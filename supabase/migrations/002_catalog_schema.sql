-- Migration for VT-35: Business Catalog Schema
-- This migration adds tables for products and services catalog management

-- Create unit of measure table
create table unit_measures (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  abbreviation text not null unique,
  type text not null, -- 'weight', 'volume', 'length', 'unit', etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create product brands table
create table product_brands (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  logo_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create product categories table
create table product_categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  parent_id uuid references product_categories(id) on delete cascade,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create service categories table
create table service_categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  parent_id uuid references service_categories(id) on delete cascade,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create products table
create table products (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  name text not null,
  brand_id uuid references product_brands(id) on delete set null,
  barcode text,
  unit_measure_id uuid references unit_measures(id) on delete set null not null,
  quantity_per_unit decimal(10,3) not null default 1,
  short_description text,
  description text,
  category_id uuid references product_categories(id) on delete set null,
  price decimal(10,2) not null,
  cost decimal(10,2),
  stock_quantity decimal(10,3) default 0,
  min_stock_level decimal(10,3) default 0,
  max_stock_level decimal(10,3),
  image_url text,
  sku text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(tenant_id, sku)
);

-- Create service types enum (based on tenant types)
create type service_type as enum ('clinic', 'spa', 'consultorio', 'general');

-- Extend existing services table with new fields for VT-35
alter table services add column if not exists service_type service_type default 'general';
alter table services add column if not exists category_id uuid references service_categories(id) on delete set null;
alter table services add column if not exists short_description text;
alter table services add column if not exists image_url text;
alter table services add column if not exists is_featured boolean default false;
alter table services add column if not exists requires_appointment boolean default true;

-- Create product images table (for multiple images per product)
create table product_images (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references products(id) on delete cascade not null,
  image_url text not null,
  alt_text text,
  is_primary boolean default false,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create service images table (for multiple images per service)
create table service_images (
  id uuid default gen_random_uuid() primary key,
  service_id uuid references services(id) on delete cascade not null,
  image_url text not null,
  alt_text text,
  is_primary boolean default false,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index idx_products_tenant_id on products(tenant_id);
create index idx_products_category_id on products(category_id);
create index idx_products_brand_id on products(brand_id);
create index idx_products_barcode on products(barcode);
create index idx_products_sku on products(sku);
create index idx_services_category_id on services(category_id);
create index idx_services_type on services(service_type);
create index idx_product_categories_parent_id on product_categories(parent_id);
create index idx_service_categories_parent_id on service_categories(parent_id);

-- Add triggers for updated_at
create trigger update_unit_measures_updated_at before update on unit_measures
  for each row execute procedure update_updated_at_column();

create trigger update_product_brands_updated_at before update on product_brands
  for each row execute procedure update_updated_at_column();

create trigger update_product_categories_updated_at before update on product_categories
  for each row execute procedure update_updated_at_column();

create trigger update_service_categories_updated_at before update on service_categories
  for each row execute procedure update_updated_at_column();

create trigger update_products_updated_at before update on products
  for each row execute procedure update_updated_at_column();

-- Insert default unit measures
insert into unit_measures (name, abbreviation, type) values
  ('Unidad', 'ud', 'unit'),
  ('Kilogramo', 'kg', 'weight'),
  ('Gramo', 'g', 'weight'),
  ('Litro', 'l', 'volume'),
  ('Mililitro', 'ml', 'volume'),
  ('Metro', 'm', 'length'),
  ('Centímetro', 'cm', 'length'),
  ('Milímetro', 'mm', 'length'),
  ('Caja', 'cj', 'container'),
  ('Paquete', 'paq', 'container'),
  ('Botella', 'bot', 'container'),
  ('Frasco', 'fco', 'container'),
  ('Tubo', 'tb', 'container'),
  ('Ampolla', 'amp', 'container'),
  ('Comprimido', 'comp', 'pharmaceutical'),
  ('Cápsula', 'caps', 'pharmaceutical'),
  ('Tableta', 'tab', 'pharmaceutical'),
  ('Sobre', 'sbr', 'container');

-- Insert default product categories
insert into product_categories (name, description) values
  ('Medicamentos', 'Productos farmacéuticos y medicinas'),
  ('Material Médico', 'Instrumentos y equipos médicos'),
  ('Productos de Belleza', 'Cosméticos y productos para tratamientos estéticos'),
  ('Suplementos', 'Vitaminas y suplementos nutricionales'),
  ('Material de Oficina', 'Artículos administrativos y de oficina'),
  ('Equipamiento', 'Mobiliario y equipos para consultorios'),
  ('Higiene', 'Productos de limpieza e higiene'),
  ('Textil', 'Ropa médica, uniformes y textiles');

-- Insert default service categories based on tenant types
insert into service_categories (name, description) values
  ('Consulta General', 'Consultas médicas generales'),
  ('Especialidades Médicas', 'Consultas con médicos especialistas'),
  ('Tratamientos Estéticos', 'Servicios de belleza y estética'),
  ('Terapias de Relajación', 'Masajes y terapias de bienestar'),
  ('Diagnóstico', 'Pruebas y estudios diagnósticos'),
  ('Cirugía Menor', 'Procedimientos quirúrgicos ambulatorios'),
  ('Rehabilitación', 'Fisioterapia y rehabilitación'),
  ('Cuidados Preventivos', 'Servicios de prevención y chequeos');

-- Add RLS (Row Level Security) policies
alter table products enable row level security;
alter table product_brands enable row level security;
alter table product_categories enable row level security;
alter table service_categories enable row level security;
alter table unit_measures enable row level security;
alter table product_images enable row level security;
alter table service_images enable row level security;

-- Products policies (tenant-based access)
create policy "Users can view products from their tenant" on products
  for select using (
    tenant_id in (
      select tenant_id from user_profiles where id = auth.uid()
    )
  );

create policy "Admins can manage products in their tenant" on products
  for all using (
    tenant_id in (
      select tenant_id from user_profiles
      where id = auth.uid() and role in ('admin_tenant', 'receptionist')
    )
  );

-- Product brands policies (global access for reading, admin for writing)
create policy "Anyone can view active brands" on product_brands
  for select using (is_active = true);

create policy "Admins can manage brands" on product_brands
  for all using (
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin_tenant'
    )
  );

-- Product categories policies (global access)
create policy "Anyone can view active categories" on product_categories
  for select using (is_active = true);

create policy "Admins can manage product categories" on product_categories
  for all using (
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin_tenant'
    )
  );

-- Service categories policies (global access)
create policy "Anyone can view active service categories" on service_categories
  for select using (is_active = true);

create policy "Admins can manage service categories" on service_categories
  for all using (
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin_tenant'
    )
  );

-- Unit measures policies (global read access)
create policy "Anyone can view unit measures" on unit_measures
  for select using (true);

create policy "Admins can manage unit measures" on unit_measures
  for all using (
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin_tenant'
    )
  );

-- Product images policies
create policy "Users can view product images from their tenant" on product_images
  for select using (
    product_id in (
      select p.id from products p
      join user_profiles up on p.tenant_id = up.tenant_id
      where up.id = auth.uid()
    )
  );

create policy "Admins can manage product images in their tenant" on product_images
  for all using (
    product_id in (
      select p.id from products p
      join user_profiles up on p.tenant_id = up.tenant_id
      where up.id = auth.uid() and up.role in ('admin_tenant', 'receptionist')
    )
  );

-- Service images policies
create policy "Users can view service images from their tenant" on service_images
  for select using (
    service_id in (
      select s.id from services s
      join user_profiles up on s.tenant_id = up.tenant_id
      where up.id = auth.uid()
    )
  );

create policy "Admins can manage service images in their tenant" on service_images
  for all using (
    service_id in (
      select s.id from services s
      join user_profiles up on s.tenant_id = up.tenant_id
      where up.id = auth.uid() and up.role in ('admin_tenant', 'receptionist')
    )
  );