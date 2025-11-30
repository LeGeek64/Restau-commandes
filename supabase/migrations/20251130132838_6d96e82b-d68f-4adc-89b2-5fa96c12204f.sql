-- Create enum for order status
CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'ready');

-- Create enum for currency
CREATE TYPE currency_type AS ENUM ('EUR', 'DJF', 'USD');

-- Restaurant settings table
CREATE TABLE restaurant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Mon Restaurant',
  currency currency_type NOT NULL DEFAULT 'EUR',
  eur_to_djf DECIMAL(10,2) NOT NULL DEFAULT 200.00,
  eur_to_usd DECIMAL(10,2) NOT NULL DEFAULT 1.10,
  admin_pin TEXT NOT NULL DEFAULT '1234',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dishes table
CREATE TABLE dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_eur DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number TEXT NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  customer_message TEXT,
  additional_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  dish_id UUID REFERENCES dishes(id) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public read access for restaurant settings (everyone can see the name, currency, etc)
CREATE POLICY "Public can read restaurant settings"
ON restaurant_settings FOR SELECT
USING (true);

-- Public read/write access for categories (no auth needed for this system)
CREATE POLICY "Public can read categories"
ON categories FOR SELECT
USING (true);

CREATE POLICY "Public can insert categories"
ON categories FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update categories"
ON categories FOR UPDATE
USING (true);

CREATE POLICY "Public can delete categories"
ON categories FOR DELETE
USING (true);

-- Public read/write access for dishes
CREATE POLICY "Public can read dishes"
ON dishes FOR SELECT
USING (true);

CREATE POLICY "Public can insert dishes"
ON dishes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update dishes"
ON dishes FOR UPDATE
USING (true);

CREATE POLICY "Public can delete dishes"
ON dishes FOR DELETE
USING (true);

-- Public read/write access for orders
CREATE POLICY "Public can read orders"
ON orders FOR SELECT
USING (true);

CREATE POLICY "Public can insert orders"
ON orders FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update orders"
ON orders FOR UPDATE
USING (true);

-- Public read/write access for order items
CREATE POLICY "Public can read order items"
ON order_items FOR SELECT
USING (true);

CREATE POLICY "Public can insert order items"
ON order_items FOR INSERT
WITH CHECK (true);

-- Public update access for restaurant settings (admin can update via PIN verification)
CREATE POLICY "Public can update restaurant settings"
ON restaurant_settings FOR UPDATE
USING (true);

-- Insert default restaurant settings
INSERT INTO restaurant_settings (name, currency, admin_pin)
VALUES ('Mon Restaurant', 'EUR', '1234');

-- Insert default categories
INSERT INTO categories (name, display_order) VALUES
  ('Entrées', 1),
  ('Plats', 2),
  ('Boissons', 3),
  ('Desserts', 4);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_restaurant_settings_updated_at
  BEFORE UPDATE ON restaurant_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dishes_updated_at
  BEFORE UPDATE ON dishes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;