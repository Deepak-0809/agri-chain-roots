import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get('id');

    if (!productId) {
      throw new Error('Product ID is required');
    }

    console.log('Fetching product details for:', { productId });

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch product details with farmer information
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
        blockchain_id,
        profiles!products_farmer_id_fkey(display_name, avatar_url, role)
      `)
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('Product not found:', productError);
      return new Response(generateErrorHTML('Product not found'), {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        status: 404,
      });
    }

    // Generate HTML page for product details
    const html = generateProductHTML(product);

    return new Response(html, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('Product view error:', error);
    return new Response(generateErrorHTML(error instanceof Error ? error.message : 'Unknown error'), {
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      status: 500,
    });
  }
});

function generateProductHTML(product: any): string {
  const farmerName = product.profiles?.display_name || 'Unknown Farmer';
  const harvestDate = product.harvest_date ? new Date(product.harvest_date).toLocaleDateString() : 'Not specified';
  const createdDate = new Date(product.created_at).toLocaleDateString();
  const totalValue = (product.quantity_available * product.price_per_unit).toFixed(2);
  
  const statusColorMap: Record<string, string> = {
    'available': '#22c55e',
    'sold': '#3b82f6',
    'in_transit': '#f59e0b',
    'out_of_stock': '#ef4444'
  };
  const statusColor = statusColorMap[product.status] || '#6b7280';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${product.name} - AgriChain Product Details</title>
    <meta name="description" content="View detailed information about ${product.name} from ${farmerName}. Fresh, traceable agricultural products.">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 16px; 
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            color: white; 
            padding: 30px; 
            text-align: center;
        }
        .header h1 { 
            font-size: 2.5rem; 
            font-weight: 700; 
            margin-bottom: 8px;
        }
        .header p { 
            font-size: 1.1rem; 
            opacity: 0.9;
        }
        .status-badge { 
            display: inline-block; 
            padding: 8px 16px; 
            border-radius: 20px; 
            font-weight: 600; 
            font-size: 0.875rem; 
            margin: 20px 0;
            color: white;
            background-color: ${statusColor};
            text-transform: uppercase;
            letter-spacing: 0.025em;
        }
        .content { 
            padding: 30px;
        }
        .description { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 12px; 
            margin-bottom: 24px;
            border-left: 4px solid #10b981;
        }
        .details-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
            margin: 24px 0;
        }
        .detail-card { 
            background: #f8fafc; 
            border: 2px solid #e2e8f0; 
            border-radius: 12px; 
            padding: 20px; 
            text-align: center;
            transition: all 0.2s ease;
        }
        .detail-card:hover {
            border-color: #10b981;
            transform: translateY(-2px);
        }
        .detail-icon { 
            font-size: 2rem; 
            margin-bottom: 12px;
        }
        .detail-value { 
            font-size: 1.5rem; 
            font-weight: 700; 
            color: #059669;
            margin-bottom: 4px;
        }
        .detail-label { 
            font-size: 0.875rem; 
            color: #6b7280; 
            font-weight: 500;
        }
        .total-value { 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
            color: white; 
            padding: 24px; 
            border-radius: 12px; 
            text-align: center; 
            margin: 24px 0;
        }
        .total-value .label { 
            font-size: 1rem; 
            opacity: 0.9; 
            margin-bottom: 8px;
        }
        .total-value .value { 
            font-size: 2.5rem; 
            font-weight: 700;
        }
        .farmer-info { 
            background: #fffbeb; 
            border: 2px solid #fbbf24; 
            border-radius: 12px; 
            padding: 20px; 
            margin-top: 24px;
        }
        .farmer-info h3 { 
            color: #92400e; 
            margin-bottom: 8px;
            font-size: 1.125rem;
        }
        .farmer-info p { 
            color: #b45309;
            font-weight: 500;
        }
        .blockchain-info {
            background: #f0f9ff;
            border: 2px solid #38bdf8;
            border-radius: 12px;
            padding: 20px;
            margin-top: 24px;
        }
        .blockchain-info h3 {
            color: #0369a1;
            margin-bottom: 8px;
            font-size: 1.125rem;
        }
        .footer { 
            background: #f8fafc; 
            padding: 20px; 
            text-align: center; 
            border-top: 1px solid #e2e8f0;
        }
        .footer p { 
            color: #6b7280; 
            font-size: 0.875rem;
        }
        @media (max-width: 640px) {
            .header h1 { font-size: 2rem; }
            .details-grid { grid-template-columns: 1fr; }
            .container { margin: 10px; border-radius: 12px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>${product.name}</h1>
            <p>Fresh Agricultural Product</p>
            <div class="status-badge">${product.status.replace('_', ' ')}</div>
        </header>
        
        <main class="content">
            ${product.description ? `
            <div class="description">
                <h3 style="margin-bottom: 12px; color: #059669; font-size: 1.125rem;">Description</h3>
                <p>${product.description}</p>
            </div>
            ` : ''}
            
            <div class="details-grid">
                <div class="detail-card">
                    <div class="detail-icon">📦</div>
                    <div class="detail-value">${product.quantity_available}</div>
                    <div class="detail-label">${product.unit} Available</div>
                </div>
                
                <div class="detail-card">
                    <div class="detail-icon">💰</div>
                    <div class="detail-value">$${product.price_per_unit.toFixed(2)}</div>
                    <div class="detail-label">Per ${product.unit}</div>
                </div>
                
                <div class="detail-card">
                    <div class="detail-icon">🌾</div>
                    <div class="detail-value">${harvestDate}</div>
                    <div class="detail-label">Harvest Date</div>
                </div>
                
                <div class="detail-card">
                    <div class="detail-icon">📅</div>
                    <div class="detail-value">${createdDate}</div>
                    <div class="detail-label">Listed Date</div>
                </div>
            </div>
            
            <div class="total-value">
                <div class="label">Total Inventory Value</div>
                <div class="value">$${totalValue}</div>
            </div>
            
            <div class="farmer-info">
                <h3>👨‍🌾 Farmer Information</h3>
                <p><strong>Produced by:</strong> ${farmerName}</p>
            </div>

            ${product.blockchain_id ? `
            <div class="blockchain-info">
                <h3>🔗 Blockchain Verified</h3>
                <p><strong>Blockchain ID:</strong> ${product.blockchain_id}</p>
                <p style="margin-top: 8px; font-size: 0.875rem;">This product is verified on the blockchain for complete transparency and traceability.</p>
            </div>
            ` : ''}
        </main>
        
        <footer class="footer">
            <p>Powered by AgriChain - Transparent Agriculture Marketplace</p>
            <p style="margin-top: 8px;">Scan this QR code to view real-time product information</p>
        </footer>
    </div>
</body>
</html>
  `;
}

function generateErrorHTML(message: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error - AgriChain</title>
    <style>
        body { 
            font-family: system-ui, sans-serif; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            margin: 0; 
            background: #f3f4f6; 
        }
        .error { 
            background: white; 
            padding: 40px; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
            text-align: center; 
            max-width: 400px;
        }
        .error h1 { 
            color: #dc2626; 
            margin-bottom: 16px; 
        }
        .error p { 
            color: #6b7280; 
        }
    </style>
</head>
<body>
    <div class="error">
        <h1>Error</h1>
        <p>${message}</p>
    </div>
</body>
</html>
  `;
}