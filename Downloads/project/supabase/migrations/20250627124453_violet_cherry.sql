/*
  # Schéma initial pour le système de gestion de boutique

  1. Nouvelles Tables
    - `users` - Utilisateurs du système (admin/agents)
    - `products` - Catalogue des produits
    - `transactions` - Historique des ventes et locations
    - `rentals` - Gestion spécifique des locations avec dates
    - `rental_calendar` - Calendrier des réservations

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Politiques pour les utilisateurs authentifiés
*/

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'agent')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des produits
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  size text NOT NULL,
  color text NOT NULL,
  brand text NOT NULL,
  purchase_price decimal(10,2) NOT NULL DEFAULT 0,
  sale_price decimal(10,2) NOT NULL DEFAULT 0,
  rental_price_per_day decimal(10,2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  description text DEFAULT '',
  barcode text,
  is_available_for_rental boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('sale', 'rental')),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price decimal(10,2) NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'returned', 'cancelled')),
  agent_id uuid REFERENCES users(id),
  agent_name text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Table spécifique pour les locations
CREATE TABLE IF NOT EXISTS rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  rental_start_date date NOT NULL,
  rental_end_date date NOT NULL,
  rental_days integer NOT NULL,
  daily_rate decimal(10,2) NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  deposit_amount decimal(10,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue', 'cancelled')),
  agent_id uuid REFERENCES users(id),
  agent_name text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  returned_at timestamptz
);

-- Table calendrier des réservations
CREATE TABLE IF NOT EXISTS rental_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  rental_id uuid REFERENCES rentals(id) ON DELETE CASCADE,
  reserved_date date NOT NULL,
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'occupied', 'available')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, reserved_date)
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_calendar ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les utilisateurs authentifiés
CREATE POLICY "Users can read all data" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage users" ON users FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can read products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage products" ON products FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read transactions" ON transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create transactions" ON transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update transactions" ON transactions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can read rentals" ON rentals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage rentals" ON rentals FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read rental calendar" ON rental_calendar FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage rental calendar" ON rental_calendar FOR ALL TO authenticated USING (true);

-- Fonctions utilitaires
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Données de démonstration
INSERT INTO users (name, email, role) VALUES
  ('Admin Principal', 'admin@boutique.com', 'admin'),
  ('Agent Vente', 'agent@boutique.com', 'agent')
ON CONFLICT (email) DO NOTHING;

INSERT INTO products (name, category, size, color, brand, purchase_price, sale_price, rental_price_per_day, stock, description, barcode) VALUES
  ('Robe Élégante', 'Robes', 'M', 'Noir', 'Chanel', 150.00, 300.00, 25.00, 5, 'Robe élégante parfaite pour les occasions spéciales', 'CHN001'),
  ('Costume Homme', 'Costumes', 'L', 'Bleu Marine', 'Hugo Boss', 200.00, 450.00, 35.00, 3, 'Costume classique pour homme', 'HB002'),
  ('Veste en Cuir', 'Vestes', 'S', 'Marron', 'Zara', 80.00, 180.00, 15.00, 2, 'Veste en cuir véritable', 'ZR003'),
  ('Robe de Soirée', 'Robes', 'L', 'Rouge', 'Dior', 300.00, 600.00, 50.00, 2, 'Robe de soirée luxueuse', 'DR004'),
  ('Smoking', 'Costumes', 'M', 'Noir', 'Armani', 250.00, 500.00, 40.00, 1, 'Smoking élégant pour événements', 'AR005')
ON CONFLICT DO NOTHING;