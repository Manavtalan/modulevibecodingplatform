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
  model?: 'claude-sonnet-4-5' | 'gpt-5-mini' | 'gemini-flash';
}

interface ProviderConfig {
  apiKey: string;
  model: string;
  endpoint: string;
  buildRequest: (messages: any[]) => any;
  parseStreamChunk: (line: string) => string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
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

    const { prompt, codeType = 'html', framework, conversation_id, model = 'gemini-flash' } = await req.json() as GenerateCodeRequest;

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

    // Build system prompt with progressive generation markers
    let systemPrompt = '';
    const baseFormat = `You are a code generation API that outputs structured progress markers.

OUTPUT FORMAT (CRITICAL):
1. First, output a plan:
[PLAN]
{"files":[{"path":"src/App.tsx","description":"Main app entry point"},{"path":"src/components/Hero.tsx","description":"Hero section"}]}
[/PLAN]

2. Then generate each file with markers:
[FILE:src/App.tsx]
... complete file content here ...
[/FILE]

[FILE:src/components/Hero.tsx]
... complete file content here ...
[/FILE]

3. Finally, output completion:
[COMPLETE]
{"filesGenerated":2,"success":true}
[/COMPLETE]

RULES:
- Output markers immediately as you generate
- Keep file content between [FILE:path] and [/FILE] markers
- Files must be complete and valid code
- No text outside markers`;

    switch (codeType) {
      case 'html':
        systemPrompt = `${baseFormat}

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
        systemPrompt = `${baseFormat}

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
        systemPrompt = `${baseFormat}

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
        systemPrompt = `${baseFormat}

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
      { role: 'user', content: prompt }
    ];

    // Configure provider based on selected model
    let provider: ProviderConfig;
    let modelUsed: string;

    if (model === 'claude-sonnet-4-5' && ANTHROPIC_API_KEY) {
      modelUsed = 'claude-sonnet-4-5';
      provider = {
        apiKey: ANTHROPIC_API_KEY,
        model: 'claude-sonnet-4-5',
        endpoint: 'https://api.anthropic.com/v1/messages',
        buildRequest: (msgs) => ({
          model: 'claude-sonnet-4-5',
          max_tokens: 8000,
          messages: msgs.filter(m => m.role !== 'system'),
          system: systemPrompt,
          stream: true,
        }),
        parseStreamChunk: (line: string) => {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return null;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                return parsed.delta.text;
              }
            } catch {}
          }
          return null;
        },
      };
    } else if (model === 'gpt-5-mini' && OPENAI_API_KEY) {
      modelUsed = 'gpt-5-mini-2025-08-07';
      provider = {
        apiKey: OPENAI_API_KEY,
        model: 'gpt-5-mini-2025-08-07',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        buildRequest: (msgs) => ({
          model: 'gpt-5-mini-2025-08-07',
          messages: msgs,
          max_completion_tokens: 8000,
          stream: true,
        }),
        parseStreamChunk: (line: string) => {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return null;
            try {
              const parsed = JSON.parse(data);
              return parsed.choices?.[0]?.delta?.content || null;
            } catch {}
          }
          return null;
        },
      };
    } else {
      // Default to Gemini via Lovable AI
      if (!LOVABLE_API_KEY) {
        throw new Error('No API key available for selected model');
      }
      modelUsed = 'google/gemini-2.5-flash';
      provider = {
        apiKey: LOVABLE_API_KEY,
        model: 'google/gemini-2.5-flash',
        endpoint: 'https://ai.gateway.lovable.dev/v1/chat/completions',
        buildRequest: (msgs) => ({
          model: 'google/gemini-2.5-flash',
          messages: msgs,
          stream: true,
        }),
        parseStreamChunk: (line: string) => {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return null;
            try {
              const parsed = JSON.parse(data);
              return parsed.choices?.[0]?.delta?.content || null;
            } catch {}
          }
          return null;
        },
      };
    }

    console.log('=== Code Generation Request ===');
    console.log('Model:', modelUsed);
    console.log('Code Type:', codeType);
    console.log('Framework:', framework || 'none');
    console.log('Prompt length:', prompt.length);

    const requestBody = provider.buildRequest(messages);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (model === 'claude-sonnet-4-5') {
      headers['x-api-key'] = provider.apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else {
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
    }

    const openaiResponse = await fetch(provider.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('Lovable AI error:', openaiResponse.status, errorText);
      
      if (openaiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (openaiResponse.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI credits depleted. Please add credits in Settings > Workspace > Usage.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
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
              const content = provider.parseStreamChunk(line);
              if (content) {
                fullResponse += content;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
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
                model_used: modelUsed,
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
            model: modelUsed
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
