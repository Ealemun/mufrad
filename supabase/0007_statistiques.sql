-- Mufrad — statistiques d'usage (cahier des charges « Statistiques d'usage », 16/11/2026).
-- À exécuter une fois dans l'éditeur SQL du projet, après 0001_schema_initial.sql.
-- Fonctionne que 0005_mesure_audience.sql ait été exécuté ou non : la table est créée si elle manque, complétée sinon.
-- Tant qu'il ne l'est pas, l'application tente l'envoi, échoue sans rien dire, et fonctionne normalement.
--
-- Ce qui change par rapport à 0005 :
--   - l'identifiant d'appareil est renouvelé chaque jour par l'application (au lieu de tous les 13 mois) :
--     au-delà d'une journée, deux visites d'un même appareil ne peuvent plus être reliées ;
--   - ce qui demande un suivi dans le temps (ancienneté, série, jours actifs, absence) est calculé sur l'appareil
--     et arrive dans « donnees », arrondi par tranches ;
--   - chaque événement peut porter de petites données chiffrées (« donnees », 800 octets au plus) ;
--   - la liste fermée des types est remplacée par un format (minuscules et _, 2 à 30 caractères) ;
--   - les versions d'essai envoient leurs événements, marqués du nom de leur branche, et les vues les écartent ;
--   - des vues toutes prêtes, réservées aux administrateurs, calculent les statistiques.
-- Règles inchangées : pas d'adresse IP, aucun lien avec les comptes, suppression après 25 mois, refus possible dans les réglages.

begin;

