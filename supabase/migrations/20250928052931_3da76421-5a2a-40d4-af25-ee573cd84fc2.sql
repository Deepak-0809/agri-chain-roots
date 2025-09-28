-- Create supply chain tracking table
CREATE TABLE public.supply_chain_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL, -- 'farmer_to_distributor', 'distributor_to_consumer'
  quantity INTEGER NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  blockchain_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supply_chain_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for supply chain tracking
CREATE POLICY "Users can view supply chain for their transactions" 
ON public.supply_chain_tracking 
FOR SELECT 
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create supply chain records for their transactions" 
ON public.supply_chain_tracking 
FOR INSERT 
WITH CHECK (auth.uid() = from_user_id);

-- Add distributor_inventory table for distributors to manage their stock
CREATE TABLE public.distributor_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  distributor_id UUID NOT NULL,
  original_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  description TEXT,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  price_per_unit NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  status TEXT NOT NULL DEFAULT 'available',
  farmer_id UUID NOT NULL,
  farmer_name TEXT NOT NULL,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.distributor_inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for distributor inventory
CREATE POLICY "Distributors can manage their own inventory" 
ON public.distributor_inventory 
FOR ALL 
USING (auth.uid() = distributor_id);

CREATE POLICY "Consumers can view available distributor inventory" 
ON public.distributor_inventory 
FOR SELECT 
USING (status = 'available' AND quantity_available > 0);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_distributor_inventory_updated_at
BEFORE UPDATE ON public.distributor_inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for supply chain tracking
CREATE TRIGGER update_supply_chain_tracking_updated_at
BEFORE UPDATE ON public.supply_chain_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();