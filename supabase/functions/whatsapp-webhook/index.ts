import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// WhatsApp API configuration
const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN')!;
const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'your_verify_token';
const PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')!;

interface UserSession {
  state: string;
  data?: any;
}

// In-memory session storage (in production, use Redis or database)
const userSessions = new Map<string, UserSession>();

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Webhook verification for WhatsApp
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verified successfully!');
        return new Response(challenge, { headers: corsHeaders });
      } else {
        return new Response('Forbidden', { status: 403, headers: corsHeaders });
      }
    }

    // Handle incoming WhatsApp messages
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('Received webhook:', JSON.stringify(body, null, 2));

      // Process WhatsApp messages
      if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
        const message = body.entry[0].changes[0].value.messages[0];
        const from = message.from;
        const messageBody = message.text?.body?.toLowerCase() || '';

        await handleUserMessage(from, messageBody);
      }

      return new Response('OK', { headers: corsHeaders });
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  } catch (error) {
    console.error('Error in WhatsApp webhook:', error);
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
  }
});

async function handleUserMessage(phoneNumber: string, message: string) {
  const session = userSessions.get(phoneNumber) || { state: 'initial' };

  switch (session.state) {
    case 'initial':
      await sendWelcomeMessage(phoneNumber);
      userSessions.set(phoneNumber, { state: 'role_selection' });
      break;

    case 'role_selection':
      if (message === '1') {
        userSessions.set(phoneNumber, { state: 'farmer_menu' });
        await sendFarmerMenu(phoneNumber);
      } else if (message === '2') {
        userSessions.set(phoneNumber, { state: 'vendor_menu' });
        await sendVendorMenu(phoneNumber);
      } else {
        await sendMessage(phoneNumber, 'Please select 1 for Farmer or 2 for Vendor');
      }
      break;

    case 'farmer_menu':
      if (message === '1') {
        userSessions.set(phoneNumber, { state: 'add_product_name' });
        await sendMessage(phoneNumber, 'Please enter the product name:');
      } else if (message === '2') {
        userSessions.set(phoneNumber, { state: 'search_supplies' });
        await sendMessage(phoneNumber, 'What supplies are you looking for? Type the name:');
      } else if (message === '3') {
        userSessions.set(phoneNumber, { state: 'initial' });
        await sendWelcomeMessage(phoneNumber);
      } else {
        await sendFarmerMenu(phoneNumber);
      }
      break;

    case 'add_product_name':
      session.data = { name: message };
      userSessions.set(phoneNumber, { state: 'add_product_quantity', data: session.data });
      await sendMessage(phoneNumber, 'Great! Now enter the quantity available (in kg):');
      break;

    case 'add_product_quantity':
      const quantity = parseInt(message);
      if (isNaN(quantity)) {
        await sendMessage(phoneNumber, 'Please enter a valid number for quantity:');
        return;
      }
      session.data.quantity_available = quantity;
      userSessions.set(phoneNumber, { state: 'add_product_price', data: session.data });
      await sendMessage(phoneNumber, 'Enter the price per kg (in rupees):');
      break;

    case 'add_product_price':
      const price = parseFloat(message);
      if (isNaN(price)) {
        await sendMessage(phoneNumber, 'Please enter a valid price:');
        return;
      }
      session.data.price_per_unit = price;
      userSessions.set(phoneNumber, { state: 'add_product_description', data: session.data });
      await sendMessage(phoneNumber, 'Enter a brief description of your product:');
      break;

    case 'add_product_description':
      session.data.description = message;
      await saveProduct(phoneNumber, session.data);
      userSessions.set(phoneNumber, { state: 'farmer_menu' });
      break;

    case 'search_supplies':
      await searchSupplies(phoneNumber, message);
      userSessions.set(phoneNumber, { state: 'farmer_menu' });
      await sendMessage(phoneNumber, '\nType "menu" to return to main menu');
      break;

    case 'vendor_menu':
      if (message === '1') {
        await searchProducts(phoneNumber);
      } else if (message === '2') {
        userSessions.set(phoneNumber, { state: 'initial' });
        await sendWelcomeMessage(phoneNumber);
      } else {
        await sendVendorMenu(phoneNumber);
      }
      break;

    default:
      if (message === 'hi' || message === 'hello' || message === 'menu') {
        userSessions.set(phoneNumber, { state: 'initial' });
        await sendWelcomeMessage(phoneNumber);
      } else {
        await sendMessage(phoneNumber, 'I didn\'t understand. Type "hi" to start over.');
      }
  }
}

