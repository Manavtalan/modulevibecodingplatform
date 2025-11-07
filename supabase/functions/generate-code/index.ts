import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MODERN SYSTEM PROMPTS
const MODERN_UI_STANDARDS = `
🎯 GENERATE PROFESSIONAL REACT APPLICATIONS (2025 STANDARDS)

MANDATORY REQUIREMENTS:
✅ Use React 18 + TypeScript
✅ Tailwind CSS for ALL styling
✅ Include gradient backgrounds with animations
✅ Add glassmorphism effects (backdrop-blur, transparency)
✅ Use modern typography (Inter font, proper spacing)
✅ Include smooth hover animations (transition-all duration-300)
✅ Add visual depth (shadows, rounded corners)
✅ Implement responsive design (mobile-first: sm:, md:, lg:)
✅ Professional color schemes

QUALITY BENCHMARK: Match the visual quality of Stripe, Vercel, Linear websites.
`;

const STREAMING_FORMAT = `
CRITICAL FORMAT REQUIREMENTS:

1. Start with [PLAN]:
[PLAN]
{"files":[{"path":"src/App.tsx","description":"Main component"}]}
[/PLAN]

2. Generate each file:
[FILE:src/App.tsx]
...code here...
[/FILE]

3. End with [COMPLETE]
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing required environment variables');
    }

    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
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

    const { prompt, codeType = 'react', model = 'claude-3-5-sonnet-20241022', conversationId } = await req.json();

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

    // Build enhanced system prompt
    const systemPrompt = `${MODERN_UI_STANDARDS}
${STREAMING_FORMAT}

CREATE MODERN REACT APPLICATION

TECH STACK:
- React 18 + TypeScript
- Tailwind CSS
- Lucide React icons
- Modern component patterns

REQUIRED FILES FOR "${prompt}":
- src/App.tsx (main component)
- src/components/ (feature components)
- src/lib/utils.ts (utilities)
- index.html (entry point)
- tailwind.config.js (config)
- package.json (dependencies)

DESIGN REQUIREMENTS:
✅ Hero section with gradient: bg-gradient-to-br from-indigo-600 to-purple-600
✅ Cards with glassmorphism: backdrop-blur-lg bg-white/10
✅ Smooth animations: transition-all duration-300 hover:scale-105
✅ Modern buttons: rounded-xl shadow-lg hover:shadow-2xl
✅ Responsive grid: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
✅ Typography: text-4xl font-bold leading-tight
✅ Professional spacing: space-y-8, gap-6

Generate for: ${prompt}`;

    console.log('Making request to Anthropic API...');

    // Make API call to Claude
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 4000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Generate a ${codeType} application for: ${prompt}`
          }
        ],
        stream: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: `AI API error: ${response.status}` }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Stream the response back to client
    const readableStream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                
                if (data === '[DONE]') {
                  controller.close();
                  return;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  
                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    controller.enqueue(new TextEncoder().encode(
                      `data: ${JSON.stringify({ content: parsed.delta.text })}\n\n`
                    ));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
        } finally {
          controller.close();
        }
      }
    });

    // Deduct tokens after successful generation
    await supabase.rpc('check_and_deduct_tokens', {
      _user_id: user.id,
      _tokens_to_use: 100
    });

    return new Response(readableStream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
