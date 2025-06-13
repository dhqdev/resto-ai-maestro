/*
  # Complete Restaurant Management System Schema

  1. New Tables
    - `profiles` - User profiles with roles and permissions
    - `tables` - Restaurant tables management
    - `categories` - Menu categories
    - `menu_items` - Menu items with options
    - `orders` - Customer orders
    - `order_items` - Items within orders
    - `payments` - Payment records
    - `stock_items` - Inventory management
    - `notifications` - System notifications

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for each role
    - Secure access based on user permissions

  3. Functions and Triggers
    - Auto-update timestamps
    - Handle new user registration
    - Create profiles automatically
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies if they exist to avoid conflicts
DO $$ 
BEGIN
  -- Drop existing policies for profiles
  DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Masters and admins can manage profiles" ON profiles;
  
  -- Drop existing policies for tables
  DROP POLICY IF EXISTS "All authenticated users can view tables" ON tables;
  DROP POLICY IF EXISTS "Staff can manage tables" ON tables;
  
  -- Drop existing policies for categories
  DROP POLICY IF EXISTS "All authenticated users can view categories" ON categories;
  DROP POLICY IF EXISTS "Managers can manage categories" ON categories;
  
  -- Drop existing policies for menu_items
  DROP POLICY IF EXISTS "All authenticated users can view menu items" ON menu_items;
  DROP POLICY IF EXISTS "Managers can manage menu items" ON menu_items;
  
  -- Drop existing policies for orders
  DROP POLICY IF EXISTS "All authenticated users can view orders" ON orders;
  DROP POLICY IF EXISTS "Staff can manage orders" ON orders;
  
  -- Drop existing policies for order_items
  DROP POLICY IF EXISTS "All authenticated users can view order items" ON order_items;
  DROP POLICY IF EXISTS "Staff can manage order items" ON order_items;
  
  -- Drop existing policies for payments
  DROP POLICY IF EXISTS "All authenticated users can view payments" ON payments;
  DROP POLICY IF EXISTS "Staff can manage payments" ON payments;
  
  -- Drop existing policies for stock_items
  DROP POLICY IF EXISTS "All authenticated users can view stock" ON stock_items;
  DROP POLICY IF EXISTS "Staff can manage stock" ON stock_items;
  
  -- Drop existing policies for notifications
  DROP POLICY IF EXISTS "All authenticated users can view notifications" ON notifications;
  DROP POLICY IF EXISTS "Staff can manage notifications" ON notifications;
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- Ignore if policies don't exist
END $$;

-- Create profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'waiter' CHECK (role IN ('master', 'admin', 'manager', 'waiter', 'kitchen', 'cashier')),
  permissions jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tables for restaurant
CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_number integer UNIQUE NOT NULL,
  capacity integer NOT NULL DEFAULT 4,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning')),
  position_x integer DEFAULT 0,
  position_y integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create categories for menu
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create menu items
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  preparation_time integer DEFAULT 15,
  ingredients text[],
  allergens text[],
  calories integer,
  is_available boolean DEFAULT true,
  image_url text,
  options jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id uuid REFERENCES tables(id) ON DELETE SET NULL,
  waiter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  order_number text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
  total_amount numeric(10,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  options jsonb DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'pix', 'other')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id text,
  created_at timestamptz DEFAULT now()
);

-- Create stock items
CREATE TABLE IF NOT EXISTS stock_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  category text NOT NULL,
  current_stock numeric(10,2) DEFAULT 0,
  min_stock numeric(10,2) DEFAULT 0,
  max_stock numeric(10,2) DEFAULT 100,
  unit text DEFAULT 'kg',
  cost_per_unit numeric(10,2) DEFAULT 0,
  supplier text,
  expiry_date date,
  last_restocked timestamptz,
  consumption_rate numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
  category text NOT NULL CHECK (category IN ('stock', 'orders', 'financial', 'staff', 'system')),
  is_read boolean DEFAULT false,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  action_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "profiles_view_all" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles_manage_all" ON profiles FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'admin')
  ));

-- Create policies for tables
CREATE POLICY "tables_view_all" ON tables FOR SELECT TO authenticated USING (true);
CREATE POLICY "tables_manage_staff" ON tables FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'admin', 'manager', 'waiter')
  ));

-- Create policies for categories
CREATE POLICY "categories_view_all" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "categories_manage_managers" ON categories FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'admin', 'manager')
  ));

-- Create policies for menu items
CREATE POLICY "menu_items_view_all" ON menu_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "menu_items_manage_managers" ON menu_items FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'admin', 'manager')
  ));

-- Create policies for orders
CREATE POLICY "orders_view_all" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "orders_manage_staff" ON orders FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'admin', 'manager', 'waiter', 'kitchen', 'cashier')
  ));

-- Create policies for order items
CREATE POLICY "order_items_view_all" ON order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "order_items_manage_staff" ON order_items FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'admin', 'manager', 'waiter', 'kitchen', 'cashier')
  ));

-- Create policies for payments
CREATE POLICY "payments_view_all" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "payments_manage_cashiers" ON payments FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'admin', 'manager', 'cashier')
  ));

-- Create policies for stock items
CREATE POLICY "stock_items_view_all" ON stock_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "stock_items_manage_kitchen" ON stock_items FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'admin', 'manager', 'kitchen')
  ));

-- Create policies for notifications
CREATE POLICY "notifications_view_all" ON notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "notifications_manage_managers" ON notifications FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'admin', 'manager')
  ));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_tables_updated_at ON tables;
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_stock_items_updated_at ON stock_items;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_items_updated_at BEFORE UPDATE ON stock_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Check if this is the first user (will be master)
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  IF user_count = 0 THEN
    -- First user becomes master
    INSERT INTO profiles (user_id, email, full_name, role, permissions)
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Master Admin'), 
      'master',
      '{"all": true}'::jsonb
    );
  ELSE
    -- Subsequent users are waiters by default
    INSERT INTO profiles (user_id, email, full_name, role)
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'), 
      'waiter'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert initial data only if not exists
INSERT INTO categories (name, description) 
SELECT 'Entradas', 'Pratos para começar a refeição'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Entradas');

INSERT INTO categories (name, description) 
SELECT 'Pratos Principais', 'Pratos principais do cardápio'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Pratos Principais');

INSERT INTO categories (name, description) 
SELECT 'Bebidas', 'Bebidas diversas'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Bebidas');

INSERT INTO categories (name, description) 
SELECT 'Sobremesas', 'Doces e sobremesas'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Sobremesas');

INSERT INTO categories (name, description) 
SELECT 'Pizzas', 'Pizzas tradicionais e especiais'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Pizzas');

-- Insert tables only if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM tables WHERE table_number = 1) THEN
    INSERT INTO tables (table_number, capacity, status) VALUES
      (1, 2, 'available'),
      (2, 4, 'available'),
      (3, 4, 'available'),
      (4, 6, 'available'),
      (5, 2, 'available'),
      (6, 4, 'available'),
      (7, 8, 'available'),
      (8, 4, 'available'),
      (9, 2, 'available'),
      (10, 6, 'available');
  END IF;
END $$;

-- Insert sample menu items only if not exists
DO $$
DECLARE
  pizza_category_id uuid;
  bebidas_category_id uuid;
BEGIN
  -- Get category IDs
  SELECT id INTO pizza_category_id FROM categories WHERE name = 'Pizzas' LIMIT 1;
  SELECT id INTO bebidas_category_id FROM categories WHERE name = 'Bebidas' LIMIT 1;
  
  -- Insert Pizza Margherita if not exists
  IF NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Pizza Margherita') AND pizza_category_id IS NOT NULL THEN
    INSERT INTO menu_items (category_id, name, description, price, preparation_time, ingredients, allergens, options) 
    VALUES (
      pizza_category_id,
      'Pizza Margherita',
      'Pizza tradicional com molho de tomate, mussarela e manjericão',
      32.90,
      25,
      ARRAY['Massa', 'Molho de tomate', 'Mussarela', 'Manjericão'],
      ARRAY['Glúten', 'Lactose'],
      '{"sizes": ["Pequena", "Média", "Grande"], "extras": ["Borda recheada", "Azeitona", "Orégano"]}'::jsonb
    );
  END IF;
  
  -- Insert Coca-Cola if not exists
  IF NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Coca-Cola') AND bebidas_category_id IS NOT NULL THEN
    INSERT INTO menu_items (category_id, name, description, price, preparation_time, ingredients, allergens, options) 
    VALUES (
      bebidas_category_id,
      'Coca-Cola',
      'Refrigerante Coca-Cola gelado',
      6.50,
      2,
      ARRAY['Coca-Cola'],
      ARRAY[]::text[],
      '{"sizes": ["350ml", "600ml", "2L"], "extras": ["Gelo", "Limão", "Canudo"]}'::jsonb
    );
  END IF;
END $$;

-- Insert sample stock items only if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM stock_items WHERE name = 'Queijo Mussarela') THEN
    INSERT INTO stock_items (name, category, current_stock, min_stock, max_stock, unit, cost_per_unit, supplier, expiry_date) VALUES
      ('Queijo Mussarela', 'Laticínios', 15.5, 10.0, 50.0, 'kg', 28.90, 'Laticínios ABC', '2024-07-15'),
      ('Massa de Pizza', 'Massas', 25.0, 20.0, 100.0, 'kg', 8.50, 'Massas XYZ', '2024-08-01'),
      ('Coca-Cola 350ml', 'Bebidas', 48, 24, 120, 'unidades', 3.20, 'Bebidas Ltda', '2024-12-31'),
      ('Tomate', 'Vegetais', 8.2, 5.0, 30.0, 'kg', 4.50, 'Hortifruti Local', '2024-06-20');
  END IF;
END $$;

-- Insert sample notifications
INSERT INTO notifications (title, message, type, category, priority, action_required)
SELECT 'Estoque Baixo', 'Queijo Mussarela está abaixo do estoque mínimo', 'warning', 'stock', 'high', true
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE title = 'Estoque Baixo');

INSERT INTO notifications (title, message, type, category, priority)
SELECT 'Sistema Iniciado', 'Sistema de gestão do restaurante foi iniciado com sucesso', 'success', 'system', 'low'
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE title = 'Sistema Iniciado');