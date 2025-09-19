import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QRRequest {
  upiId: string;
  amount: number;
  productName: string;
  merchantName?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { upiId, amount, productName, merchantName = "AgriChain" }: QRRequest = await req.json();

    console.log('Generating QR code for:', { upiId, amount, productName });

    // Create UPI payment URL
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Payment for ${productName}`)}`;

    // Generate QR code using QR Server API
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}`;

    // Fetch the QR code image
    const qrResponse = await fetch(qrApiUrl);
    if (!qrResponse.ok) {
      throw new Error('Failed to generate QR code');
    }

    const qrImageBuffer = await qrResponse.arrayBuffer();
    const qrImageBase64 = btoa(String.fromCharCode(...new Uint8Array(qrImageBuffer)));

    console.log('QR code generated successfully');

    return new Response(JSON.stringify({ 
      success: true,
      qrCode: `data:image/png;base64,${qrImageBase64}`,
      upiUrl: upiUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('QR generation error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});