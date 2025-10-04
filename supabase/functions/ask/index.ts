import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getSystemPrompt, listTemplates } from "./prompts.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AskRequest {
  user_message: string;
  conversation_id?: string;
  mode?: 'explain' | 'debug' | 'project';
  template_id?: string; // New: for selecting prompt templates
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check and template listing
  if (req.method === 'GET') {
    const url = new URL(req.url);
    if (url.pathname.endsWith('/templates')) {
      return new Response(JSON.stringify({ templates: listTemplates() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get environment variables
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ code: 'SERVER_ERROR', message: 'Configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      return new Response(
        JSON.stringify({ code: 'UNAUTHORIZED', message: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JWT token from "Bearer <token>"
    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client with user's JWT for RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user by passing the token directly
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ code: 'UNAUTHORIZED', message: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!user) {
      console.error('No user found from token');
      return new Response(
        JSON.stringify({ code: 'UNAUTHORIZED', message: 'User not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    // Parse request body
    const body: AskRequest = await req.json();
    let { user_message, conversation_id, mode = 'explain', template_id } = body;

    if (!user_message || typeof user_message !== 'string') {
      return new Response(
        JSON.stringify({ code: 'BAD_REQUEST', message: 'user_message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Truncate user message to 10k chars
    user_message = user_message.slice(0, 10000);

    // Validate mode
    if (!['explain', 'debug', 'project'].includes(mode)) {
      return new Response(
        JSON.stringify({ code: 'BAD_REQUEST', message: 'mode must be explain, debug, or project' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle conversation
    let conversationId = conversation_id;
    
    if (conversationId) {
      // Verify conversation belongs to user
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (convError || !conv) {
        return new Response(
          JSON.stringify({ code: 'FORBIDDEN', message: 'Conversation not found or access denied' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Create new conversation
      const title = user_message.replace(/\n/g, ' ').slice(0, 50);
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title,
          mode,
          last_active: new Date().toISOString()
        })
        .select()
        .single();

      if (createError || !newConv) {
        console.error('Failed to create conversation:', createError);
        return new Response(
          JSON.stringify({ code: 'SERVER_ERROR', message: 'Failed to create conversation' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      conversationId = newConv.id;
    }

    // Rate limit check: count requests today per user (not per conversation)
    const today = new Date().toISOString().split('T')[0];
    const { count, error: countError } = await supabase
      .from('requests_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00Z`)
      .lte('created_at', `${today}T23:59:59Z`);

    if (countError) {
      console.error('Rate limit check failed:', countError);
    } else if (count !== null && count >= 10) {
      return new Response(
        JSON.stringify({ 
          code: 'RATE_LIMIT', 
          message: 'Daily free credits exhausted. Upgrade to premium to continue.' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch last 10 messages for context
    const { data: contextMessages, error: msgError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10);

    if (msgError) {
      console.error('Failed to fetch context:', msgError);
    }

    // Build messages array for LLM
    const systemPrompt = getSystemPrompt({ mode, template_id });
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    if (contextMessages) {
      messages.push(...contextMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })));
    }

    messages.push({ role: 'user', content: user_message });

    // Call OpenAI
    let assistantReply = '';
    let modelUsed = 'openai:gpt-5';

    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-2025-08-07',
          messages: messages,
          max_completion_tokens: 512,
        }),
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('OpenAI API error:', openaiResponse.status, errorText);
        throw new Error(`OpenAI API failed: ${openaiResponse.status}`);
      }

      const openaiData = await openaiResponse.json();
      assistantReply = openaiData.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI call failed:', error);
      // Note: Anthropic fallback would go here if ANTHROPIC_API_KEY is configured
      return new Response(
        JSON.stringify({ code: 'SERVER_ERROR', message: 'AI service unavailable' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert user message
    const userTokenEst = Math.ceil(user_message.length / 4);
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: user_message,
        model_used: 'client',
        token_est: userTokenEst
      });

    if (userMsgError) {
      console.error('Failed to insert user message:', userMsgError);
    }

    // Insert assistant message
    const assistantTokenEst = Math.ceil(assistantReply.length / 4);
    const { data: assistantMsg, error: assistantMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantReply,
        model_used: modelUsed,
        token_est: assistantTokenEst
      })
      .select()
      .single();

    if (assistantMsgError || !assistantMsg) {
      console.error('Failed to insert assistant message:', assistantMsgError);
      return new Response(
        JSON.stringify({ code: 'SERVER_ERROR', message: 'Failed to save response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update conversation last_active
    await supabase
      .from('conversations')
      .update({ last_active: new Date().toISOString() })
      .eq('id', conversationId);

    // Log request with estimated tokens
    const totalTokens = userTokenEst + assistantTokenEst;
    const { error: logError } = await supabase
      .from('requests_log')
      .insert({
        user_id: user.id,
        model: modelUsed,
        tokens_est: totalTokens
      });

    if (logError) {
      console.error('Failed to log request:', logError);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        conversation_id: conversationId,
        assistant_message: assistantReply,
        message_id: assistantMsg.id,
        model_used: modelUsed
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in ask function:', error);
    return new Response(
      JSON.stringify({ code: 'SERVER_ERROR', message: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
