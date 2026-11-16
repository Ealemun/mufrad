-- Mufrad — tracés du tableau d'écriture.
-- À exécuter une fois dans l'éditeur SQL du projet, après 0001_schema_initial.sql. Non encore exécuté.
-- Deux usages pour une même table :
--   - les écritures des apprenants qui l'ont accepté, pour entraîner la future reconnaissance d'écriture ;
--   - les tracés de référence d'une lettre (sens d'écriture), écrits par un contributeur et lus par tout le monde.

begin;

create table public.traces (
  id uuid primary key default gen_random_uuid(),
  cree_le timestamptz not null default now(),
  auteur uuid references auth.users (id) on delete set null,   -- vide pour une personne sans compte
  element text,                          -- identifiant de la lettre ou du mot qui était à l'écran (étiquette proposée)
  forme text,                            -- pour une lettre : isolee, debut, milieu ou fin
  texte text,                            -- le texte arabe qui était à l'écran
  contexte text,                         -- cours, exo:…, grammaire:…, libre
  modele_visible boolean not null default false,   -- le modèle en filigrane était-il affiché pendant l'écriture ?
  largeur integer not null,              -- taille du tableau à l'écran, en pixels
  hauteur integer not null,
  appareil text,                         -- touch, pen ou mouse
  traits jsonb not null,                 -- liste de traits ; un trait = liste de points [x, y, t]
  modele boolean not null default false, -- tracé de référence, posé par un contributeur
  etiquette_verifiee boolean,            -- vide = pas encore relu ; vrai ou faux une fois l'étiquette confirmée ou rejetée
  etiquette_corrigee text,               -- ce qui est réellement écrit, si le relecteur corrige l'étiquette
  check (jsonb_typeof(traits) = 'array' and pg_column_size(traits) < 300000)
);
create index traces_modeles on public.traces (element, forme) where modele;
create index traces_a_relire on public.traces (cree_le) where etiquette_verifiee is null and not modele;

-- À la création, le serveur impose ce que l'envoyeur n'a pas à décider :
-- l'auteur réel, pas de relecture déjà faite, et « modèle » réservé aux contributeurs.
create function public.imposer_trace() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.auteur := auth.uid();
  new.cree_le := now();
  new.etiquette_verifiee := null;
  new.etiquette_corrigee := null;
  if not public.est_contributeur() then new.modele := false; end if;
  return new;
end $$;
create trigger traces_avant_creation before insert on public.traces
for each row execute function public.imposer_trace();

alter table public.traces enable row level security;

-- Tout le monde peut déposer un tracé, avec ou sans compte
create policy "deposer un trace" on public.traces for insert to anon, authenticated with check (true);
-- Tout le monde lit les tracés de référence ; seuls les contributeurs lisent les écritures des apprenants
create policy "lire les traces" on public.traces for select to anon, authenticated
  using (modele or public.est_contributeur());
-- Les contributeurs relisent les étiquettes et retirent ce qui ne doit pas rester
create policy "relire les traces" on public.traces for update to authenticated
  using (public.est_contributeur()) with check (public.est_contributeur());
create policy "retirer les traces" on public.traces for delete to authenticated
  using (public.est_contributeur());

commit;
