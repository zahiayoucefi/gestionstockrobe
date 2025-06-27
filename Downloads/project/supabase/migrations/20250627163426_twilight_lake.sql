/*
  # Ajout des champs mot de passe et réduction

  1. Modifications
    - Ajouter le champ `password` à la table `users`
    - Ajouter les champs `discount` et `discount_amount` aux tables `transactions` et `rentals`

  2. Données de test
    - Mettre à jour les utilisateurs avec des mots de passe
*/

-- Ajouter le champ password à la table users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password'
  ) THEN
    ALTER TABLE users ADD COLUMN password text DEFAULT '123456';
  END IF;
END $$;

-- Ajouter les champs discount aux transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'discount'
  ) THEN
    ALTER TABLE transactions ADD COLUMN discount decimal(5,2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE transactions ADD COLUMN discount_amount decimal(10,2) DEFAULT 0;
  END IF;
END $$;

-- Ajouter les champs discount aux rentals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rentals' AND column_name = 'discount'
  ) THEN
    ALTER TABLE rentals ADD COLUMN discount decimal(5,2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rentals' AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE rentals ADD COLUMN discount_amount decimal(10,2) DEFAULT 0;
  END IF;
END $$;

-- Mettre à jour les mots de passe des utilisateurs existants
UPDATE users SET password = 'hamaza44' WHERE email = 'admin@boutique.com';
UPDATE users SET password = '123456' WHERE email = 'agent@boutique.com';