// FIXED MODULE EDGE FUNCTION - GENERATES PROFESSIONAL WEB APPLICATIONS
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.33.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// MODERN SYSTEM PROMPTS WITH CONCRETE EXAMPLES
const MODERN_UI_STANDARDS = `
🎯 GENERATE 2024-STANDARD PROFESSIONAL WEB APPLICATIONS

FORBIDDEN OUTPUTS (AUTO-FAIL):
❌ Plain HTML with inline styles
❌ Basic forms and buttons without modern styling  
❌ 1990s-style layouts
❌ Unstyled text-heavy websites
❌ Missing modern visual effects

MANDATORY REQUIREMENTS:
✅ Use Tailwind CSS for ALL styling
✅ Include gradient backgrounds with animations
✅ Add glassmorphism effects (backdrop-blur, transparency)
✅ Use modern typography (Inter font, proper spacing)
✅ Include smooth hover animations (cubic-bezier easing)
✅ Add visual depth (shadows, borders, effects)
✅ Implement responsive design (mobile-first)
✅ Use professional color schemes

QUALITY BENCHMARK: Output must match the visual quality of:
- Stripe's homepage
- Vercel's design system  
- Linear's interface
- Figma's landing pages
`;

const STREAMING_FORMAT_ENFORCER = `
🚨 CRITICAL STREAMING FORMAT (MANDATORY)

YOU MUST use these EXACT markers:
1. [PLAN] with JSON file structure
2. [FILE:path/filename] for each file  
3. [/FILE] to end each file
4. [COMPLETE] to finish

EXAMPLE:
[PLAN]
{"files":[{"path":"index.html","description":"Main page"}]}
[/PLAN]
[FILE:index.html]
<!DOCTYPE html>...
[/FILE]
[COMPLETE]
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, codeType, model, conversationId } = await req.json()
    
    // Enhanced system prompts based on code type
    let systemPrompt = ''
    
    switch (codeType) {
      case 'html':
        systemPrompt = `${MODERN_UI_STANDARDS}
${STREAMING_FORMAT_ENFORCER}

CREATE MODERN HTML WEB APPLICATION WITH PROFESSIONAL STYLING

MANDATORY TECH STACK:
- HTML5 semantic structure
- Tailwind CSS (CDN) for ALL styling
- Modern JavaScript (ES6+) 
- Google Fonts (Inter family)
- Lucide icons for UI elements

REQUIRED FILE STRUCTURE:
[PLAN]
{"files":[
  {"path":"index.html","description":"Modern HTML with Tailwind integration"},
  {"path":"styles.css","description":"Custom CSS for advanced animations"},
  {"path":"script.js","description":"Modern JavaScript with smooth interactions"}
]}
[/PLAN]

DESIGN REQUIREMENTS FOR "${prompt}":
✅ Hero section with gradient background and animations
✅ Navigation with glassmorphism effects
✅ Content cards with hover animations and shadows
✅ Modern buttons with smooth transitions
✅ Responsive grid layouts that adapt to all screens
✅ Professional typography hierarchy
✅ Interactive elements with visual feedback

EXAMPLE MODERN HTML STRUCTURE:
[FILE:index.html]
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Professional Web Application</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'system-ui', 'sans-serif'],
                    },
                    animation: {
                        'gradient': 'gradient 8s ease-in-out infinite',
                        'float': 'float 6s ease-in-out infinite',
                        'slide-up': 'slideUp 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    }
                }
            }
        }
    </script>
</head>
<body class="font-sans bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 min-h-screen">

    <!-- Modern Navigation -->
    <nav class="fixed top-0 w-full z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div class="max-w-7xl mx-auto px-6">
            <div class="flex items-center justify-between h-16">
                <h1 class="text-2xl font-bold text-white">Brand</h1>
                <div class="hidden md:flex items-center space-x-8">
                    <a href="#features" class="text-white/90 hover:text-white transition-all duration-300 hover:scale-105">Features</a>
                    <a href="#pricing" class="text-white/90 hover:text-white transition-all duration-300 hover:scale-105">Pricing</a>
                    <button class="bg-white text-gray-900 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="pt-24 pb-20 relative overflow-hidden">
        <div class="absolute inset-0 bg-black/20"></div>
        <div class="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-float"></div>
        
        <div class="relative z-10 max-w-6xl mx-auto px-6 text-center">
            <h1 class="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
                Build Something
                <span class="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    Amazing
                </span>
            </h1>
            <p class="text-xl text-white/90 mb-12 max-w-3xl mx-auto">
                Professional web applications with modern design and cutting-edge technology.
            </p>
            <button class="group bg-white text-gray-900 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-100 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                Start Building
                <svg class="inline ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
            </button>
        </div>
    </section>

    <!-- Continue building the rest of the application with modern patterns -->

    <script src="script.js"></script>
</body>
</html>
[/FILE]

CONTINUE BUILDING: Generate complete modern website with all required files and professional styling.

Generate for: ${prompt}`;
        break;
        
      case 'react':
        systemPrompt = `${MODERN_UI_STANDARDS}
${STREAMING_FORMAT_ENFORCER}

CREATE MODERN REACT APPLICATION WITH COMPONENT LIBRARY

MANDATORY TECH STACK:
- React 18 + TypeScript
- Tailwind CSS for styling
- shadcn/ui components (Button, Card, Input)
- Lucide React icons
- Modern hooks and patterns

REQUIRED FILE STRUCTURE:
[PLAN]
{"files":[
  {"path":"src/App.tsx","description":"Main application component"},
  {"path":"src/components/ui/Button.tsx","description":"Reusable button component"},
  {"path":"src/components/ui/Card.tsx","description":"Modern card component"},
  {"path":"src/components/layout/Header.tsx","description":"Navigation header"},
  {"path":"src/components/sections/Hero.tsx","description":"Hero section with gradients"},
  {"path":"src/components/sections/Features.tsx","description":"Features showcase"},
  {"path":"src/lib/utils.ts","description":"Utility functions"},
  {"path":"index.html","description":"Entry point"},
  {"path":"tailwind.config.js","description":"Tailwind configuration"},
  {"path":"package.json","description":"Dependencies and scripts"}
]}
[/PLAN]

COMPONENT REQUIREMENTS:
✅ Use TypeScript interfaces for all props
✅ Implement modern React patterns (hooks, context)
✅ Add smooth animations with CSS transitions
✅ Include responsive design with Tailwind breakpoints
✅ Use shadcn/ui component patterns
✅ Add proper error boundaries and loading states

EXAMPLE MODERN REACT COMPONENT:
[FILE:src/components/sections/Hero.tsx]
import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 overflow-hidden">
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Next Generation
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            {" "}Solutions
          </span>
        </h1>
        
        <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
          Experience the future of web applications with cutting-edge technology and beautiful design.
        </p>
        
        <button className="group bg-white text-gray-900 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-100 transition-all duration-300 hover:scale-105 hover:shadow-2xl flex items-center justify-center mx-auto">
          Get Started
          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </section>
  );
}
[/FILE]

CONTINUE BUILDING: Generate complete React application with modern patterns.

Generate for: ${prompt}`;
        break;
        
      default:
        systemPrompt = `${MODERN_UI_STANDARDS}
Create a modern, professional application for: ${prompt}
Use appropriate technology stack and follow all modern design requirements.`;
    }

    // Make API call to Claude
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-sonnet-20241022',
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

    // Return streaming response
    const readableStream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) return;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  controller.close();
                  return;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.delta?.text) {
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

    return new Response(readableStream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})
