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

⚠️⚠️⚠️ CRITICAL RULE - READ THIS CAREFULLY ⚠️⚠️⚠️
YOU ARE ABSOLUTELY FORBIDDEN FROM GENERATING A SINGLE STANDALONE HTML FILE.
YOU MUST GENERATE EXACTLY 3 SEPARATE FILES: index.html, styles.css, script.js
IF YOU GENERATE A SINGLE FILE WITH EMBEDDED STYLES OR SCRIPTS, YOU HAVE FAILED.

FORBIDDEN PATTERNS (DO NOT OUTPUT THESE):
❌ <style> tags inside HTML
❌ <script> tags with JavaScript code inside HTML
❌ inline style attributes (style="...")
❌ A single standalone HTML file
❌ Phrases like "complete standalone HTML file"

REQUIRED FILE STRUCTURE (YOU MUST OUTPUT THIS):
[PLAN]
{"files":[
  {"path":"index.html","description":"HTML structure ONLY - links to external CSS/JS"},
  {"path":"styles.css","description":"ALL styling - every single CSS rule goes here"},
  {"path":"script.js","description":"ALL JavaScript - every single line of JS goes here"}
]}
[/PLAN]

MANDATORY OUTPUT FORMAT:
[FILE:index.html]
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Website Title</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <nav>
      <div class="nav-container">
        <h1 class="logo">Logo</h1>
        <ul class="nav-links">
          <li><a href="#home">Home</a></li>
          <li><a href="#about">About</a></li>
        </ul>
      </div>
    </nav>
  </header>
  <main>
    <section id="hero" class="hero">
      <h2>Hero Title</h2>
      <p>Hero description text</p>
    </section>
  </main>
  <footer>
    <p>&copy; 2025 Website Name</p>
  </footer>
  <script src="script.js"></script>
</body>
</html>
[/FILE]

[FILE:styles.css]
/* Reset and Base Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.6;
  color: #333;
}

/* Navigation Styles */
nav {
  background: #2c3e50;
  padding: 1rem 0;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Hero Styles */
.hero {
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 2rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
  }
}
[/FILE]

[FILE:script.js]
// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
  console.log('Website loaded');
  
  // Mobile menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', function() {
      const navLinks = document.querySelector('.nav-links');
      navLinks.classList.toggle('active');
    });
  }
  
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});
[/FILE]

VERIFICATION CHECKLIST (CHECK BEFORE COMPLETING):
✓ Generated 3 files: index.html, styles.css, script.js
✓ index.html has <link rel="stylesheet" href="styles.css">
✓ index.html has <script src="script.js"></script>
✓ index.html has NO <style> tags
✓ index.html has NO <script> tags with code inside
✓ styles.css exists and contains all CSS
✓ script.js exists and contains all JavaScript
✓ Semantic HTML5 (header, main, section, footer, nav)
✓ Responsive 320px-1536px
✓ Accessible (alt text, headings, ARIA)
✓ Color contrast ≥4.5:1`;
        break;
      case 'react':
        systemPrompt = `${baseFormat}

MANDATORY ARCHITECTURE (Vite + React + TypeScript + Tailwind):

FILE STRUCTURE (REQUIRED):
[PLAN]
{"files":[
  {"path":"src/App.tsx","description":"Main app entry - composes all sections"},
  {"path":"src/components/sections/Navbar.tsx","description":"Navigation bar component"},
  {"path":"src/components/sections/Hero.tsx","description":"Hero/banner section"},
  {"path":"src/components/sections/Features.tsx","description":"Features grid section"},
  {"path":"src/components/sections/Footer.tsx","description":"Footer section"},
  {"path":"src/styles/tokens.css","description":"Design system tokens (colors, spacing)"},
  {"path":"src/styles/globals.css","description":"Global styles and resets"}
]}
[/PLAN]

EXAMPLE COMPONENT STRUCTURE:
[FILE:src/App.tsx]
import Navbar from '@/components/sections/Navbar';
import Hero from '@/components/sections/Hero';
import Features from '@/components/sections/Features';
import Footer from '@/components/sections/Footer';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Features />
      <Footer />
    </div>
  );
}

export default App;
[/FILE]

[FILE:src/components/sections/Hero.tsx]
import { Button } from '@/components/ui/button';

export default function Hero() {
  return (
    <section className="container mx-auto px-4 py-20">
      <h1 className="text-4xl font-bold">Hero Title</h1>
      <Button variant="default">Get Started</Button>
    </section>
  );
}
[/FILE]

