-- Create products table for farmers to list their products
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  price_per_unit DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'in_transit', 'out_of_stock')),
  harvest_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supplies table for farming supplies
CREATE TABLE public.supplies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'piece',
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table for tracking purchases
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  seller_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  supply_id UUID REFERENCES supplies(id) ON DELETE SET NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('product', 'supply')),
  quantity INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS for all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Anyone can view available products" 
ON public.products 
FOR SELECT 
USING (status = 'available' OR farmer_id = auth.uid());

CREATE POLICY "Farmers can insert their own products" 
ON public.products 
FOR INSERT 
WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Farmers can update their own products" 
ON public.products 
FOR UPDATE 
USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can delete their own products" 
ON public.products 
FOR DELETE 
USING (auth.uid() = farmer_id);

-- Supplies policies  
CREATE POLICY "Anyone can view supplies" 
ON public.supplies 
FOR SELECT 
USING (true);

-- Orders policies
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Sellers can update order status" 
ON public.orders 
FOR UPDATE 
USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- Add update triggers
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplies_updated_at
BEFORE UPDATE ON public.supplies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample supplies data (not user-specific)
INSERT INTO public.supplies (name, supplier_name, description, price, quantity_available, unit, category) VALUES
('Tomato Seeds (Hybrid)', 'Green Seeds Co.', 'High-yield hybrid tomato seeds for commercial farming', 45.00, 100, 'kg', 'Seeds'),
('Organic Fertilizer', 'EcoGrow Solutions', '100% organic fertilizer for sustainable farming', 28.50, 500, 'kg', 'Fertilizer'),
('Lettuce Seeds', 'Fresh Start Seeds', 'Premium lettuce seeds for greenhouse cultivation', 32.00, 200, 'kg', 'Seeds'),
('NPK Fertilizer', 'AgriChem Ltd.', 'Balanced NPK fertilizer for all crops', 35.00, 300, 'kg', 'Fertilizer'),
('Irrigation Pipes', 'WaterFlow Systems', 'Durable PVC pipes for drip irrigation', 15.00, 1000, 'meter', 'Equipment'),
('Pesticide Spray', 'CropGuard Inc.', 'Eco-friendly pesticide for pest control', 22.00, 150, 'liter', 'Pesticide');