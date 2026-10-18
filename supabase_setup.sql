-- ====================================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS PARA ROL & D&D (rp-lorena)
-- Pega este script en el SQL Editor de tu proyecto en Supabase y pulsa RUN
-- ====================================================================

-- 1. TABLA DE PERSONAJES
create table if not exists public.characters (
  id text primary key,
  name text not null,
  title text,
  avatar_url text,
  vision text default 'Pyro',
  color text default '#e05353',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TABLA DE SALAS (MULTIVERSO DE ROL)
create table if not exists public.rooms (
  id text primary key,
  name text not null,
  location text,
  region text default 'Mondstadt',
  description text,
  background_url text,
  ambient_type text default 'night',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TABLA DE MENSAJES Y TIRADAS D&D
create table if not exists public.messages (
  id text primary key,
  room_id text references public.rooms(id) on delete cascade not null,
  character_id text not null,
  character_name text not null,
  character_avatar text,
  character_vision text default 'Pyro',
  expression text default 'normal',
  content text default '',
  parsed_blocks jsonb default '[]'::jsonb,
  dice_roll jsonb,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TABLA DE PERFILES DE JUGADOR (Para ti y tu novio)
create table if not exists public.profiles (
  id text primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  active_character_id text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. HABILITAR TIEMPO REAL (REALTIME)
-- Permite que ambos veáis los mensajes y dados al milisegundo sin recargar la página
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.characters;

-- 6. POLÍTICAS DE ACCESO (Permitir lectura y escritura abierta para la app privada)
alter table public.characters enable row level security;
alter table public.rooms enable row level security;
alter table public.messages enable row level security;
alter table public.profiles enable row level security;

create policy "Permitir todo en characters" on public.characters for all using (true) with check (true);
create policy "Permitir todo en rooms" on public.rooms for all using (true) with check (true);
create policy "Permitir todo en messages" on public.messages for all using (true) with check (true);
create policy "Permitir todo en profiles" on public.profiles for all using (true) with check (true);

-- 7. INSERTAR DATOS INICIALES POR DEFECTO
insert into public.characters (id, name, title, avatar_url, vision, color) values
  ('char-bruno', 'Bruno', 'Caballero Errante', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'Pyro', '#e05353'),
  ('char-lorena', 'Lorena', 'Dama de las Estrellas', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', 'Cryo', '#58d3d9')
on conflict (id) do nothing;

insert into public.rooms (id, name, location, region, description, background_url, ambient_type) values
  ('room-dawn-winery', 'Viñedo del Amanecer', 'Mondstadt • Terraza Privada', 'Mondstadt', 'Bajo la luz tenue de las velas y el cielo estrellado de Teyvat. La brisa trae aroma a uvas y madera vieja.', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop&q=80', 'tavern'),
  ('room-liyue-harbor', 'Puerto de Liyue', 'Liyue • Mirador del Pabellón Liuli', 'Liyue', 'Miles de linternas flotan suavemente en el mar nocturno mientras la brisa marina roza vuestras mejillas.', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80', 'night'),
  ('room-dnd-chamber', 'Cámara de las Sombras (D&D)', 'Mazmorra Olvidada • Sala del Trono', 'Custom', 'Un templo arcano donde cada paso resuena y el destino se decide al filo del dado.', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80', 'fireplace')
on conflict (id) do nothing;

-- 8. BUCKET DE ALMACENAMIENTO PARA FOTOS
insert into storage.buckets (id, name, public) values ('roleplay-media', 'roleplay-media', true)
on conflict (id) do nothing;

create policy "Fotos públicas" on storage.objects for all using (bucket_id = 'roleplay-media') with check (bucket_id = 'roleplay-media');

-- 9. TABLA DE SUSCRIPCIONES PUSH WEB (iOS & Android en segundo plano)
create table if not exists public.push_subscriptions (
  id text primary key,
  user_id text not null,
  endpoint text not null,
  subscription jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.push_subscriptions enable row level security;
create policy "Permitir todo en push_subscriptions" on public.push_subscriptions for all using (true) with check (true);

-- 10. WEBHOOK DE BASE DE DATOS (OPCIONAL):
-- En el panel de Supabase: Database -> Webhooks -> "Create a webhook":
--  - Name: send_push_notification
--  - Table: messages
--  - Events: INSERT
--  - Type: Supabase Edge Functions (selecciona 'send-push') o Webhook URL
