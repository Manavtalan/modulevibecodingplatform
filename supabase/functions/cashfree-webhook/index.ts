import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-timestamp',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get('CASHFREE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const rawBody = await req.text();
    const webhookData = JSON.parse(rawBody);

    console.log('Received Cashfree webhook:', JSON.stringify(webhookData, null, 2));

    // Handle test webhooks from Cashfree FIRST (before signature verification)
    if (webhookData.type === 'WEBHOOK' && webhookData.data?.test_object) {
      console.log('Test webhook received - responding with success');
      return new Response(
        JSON.stringify({ success: true, message: 'Test webhook received successfully' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get webhook signature for verification (for real payment webhooks)
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature && timestamp) {
      const signedPayload = `${timestamp}${rawBody}`;
      const computedSignature = createHmac('sha256', webhookSecret)
        .update(signedPayload)
        .digest('base64');

      if (computedSignature !== signature) {
        console.error('Invalid webhook signature');
        throw new Error('Invalid webhook signature');
      }
      console.log('Webhook signature verified successfully');
    } else if (!webhookSecret) {
      console.warn('Webhook secret not configured - skipping signature verification');
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract payment data from real webhooks
    const { data } = webhookData;
    const orderId = data?.order?.order_id;
    const paymentStatus = data?.payment?.payment_status;
    const paymentMethod = data?.payment?.payment_method;
    const transactionId = data?.payment?.cf_payment_id;

    if (!orderId) {
      console.error('Order ID not found in webhook data. Webhook type:', webhookData.type);
      throw new Error('Order ID not found in webhook data');
    }

    // Update payment order status
    const updateData: any = {
      status: paymentStatus?.toLowerCase() || 'unknown',
      payment_method: paymentMethod,
      transaction_id: transactionId,
      metadata: data,
      updated_at: new Date().toISOString(),
    };

    if (paymentStatus === 'SUCCESS') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: orderData, error: updateError } = await supabase
      .from('payment_orders')
      .update(updateData)
      .eq('order_id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating payment order:', updateError);
      throw updateError;
    }

    console.log('Payment order updated:', orderData);

    // If payment is successful, update user's subscription
    if (paymentStatus === 'SUCCESS' && orderData) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_tier: orderData.plan_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderData.user_id);

      if (profileError) {
        console.error('Error updating user profile:', profileError);
      } else {
        console.log('User subscription updated successfully');
      }

      // Send notification to user
      await supabase.from('notifications').insert({
        user_id: orderData.user_id,
        type: 'success',
        title: 'Payment Successful',
        message: `Your ${orderData.plan_name} subscription has been activated!`,
        action_url: '/profile',
      });
    } else if (paymentStatus === 'FAILED') {
      // Send failure notification
      await supabase.from('notifications').insert({
        user_id: orderData.user_id,
        type: 'error',
        title: 'Payment Failed',
        message: `Your payment for ${orderData.plan_name} plan failed. Please try again.`,
        action_url: '/pricing',
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in cashfree-webhook function:', error);
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
