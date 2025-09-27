import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductQRRequest {
  productId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId }: ProductQRRequest = await req.json();

    console.log('Generating product QR code for:', { productId });

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        quantity_available,
        unit,
        price_per_unit,
        status,
        harvest_date,
        created_at,
        farmer_id,
        profiles!products_farmer_id_fkey(display_name)
      `)
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('Product not found:', productError);
      throw new Error('Product not found');
    }

    // Create the product view URL
    const productUrl = `https://gpuxyahhxwjoovjizbws.supabase.co/functions/v1/view-product?id=${productId}`;

    // Generate QR code using QR Server API
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(productUrl)}`;

    // Fetch the QR code image
    const qrResponse = await fetch(qrApiUrl);
    if (!qrResponse.ok) {
      throw new Error('Failed to generate QR code');
    }

    const qrImageBuffer = await qrResponse.arrayBuffer();
    const qrImageBase64 = btoa(String.fromCharCode(...new Uint8Array(qrImageBuffer)));

    console.log('Product QR code generated successfully');

    return new Response(JSON.stringify({ 
      success: true,
      qrCode: `data:image/png;base64,${qrImageBase64}`,
      productUrl: productUrl,
      product: {
        id: product.id,
        name: product.name,
        farmer: Array.isArray(product.profiles) ? product.profiles[0]?.display_name || 'Unknown Farmer' : (product.profiles as any)?.display_name || 'Unknown Farmer'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Product QR generation error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});