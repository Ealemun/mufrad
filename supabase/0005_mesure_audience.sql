-- Mufrad — mesure d'audience anonyme : combien de visiteurs, ce qu'ils font, ce qu'ils touchent.
-- À exécuter une fois dans l'éditeur SQL du projet, après 0001_schema_initial.sql. Non encore exécuté.
-- Tant qu'il ne l'est pas, l'application tente l'envoi, échoue sans rien dire, et fonctionne normalement.
--
-- Règles suivies (dispense de consentement de la CNIL pour la mesure d'audience) :
--   - aucun lien avec les comptes ni avec les adresses électroniques ; l'adresse IP n'est pas enregistrée ici ;
--   - un appareil n'est reconnu que par un identifiant tiré au hasard, renouvelé tous les 13 mois ;
--   - les événements de plus de 25 mois sont supprimés ;
--   - chacun peut refuser d'être compté dans les réglages de l'application ;
--   - seuls les administrateurs lisent les données, et seulement pour les statistiques de Mufrad.

begin;

create table public.evenements (
  id bigint generated always as identity primary key,
  appareil uuid not null,                  -- identifiant tiré au hasard par l'appareil (pas une personne, pas un compte)
  quand timestamptz not null default now(),
  type text not null check (type in ('ouverture', 'onglet', 'clic', 'seance_debut', 'seance_fin')),
  detail text,                             -- ex. le bouton touché (« learn:3 »), l'onglet (« mots »), le type de séance
  installee boolean                        -- application ouverte depuis l'icône de l'écran d'accueil
);
create index evenements_par_date on public.evenements (quand);

-- Personne n'écrit directement : on passe par la fonction ci-dessous, qui contrôle et limite ce qui entre.
alter table public.evenements enable row level security;
create policy "administrateurs lisent les evenements" on public.evenements for select to authenticated
  using (public.est_admin());

-- Reçoit un lot d'événements d'un appareil : [{ "type": "clic", "detail": "learn:3", "quand": "2026-…" }, …]
-- Au plus 50 par lot ; les détails sont coupés à 60 caractères ; les dates trop éloignées sont remplacées par maintenant.
create function public.noter_evenements(appareil uuid, installee boolean, liste jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.evenements (appareil, quand, type, detail, installee)
  select noter_evenements.appareil,
         case when (e->>'quand')::timestamptz between now() - interval '2 days' and now() + interval '5 minutes'
              then (e->>'quand')::timestamptz else now() end,
         e->>'type', left(e->>'detail', 60), noter_evenements.installee
  from jsonb_array_elements(liste) with ordinality as l(e, n)
  where n <= 50 and e->>'type' in ('ouverture', 'onglet', 'clic', 'seance_debut', 'seance_fin');
  -- Ménage de temps en temps : on ne garde pas plus de 25 mois
  if random() < 0.02 then delete from public.evenements where quand < now() - interval '25 months'; end if;
end $$;
grant execute on function public.noter_evenements(uuid, boolean, jsonb) to anon, authenticated;

-- Tableaux tout prêts, visibles dans le Table Editor (et réservés aux administrateurs par la règle ci-dessus).
-- Visiteurs, ouvertures et séances par jour, à l'heure de Paris :
create view public.stats_par_jour with (security_invoker = true) as
  select (quand at time zone 'Europe/Paris')::date as jour,
         count(distinct appareil) as visiteurs,
         count(*) filter (where type = 'ouverture') as ouvertures,
         count(distinct appareil) filter (where installee) as visiteurs_appli_installee,
         count(*) filter (where type = 'seance_debut') as seances_commencees,
         count(*) filter (where type = 'seance_fin') as seances_terminees,
         count(*) filter (where type = 'clic') as clics
  from public.evenements group by 1 order by 1 desc;
-- Ce qui est touché, sur les 30 derniers jours :
create view public.stats_clics with (security_invoker = true) as
  select type, detail, count(*) as fois, count(distinct appareil) as visiteurs
  from public.evenements where quand > now() - interval '30 days' and type in ('clic', 'onglet', 'seance_debut', 'seance_fin')
  group by type, detail order by fois desc;

commit;
