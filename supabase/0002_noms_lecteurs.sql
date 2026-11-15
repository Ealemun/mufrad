-- Mufrad — noms des lecteurs, pour savoir qui a enregistré quoi.
-- À exécuter une fois dans l'éditeur SQL du projet, après 0001_schema_initial.sql. Non encore exécuté.

begin;

-- Nom que chaque personne choisit d'afficher à côté de ses enregistrements (facultatif)
alter table public.profils add column nom text;

-- Chacun fixe son propre nom, et rien d'autre : passer par une fonction évite d'ouvrir la modification
-- du profil entier, qui permettrait de se donner soi-même un niveau.
create function public.definir_nom(nouveau text) returns void
language sql security definer set search_path = public as $$
  update public.profils set nom = nullif(left(trim(nouveau), 40), '') where id = auth.uid()
$$;
revoke execute on function public.definir_nom(text) from anon;

-- Les contributeurs et les administrateurs lisent les profils (nom et niveau), pour le suivi des voix
create policy "contributeurs lisent les profils" on public.profils for select to authenticated
  using (public.est_contributeur());

-- Tout le monde lit le nom des lecteurs dont au moins une voix est publiée, et seulement ceux-là
create function public.lecteurs() returns table (id uuid, nom text)
language sql stable security definer set search_path = public as $$
  select p.id, p.nom from public.profils p
  where exists (select 1 from public.voix v where v.auteur = p.id and v.etat = 'publie')
$$;
grant execute on function public.lecteurs() to anon, authenticated;

commit;
