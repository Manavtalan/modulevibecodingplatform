import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateCodeRequest {
  prompt: string;
  codeType?: 'html' | 'react' | 'vue' | 'javascript' | 'typescript' | 'css';
  framework?: string;
  conversation_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing required environment variables');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt, codeType = 'html', framework, conversation_id } = await req.json() as GenerateCodeRequest;

    if (!prompt || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check token quota
    const { data: tokenCheck } = await supabase.rpc('check_and_deduct_tokens', {
      _user_id: user.id,
      _tokens_to_use: 0
    });

    if (tokenCheck && !tokenCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Token quota exceeded',
        remaining: tokenCheck.remaining 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build system prompt based on code type
    let systemPrompt = '';
    switch (codeType) {
      case 'html':
        systemPrompt = `You are an API that returns ONLY valid JSON. No explanations. No markdown. No text before or after the JSON.

RESPONSE FORMAT (CRITICAL):
{"files":[{"path":"index.html","content":"..."},{"path":"styles.css","content":"..."},{"path":"script.js","content":"..."}]}

Your response MUST start with { and end with }

ARCHITECTURE:
- Separate HTML, CSS, JavaScript files
- Semantic HTML5 (header, main, section, footer, nav)
- Modern CSS (Flexbox/Grid)
- Functional JavaScript

REQUIREMENTS:
- Responsive 320px-1536px
- Semantic headings (h1→h6)
- Alt text on images
- Color contrast ≥4.5:1
- No placeholder content
- Files ≤200 lines each`;
        break;
      case 'react':
        systemPrompt = `You are an API that returns ONLY valid JSON. No explanations. No markdown. No text before or after the JSON.

RESPONSE FORMAT (CRITICAL):
{"files":[{"path":"src/App.tsx","content":"..."},{"path":"src/components/sections/Hero.tsx","content":"..."}]}

Your response MUST start with { and end with }

ARCHITECTURE (Vite + React + TS + Tailwind):
- App entry: src/App.tsx (compose sections)
- Sections: src/components/sections/* (Navbar, Hero, Features, etc.)
- UI kit: Button, Card, Input, Badge from @/components/ui/*
- Styles: src/styles/tokens.css, src/styles/globals.css
- Use Tailwind utilities + design tokens
- NO new dependencies

COMPONENT RULES:
- ≤120 lines each, split if larger
- TypeScript interfaces for props
- Props for text/colors/images
- Meaningful copy (not Lorem Ipsum)

ACCESSIBILITY:
- Single h1, correct heading order
- Form labels/aria attributes
- Descriptive alt text
- focus-visible:ring-2
- Contrast ≥4.5:1

RESPONSIVENESS:
- 320px-1536px mobile-first
- Use sm: md: lg: xl: 2xl: breakpoints
- No horizontal scroll
- Stack mobile, grid/flex desktop`;
        break;
      case 'vue':
        systemPrompt = `You are an API that returns ONLY valid JSON. No explanations. No markdown. No text before or after the JSON.

RESPONSE FORMAT (CRITICAL):
{"files":[{"path":"src/App.vue","content":"..."},{"path":"src/components/Header.vue","content":"..."}]}

Your response MUST start with { and end with }

ARCHITECTURE (Vue 3 + Vite + TS):
- App entry: src/App.vue
- Components: src/components/*
- Composition API with script setup
- Scoped styles

REQUIREMENTS:
- Components ≤120 lines
- Responsive 320px-1536px
- Semantic headings
- Alt text, aria labels
- Contrast ≥4.5:1`;
        break;
      default:
        systemPrompt = `You are an API that returns ONLY valid JSON. No explanations. No markdown. No text before or after the JSON.

RESPONSE FORMAT (CRITICAL):
{"files":[{"path":"main.${codeType}","content":"..."},{"path":"utils.${codeType}","content":"..."}]}

Your response MUST start with { and end with }

RULES:
- Separate focused files
- Clean ${codeType} code
- Files ≤200 lines
- Modern best practices`;
    }

    if (framework) {
      systemPrompt += `\n\nUse ${framework} framework/library for this implementation.`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${prompt}\n\nIMPORTANT: Your response must start with { and end with } - ONLY JSON, no other text before or after.` }
    ];

    console.log('=== Code Generation Request ===');
    console.log('Model: gpt-5-mini-2025-08-07');
    console.log('Code Type:', codeType);
    console.log('Framework:', framework || 'none');
    console.log('Prompt length:', prompt.length);

    const requestBody = {
      model: 'gpt-5-mini-2025-08-07',
      messages: messages,
      max_completion_tokens: 16000,
      stream: true,
    };

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', openaiResponse.status, errorText);
      return new Response(JSON.stringify({ 
        error: 'Failed to generate code',
        details: errorText 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const reader = openaiResponse.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let fullResponse = '';
    let inputTokens = 0;
    let outputTokens = 0;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  
                  if (content) {
                    fullResponse += content;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }

                  if (parsed.usage) {
                    inputTokens = parsed.usage.prompt_tokens || 0;
                    outputTokens = parsed.usage.completion_tokens || 0;
                  }
                } catch (parseError) {
                  console.error('Error parsing SSE data:', parseError);
                }
              }
            }
          }

          // Estimate tokens if not provided
          if (inputTokens === 0) {
            inputTokens = Math.ceil(prompt.length / 4);
          }
          if (outputTokens === 0) {
            outputTokens = Math.ceil(fullResponse.length / 4);
          }

          const totalTokens = inputTokens + outputTokens;

          // Deduct tokens
          await supabase.rpc('check_and_deduct_tokens', {
            _user_id: user.id,
            _tokens_to_use: totalTokens
          });

          // Create or update conversation
          let conversationId = conversation_id;
          if (!conversationId) {
            const { data: newConv } = await supabase
              .from('conversations')
              .insert({
                user_id: user.id,
                title: prompt.slice(0, 100),
                mode: 'code_generation'
              })
              .select()
              .single();
            
            conversationId = newConv?.id;
          }

          // Save messages
          if (conversationId) {
            await supabase.from('messages').insert([
              {
                conversation_id: conversationId,
                role: 'user',
                content: prompt,
                token_est: inputTokens
              },
              {
                conversation_id: conversationId,
                role: 'assistant',
                content: fullResponse,
                token_est: outputTokens,
                model_used: 'gpt-5-mini-2025-08-07',
                metadata: { code_type: codeType, framework }
              }
            ]);

            await supabase
              .from('conversations')
              .update({ last_active: new Date().toISOString() })
              .eq('id', conversationId);
          }

          // Log request
          await supabase.from('requests_log').insert({
            user_id: user.id,
            tokens_est: totalTokens,
            model: 'gpt-5-mini-2025-08-07'
          });

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            done: true, 
            conversation_id: conversationId,
            tokens: { input: inputTokens, output: outputTokens, total: totalTokens }
          })}\n\n`));

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in generate-code function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
