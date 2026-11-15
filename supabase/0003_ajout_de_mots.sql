-- Mufrad — ajout de mots depuis l'application, et correction de la translittération.
-- À exécuter une fois dans l'éditeur SQL du projet, après 0001_schema_initial.sql. Non encore exécuté.

begin;

-- Les corrections peuvent aussi porter sur la translittération
alter table public.corrections drop constraint corrections_champ_check;
alter table public.corrections add constraint corrections_champ_check
  check (champ in ('arabe', 'translitteration', 'traduction', 'note'));

-- Mots ajoutés à une leçon : publiés directement par un contributeur, recommandés par les autres
create table public.mots (
  id uuid primary key default gen_random_uuid(),
  lecon integer not null,                            -- numéro de la leçon du manuel
  arabe text not null check (length(trim(arabe)) > 0),
  translitteration text not null default '',
  traduction text not null check (length(trim(traduction)) > 0),
  note text not null default '',
  auteur uuid not null default auth.uid() references auth.users (id) on delete cascade,
  etat public.etat not null default 'recommande',
  motif text,
  traite_par uuid references auth.users (id),
  traite_le timestamptz,
  cree_le timestamptz not null default now()
);
create index mots_par_lecon on public.mots (lecon, etat);

-- Comme pour les voix : l'auteur et l'état sont imposés par le serveur à la création
create trigger mots_avant_creation before insert on public.mots
for each row execute function public.imposer_etat();

alter table public.mots enable row level security;

create policy "lire les mots" on public.mots for select to anon, authenticated
  using (etat = 'publie' or auteur = auth.uid() or public.est_contributeur());
create policy "envoyer un mot" on public.mots for insert to authenticated
  with check (auteur = auth.uid());
create policy "traiter les mots" on public.mots for update to authenticated
  using (public.est_contributeur()) with check (public.est_contributeur());
create policy "retirer son mot" on public.mots for update to authenticated
  using (auteur = auth.uid()) with check (auteur = auth.uid() and etat = 'retire');

commit;
