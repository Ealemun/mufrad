-- Mufrad — compteur anonyme des ouvertures de l'application, jour par jour.
-- À exécuter une fois dans l'éditeur SQL du projet, après 0001_schema_initial.sql. Non encore exécuté.
-- Tant qu'il ne l'est pas, l'application tente le comptage, échoue sans rien dire, et fonctionne normalement.
--
-- Ce qui est compté : un total par jour, rien d'autre. Aucun identifiant d'appareil ni de personne,
-- aucune adresse, rien n'est écrit ni lu sur l'appareil pour ce comptage. On sait donc combien de fois
-- l'application a été ouverte, et combien de ces ouvertures venaient de l'application installée,
-- mais pas combien de personnes différentes l'ont ouverte.

begin;

create table public.ouvertures (
  jour date primary key,                   -- jour, à l'heure de Paris
  total integer not null default 0,        -- ouvertures de l'application ce jour-là
  installee integer not null default 0     -- parmi elles, ouvertures depuis l'icône de l'écran d'accueil
);

-- Personne n'écrit directement dans la table : on passe par la fonction ci-dessous, qui ne sait qu'ajouter 1.
-- Seuls les administrateurs lisent les totaux (le tableau de bord Supabase les montre aussi).
alter table public.ouvertures enable row level security;
create policy "administrateurs lisent les ouvertures" on public.ouvertures for select to authenticated
  using (public.est_admin());

create function public.compter_ouverture(depuis_icone boolean) returns void
language sql security definer set search_path = public as $$
  insert into public.ouvertures as o (jour, total, installee)
  values ((now() at time zone 'Europe/Paris')::date, 1, case when depuis_icone then 1 else 0 end)
  on conflict (jour) do update set total = o.total + 1, installee = o.installee + excluded.installee
$$;
grant execute on function public.compter_ouverture(boolean) to anon, authenticated;

commit;
