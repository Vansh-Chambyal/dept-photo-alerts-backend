-- Run this once in Supabase Dashboard -> SQL Editor -> New query

create extension if not exists "uuid-ossp";

create table departments (
    id uuid primary key default uuid_generate_v4(),
    name text unique not null,
    created_at timestamptz not null default now()
);

create table users (
    id uuid primary key default uuid_generate_v4(),
    phone_number text unique not null,
    pin_hash text,                                    -- null until the user sets it on first login
    is_admin boolean not null default false,
    department_id uuid references departments(id),
    fcm_token text,
    created_at timestamptz not null default now()
);

create table photos (
    id uuid primary key default uuid_generate_v4(),
    department_id uuid not null references departments(id),
    sent_by_id uuid not null references users(id),
    image_url text not null,
    caption text,
    created_at timestamptz not null default now()
);

create index idx_users_department on users(department_id);
create index idx_photos_department on photos(department_id);

-- Starter departments — rename, add, or remove any time via the admin-only
-- department endpoints once the app is running. These are just to start.
insert into departments (name) values
    ('Electrical'), ('Mechanical'), ('Civil'), ('QC');

-- Add yourself as the very first administrator. There's no signup flow for
-- this one row on purpose — every other user gets whitelisted BY an admin
-- (see POST /users/whitelist), so the first admin has to be inserted by hand.
-- Replace the phone number below with your own, then run this line.
insert into users (phone_number, is_admin) values ('+91XXXXXXXXXX', true);