COMPONENT RULES (CRITICAL):
- ONE component per file
- Files ≤120 lines each (split if larger)
- TypeScript interfaces for all props
- Use existing UI components: Button, Card, Input, Badge from @/components/ui/*
- Tailwind utilities ONLY (no custom CSS unless in tokens.css)
- NO new npm dependencies
- Props for customizable text/colors/images
- Meaningful content (NO Lorem Ipsum)

ACCESSIBILITY (MANDATORY):
- Single h1 per page, correct heading hierarchy
- Form labels and ARIA attributes
- Descriptive alt text for all images
- focus-visible:ring-2 for interactive elements
- Color contrast ≥4.5:1

RESPONSIVENESS (REQUIRED):
- Mobile-first design 320px-1536px
- Use Tailwind breakpoints: sm: md: lg: xl: 2xl:
- No horizontal scroll at any breakpoint
- Stack columns on mobile, grid/flex on desktop

DESIGN SYSTEM:
- Use CSS variables from tokens.css (--primary, --background, etc.)
- Consistent spacing scale
- Theme-aware colors (support light/dark mode)`;
        break;
      case 'vue':
        systemPrompt = `${baseFormat}

MANDATORY ARCHITECTURE (Vue 3 + Vite + TypeScript):

FILE STRUCTURE (REQUIRED):
[PLAN]
{"files":[
  {"path":"src/App.vue","description":"Main app entry with router-view"},
  {"path":"src/components/Navbar.vue","description":"Navigation component"},
  {"path":"src/components/Hero.vue","description":"Hero section"},
  {"path":"src/components/Features.vue","description":"Features section"},
  {"path":"src/components/Footer.vue","description":"Footer component"}
]}
[/PLAN]

EXAMPLE COMPONENT:
[FILE:src/App.vue]
<script setup lang="ts">
import Navbar from './components/Navbar.vue';
import Hero from './components/Hero.vue';
</script>

<template>
  <div class="app">
    <Navbar />
    <Hero />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
}
</style>
[/FILE]

REQUIREMENTS:
- Composition API with <script setup lang="ts">
- Components ≤120 lines each
- Scoped styles in each component
- Props with TypeScript types
- Responsive 320px-1536px
- Semantic HTML headings
- Alt text and ARIA labels
- Color contrast ≥4.5:1`;
        break;
      default:
        systemPrompt = `${baseFormat}

RULES:
- Generate multiple focused files
- Clean ${codeType} code
- Each file ≤200 lines
- Modern best practices
- Proper file organization`;
    }

    if (framework) {
      systemPrompt += `\n\nUse ${framework} framework/library for this implementation.`;
    }

    // Model-specific prompt adjustments
    if (model === 'gemini-flash' && codeType === 'html') {
      systemPrompt += `\n\n⚠️ CRITICAL REMINDER: You MUST output separate files. Verify before completing:\n✓ index.html (NO <style> tags, NO inline <script> code)\n✓ styles.css file exists\n✓ script.js file exists`;
    }

    // Auto-enhance user prompt to enforce multi-file generation
    let enhancedPrompt = prompt;

    if (codeType === 'html') {
      enhancedPrompt = `${prompt}

🚨 CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE 🚨

DO NOT generate a "standalone HTML file" - that is FORBIDDEN.
DO NOT include ANY styling in the HTML file - NO <style> tags, NO inline styles.
DO NOT include ANY JavaScript in the HTML file - NO <script> tags with code.

YOU MUST generate EXACTLY 3 SEPARATE FILES:

1. index.html - ONLY HTML structure + links to external files
   - Must include: <link rel="stylesheet" href="styles.css">
   - Must include: <script src="script.js"></script>
   - NO <style> tags
   - NO <script> tags with code inside

2. styles.css - ALL styling rules go here
   - Every CSS rule must be in this file
   - NO styles in the HTML file

3. script.js - ALL JavaScript code goes here
   - Every line of JavaScript must be in this file
   - NO scripts in the HTML file

If you generate a single standalone HTML file, you have completely failed the task.`;
    } else if (codeType === 'react') {
      enhancedPrompt = `${prompt}

REQUIREMENTS:
- Generate multiple component files (NOT a single App.tsx with everything)
- Split into focused sections: Navbar, Hero, Features, Footer, etc.
- Each component in its own file under src/components/sections/
- Use existing UI components from @/components/ui/*`;
    } else if (codeType === 'vue') {
      enhancedPrompt = `${prompt}

REQUIREMENTS:
- Generate multiple .vue component files
- Split into logical components (Navbar, Hero, Features, Footer)
- Each component ≤120 lines`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: enhancedPrompt }
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
