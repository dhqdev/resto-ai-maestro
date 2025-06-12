/*
  # Sistema Completo de Gestão de Restaurante

  1. Tabelas Principais
    - `profiles` - Perfis de usuários com permissões
    - `tables` - Mesas do restaurante
    - `categories` - Categorias do cardápio
    - `menu_items` - Itens do cardápio
    - `orders` - Pedidos
    - `order_items` - Itens dos pedidos
    - `payments` - Pagamentos
    - `stock_items` - Estoque
    - `notifications` - Notificações

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas de acesso baseadas em roles
    - Triggers para atualização automática

  3. Funcionalidades
    - Sistema de permissões granular
    - Controle de estoque com alertas
    - Gestão completa de pedidos
    - Sistema financeiro integrado
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Masters and admins can manage profiles" ON profiles FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'admin')
  ));

-- Create policies for tables
CREATE POLICY "All authenticated users can view tables" ON tables FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage tables" ON tables FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'admin', 'manager', 'waiter')
  ));

-- Create policies for categories
CREATE POLICY "All authenticated users can view categories" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can manage categories" ON categories FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'admin', 'manager')
  ));

-- Create policies for menu items
CREATE POLICY "All authenticated users can view menu items" ON menu_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can manage menu items" ON menu_items FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'admin', 'manager')
  ));

-- Create policies for orders
CREATE POLICY "All authenticated users can view orders" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage orders" ON orders FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'admin', 'manager', 'waiter', 'kitchen', 'cashier')
  ));

-- Create policies for order items
CREATE POLICY "All authenticated users can view order items" ON order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage order items" ON order_items FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'admin', 'manager', 'waiter', 'kitchen', 'cashier')
  ));

-- Create policies for payments
CREATE POLICY "All authenticated users can view payments" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage payments" ON payments FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'admin', 'manager', 'cashier')
  ));

-- Create policies for stock items
CREATE POLICY "All authenticated users can view stock" ON stock_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage stock" ON stock_items FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'admin', 'manager', 'kitchen')
  ));

-- Create policies for notifications
CREATE POLICY "All authenticated users can view notifications" ON notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage notifications" ON notifications FOR ALL TO authenticated 
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

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_items_updated_at BEFORE UPDATE ON stock_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'), 'waiter');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert initial data
INSERT INTO categories (name, description) VALUES
  ('Entradas', 'Pratos para começar a refeição'),
  ('Pratos Principais', 'Pratos principais do cardápio'),
  ('Bebidas', 'Bebidas diversas'),
  ('Sobremesas', 'Doces e sobremesas'),
  ('Pizzas', 'Pizzas tradicionais e especiais')
ON CONFLICT DO NOTHING;

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
  (10, 6, 'available')
ON CONFLICT DO NOTHING;

-- Insert sample menu items
INSERT INTO menu_items (category_id, name, description, price, preparation_time, ingredients, allergens, options) 
SELECT 
  c.id,
  'Pizza Margherita',
  'Pizza tradicional com molho de tomate, mussarela e manjericão',
  32.90,
  25,
  ARRAY['Massa', 'Molho de tomate', 'Mussarela', 'Manjericão'],
  ARRAY['Glúten', 'Lactose'],
  '{"sizes": ["Pequena", "Média", "Grande"], "extras": ["Borda recheada", "Azeitona", "Orégano"]}'::jsonb
FROM categories c WHERE c.name = 'Pizzas'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (category_id, name, description, price, preparation_time, ingredients, allergens, options) 
SELECT 
  c.id,
  'Coca-Cola',
  'Refrigerante Coca-Cola gelado',
  6.50,
  2,
  ARRAY['Coca-Cola'],
  ARRAY[]::text[],
  '{"sizes": ["350ml", "600ml", "2L"], "extras": ["Gelo", "Limão", "Canudo"]}'::jsonb
FROM categories c WHERE c.name = 'Bebidas'
ON CONFLICT DO NOTHING;

-- Insert sample stock items
INSERT INTO stock_items (name, category, current_stock, min_stock, max_stock, unit, cost_per_unit, supplier, expiry_date) VALUES
  ('Queijo Mussarela', 'Laticínios', 15.5, 10.0, 50.0, 'kg', 28.90, 'Laticínios ABC', '2024-07-15'),
  ('Massa de Pizza', 'Massas', 25.0, 20.0, 100.0, 'kg', 8.50, 'Massas XYZ', '2024-08-01'),
  ('Coca-Cola 350ml', 'Bebidas', 48, 24, 120, 'unidades', 3.20, 'Bebidas Ltda', '2024-12-31'),
  ('Tomate', 'Vegetais', 8.2, 5.0, 30.0, 'kg', 4.50, 'Hortifruti Local', '2024-06-20')
ON CONFLICT DO NOTHING;