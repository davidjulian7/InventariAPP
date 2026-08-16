-- ============================================================
-- RetailOS - Esquema SQLite (desarrollo local)
-- Adaptado de supabase/migrations/001_schema.sql (Supabase/Postgres)
-- ============================================================

-- En Supabase la autenticación vive en auth.users + public.user_profiles.
-- En dev local se sustituye por una tabla `users` con hash de contraseña.

create table if not exists stores (
  id integer primary key autoincrement,
  nombre text not null,
  rfc text,
  direccion text,
  telefono text,
  email text,
  logo_url text,
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);

create table if not exists users (
  id integer primary key autoincrement,
  email text not null unique,
  password_hash text not null,
  nombre text not null,
  rol text not null default 'cajero' check (rol in ('admin', 'cajero', 'almacenista', 'gerente')),
  store_id integer references stores(id) on delete set null,
  active integer not null default 1,
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);

create table if not exists sessions (
  token text primary key,
  user_id integer not null references users(id) on delete cascade,
  created_at text not null default (datetime('now')),
  expires_at text not null
);

create table if not exists categories (
  id integer primary key autoincrement,
  nombre text not null,
  color text default '#628141',
  store_id integer references stores(id) on delete cascade,
  created_at text not null default (datetime('now'))
);

create table if not exists suppliers (
  id integer primary key autoincrement,
  nombre text not null,
  contacto text,
  telefono text,
  email text,
  direccion text,
  store_id integer references stores(id) on delete cascade,
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);

create table if not exists products (
  id integer primary key autoincrement,
  sku text,
  codigo_barras text,
  nombre text not null,
  categoria text,
  category_id integer references categories(id) on delete set null,
  precio_compra real not null default 0,
  precio_venta real not null default 0,
  existencia real not null default 0,
  stock_min real not null default 10,
  proveedor_id integer references suppliers(id) on delete set null,
  store_id integer references stores(id) on delete cascade,
  active integer not null default 1,
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);

create index if not exists idx_products_store on products(store_id);
create index if not exists idx_products_barcode on products(codigo_barras);
create index if not exists idx_products_category on products(category_id);

create table if not exists inventory_movements (
  id integer primary key autoincrement,
  producto_id integer not null references products(id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'salida', 'ajuste')),
  cantidad real not null,
  motivo text,
  referencia text,
  user_id integer references users(id),
  store_id integer references stores(id) on delete cascade,
  created_at text not null default (datetime('now'))
);

create index if not exists idx_movements_product on inventory_movements(producto_id);
create index if not exists idx_movements_store on inventory_movements(store_id);
create index if not exists idx_movements_created on inventory_movements(created_at desc);

create table if not exists sales (
  id integer primary key autoincrement,
  folio text not null,
  cliente text default 'Cliente general',
  subtotal real not null default 0,
  iva real not null default 0,
  total real not null default 0,
  metodo_pago text not null check (metodo_pago in ('efectivo', 'transferencia', 'terminal')),
  user_id integer references users(id),
  store_id integer references stores(id) on delete cascade,
  created_at text not null default (datetime('now'))
);

create index if not exists idx_sales_store on sales(store_id);
create index if not exists idx_sales_created on sales(created_at desc);

create table if not exists sale_items (
  id integer primary key autoincrement,
  venta_id integer not null references sales(id) on delete cascade,
  producto_id integer references products(id) on delete set null,
  nombre text not null,
  precio real not null,
  qty real not null,
  subtotal real not null
);

create index if not exists idx_sale_items_venta on sale_items(venta_id);

create table if not exists ai_chats (
  id integer primary key autoincrement,
  title text,
  user_id integer references users(id),
  store_id integer references stores(id) on delete cascade,
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);

create table if not exists ai_messages (
  id integer primary key autoincrement,
  chat_id integer references ai_chats(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at text not null default (datetime('now'))
);

create index if not exists idx_ai_messages_chat on ai_messages(chat_id);

create table if not exists notifications (
  id integer primary key autoincrement,
  user_id integer references users(id) on delete cascade,
  title text not null,
  descripcion text,
  tipo text default 'info',
  leida integer not null default 0,
  created_at text not null default (datetime('now'))
);

create index if not exists idx_notifications_user on notifications(user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

create trigger if not exists trg_stores_updated
  after update on stores for each row
  when old.updated_at = new.updated_at
  begin
    update stores set updated_at = datetime('now') where id = old.id;
  end;

create trigger if not exists trg_users_updated
  after update on users for each row
  when old.updated_at = new.updated_at
  begin
    update users set updated_at = datetime('now') where id = old.id;
  end;

create trigger if not exists trg_suppliers_updated
  after update on suppliers for each row
  when old.updated_at = new.updated_at
  begin
    update suppliers set updated_at = datetime('now') where id = old.id;
  end;

create trigger if not exists trg_products_updated
  after update on products for each row
  when old.updated_at = new.updated_at
  begin
    update products set updated_at = datetime('now') where id = old.id;
  end;
