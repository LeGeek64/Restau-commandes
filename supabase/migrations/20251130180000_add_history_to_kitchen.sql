-- Add 'completed' to the order_status enum
ALTER TYPE order_status ADD VALUE 'completed';

-- Add is_archived column to the orders table
ALTER TABLE orders ADD COLUMN is_archived BOOLEAN DEFAULT false NOT NULL;
