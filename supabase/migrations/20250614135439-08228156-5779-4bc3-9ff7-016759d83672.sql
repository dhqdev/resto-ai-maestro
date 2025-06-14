
-- Criar tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'waiter' CHECK (role IN ('master', 'admin', 'manager', 'waiter', 'kitchen', 'cashier')),
  permissions jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de mesas
CREATE TABLE IF NOT EXISTS public.tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number integer UNIQUE NOT NULL,
  capacity integer NOT NULL DEFAULT 4,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning')),
  position_x integer DEFAULT 0,
  position_y integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de categorias do menu
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de itens do menu
CREATE TABLE IF NOT EXISTS public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Criar tabela de pedidos
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid REFERENCES tables(id) ON DELETE SET NULL,
  waiter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  order_number text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
  total_amount numeric(10,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de itens do pedido
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  options jsonb DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de pagamentos
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'pix', 'other')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id text,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de estoque
CREATE TABLE IF NOT EXISTS public.stock_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
  category text NOT NULL CHECK (category IN ('stock', 'orders', 'financial', 'staff', 'system')),
  is_read boolean DEFAULT false,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  action_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir tudo para usuários autenticados)
CREATE POLICY "Authenticated users can manage profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage tables" ON public.tables FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage categories" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage menu_items" ON public.menu_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage orders" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage order_items" ON public.order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage payments" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage stock_items" ON public.stock_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage notifications" ON public.notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  IF user_count = 0 THEN
    -- Primeiro usuário vira master
    INSERT INTO public.profiles (user_id, email, full_name, role, permissions)
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Master Admin'), 
      'master',
      '{"all": true}'::jsonb
    );
  ELSE
    -- Demais usuários são garçons
    INSERT INTO public.profiles (user_id, email, full_name, role)
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

-- Trigger para criar perfil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Inserir dados iniciais de exemplo
INSERT INTO public.categories (name, description) VALUES
  ('Entradas', 'Pratos para começar a refeição'),
  ('Pratos Principais', 'Pratos principais do cardápio'),
  ('Bebidas', 'Bebidas diversas'),
  ('Sobremesas', 'Doces e sobremesas'),
  ('Pizzas', 'Pizzas tradicionais e especiais')
ON CONFLICT DO NOTHING;

INSERT INTO public.tables (table_number, capacity, status) VALUES
  (1, 2, 'available'), (2, 4, 'available'), (3, 4, 'available'),
  (4, 6, 'available'), (5, 2, 'available'), (6, 4, 'available'),
  (7, 8, 'available'), (8, 4, 'available'), (9, 2, 'available'),
  (10, 6, 'available'), (11, 4, 'available'), (12, 8, 'available'),
  (13, 2, 'available'), (14, 4, 'available'), (15, 6, 'available'),
  (16, 2, 'available'), (17, 4, 'available'), (18, 8, 'available')
ON CONFLICT (table_number) DO NOTHING;

-- Inserir itens do menu de exemplo
INSERT INTO public.menu_items (category_id, name, description, price, preparation_time, ingredients, allergens, options) 
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

INSERT INTO public.menu_items (category_id, name, description, price, preparation_time, ingredients, allergens, options) 
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

-- Inserir itens de estoque de exemplo
INSERT INTO public.stock_items (name, category, current_stock, min_stock, max_stock, unit, cost_per_unit, supplier, expiry_date) VALUES
  ('Queijo Mussarela', 'Laticínios', 15.5, 10.0, 50.0, 'kg', 28.90, 'Laticínios ABC', '2024-07-15'),
  ('Massa de Pizza', 'Massas', 25.0, 20.0, 100.0, 'kg', 8.50, 'Massas XYZ', '2024-08-01'),
  ('Coca-Cola 350ml', 'Bebidas', 48, 24, 120, 'unidades', 3.20, 'Bebidas Ltda', '2024-12-31'),
  ('Tomate', 'Vegetais', 8.2, 5.0, 30.0, 'kg', 4.50, 'Hortifruti Local', '2024-06-20')
ON CONFLICT DO NOTHING;

-- Inserir notificações de exemplo
INSERT INTO public.notifications (title, message, type, category, priority, action_required) VALUES
  ('Estoque Baixo', 'Queijo Mussarela está abaixo do estoque mínimo', 'warning', 'stock', 'high', true),
  ('Novo Pedido', 'Pedido #001 recebido da mesa 5', 'info', 'orders', 'medium', false),
  ('Sistema Iniciado', 'Sistema de gestão do restaurante foi iniciado com sucesso', 'success', 'system', 'low', false)
ON CONFLICT DO NOTHING;
