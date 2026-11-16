-- Mufrad — statistiques : ne plus mélanger les événements de l'ancienne mesure (0005) avec la nouvelle (0007).
-- À exécuter une fois dans l'éditeur SQL du projet, après 0007_statistiques.sql.
--
-- Pourquoi : avant 0007, l'application notait ses événements avec un identifiant d'appareil gardé 13 mois et sans
-- identifiant de visite. Ces lignes comptaient dans « visiteurs » (appareils distincts) mais pas dans « visites »
-- (qui ne compte que les identifiants de visite), d'où des jours avec beaucoup plus de visiteurs que de visites.
-- Les lignes de l'ancienne mesure se reconnaissent à leur visite vide : toutes les vues les écartent désormais.
-- Elles restent dans la table (rien n'est supprimé ici) ; voir la fin du fichier pour les supprimer si on le souhaite.

begin;

-- Les vues dépendent de cette base commune : on la remplace sans changer ses colonnes
create or replace view public.stats_evenements with (security_invoker = true) as
  select e.*, (e.quand at time zone 'Europe/Paris') as local
  from public.evenements e
  where e.essai is null          -- pas les versions d'essai
    and e.visite is not null;    -- pas l'ancienne mesure (identifiant de 13 mois, sans visite)

-- L'ancienne fonction d'envoi n'est plus appelée par l'application à jour. On la retire, pour qu'une vieille copie
-- de l'application restée ouverte quelque part ne continue pas d'écrire des identifiants gardés 13 mois.
drop function if exists public.noter_evenements(uuid, boolean, jsonb);

commit;

-- FACULTATIF, et définitif : supprimer les événements de l'ancienne mesure (identifiants gardés 13 mois).
-- Ils ne servent plus à aucune vue. À exécuter seul, si on le décide :
--   delete from public.evenements where visite is null;
