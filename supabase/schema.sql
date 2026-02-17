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


-- 5. SHARED WATCHLISTS (partage de watchlists via lien public)
create table if not exists public.shared_watchlists (
    id bigint generated always as identity primary key,
    owner_id uuid references public.profiles(id) on delete cascade not null,
    share_code text unique not null,   -- code 12 caractères alphanumérique
    name text not null,                -- nom donné à la watchlist partagée
    is_public boolean default true,
    created_at timestamptz default now()
);

-- Index pour lookup rapide par share_code
create index if not exists idx_shared_watchlists_code
    on public.shared_watchlists(share_code);


-- 6. WATCHLIST ANNOTATIONS (notes collaboratives sur les actifs)
create table if not exists public.watchlist_annotations (
    id bigint generated always as identity primary key,
    watchlist_item_id bigint references public.watchlist(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    author_name text,                  -- nom affiché (dénormalisé pour performance)
    text text not null,
    created_at timestamptz default now()
);

-- Index pour charger les annotations d'un item rapidement
create index if not exists idx_annotations_item
    on public.watchlist_annotations(watchlist_item_id);


-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════

-- Activer RLS sur toutes les tables
alter table public.profiles enable row level security;
alter table public.watchlist enable row level security;
alter table public.articles enable row level security;
alter table public.newsletter enable row level security;
alter table public.shared_watchlists enable row level security;
alter table public.watchlist_annotations enable row level security;

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

-- SHARED WATCHLISTS : tout le monde peut voir les watchlists publiques
create policy "Public shared watchlists are viewable"
    on public.shared_watchlists for select
    using (is_public = true);

-- SHARED WATCHLISTS : les propriétaires voient aussi les leurs (publiques ou non)
create policy "Owners can view own shared watchlists"
    on public.shared_watchlists for select
    using (auth.uid() = owner_id);

-- SHARED WATCHLISTS : seul un utilisateur authentifié peut partager sa watchlist
create policy "Users can share own watchlist"
    on public.shared_watchlists for insert
    with check (auth.uid() = owner_id);

-- SHARED WATCHLISTS : le propriétaire peut supprimer son partage
create policy "Owners can delete own shared watchlists"
    on public.shared_watchlists for delete
    using (auth.uid() = owner_id);

-- ANNOTATIONS : visibles par tous (collaboration ouverte)
create policy "Annotations are viewable by all authenticated users"
    on public.watchlist_annotations for select
    using (auth.uid() is not null);

-- ANNOTATIONS : tout utilisateur authentifié peut annoter
create policy "Authenticated users can add annotations"
    on public.watchlist_annotations for insert
    with check (auth.uid() = user_id);

-- ANNOTATIONS : chacun peut supprimer ses propres annotations
create policy "Users can delete own annotations"
    on public.watchlist_annotations for delete
    using (auth.uid() = user_id);

-- WATCHLIST : les propriétaires de shared_watchlists peuvent lire
-- la watchlist de l'owner (nécessaire pour afficher une watchlist partagée)
create policy "Shared watchlist items are viewable"
    on public.watchlist for select
    using (
        exists (
            select 1 from public.shared_watchlists sw
            where sw.owner_id = watchlist.user_id
            and sw.is_public = true
        )
    );
