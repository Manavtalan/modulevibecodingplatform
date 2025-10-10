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

    // Check token quota before processing
    const { data: tokenCheck, error: tokenCheckError } = await supabase
      .rpc('get_token_usage', { _user_id: user.id });

    if (tokenCheckError) {
      console.error('Token check failed:', tokenCheckError);
    } else if (tokenCheck) {
      const { remaining, percentage } = tokenCheck;
      console.log(`User ${user.id} token usage: ${percentage}% (${remaining} remaining)`);
      
      if (remaining <= 0) {
        return new Response(
          JSON.stringify({ 
            code: 'TOKEN_LIMIT_EXCEEDED', 
            message: '🚫 Token limit reached. Upgrade your plan to continue building.',
            token_usage: tokenCheck
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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
      // Filter out empty messages from context
      const validMessages = contextMessages.filter(m => m.content && m.content.trim());
      messages.push(...validMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })));
    }

    messages.push({ role: 'user', content: user_message });

    // Call OpenAI
    let assistantReply = '';
    let modelUsed = 'openai:gpt-4o-mini';
    let tokensUsed = 0;
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      console.log('=== OpenAI Request Debug ===');
      console.log('Model:', 'gpt-4o-mini');
      console.log('Messages count:', messages.length);
      console.log('API Key present:', !!OPENAI_API_KEY);
      console.log('API Key prefix:', OPENAI_API_KEY?.substring(0, 10) + '...');
      
      const requestBody = {
        model: 'gpt-4o-mini', // Reliable model for code generation
        messages: messages,
        max_tokens: 8000, // Sufficient for web app generation
      };
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('=== OpenAI Response Debug ===');
      console.log('Status:', openaiResponse.status);
      console.log('Status Text:', openaiResponse.statusText);
      console.log('Headers:', JSON.stringify(Object.fromEntries(openaiResponse.headers.entries())));

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('OpenAI API error response:', errorText);
        throw new Error(`OpenAI API failed with status ${openaiResponse.status}: ${errorText}`);
      }

      const openaiData = await openaiResponse.json();
      console.log('Full OpenAI response:', JSON.stringify(openaiData, null, 2));
      
      // Extract token usage from GPT-5 response
      if (openaiData.usage) {
        inputTokens = openaiData.usage.prompt_tokens || 0;
        outputTokens = openaiData.usage.completion_tokens || 0;
        tokensUsed = inputTokens + outputTokens;
        console.log(`Token usage - Input: ${inputTokens}, Output: ${outputTokens}, Total: ${tokensUsed}`);
      }
      
      // Check response structure
      if (!openaiData.choices) {
        console.error('Missing choices in response');
        throw new Error('Invalid response: no choices array');
      }
      
      if (!openaiData.choices[0]) {
        console.error('Empty choices array');
        throw new Error('Invalid response: empty choices array');
      }
      
      if (!openaiData.choices[0].message) {
        console.error('Missing message in first choice');
        throw new Error('Invalid response: no message in choice');
      }
      
      assistantReply = openaiData.choices[0].message.content;
      console.log('Extracted content type:', typeof assistantReply);
      console.log('Extracted content value:', assistantReply);
      console.log('Content is null?', assistantReply === null);
      console.log('Content is undefined?', assistantReply === undefined);
      
      if (assistantReply === null || assistantReply === undefined) {
        console.error('OpenAI returned null/undefined content');
        console.error('Full choice object:', JSON.stringify(openaiData.choices[0]));
        throw new Error('OpenAI returned null content');
      }
      
      if (typeof assistantReply !== 'string') {
        console.error('Content is not a string, converting...');
        assistantReply = String(assistantReply);
      }
      
      if (!assistantReply.trim()) {
        console.error('OpenAI returned empty or whitespace-only content');
        throw new Error('OpenAI returned empty content');
      }
      
      console.log('✓ Successfully extracted reply, length:', assistantReply.length);
    } catch (error) {
      console.error('=== OpenAI Call Failed ===');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('Full error:', error);
      
      // Return more specific error message
      let errorMessage = 'AI service unavailable';
      if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
        errorMessage = 'Invalid OpenAI API key. Please check your API key configuration.';
      } else if (error?.message?.includes('429') || error?.message?.includes('rate limit')) {
        errorMessage = 'OpenAI rate limit exceeded. Please try again later.';
      } else if (error?.message?.includes('Empty response') || error?.message?.includes('null content')) {
        errorMessage = 'OpenAI returned an empty response. This might indicate an API issue.';
      } else if (error?.message) {
        errorMessage = `OpenAI error: ${error.message}`;
      }
      
      return new Response(
        JSON.stringify({ 
          code: 'AI_SERVICE_ERROR', 
          message: errorMessage,
          details: error?.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deduct tokens from user quota
    const { data: tokenDeduction, error: tokenError } = await supabase
      .rpc('check_and_deduct_tokens', { 
        _user_id: user.id,
        _tokens_to_use: tokensUsed 
      });

    if (tokenError) {
      console.error('Token deduction failed:', tokenError);
    }

    // Insert user message
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: user_message,
        model_used: 'client',
        token_est: inputTokens
      });

    if (userMsgError) {
      console.error('Failed to insert user message:', userMsgError);
    }

    // Insert assistant message
    const { data: assistantMsg, error: assistantMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantReply,
        model_used: modelUsed,
        token_est: outputTokens
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

    // Log request with actual tokens
    const { error: logError } = await supabase
      .from('requests_log')
      .insert({
        user_id: user.id,
        model: modelUsed,
        tokens_est: tokensUsed
      });

    if (logError) {
      console.error('Failed to log request:', logError);
    }

    // Get updated token usage for response
    const { data: updatedTokenUsage } = await supabase
      .rpc('get_token_usage', { _user_id: user.id });

    // Return success response with token usage
    return new Response(
      JSON.stringify({
        conversation_id: conversationId,
        assistant_message: assistantReply,
        message_id: assistantMsg.id,
        model_used: modelUsed,
        tokens_used: tokensUsed,
        token_usage: updatedTokenUsage || null
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
