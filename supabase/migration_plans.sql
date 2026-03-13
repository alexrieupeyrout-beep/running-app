-- Table des plans d'entraînement
create table if not exists plans (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  athlete_id bigint references strava_tokens(athlete_id) on delete cascade,

  -- données onboarding
  distance text,
  race_name text,
  race_date date,
  km_per_week text,
  longest_run text,
  experience text,
  ref_times jsonb default '{}',
  goal text,
  target_time text,
  sessions_per_week int,
  preferred_days text[],

  -- plan généré par IA
  semaines jsonb default '[]',

  -- statut
  statut text default 'actif' check (statut in ('actif', 'terminé', 'abandonné'))
);

-- Index pour retrouver rapidement le plan actif d'un athlète
create index if not exists plans_athlete_id_idx on plans(athlete_id);
