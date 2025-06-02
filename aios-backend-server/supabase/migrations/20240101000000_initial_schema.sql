-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  google_id VARCHAR(255) UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  profile_picture TEXT,
  points_balance INTEGER NOT NULL DEFAULT 0,
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Point transactions table
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  transaction_type VARCHAR(50) NOT NULL,
  operation_type VARCHAR(50),
  points INTEGER NOT NULL,
  description TEXT,
  metadata JSONB,
  stripe_payment_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 