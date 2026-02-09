-- ═══════════════════════════════════════════════════════════════
-- Inflexion — Schéma Supabase
-- À exécuter dans : Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════

-- 1. PROFILS UTILISATEURS
-- Lié automatiquement à auth.users via le trigger
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text,
    display_name text,
    avatar_url text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Trigger : créer un profil automatiquement à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, display_name)
    values (new.id, new.email, split_part(new.email, '@', 1));
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();


-- 2. WATCHLIST (actifs suivis par l'utilisateur)
create table if not exists public.watchlist (
    id bigint generated always as identity primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    symbol text not null,           -- ex: 'BTC', 'AAPL', 'XAU'
    label text,                     -- ex: 'Bitcoin', 'Apple', 'Or'
    category text default 'other',  -- crypto, stock, commodity, index
    added_at timestamptz default now(),
    unique(user_id, symbol)
);


-- 3. ARTICLES (archive des articles IA)
create table if not exists public.articles (
    id bigint generated always as identity primary key,
    date date unique not null,
    titre text not null,
    sous_titre text,
    contenu text,
    tags text[] default '{}',
    points_cles text[] default '{}',
    sources jsonb default '[]',
    generated_at timestamptz default now()
);


-- 4. NEWSLETTER (abonnés)
create table if not exists public.newsletter (
    id bigint generated always as identity primary key,
    email text unique not null,
    subscribed_at timestamptz default now(),
    active boolean default true
);


-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════

-- Activer RLS sur toutes les tables
alter table public.profiles enable row level security;
alter table public.watchlist enable row level security;
alter table public.articles enable row level security;
alter table public.newsletter enable row level security;

-- PROFILES : chacun voit/modifie son propre profil
create policy "Users can view own profile"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- WATCHLIST : chacun gère sa propre watchlist
create policy "Users can view own watchlist"
    on public.watchlist for select
    using (auth.uid() = user_id);

create policy "Users can add to own watchlist"
    on public.watchlist for insert
    with check (auth.uid() = user_id);

create policy "Users can remove from own watchlist"
    on public.watchlist for delete
    using (auth.uid() = user_id);

-- ARTICLES : tout le monde peut lire (public)
create policy "Articles are public"
    on public.articles for select
    using (true);

-- ARTICLES : seul le service_role peut insérer (backend)
create policy "Only backend can insert articles"
    on public.articles for insert
    with check (false);  -- Bloqué côté anon, le service_role bypass RLS

-- NEWSLETTER : tout le monde peut s'inscrire
create policy "Anyone can subscribe"
    on public.newsletter for insert
    with check (true);

-- NEWSLETTER : seul le propriétaire peut se désinscrire (via JWT email)
-- Note : fonctionne uniquement pour les utilisateurs authentifiés dont
-- l'email correspond à l'email de la newsletter.
create policy "Subscribers can unsubscribe"
    on public.newsletter for update
    using (
        auth.uid() is not null
        and email = (auth.jwt()->>'email')
    );