async function sendWelcomeMessage(phoneNumber: string) {
  const message = `🌾 Welcome to AgriConnect! 🌾

I'm your farming assistant. How can I help you today?

1️⃣ I'm a Farmer
2️⃣ I'm a Vendor

Reply with 1 or 2`;
  
  await sendMessage(phoneNumber, message);
}

async function sendFarmerMenu(phoneNumber: string) {
  const message = `👨‍🌾 Farmer Menu

What would you like to do?

1️⃣ Add a product to sell
2️⃣ Search for supplies to buy
3️⃣ Back to main menu

Reply with 1, 2, or 3`;
  
  await sendMessage(phoneNumber, message);
}

async function sendVendorMenu(phoneNumber: string) {
  const message = `🏪 Vendor Menu

What would you like to do?

1️⃣ Browse available products
2️⃣ Back to main menu

Reply with 1 or 2`;
  
  await sendMessage(phoneNumber, message);
}

async function saveProduct(phoneNumber: string, productData: any) {
  try {
    // For demo purposes, using a default farmer_id
    // In production, you'd need proper user authentication
    const { data, error } = await supabase
      .from('products')
      .insert({
        farmer_id: '00000000-0000-0000-0000-000000000001', // Default farmer ID
        name: productData.name,
        quantity_available: productData.quantity_available,
        price_per_unit: productData.price_per_unit,
        description: productData.description,
        status: 'available'
      });

    if (error) {
      console.error('Error saving product:', error);
      await sendMessage(phoneNumber, '❌ Sorry, there was an error saving your product. Please try again.');
    } else {
      await sendMessage(phoneNumber, `✅ Product "${productData.name}" has been successfully added to the website!

📱 Customers can now see and purchase your product online.

What would you like to do next?`);
      await sendFarmerMenu(phoneNumber);
    }
  } catch (error) {
    console.error('Error in saveProduct:', error);
    await sendMessage(phoneNumber, '❌ Sorry, there was an error. Please try again.');
  }
}

async function searchSupplies(phoneNumber: string, searchTerm: string) {
  try {
    const { data: supplies, error } = await supabase
      .from('supplies')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .limit(5);

    if (error) {
      console.error('Error searching supplies:', error);
      await sendMessage(phoneNumber, '❌ Sorry, there was an error searching for supplies.');
      return;
    }

    if (!supplies || supplies.length === 0) {
      await sendMessage(phoneNumber, `😕 No supplies found matching "${searchTerm}". Try searching with different keywords.`);
      return;
    }

    let message = `🔍 Found ${supplies.length} supplies matching "${searchTerm}":\n\n`;
    
    supplies.forEach((supply, index) => {
      message += `${index + 1}. ${supply.name}
💰 Price: ₹${supply.price} per ${supply.unit}
📦 Available: ${supply.quantity_available} ${supply.unit}s
🏪 Supplier: ${supply.supplier_name}
${supply.description ? `📝 ${supply.description}` : ''}

`;
    });

    message += `\n💡 To purchase any of these items, visit our website or contact the supplier directly.`;
    
    await sendMessage(phoneNumber, message);
  } catch (error) {
    console.error('Error in searchSupplies:', error);
    await sendMessage(phoneNumber, '❌ Sorry, there was an error searching for supplies.');
  }
}

async function searchProducts(phoneNumber: string) {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        profiles:farmer_id (display_name)
      `)
      .eq('status', 'available')
      .gt('quantity_available', 0)
      .limit(5);

    if (error) {
      console.error('Error searching products:', error);
      await sendMessage(phoneNumber, '❌ Sorry, there was an error fetching products.');
      return;
    }

    if (!products || products.length === 0) {
      await sendMessage(phoneNumber, '😕 No products available at the moment.');
      return;
    }

    let message = `🛒 Available Products:\n\n`;
    
    products.forEach((product, index) => {
      message += `${index + 1}. ${product.name}
💰 Price: ₹${product.price_per_unit} per ${product.unit}
📦 Available: ${product.quantity_available} ${product.unit}
👨‍🌾 Farmer: ${product.profiles?.display_name || 'Unknown'}
${product.description ? `📝 ${product.description}` : ''}
${product.harvest_date ? `🗓️ Harvested: ${new Date(product.harvest_date).toLocaleDateString()}` : ''}

`;
    });

    message += `\n💡 To purchase any of these products, visit our website to complete the transaction.`;
    
    await sendMessage(phoneNumber, message);
    await sendVendorMenu(phoneNumber);
  } catch (error) {
    console.error('Error in searchProducts:', error);
    await sendMessage(phoneNumber, '❌ Sorry, there was an error fetching products.');
  }
}

async function sendMessage(phoneNumber: string, messageText: string) {
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: messageText
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send message:', errorText);
    } else {
      console.log('Message sent successfully to', phoneNumber);
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
}