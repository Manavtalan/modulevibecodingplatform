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
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ code: 'SERVER_ERROR', message: 'Configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ANTHROPIC_API_KEY && !OPENAI_API_KEY) {
      console.error('No AI API keys configured');
      return new Response(
        JSON.stringify({ code: 'SERVER_ERROR', message: 'AI API not configured' }),
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
    
    // Get model from request or default to Claude Sonnet 4.5
    const model = (body as any).model || 'claude-sonnet-4-5';

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

    // Use selected model (Claude Sonnet 4.5 as primary)
    let assistantReply = '';
    let modelUsed = model;
    let tokensUsed = 0;
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      if (model.startsWith('claude')) {
        // Use Anthropic API for Claude models
        if (!ANTHROPIC_API_KEY) {
          throw new Error('Anthropic API key not configured');
        }

        console.log('=== Claude Request ===');
        console.log('Model:', model);
        console.log('Messages count:', messages.length);

        // Convert messages format for Anthropic (system is separate)
        const systemMessage = messages.find(m => m.role === 'system');
        const conversationMessages = messages.filter(m => m.role !== 'system');

        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            max_tokens: 4096,
            temperature: 0.7,
            system: systemMessage?.content || '',
            messages: conversationMessages.map(m => ({
              role: m.role,
              content: m.content
            })),
            stream: true,
          }),
        });

        if (!anthropicResponse.ok) {
          const errorText = await anthropicResponse.text();
          console.error('Anthropic API error:', anthropicResponse.status, errorText);
          throw new Error(`Anthropic API failed: ${anthropicResponse.status}`);
        }

        if (!anthropicResponse.body) {
          throw new Error('No response body');
        }

        const reader = anthropicResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) continue;
            
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const data = JSON.parse(jsonStr);
              
              if (data.type === 'content_block_delta' && data.delta?.text) {
                assistantReply += data.delta.text;
              }
              
              if (data.type === 'message_start' && data.message?.usage) {
                inputTokens = data.message.usage.input_tokens || 0;
              }
              
              if (data.type === 'message_delta' && data.usage) {
                outputTokens = data.usage.output_tokens || 0;
              }
            } catch (e) {
              console.error('Error parsing Claude SSE:', e);
            }
          }
        }

        tokensUsed = inputTokens + outputTokens;
        console.log('✓ Claude succeeded, length:', assistantReply.length);
        
      } else {
        // Use OpenAI API for GPT models
        if (!OPENAI_API_KEY) {
          throw new Error('OpenAI API key not configured');
        }

        console.log('=== OpenAI Request ===');
        console.log('Model:', model);
        console.log('Messages count:', messages.length);

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            temperature: 0.7,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            stream: true,
          }),
        });

        if (!openaiResponse.ok) {
          const errorText = await openaiResponse.text();
          console.error('OpenAI API error:', openaiResponse.status, errorText);
          
          if (openaiResponse.status === 429) {
            return new Response(
              JSON.stringify({ 
                code: 'RATE_LIMIT_EXCEEDED', 
                message: 'Rate limit exceeded. Please try again later.' 
              }),
              { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          throw new Error(`OpenAI API failed: ${openaiResponse.status}`);
        }

        if (!openaiResponse.body) {
          throw new Error('No response body');
        }

        const reader = openaiResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) continue;
            
            const jsonStr = line.slice(6);
            if (jsonStr === '[DONE]') continue;

            try {
              const data = JSON.parse(jsonStr);
              
              if (data.choices?.[0]?.delta?.content) {
                assistantReply += data.choices[0].delta.content;
              }
              
              if (data.usage) {
                inputTokens = data.usage.prompt_tokens || 0;
                outputTokens = data.usage.completion_tokens || 0;
              }
            } catch (e) {
              console.error('Error parsing OpenAI SSE:', e);
            }
          }
        }

        tokensUsed = inputTokens + outputTokens;
        console.log('✓ OpenAI succeeded, length:', assistantReply.length);
      }
      
      if (!assistantReply.trim()) {
        throw new Error('AI returned empty content');
      }
    } catch (error) {
      console.error('=== AI Request Failed ===');
      console.error('Error:', error?.message);
      throw error;
    }

    // Error handling if all attempts failed
    if (!assistantReply.trim()) {
      console.error('No AI response generated');
      
      let errorMessage = 'AI service unavailable';
      return new Response(
        JSON.stringify({ 
          code: 'AI_SERVICE_ERROR', 
          message: errorMessage,
          details: 'All AI services failed to generate a response'
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
