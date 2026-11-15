-- Mufrad — copie de la progression dans le compte, pour la retrouver sur un autre appareil.
-- À exécuter une fois dans l'éditeur SQL du projet, après 0001_schema_initial.sql. Non encore exécuté.
-- Tant qu'il ne l'est pas, le bouton « Synchroniser avec mon compte » des réglages répond « indisponible ».
--
-- Une seule ligne par compte : la dernière progression fusionnée. L'application ne l'écrase jamais à l'aveugle :
-- elle lit la copie, la fusionne avec celle de l'appareil (aucune réponse n'est perdue), puis renvoie le résultat.
-- Le numéro de version empêche deux appareils qui synchronisent au même moment d'effacer le travail l'un de l'autre :
-- l'écriture n'aboutit que si la version lue est toujours la dernière ; sinon l'application relit et refusionne.

begin;

create table public.sauvegardes (
  utilisateur uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  donnees jsonb not null,                            -- cartes, journal des réponses et jours, comme dans l'application
  version integer not null default 1,                -- augmente de 1 à chaque écriture
  maj_le timestamptz not null default now()
);

alter table public.sauvegardes enable row level security;
-- Chacun lit, crée et met à jour sa propre copie, et rien d'autre
create policy "lire sa sauvegarde" on public.sauvegardes for select to authenticated
  using (utilisateur = auth.uid());
create policy "creer sa sauvegarde" on public.sauvegardes for insert to authenticated
  with check (utilisateur = auth.uid());
create policy "mettre a jour sa sauvegarde" on public.sauvegardes for update to authenticated
  using (utilisateur = auth.uid()) with check (utilisateur = auth.uid());

commit;