-- 1. La table (créée si 0005 n'a pas été exécuté), puis les colonnes nouvelles
create table if not exists public.evenements (
  id bigint generated always as identity primary key,
  appareil uuid not null,
  quand timestamptz not null default now(),
  type text not null,
  detail text,
  installee boolean
);
alter table public.evenements add column if not exists visite uuid;     -- une ouverture de l'application
alter table public.evenements add column if not exists donnees jsonb;   -- petites données propres au type
alter table public.evenements add column if not exists ecran text;      -- telephone, tablette ou ordinateur
alter table public.evenements add column if not exists version text;    -- numéro de version de l'application
alter table public.evenements add column if not exists essai text;      -- nom de la branche d'essai ; vide sur la vraie version

-- Le contrôle des types de 0005 (liste fermée) est remplacé par un contrôle de format
alter table public.evenements drop constraint if exists evenements_type_check;
alter table public.evenements drop constraint if exists evenements_type_format;
alter table public.evenements add constraint evenements_type_format check (type ~ '^[a-z_]{2,30}$');

create index if not exists evenements_par_date on public.evenements (quand);
create index if not exists evenements_par_type on public.evenements (type, quand);

-- 2. Lecture réservée aux administrateurs ; personne n'écrit directement
alter table public.evenements enable row level security;
drop policy if exists "administrateurs lisent les evenements" on public.evenements;
create policy "administrateurs lisent les evenements" on public.evenements for select to authenticated
  using (public.est_admin());
-- Droit de lecture explicite (la règle ci-dessus limite aux administrateurs) ; rien pour les visiteurs anonymes
revoke all on public.evenements from anon;
grant select on public.evenements to authenticated;

-- 3. Réception d'un lot d'événements d'un appareil
-- liste : [{ "type": "reponse", "detail": "u1-03", "quand": "2026-…", "donnees": { "ok": true, "ms": 2300 } }, …]
-- Au plus 50 par lot ; détails coupés à 60 caractères ; données de plus de 800 octets ignorées ;
-- dates trop éloignées remplacées par maintenant ; types mal formés écartés.
create or replace function public.noter_evenements_v2(
  appareil uuid, visite uuid, installee boolean, ecran text, version text, essai text, liste jsonb
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if jsonb_typeof(liste) <> 'array' then return; end if;
  insert into public.evenements (appareil, visite, quand, type, detail, donnees, installee, ecran, version, essai)
  select noter_evenements_v2.appareil,
         noter_evenements_v2.visite,
         case when (e->>'quand') ~ '^\d{4}-\d{2}-\d{2}T'
                   and (e->>'quand')::timestamptz between now() - interval '2 days' and now() + interval '5 minutes'
              then (e->>'quand')::timestamptz else now() end,
         e->>'type',
         left(e->>'detail', 60),
         case when jsonb_typeof(e->'donnees') = 'object' and length((e->'donnees')::text) <= 800 then e->'donnees' end,
         noter_evenements_v2.installee,
         case when noter_evenements_v2.ecran in ('telephone', 'tablette', 'ordinateur') then noter_evenements_v2.ecran end,
         left(noter_evenements_v2.version, 12),
         nullif(left(noter_evenements_v2.essai, 40), '')
  from jsonb_array_elements(liste) with ordinality as l(e, n)
  where n <= 50 and (e->>'type') ~ '^[a-z_]{2,30}$';
  -- Ménage de temps en temps : on ne garde pas plus de 25 mois
  if random() < 0.02 then delete from public.evenements where quand < now() - interval '25 months'; end if;
end $$;
grant execute on function public.noter_evenements_v2(uuid, uuid, boolean, text, text, text, jsonb) to anon, authenticated;

-- 4. Les vues. Toutes lisent la table avec les droits de celui qui demande (security_invoker) :
-- seuls les administrateurs y voient quelque chose. Les événements des versions d'essai sont écartés,
-- sauf dans stats_essai. Les jours et les heures sont ceux de Paris.
drop view if exists public.stats_par_jour, public.stats_clics, public.stats_heures, public.stats_retention,
  public.stats_assiduite, public.stats_lecons, public.stats_questions, public.stats_confusions, public.stats_oubli,
  public.stats_grammaire, public.stats_audio, public.stats_tableau, public.stats_interface, public.stats_appareils,
  public.stats_erreurs, public.stats_essai, public.stats_semaines, public.stats_evenements;

-- Base commune : événements de la vraie version, avec la date et l'heure de Paris
create view public.stats_evenements with (security_invoker = true) as
  select e.*, (e.quand at time zone 'Europe/Paris') as local
  from public.evenements e where e.essai is null;

-- Par jour : visiteurs, visites, temps actif médian d'une visite, séances, réponses, réussite
create view public.stats_par_jour with (security_invoker = true) as
  with v as (   -- une ligne par visite : son jour et son temps actif (somme des pauses)
    select visite, min(local)::date as jour,
           sum((donnees->>'actif_s')::numeric) filter (where type = 'pause') as actif_s
    from public.stats_evenements where visite is not null group by visite
  ), t as (
    select local::date as jour,
           count(distinct appareil) as visiteurs,
           count(distinct appareil) filter (where installee) as visiteurs_appli_installee,
           count(distinct visite) as visites,
           count(*) filter (where type in ('seance_debut', 'g_debut')) as seances_commencees,
           count(*) filter (where type in ('seance_fin', 'g_fin')) as seances_finies,
           count(*) filter (where type in ('reponse', 'g_reponse', 'paire')) as reponses,
           round(100.0 * count(*) filter (where type in ('reponse', 'g_reponse', 'paire') and (donnees->>'ok')::boolean)
                 / nullif(count(*) filter (where type in ('reponse', 'g_reponse', 'paire')), 0), 1) as reussite_pct
    from public.stats_evenements group by 1
  )
  select t.*, (select round((percentile_cont(0.5) within group (order by v.actif_s))::numeric / 60, 1)
               from v where v.jour = t.jour and v.actif_s is not null) as minutes_actives_mediane
  from t order by jour desc;

-- Par semaine : appareils actifs (chacun compté une fois, grâce à « première ouverture de la semaine ») et nouveaux appareils
create view public.stats_semaines with (security_invoker = true) as
  select date_trunc('week', local)::date as semaine,
         count(*) filter (where (donnees->>'nsem')::boolean) as appareils_actifs,
         count(*) filter (where (donnees->>'nsem')::boolean and (donnees->>'anc') = '0') as nouveaux_appareils
  from public.stats_evenements where type = 'ouverture' group by 1 order by 1 desc;

-- Heures de connexion : ouvertures par jour de la semaine (1 = lundi) et par heure
create view public.stats_heures with (security_invoker = true) as
  select extract(isodow from local)::int as jour_semaine, extract(hour from local)::int as heure, count(*) as ouvertures
  from public.stats_evenements where type = 'ouverture' group by 1, 2 order by 1, 2;

-- Rétention : chaque appareil envoie, à sa première ouverture de la semaine, son ancienneté en semaines.
-- Semaine de première utilisation = semaine de l'ouverture moins l'ancienneté.
-- « appareils » = appareils actifs cette semaine-là ; la ligne semaine 0 donne la taille de la cohorte.
create view public.stats_retention with (security_invoker = true) as
  with o as (
    select (date_trunc('week', local) - make_interval(weeks => (donnees->>'anc')::int))::date as cohorte,
           (donnees->>'anc')::int as semaine
    from public.stats_evenements
    where type = 'ouverture' and (donnees->>'nsem')::boolean and (donnees->>'anc') ~ '^\d+$'
  ), c as (select cohorte, semaine, count(*) as appareils from o group by 1, 2)
  select c.cohorte, c.semaine, c.appareils,
         round(100.0 * c.appareils / nullif((select c0.appareils from c c0 where c0.cohorte = c.cohorte and c0.semaine = 0), 0), 1) as retention_pct
  from c order by cohorte desc, semaine;

-- Assiduité : à la première ouverture du jour de chaque appareil, sa série, ses jours actifs sur 30 et son absence
create view public.stats_assiduite with (security_invoker = true) as
  select 'serie' as mesure, (donnees->>'serie')::int as valeur, count(*) as appareils_jours
    from public.stats_evenements where type = 'ouverture' and (donnees->>'njour')::boolean and donnees ? 'serie' group by 2
  union all
  select 'jours_actifs_30', (donnees->>'actifs30')::int, count(*)
    from public.stats_evenements where type = 'ouverture' and (donnees->>'njour')::boolean and donnees ? 'actifs30' group by 2
  union all
  select 'absence_jours', (donnees->>'absence')::int, count(*)
    from public.stats_evenements where type = 'ouverture' and (donnees->>'njour')::boolean and donnees ? 'absence' group by 2
  order by 1, 2;

-- Leçons : commencées, finies, quittées (et à quelle carte en moyenne), validées sans être faites, durée médiane
create view public.stats_lecons with (security_invoker = true) as
  select coalesce(donnees->>'l', detail) as lecon,
         count(*) filter (where type = 'seance_debut' and detail = 'learn') as commencees,
         count(*) filter (where type = 'seance_fin' and detail = 'learn') as finies,
         count(*) filter (where type = 'seance_quittee' and detail = 'learn') as quittees,
         round(avg((donnees->>'pos')::numeric / nullif((donnees->>'total')::numeric, 0)) filter (where type = 'seance_quittee'), 2) as quittee_a_la_fraction,
         count(*) filter (where type = 'lecon_validee') as validees_sans_les_faire,
         round((percentile_cont(0.5) within group (order by (donnees->>'duree_s')::numeric) filter (where type = 'seance_fin' and detail = 'learn'))::numeric / 60, 1) as minutes_mediane
  from public.stats_evenements
  where type in ('seance_debut', 'seance_fin', 'seance_quittee', 'lecon_validee')
  group by 1 order by length(coalesce(donnees->>'l', detail)), 1;   -- 2 avant 10

-- Questions : par élément et par exercice (ar2fr, fr2ar, listen, n2l, f2l…)
create view public.stats_questions with (security_invoker = true) as
  select detail as element, donnees->>'ex' as exercice, count(*) as reponses,
         round(100.0 * avg(((donnees->>'ok')::boolean)::int), 1) as reussite_pct,
         round(100.0 * avg(((donnees->>'ok')::boolean)::int) filter (where (donnees->>'rang')::int = 1), 1) as reussite_premier_essai_pct,
         round((percentile_cont(0.5) within group (order by (donnees->>'ms')::numeric))::numeric / 1000, 1) as secondes_mediane
  from public.stats_evenements where type = 'reponse'
  group by 1, 2 order by reussite_pct asc, reponses desc;

-- Confusions : les mauvaises réponses les plus choisies (questions et paires)
create view public.stats_confusions with (security_invoker = true) as
  select detail as element, donnees->>'choix' as pris_pour, count(*) as fois
  from public.stats_evenements
  where type in ('reponse', 'paire') and not (donnees->>'ok')::boolean and donnees ? 'choix'
  group by 1, 2 order by fois desc;

-- Oubli : réussite en révision selon les jours écoulés depuis la dernière révision de l'élément
create view public.stats_oubli with (security_invoker = true) as
  select (donnees->>'ecart')::int as jours_depuis, count(*) as reponses,
         round(100.0 * avg(((donnees->>'ok')::boolean)::int), 1) as reussite_pct
  from public.stats_evenements where type = 'reponse' and donnees->>'etat' in ('d', 'a') and (donnees->>'ecart') ~ '^\d+$'
  group by 1 order by 1;

-- Grammaire : par question
create view public.stats_grammaire with (security_invoker = true) as
  select detail as question, donnees->>'q' as type_question, count(*) as reponses,
         round(100.0 * avg(((donnees->>'ok')::boolean)::int), 1) as reussite_pct,
         count(*) filter (where (donnees->>'presque')::boolean) as justes_a_une_haraka_pres,
         round((percentile_cont(0.5) within group (order by (donnees->>'ms')::numeric))::numeric / 1000, 1) as secondes_mediane
  from public.stats_evenements where type = 'g_reponse'
  group by 1, 2 order by reussite_pct asc, reponses desc;

-- Audio : écoutes par élément, selon l'origine de la voix entendue
create view public.stats_audio with (security_invoker = true) as
  select detail as element, count(*) as ecoutes,
         count(*) filter (where donnees->>'src' = 'partagee') as voix_partagee,
         count(*) filter (where donnees->>'src' = 'perso') as sa_voix,
         count(*) filter (where donnees->>'src' = 'synthese') as synthese,
         count(*) filter (where donnees->>'src' = 'aucune') as rien_a_entendre
  from public.stats_evenements where type = 'ecoute'
  group by 1 order by ecoutes desc;

-- Tableau d'écriture : ouvertures et issues par contexte
create view public.stats_tableau with (security_invoker = true) as
  select split_part(detail, ':', 1) as contexte,
         count(*) filter (where type = 'tableau') as ouvertures,
         count(*) filter (where type = 'tableau_fin' and donnees->>'issue' = 'termine') as termines,
         count(*) filter (where type = 'tableau_fin' and donnees->>'issue' = 'croix') as fermes_par_la_croix,
         count(*) filter (where type = 'tableau_fin' and (donnees->>'traits')::int = 0) as rien_ecrit,
         count(*) filter (where type = 'tableau_fin' and donnees->>'pointage' = 'touch') as au_doigt,
         count(*) filter (where type = 'tableau_fin' and donnees->>'pointage' = 'mouse') as a_la_souris,
         count(*) filter (where type = 'tableau_fin' and donnees->>'pointage' = 'pen') as au_stylet
  from public.stats_evenements where type in ('tableau', 'tableau_fin')
  group by 1 order by ouvertures desc;

-- Interface : boutons touchés et onglets visités sur 30 jours
create view public.stats_interface with (security_invoker = true) as
  select type, detail, count(*) as fois, count(distinct appareil) as appareils_jours
  from public.stats_evenements where quand > now() - interval '30 days' and type in ('clic', 'onglet', 'terme', 'source')
  group by 1, 2 order by fois desc;

-- Appareils : à la première ouverture du jour, écran, appli installée, version, langue
create view public.stats_appareils with (security_invoker = true) as
  select ecran, installee, version, donnees->>'langue' as langue, count(*) as appareils_jours
  from public.stats_evenements where type = 'ouverture' and (donnees->>'njour')::boolean
  group by 1, 2, 3, 4 order by appareils_jours desc;

-- Erreurs techniques : par message et par version
create view public.stats_erreurs with (security_invoker = true) as
  select detail as message, version, count(*) as fois, max(quand) as derniere_fois
  from public.stats_evenements where type = 'erreur'
  group by 1, 2 order by derniere_fois desc;

-- Versions d'essai : ce qu'elles ont envoyé sur 7 jours, pour vérifier la mesure avant de fusionner
create view public.stats_essai with (security_invoker = true) as
  select essai, type, count(*) as fois, max(quand) as dernier
  from public.evenements where essai is not null and quand > now() - interval '7 days'
  group by 1, 2 order by 1, fois desc;

-- Les vues ne servent à rien sans compte administrateur : on ne les ouvre pas aux visiteurs anonymes
revoke all on public.stats_evenements, public.stats_semaines, public.stats_par_jour, public.stats_heures, public.stats_retention,
  public.stats_assiduite, public.stats_lecons, public.stats_questions, public.stats_confusions, public.stats_oubli,
  public.stats_grammaire, public.stats_audio, public.stats_tableau, public.stats_interface, public.stats_appareils,
  public.stats_erreurs, public.stats_essai from anon;
grant select on public.stats_evenements, public.stats_semaines, public.stats_par_jour, public.stats_heures, public.stats_retention,
  public.stats_assiduite, public.stats_lecons, public.stats_questions, public.stats_confusions, public.stats_oubli,
  public.stats_grammaire, public.stats_audio, public.stats_tableau, public.stats_interface, public.stats_appareils,
  public.stats_erreurs, public.stats_essai to authenticated;

commit;
