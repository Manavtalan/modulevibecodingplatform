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
        systemPrompt = `GENERATION CONTRACT:
Return a JSON object with a "files" array only. Each item = { "path": string, "content": string }.

ARCHITECTURE RULES:
- Create index.html, styles.css, and script.js as separate files
- Use modern CSS (Flexbox/Grid) in separate CSS file
- Include proper semantic HTML5 elements (header, main, section, footer, nav)
- Add functional JavaScript in separate JS file

ACCESSIBILITY:
- Semantic headings (h1 → h6 in correct order)
- Form labels with proper for attributes
- Alt text on all images
- Visible focus states
- Color contrast ≥ 4.5:1

RESPONSIVENESS:
- Works 320px → 1536px
- No horizontal scroll
- Avoid fixed widths
- Use responsive units (rem, %, vw)

CLEAN CODE:
- No duplication
- Each file ≤ 200 lines
- Split if larger
- NO placeholder content - make it fully functional

Output JSON only (no commentary, no markdown blocks).`;
        break;
      case 'react':
        systemPrompt = `GENERATION CONTRACT:
Return a JSON object with a "files" array only. Each item = { "path": string, "content": string }. 
The output must compile in a fresh Vite + React + TS + Tailwind project.

ARCHITECTURE RULES:
- App entry: src/App.tsx (render sections here)
- Sections: src/components/sections/* (small, reusable React components)
- Pages (if any): src/pages/*
- Styles: src/styles/tokens.css, src/styles/globals.css
- Use Tailwind utilities + tokens from existing design system
- Use existing UI kit components: Button, Card, Input, Badge, etc. (import from @/components/ui/*)
- Avoid new dependencies

ACCESSIBILITY:
- Semantic headings (h1 → h6 in correct order, single h1 per page)
- Form labels/aria attributes
- Alt text on all images
- Visible focus states (focus-visible:ring-2)
- Color contrast ≥ 4.5:1

RESPONSIVENESS:
- Works 320px → 1536px (mobile-first)
- No horizontal scroll
- Avoid fixed widths
- Use responsive breakpoints: sm: md: lg: xl: 2xl:

CLEAN CODE:
- No duplication
- Components ≤ 120 lines (split if larger)
- Functional components with TypeScript
- Proper prop types
- NO placeholder content - make it fully functional

If you cannot satisfy this contract, return nothing.
Output JSON only (no commentary, no markdown blocks).`;
        break;
      case 'vue':
        systemPrompt = `GENERATION CONTRACT:
Return a JSON object with a "files" array only. Each item = { "path": string, "content": string }.
The output must work in a Vue 3 + Vite + TS project.

ARCHITECTURE RULES:
- App entry: src/App.vue
- Components: src/components/* (small, reusable)
- Use Composition API with script setup
- Use scoped styles

ACCESSIBILITY:
- Semantic headings (h1 → h6 in correct order)
- Form labels/aria attributes
- Alt text on all images
- Visible focus states
- Color contrast ≥ 4.5:1

RESPONSIVENESS:
- Works 320px → 1536px
- No horizontal scroll
- Use responsive CSS

CLEAN CODE:
- Components ≤ 120 lines
- No duplication
- NO placeholder content

Output JSON only (no commentary, no markdown blocks).`;
        break;
      default:
        systemPrompt = `GENERATION CONTRACT:
Return a JSON object with a "files" array only. Each item = { "path": string, "content": string }.

RULES:
- Create separate, focused files
- Write clean, maintainable ${codeType} code
- Include helpful comments
- Follow modern best practices
- Files ≤ 200 lines each
- NO placeholder content

Output JSON only (no commentary, no markdown blocks).`;
    }

    if (framework) {
      systemPrompt += `\n\nUse ${framework} framework/library for this implementation.`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    console.log('=== Code Generation Request ===');
    console.log('Model: gpt-4o');
    console.log('Code Type:', codeType);
    console.log('Framework:', framework || 'none');
    console.log('Prompt length:', prompt.length);

    const requestBody = {
      model: 'gpt-4o',
      messages: messages,
      max_tokens: 16000,
      temperature: 0.7,
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
                model_used: 'gpt-4o',
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
            model: 'gpt-4o'
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
