-- Ajout du statut 'en_pause'
alter table plans drop constraint if exists plans_statut_check;
alter table plans add constraint plans_statut_check check (statut in ('actif', 'terminé', 'abandonné', 'en_pause'));
