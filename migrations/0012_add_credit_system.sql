-- Credit system: add credit fields to users, isAiGenerated to binders, and credit_transactions table

-- New columns on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS credit_balance integer NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_granted_at timestamp;

-- New column on binders
ALTER TABLE binders ADD COLUMN IF NOT EXISTS is_ai_generated boolean DEFAULT false;

-- Credit transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id serial PRIMARY KEY,
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  balance integer NOT NULL,
  type text NOT NULL,
  description text NOT NULL,
  metadata text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credit_transactions_user_id_idx ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS credit_transactions_created_at_idx ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS credit_transactions_type_idx ON credit_transactions(type);

-- Grant 100 credits to existing free users (non-admin, non-pro)
UPDATE users SET credit_balance = 100 WHERE subscription_status = 'free';

-- Grant 5000 credits to existing pro users (lifetime buyers)
UPDATE users SET credit_balance = 5000, subscription_tier = 'lifetime' WHERE subscription_status = 'pro';
