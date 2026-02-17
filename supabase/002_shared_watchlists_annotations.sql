-- ═══════════════════════════════════════════════════════════════
-- Migration 002 — Tables shared_watchlists & watchlist_annotations
-- À exécuter dans : Supabase Dashboard → SQL Editor → New query
--
-- Prérequis : schema.sql (tables profiles, watchlist) déjà appliqué
-- ═══════════════════════════════════════════════════════════════

-- ─── Table : shared_watchlists ────────────────────────────────
-- Permet le partage de watchlists via un lien public (code 12 car.)

create table if not exists public.shared_watchlists (
    id bigint generated always as identity primary key,
    owner_id uuid references public.profiles(id) on delete cascade not null,
    share_code text unique not null,
    name text not null,
    is_public boolean default true,
    created_at timestamptz default now()
);

create index if not exists idx_shared_watchlists_code
    on public.shared_watchlists(share_code);

alter table public.shared_watchlists enable row level security;

-- Tout le monde peut voir les watchlists publiques
create policy "Public shared watchlists are viewable"
    on public.shared_watchlists for select
    using (is_public = true);

-- Les propriétaires voient aussi les leurs
create policy "Owners can view own shared watchlists"
    on public.shared_watchlists for select
    using (auth.uid() = owner_id);

-- Seul un utilisateur authentifié peut partager sa watchlist
create policy "Users can share own watchlist"
    on public.shared_watchlists for insert
    with check (auth.uid() = owner_id);

-- Le propriétaire peut supprimer son partage
create policy "Owners can delete own shared watchlists"
    on public.shared_watchlists for delete
    using (auth.uid() = owner_id);


-- ─── Table : watchlist_annotations ───────────────────────────
-- Notes collaboratives sur les actifs de la watchlist

create table if not exists public.watchlist_annotations (
    id bigint generated always as identity primary key,
    watchlist_item_id bigint references public.watchlist(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    author_name text,
    text text not null,
    created_at timestamptz default now()
);

create index if not exists idx_annotations_item
    on public.watchlist_annotations(watchlist_item_id);

alter table public.watchlist_annotations enable row level security;

-- Visibles par tous les utilisateurs authentifiés
create policy "Annotations are viewable by all authenticated users"
    on public.watchlist_annotations for select
    using (auth.uid() is not null);

-- Tout utilisateur authentifié peut annoter
create policy "Authenticated users can add annotations"
    on public.watchlist_annotations for insert
    with check (auth.uid() = user_id);

-- Chacun peut supprimer ses propres annotations
create policy "Users can delete own annotations"
    on public.watchlist_annotations for delete
    using (auth.uid() = user_id);


-- ─── Policy additionnelle sur watchlist ──────────────────────
-- Permet de lire les items d'une watchlist partagée publiquement

create policy "Shared watchlist items are viewable"
    on public.watchlist for select
    using (
        exists (
            select 1 from public.shared_watchlists sw
            where sw.owner_id = watchlist.user_id
            and sw.is_public = true
        )
    );
