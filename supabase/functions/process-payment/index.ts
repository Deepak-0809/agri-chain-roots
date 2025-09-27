import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  productId: string;
  quantity: number;
  paymentMethod: 'upi' | 'qr';
  transactionId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const { productId, quantity, paymentMethod, transactionId }: PaymentRequest = await req.json();

    console.log('Processing payment for:', { productId, quantity, paymentMethod, userId: user.id });

    // Get product details
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      throw new Error('Product not found');
    }

    // Check if enough quantity available
    if (product.quantity_available < quantity) {
      throw new Error('Insufficient quantity available');
    }

    const totalAmount = product.price_per_unit * quantity;

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create order
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        buyer_id: user.id,
        seller_id: product.farmer_id,
        product_id: productId,
        quantity: quantity,
        total_price: totalAmount,
        order_type: 'product',
        status: 'completed',
        notes: `Payment via ${paymentMethod.toUpperCase()}${transactionId ? ` - Transaction ID: ${transactionId}` : ''}`
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw new Error('Failed to create order');
    }

    // Update product quantity
    const { error: updateError } = await supabaseClient
      .from('products')
      .update({ 
        quantity_available: product.quantity_available - quantity 
      })
      .eq('id', productId);

    if (updateError) {
      console.error('Product update error:', updateError);
      throw new Error('Failed to update product quantity');
    }

    console.log('Payment processed successfully:', order.id);

    return new Response(JSON.stringify({ 
      success: true, 
      orderId: order.id,
      message: 'Payment processed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});