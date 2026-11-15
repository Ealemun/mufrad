-- Mufrad — schéma initial pour l'alpha 1 (comptes, progression synchronisée, voix et corrections partagées).
-- À exécuter une fois dans l'éditeur SQL du projet Supabase. Ce fichier n'a pas encore été exécuté :
-- en cas d'erreur, l'éditeur indique la ligne et rien n'est appliqué à moitié (tout est dans une transaction).

begin;

-- ---------------------------------------------------------------------------------------------
-- 1. Niveaux : utilisateur (recommande), contributeur (publie directement), administrateur
-- ---------------------------------------------------------------------------------------------
create type public.niveau as enum ('utilisateur', 'contributeur', 'administrateur');

create table public.profils (
  id uuid primary key references auth.users (id) on delete cascade,
  niveau public.niveau not null default 'utilisateur',
  cree_le timestamptz not null default now()
);

-- Chaque nouveau compte reçoit automatiquement un profil de niveau « utilisateur »
create function public.creer_profil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profils (id) values (new.id);
  return new;
end $$;

create trigger apres_inscription after insert on auth.users
for each row execute function public.creer_profil();

-- Niveau de la personne connectée. « security definer » : la fonction lit la table des profils
-- sans repasser par ses règles d'accès, ce qui évite une boucle dans les règles ci-dessous.
create function public.mon_niveau() returns public.niveau
language sql stable security definer set search_path = public as $$
  select coalesce((select niveau from public.profils where id = auth.uid()), 'utilisateur'::public.niveau)
$$;

create function public.est_contributeur() returns boolean
language sql stable as $$ select public.mon_niveau() in ('contributeur', 'administrateur') $$;

create function public.est_admin() returns boolean
language sql stable as $$ select public.mon_niveau() = 'administrateur' $$;

alter table public.profils enable row level security;
-- Chacun lit son propre profil ; les administrateurs lisent tous les profils
create policy "lire son profil" on public.profils for select to authenticated
  using (id = auth.uid() or public.est_admin());
-- Seul un administrateur change un niveau
create policy "attribuer les niveaux" on public.profils for update to authenticated
  using (public.est_admin()) with check (public.est_admin());

-- ---------------------------------------------------------------------------------------------
-- 2. Accord électronique des contributeurs de voix, rattaché au compte et retirable
-- ---------------------------------------------------------------------------------------------
create table public.accords (
  id uuid primary key default gen_random_uuid(),
  utilisateur uuid not null default auth.uid() references auth.users (id) on delete cascade,
  version text not null,                             -- version du texte de l'accord qui a été signé
  voix_dans_appli boolean not null,                  -- la voix peut être entendue par les autres apprenants
  voix_pour_entrainement boolean not null default false, -- la voix peut servir à entraîner les modèles
  nom_affiche boolean not null default false,        -- afficher le nom du contributeur, ou rester anonyme
  signe_le timestamptz not null default now(),
  retire_le timestamptz                              -- rempli quand la personne retire son accord
);

alter table public.accords enable row level security;
create policy "lire ses accords" on public.accords for select to authenticated
  using (utilisateur = auth.uid() or public.est_admin());
create policy "signer un accord" on public.accords for insert to authenticated
  with check (utilisateur = auth.uid());
create policy "retirer son accord" on public.accords for update to authenticated
  using (utilisateur = auth.uid()) with check (utilisateur = auth.uid());

-- ---------------------------------------------------------------------------------------------
-- 3. Journal des réponses : la progression de chacun, synchronisée entre ses appareils.
--    Une ligne n'est jamais modifiée ni supprimée ; l'état des cartes se recalcule à partir du journal.
-- ---------------------------------------------------------------------------------------------
create table public.journal (
  id uuid primary key,                               -- identifiant créé sur l'appareil, pour ne jamais compter deux fois
  utilisateur uuid not null default auth.uid() references auth.users (id) on delete cascade,
  element text not null,                             -- identifiant de la lettre ou du mot (ex. « w01 »)
  exercice text not null,
  juste boolean not null,
  duree_ms integer,
  repondu_le timestamptz not null,
  recu_le timestamptz not null default now()
);
create index journal_par_utilisateur on public.journal (utilisateur, repondu_le);

alter table public.journal enable row level security;
create policy "lire son journal" on public.journal for select to authenticated
  using (utilisateur = auth.uid());
create policy "ecrire son journal" on public.journal for insert to authenticated
  with check (utilisateur = auth.uid());
