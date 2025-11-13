import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateCodeRequest {
  prompt: string;
  codeType?: 'react' | 'vue' | 'javascript' | 'typescript' | 'css';
  framework?: string;
  conversation_id?: string;
  model?: 'claude-sonnet-4-5' | 'gpt-4o' | 'gpt-4o-mini';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing required environment variables');
    }
    
    if (!ANTHROPIC_API_KEY && !OPENAI_API_KEY) {
      throw new Error('No AI API keys configured');
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

    const { prompt, codeType = 'react', framework, conversation_id, model = 'claude-sonnet-4-5' } = await req.json() as GenerateCodeRequest;

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
        error: '🚫 You have reached your 500,000 token usage limit. Please upgrade or contact support to continue using Module.',
        remaining: tokenCheck.remaining 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Optimized system prompt (reduced from 1457 to ~100 lines)
    const baseFormat = `You are a senior full-stack developer. Generate production-ready web applications.

CRITICAL OUTPUT FORMAT:
[PLAN]
{"files":[{"path":"src/App.tsx","description":"Main app"},...]}
[/PLAN]

[FILE:path/to/file.tsx]
... complete file content ...
[/FILE]

[COMPLETE]
{"filesGenerated":N,"success":true}
[/COMPLETE]

CORE RULES:
- Use [FILE:path] and [/FILE] markers for ALL files
- Generate MINIMUM 30-35 files for React apps
- Modern, professional UI design
- Responsive (mobile-first)
- Semantic HTML5
- Smooth animations
- Accessibility (WCAG AA)
- No placeholder comments - complete implementations only`;

    let systemPrompt = '';
    switch (codeType) {
      case 'react':
        systemPrompt = `${baseFormat}

REACT + VITE APP STRUCTURE (30-35 FILES REQUIRED):

public/ (3 files): favicon.ico, robots.txt, logo.svg
src/ (30+ files):
  - main.tsx, App.tsx, vite-env.d.ts, index.css
  - components/layout: Navbar, Header, Footer, Sidebar
  - components/sections: Hero, Features, About, Testimonials, CTA, Contact
  - components/ui: Button, Card, Badge, Input, Loading, Alert, Modal
  - hooks: useMediaQuery, useToggle, useLocalStorage, useDebounce
  - lib: utils.ts, constants.ts
  - styles: design-tokens.css, globals.css
  - types: index.ts
  - utils: formatters.ts, validators.ts, helpers.ts
Config files: tsconfig.json, vite.config.ts, tailwind.config.ts, postcss.config.js, .gitignore, README.md

CRITICAL IMPORT RESTRICTIONS:
- You may ONLY import from "react", "react-dom", and relative paths (e.g., "./components/Button", "../hooks/useToggle")
- DO NOT import any third-party libraries: NO lucide-react, framer-motion, @radix-ui, shadcn, clsx, tailwind-merge, or ANY other external packages
- DO NOT generate or modify package.json - the preview system will handle dependencies automatically
- Use inline SVG icons instead of icon libraries
- Use plain CSS/Tailwind for animations instead of animation libraries
- All code must be self-contained within the generated files`;
        break;
        
      case 'vue':
        systemPrompt = `${baseFormat}

VUE 3 + VITE STRUCTURE (25-30 FILES):
public/, src/ with components, composables, views, styles, router
Config: package.json, vite.config.ts, tsconfig.json, tailwind.config.ts`;
        break;
        
      default:
        systemPrompt = baseFormat;
    }

    // Enhance prompt with quality requirements
    let enhancedPrompt = `${prompt}

STRICT REQUIREMENTS:
- Generate 30-35+ files for complete applications
- Use [FILE:path] markers for EVERY file
- Professional, modern UI design
- Complete implementations (no TODOs)
- Production-ready code quality`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: enhancedPrompt }
    ];

    console.log('=== Code Generation Request ===');
    console.log('Model:', model);
    console.log('Code Type:', codeType);
    console.log('Framework:', framework || 'none');
    console.log('Prompt length:', prompt.length);
    console.log('Expected files:', codeType === 'react' ? '30+ files' : 'multiple files');

    let apiResponse: Response;
    let reader: ReadableStreamDefaultReader<Uint8Array>;

    if (model.startsWith('claude')) {
      // Use Anthropic API
      if (!ANTHROPIC_API_KEY) {
        throw new Error('Anthropic API key not configured');
      }

      apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 16000,
          temperature: 0.7,
          system: systemPrompt,
          messages: [{ role: 'user', content: enhancedPrompt }],
          stream: true,
        }),
      });
    } else {
      // Use OpenAI API
      if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 16000,
          messages: messages,
          stream: true,
        }),
      });
    }

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('API error:', apiResponse.status, errorText);
      
      if (apiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          details: 'Too many requests. Please try again later.' 
        }), {
          status: 429,
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

    reader = apiResponse.body?.getReader()!;
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
          let buffer = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim() || !line.startsWith('data: ')) continue;
              
              const data = line.slice(6).trim();
              if (!data || data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                
                // Handle both OpenAI and Anthropic formats
                let delta = '';
                if (parsed.choices?.[0]?.delta?.content) {
                  // OpenAI format
                  delta = parsed.choices[0].delta.content;
                } else if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  // Anthropic format
                  delta = parsed.delta.text;
                }
                
                if (delta) {
                  fullResponse += delta;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
                }
                
                // Handle token usage from both providers
                if (parsed.usage) {
                  inputTokens = parsed.usage.prompt_tokens || parsed.usage.input_tokens || 0;
                  outputTokens = parsed.usage.completion_tokens || parsed.usage.output_tokens || 0;
                } else if (parsed.type === 'message_start' && parsed.message?.usage) {
                  inputTokens = parsed.message.usage.input_tokens || 0;
                } else if (parsed.type === 'message_delta' && parsed.usage) {
                  outputTokens = parsed.usage.output_tokens || 0;
                }
              } catch (e) {
                console.error('Parse error:', e);
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

          // Validate imports - check for invalid/null imports
          const invalidImportPatterns = [
            /from\s+['"]{2}/g,           // from ""
            /from\s+null/g,              // from null
            /import\s+null/g,            // import null
            /from\s+['"]lucide-react/g,  // lucide-react
            /from\s+['"]framer-motion/g, // framer-motion
            /from\s+['"]@radix-ui/g,     // @radix-ui
            /from\s+['"]@\/components\/ui/g, // shadcn ui
            /from\s+['"]clsx/g,          // clsx
            /from\s+['"]tailwind-merge/g // tailwind-merge
          ];

          let hasInvalidImport = false;
          const invalidImportIssues: string[] = [];

          for (const pattern of invalidImportPatterns) {
            const matches = fullResponse.match(pattern);
            if (matches) {
              hasInvalidImport = true;
              invalidImportIssues.push(`Found invalid import: ${matches[0]}`);
            }
          }

          // If invalid imports found, return error
          if (hasInvalidImport) {
            console.error('Invalid imports detected:', invalidImportIssues);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              error: 'Invalid imports in generated code',
              details: invalidImportIssues.join(', ')
            })}\n\n`));
            controller.close();
            return;
          }

          // Simplified validation
          const qualityCheck = {
            valid: fullResponse.includes('gradient') || fullResponse.includes('backdrop-blur') || fullResponse.includes('transition'),
            suggestions: []
          };
          
          const tokenValidation = {
            valid: true,
            issues: []
          };
          
          // File count validation
          const fileMatches = fullResponse.match(/\[FILE:/g);
          const fileCount = fileMatches ? fileMatches.length : 0;
          const expectedFiles = codeType === 'react' ? 30 : 20;
          
          console.log(`✅ Generation complete: ${fullResponse.length} characters, ${fileCount} files generated`);
          
          // File count validation and warning
          if (fileCount < expectedFiles) {
            console.warn(`⚠️ WARNING: Expected ${expectedFiles}+ files for ${codeType}, but only ${fileCount} were generated`);
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              warning: `Incomplete generation: ${fileCount}/${expectedFiles} files. Consider regenerating.`,
              fileCount,
              expectedFiles
            })}\n\n`));
          }

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
                model_used: model,
                metadata: { code_type: codeType, framework, file_count: fileCount }
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
            model: model
          });

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            done: true, 
            conversation_id: conversationId,
            tokens: { input: inputTokens, output: outputTokens, total: totalTokens },
            quality_check: {
              valid: qualityCheck.valid,
              suggestions: qualityCheck.suggestions
            },
            token_validation: {
              valid: tokenValidation.valid,
              issues: tokenValidation.issues
            },
            file_count: fileCount
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
