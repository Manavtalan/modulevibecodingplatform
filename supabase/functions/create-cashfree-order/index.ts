import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateOrderRequest {
  planId: string;
  planName: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const cashfreeAppId = Deno.env.get('CASHFREE_APP_ID');
    const cashfreeSecretKey = Deno.env.get('CASHFREE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!cashfreeAppId || !cashfreeSecretKey) {
      throw new Error('Cashfree credentials not configured');
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get user profile for display name only (email comes from auth.users)
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    const { planId, planName, amount, billingCycle }: CreateOrderRequest = await req.json();

    // Generate unique order ID
    const orderId = `order_${user.id.substring(0, 8)}_${Date.now()}`;
    
    // Cashfree API endpoint (use production URL in production)
    const cashfreeApiUrl = 'https://sandbox.cashfree.com/pg/orders';
    // For production, use: https://api.cashfree.com/pg/orders
    
    // Create order payload
    const orderPayload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: user.id,
        customer_email: user.email, // Get email from auth.users (secure)
        customer_phone: '9999999999', // You may want to collect this
        customer_name: profile?.display_name || user.email?.split('@')[0] || 'User',
      },
      order_meta: {
        return_url: `${req.headers.get('origin')}/pricing?session_id={order_id}`,
        notify_url: `${supabaseUrl}/functions/v1/cashfree-webhook`,
      },
      order_note: `${planName} - ${billingCycle}`,
    };

    console.log('Creating Cashfree order:', orderPayload);

    // Call Cashfree API
    const cashfreeResponse = await fetch(cashfreeApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': cashfreeAppId,
        'x-client-secret': cashfreeSecretKey,
        'x-api-version': '2023-08-01',
      },
      body: JSON.stringify(orderPayload),
    });

    const cashfreeData = await cashfreeResponse.json();
    
    if (!cashfreeResponse.ok) {
      console.error('Cashfree API error:', cashfreeData);
      throw new Error(cashfreeData.message || 'Failed to create Cashfree order');
    }

    console.log('Cashfree order created successfully:', cashfreeData);

    // Store order in database for tracking
    await supabase.from('payment_orders').insert({
      order_id: orderId,
      user_id: user.id,
      plan_id: planId,
      plan_name: planName,
      amount: amount,
      currency: 'INR',
      billing_cycle: billingCycle,
      status: 'pending',
      cashfree_order_id: cashfreeData.cf_order_id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        payment_session_id: cashfreeData.payment_session_id,
        order_id: orderId,
        payment_url: cashfreeData.payment_link,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in create-cashfree-order function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