-- Pas de règle de modification ni de suppression : le journal est en écriture seule.

-- ---------------------------------------------------------------------------------------------
-- 4. Voix et corrections : publiées directement par un contributeur, recommandées par les autres
-- ---------------------------------------------------------------------------------------------
create type public.etat as enum ('recommande', 'publie', 'refuse', 'retire');

create table public.voix (
  id uuid primary key default gen_random_uuid(),
  element text not null,
  auteur uuid not null default auth.uid() references auth.users (id) on delete cascade,
  chemin text not null,                              -- emplacement du fichier dans le dépôt de fichiers « voix »
  etat public.etat not null default 'recommande',
  motif text,                                        -- raison donnée en cas de refus
  traite_par uuid references auth.users (id),
  traite_le timestamptz,
  cree_le timestamptz not null default now()
);
create index voix_par_element on public.voix (element, etat);

create table public.corrections (
  id uuid primary key default gen_random_uuid(),
  element text not null,
  champ text not null check (champ in ('arabe', 'traduction', 'note')),
  valeur text not null,                              -- nouvelle valeur proposée pour ce champ
  auteur uuid not null default auth.uid() references auth.users (id) on delete cascade,
  etat public.etat not null default 'recommande',
  motif text,
  traite_par uuid references auth.users (id),
  traite_le timestamptz,
  cree_le timestamptz not null default now()
);
create index corrections_par_element on public.corrections (element, etat);

-- À la création, l'auteur et l'état sont imposés par le serveur : personne ne peut se déclarer « publié » lui-même
create function public.imposer_etat() returns trigger
language plpgsql as $$
begin
  new.auteur := auth.uid();
  new.etat := case when public.est_contributeur() then 'publie' else 'recommande' end;
  new.traite_par := null; new.traite_le := null; new.motif := null;
  return new;
end $$;

create trigger voix_avant_creation before insert on public.voix
for each row execute function public.imposer_etat();
create trigger corrections_avant_creation before insert on public.corrections
for each row execute function public.imposer_etat();

alter table public.voix enable row level security;
alter table public.corrections enable row level security;

-- Tout le monde entend ce qui est publié ; chacun voit ses propres envois ; les contributeurs voient tout
create policy "lire les voix" on public.voix for select to anon, authenticated
  using (etat = 'publie' or auteur = auth.uid() or public.est_contributeur());
create policy "envoyer une voix" on public.voix for insert to authenticated
  with check (auteur = auth.uid());
-- Les contributeurs acceptent ou refusent ; l'auteur peut seulement retirer son envoi
create policy "traiter les voix" on public.voix for update to authenticated
  using (public.est_contributeur()) with check (public.est_contributeur());
create policy "retirer sa voix" on public.voix for update to authenticated
  using (auteur = auth.uid()) with check (auteur = auth.uid() and etat = 'retire');

create policy "lire les corrections" on public.corrections for select to anon, authenticated
  using (etat = 'publie' or auteur = auth.uid() or public.est_contributeur());
create policy "envoyer une correction" on public.corrections for insert to authenticated
  with check (auteur = auth.uid());
create policy "traiter les corrections" on public.corrections for update to authenticated
  using (public.est_contributeur()) with check (public.est_contributeur());
create policy "retirer sa correction" on public.corrections for update to authenticated
  using (auteur = auth.uid()) with check (auteur = auth.uid() and etat = 'retire');

-- ---------------------------------------------------------------------------------------------
-- 5. Fichiers audio : un dépôt « voix », un dossier par contributeur (son identifiant)
--    Limite connue de l'alpha : le dépôt est public, donc un fichier recommandé mais pas encore
--    publié reste lisible par quelqu'un qui connaîtrait son adresse exacte (non devinable).
-- ---------------------------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('voix', 'voix', true)
on conflict (id) do nothing;

create policy "deposer sa voix" on storage.objects for insert to authenticated
  with check (bucket_id = 'voix' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "supprimer une voix" on storage.objects for delete to authenticated
  using (bucket_id = 'voix' and ((storage.foldername(name))[1] = auth.uid()::text or public.est_contributeur()));

commit;

-- Après votre première connexion à l'application, donnez-vous le niveau administrateur
-- (à exécuter séparément, en remplaçant l'adresse) :
--   update public.profils set niveau = 'administrateur'
--   where id = (select id from auth.users where email = 'votre-adresse@exemple.org');
