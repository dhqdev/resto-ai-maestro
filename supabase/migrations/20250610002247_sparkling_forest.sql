/*
  # Sistema Completo de Gestão de Restaurante

  1. Tabelas Principais
    - `profiles` - Perfis de usuários com permissões
    - `customers` - Clientes cadastrados
    - `tables` - Mesas do restaurante
    - `categories` - Categorias do cardápio
    - `menu_items` - Itens do cardápio
    - `stock_items` - Itens do estoque
    - `orders` - Pedidos
    - `order_items` - Itens dos pedidos
    - `payments` - Pagamentos
    - `notifications` - Notificações do sistema

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas baseadas em permissões de usuário
    - Usuário master com acesso total
*/

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de perfis de usuários
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

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de mesas
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

-- Tabela de categorias do cardápio
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabela de itens do cardápio
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  preparation_time integer DEFAULT 15,
  ingredients text[],
  allergens text[],
  calories integer,
  is_available boolean DEFAULT true,
  image_url text,
  options jsonb DEFAULT '{}', -- Para opções como gelo, limão, etc.
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de itens do estoque
CREATE TABLE IF NOT EXISTS stock_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  category text NOT NULL,
  current_stock decimal(10,2) NOT NULL DEFAULT 0,
  min_stock decimal(10,2) NOT NULL DEFAULT 0,
  max_stock decimal(10,2) NOT NULL DEFAULT 100,
  unit text NOT NULL DEFAULT 'kg',
  cost_per_unit decimal(10,2) NOT NULL DEFAULT 0,
  supplier text,
  expiry_date date,
  last_restocked timestamptz,
  consumption_rate decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id uuid REFERENCES tables(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  waiter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  order_number text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de itens dos pedidos
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(10,2) NOT NULL,
  options jsonb DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'pix', 'other')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id text,
  created_at timestamptz DEFAULT now()
);

-- Tabela de notificações
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

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Masters and admins can manage profiles" ON profiles FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('master', 'admin')
    )
  );

-- Políticas para customers
CREATE POLICY "All authenticated users can view customers" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage customers" ON customers FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('master', 'admin', 'manager', 'waiter', 'cashier')
    )
  );

-- Políticas para tables
CREATE POLICY "All authenticated users can view tables" ON tables FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage tables" ON tables FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('master', 'admin', 'manager', 'waiter')
    )
  );

-- Políticas para categories
CREATE POLICY "All authenticated users can view categories" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can manage categories" ON categories FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('master', 'admin', 'manager')
    )
  );

-- Políticas para menu_items
CREATE POLICY "All authenticated users can view menu items" ON menu_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can manage menu items" ON menu_items FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('master', 'admin', 'manager')
    )
  );

-- Políticas para stock_items
CREATE POLICY "All authenticated users can view stock" ON stock_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage stock" ON stock_items FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('master', 'admin', 'manager', 'kitchen')
    )
  );

-- Políticas para orders
CREATE POLICY "All authenticated users can view orders" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage orders" ON orders FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('master', 'admin', 'manager', 'waiter', 'kitchen', 'cashier')
    )
  );

-- Políticas para order_items
CREATE POLICY "All authenticated users can view order items" ON order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage order items" ON order_items FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('master', 'admin', 'manager', 'waiter', 'kitchen', 'cashier')
    )
  );

-- Políticas para payments
CREATE POLICY "All authenticated users can view payments" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage payments" ON payments FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('master', 'admin', 'manager', 'cashier')
    )
  );

-- Políticas para notifications
CREATE POLICY "All authenticated users can view notifications" ON notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage notifications" ON notifications FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('master', 'admin', 'manager')
    )
  );

-- Funções para atualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar timestamps
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_items_updated_at BEFORE UPDATE ON stock_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', new.email), 'waiter');
  RETURN new;
END;
$$ language plpgsql security definer;

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Inserir dados iniciais
INSERT INTO categories (name, description) VALUES
  ('Pizzas', 'Pizzas tradicionais e especiais'),
  ('Hambúrguers', 'Hambúrguers artesanais'),
  ('Saladas', 'Saladas frescas e saudáveis'),
  ('Massas', 'Massas italianas'),
  ('Bebidas', 'Bebidas geladas e quentes'),
  ('Sobremesas', 'Doces e sobremesas');

INSERT INTO tables (table_number, capacity, position_x, position_y) VALUES
  (1, 2, 100, 100),
  (2, 4, 300, 100),
  (3, 4, 500, 100),
  (4, 6, 700, 100),
  (5, 2, 100, 300),
  (6, 4, 300, 300),
  (7, 4, 500, 300),
  (8, 6, 700, 300),
  (9, 2, 100, 500),
  (10, 4, 300, 500),
  (11, 4, 500, 500),
  (12, 8, 700, 500);

-- Inserir itens do cardápio com opções
INSERT INTO menu_items (category_id, name, description, price, preparation_time, ingredients, allergens, options) 
SELECT 
  c.id,
  'Pizza Margherita',
  'Pizza tradicional com molho de tomate, mussarela e manjericão',
  32.90,
  25,
  ARRAY['Massa', 'Molho de tomate', 'Mussarela', 'Manjericão'],
  ARRAY['Glúten', 'Lactose'],
  '{"sizes": ["Pequena", "Média", "Grande"], "extras": ["Borda recheada", "Queijo extra"]}'::jsonb
FROM categories c WHERE c.name = 'Pizzas';

INSERT INTO menu_items (category_id, name, description, price, preparation_time, ingredients, allergens, options) 
SELECT 
  c.id,
  'Coca-Cola',
  'Refrigerante gelado',
  6.50,
  2,
  ARRAY['Coca-Cola'],
  ARRAY[]::text[],
  '{"sizes": ["350ml", "600ml", "2L"], "options": ["Com gelo", "Sem gelo", "Com limão"]}'::jsonb
FROM categories c WHERE c.name = 'Bebidas';

-- Inserir itens de estoque
INSERT INTO stock_items (name, category, current_stock, min_stock, max_stock, unit, cost_per_unit, expiry_date) VALUES
  ('Massa para Pizza', 'food', 15, 20, 100, 'kg', 8.50, CURRENT_DATE + INTERVAL '30 days'),
  ('Queijo Mussarela', 'food', 5, 10, 50, 'kg', 28.90, CURRENT_DATE + INTERVAL '15 days'),
  ('Coca-Cola 350ml', 'beverage', 48, 24, 120, 'unidades', 3.20, CURRENT_DATE + INTERVAL '90 days'),
  ('Tomate', 'food', 8, 15, 50, 'kg', 4.50, CURRENT_DATE + INTERVAL '7 days'),
  ('Manjericão', 'food', 2, 5, 20, 'kg', 12.00, CURRENT_DATE + INTERVAL '5 days');