/*
  # Correction des permissions admin et ajout des fonctionnalités de paiement

  1. Corrections
    - Corriger les politiques RLS pour permettre aux admins de gérer les utilisateurs
    - Ajouter une table pour les clients
    - Ajouter une table pour les paiements partiels
    - Corriger les permissions pour la création d'utilisateurs

  2. Nouvelles Tables
    - `customers` - Informations des clients
    - `payments` - Gestion des paiements partiels

  3. Sécurité
    - Politiques RLS mises à jour
    - Permissions correctes pour les admins
*/

-- Table des clients
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  address text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(phone)
);

-- Table des paiements
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  rental_id uuid REFERENCES rentals(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  amount_paid decimal(10,2) NOT NULL,
  remaining_amount decimal(10,2) NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer')),
  payment_date timestamptz DEFAULT now(),
  agent_id uuid REFERENCES users(id),
  agent_name text NOT NULL,
  notes text,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Ajouter des champs pour les paiements partiels aux transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'amount_paid'
  ) THEN
    ALTER TABLE transactions ADD COLUMN amount_paid decimal(10,2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'remaining_amount'
  ) THEN
    ALTER TABLE transactions ADD COLUMN remaining_amount decimal(10,2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE transactions ADD COLUMN payment_status text DEFAULT 'completed' CHECK (payment_status IN ('completed', 'partial', 'pending'));
  END IF;
END $$;

-- Ajouter des champs pour les paiements partiels aux locations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rentals' AND column_name = 'amount_paid'
  ) THEN
    ALTER TABLE rentals ADD COLUMN amount_paid decimal(10,2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rentals' AND column_name = 'remaining_amount'
  ) THEN
    ALTER TABLE rentals ADD COLUMN remaining_amount decimal(10,2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rentals' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE rentals ADD COLUMN payment_status text DEFAULT 'completed' CHECK (payment_status IN ('completed', 'partial', 'pending'));
  END IF;
END $$;

-- Enable RLS sur les nouvelles tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques problématiques pour les utilisateurs
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Users can read all data" ON users;

-- Nouvelles politiques pour les utilisateurs
CREATE POLICY "Allow read to authenticated users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow login by email/password" ON users FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Allow logged-in users to read active users" ON users FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Allow insert to admins" ON users FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Allow update to admins" ON users FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Politiques pour les clients
CREATE POLICY "Users can read customers" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage customers" ON customers FOR ALL TO authenticated USING (true);

-- Politiques pour les paiements
CREATE POLICY "Users can read payments" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage payments" ON payments FOR ALL TO authenticated USING (true);

-- Trigger pour updated_at sur customers
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement un client
CREATE OR REPLACE FUNCTION create_customer_if_not_exists(
  customer_name text,
  customer_phone text,
  customer_email text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  customer_id uuid;
BEGIN
  -- Chercher le client existant
  SELECT id INTO customer_id FROM customers WHERE phone = customer_phone;
  
  -- Si le client n'existe pas, le créer
  IF customer_id IS NULL THEN
    INSERT INTO customers (name, phone, email)
    VALUES (customer_name, customer_phone, customer_email)
    RETURNING id INTO customer_id;
  ELSE
    -- Mettre à jour les informations si nécessaire
    UPDATE customers 
    SET name = customer_name, 
        email = COALESCE(customer_email, email),
        updated_at = now()
    WHERE id = customer_id;
  END IF;
  
  RETURN customer_id;
END;
$$ LANGUAGE plpgsql;

-- Insérer quelques clients de démonstration
INSERT INTO customers (name, phone, email, address) VALUES
  ('Ahmed Benali', '0555123456', 'ahmed.benali@email.com', '123 Rue de la Paix, Alger'),
  ('Fatima Khelifi', '0666789012', 'fatima.k@email.com', '456 Avenue Mohamed V, Oran'),
  ('Youcef Mammeri', '0777345678', 'youcef.m@email.com', '789 Boulevard Zirout Youcef, Constantine'),
  ('Amina Boudiaf', '0888901234', 'amina.b@email.com', '321 Rue Didouche Mourad, Alger'),
  ('Karim Zidane', '0999567890', 'karim.z@email.com', '654 Avenue de l\'Indépendance, Annaba')
ON CONFLICT (phone) DO NOTHING;