-- Add blockchain wallet to profiles
ALTER TABLE public.profiles 
ADD COLUMN blockchain_wallet TEXT;

-- Add blockchain tracking to products
ALTER TABLE public.products 
ADD COLUMN blockchain_id TEXT,
ADD COLUMN blockchain_transaction_hash TEXT,
ADD COLUMN last_price_update TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add blockchain tracking to orders
ALTER TABLE public.orders 
ADD COLUMN blockchain_transaction_id TEXT,
ADD COLUMN blockchain_transaction_hash TEXT,
ADD COLUMN blockchain_status TEXT DEFAULT 'pending';

-- Create blockchain_transactions table for transparency
CREATE TABLE public.blockchain_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id),
  transaction_type TEXT NOT NULL, -- 'price_update', 'product_add', 'order_create'
  transaction_hash TEXT NOT NULL,
  block_number BIGINT,
  gas_used BIGINT,
  gas_price BIGINT,
  from_address TEXT NOT NULL,
  to_address TEXT,
  value_eth NUMERIC,
  transaction_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on blockchain_transactions
ALTER TABLE public.blockchain_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for blockchain_transactions
CREATE POLICY "Anyone can view blockchain transactions for transparency" 
ON public.blockchain_transactions 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create blockchain transactions" 
ON public.blockchain_transactions 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own blockchain transactions" 
ON public.blockchain_transactions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.products p 
    WHERE p.id = blockchain_transactions.product_id 
    AND p.farmer_id = auth.uid()
  )
);

-- Add trigger for blockchain_transactions updated_at
CREATE TRIGGER update_blockchain_transactions_updated_at
BEFORE UPDATE ON public.blockchain_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_blockchain_transactions_product_id ON public.blockchain_transactions(product_id);
CREATE INDEX idx_blockchain_transactions_status ON public.blockchain_transactions(status);
CREATE INDEX idx_blockchain_transactions_hash ON public.blockchain_transactions(transaction_hash);
CREATE INDEX idx_products_blockchain_id ON public.products(blockchain_id);
CREATE INDEX idx_orders_blockchain_transaction_id ON public.orders(blockchain_transaction_id);