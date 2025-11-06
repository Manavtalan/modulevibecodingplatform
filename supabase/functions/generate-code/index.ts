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

// Design quality validation function
const validateDesignQuality = (content: string): { valid: boolean; suggestions: string[] } => {
  const suggestions: string[] = [];
  
  // Check for modern CSS patterns
  if (!content.includes('grid') && !content.includes('flexbox') && !content.includes('flex')) {
    suggestions.push('Add CSS Grid or Flexbox layouts for modern responsive design');
  }
  
  if (!content.includes('transition') && !content.includes('animation')) {
    suggestions.push('Add smooth transitions and animations for better UX');
  }
  
  if (!content.includes('gradient') && !content.includes('linear-gradient') && !content.includes('bg-gradient')) {
    suggestions.push('Use modern gradients for visual depth');
  }
  
  if (!content.includes('hover:') && !content.includes(':hover')) {
    suggestions.push('Add hover effects for interactive elements');
  }
  
  // Check for responsive design
  if (!content.includes('responsive') && !content.includes('@media') && !content.includes('sm:') && !content.includes('md:')) {
    suggestions.push('Implement responsive design with breakpoints');
  }
  
  // Check for modern typography
  if (!content.includes('font-') && !content.includes('text-') && !content.includes('font-family')) {
    suggestions.push('Use proper typography hierarchy (headings, body text)');
  }
  
  // Check for spacing
  if (!content.includes('padding') && !content.includes('margin') && !content.includes('gap') && !content.includes('space-')) {
    suggestions.push('Add consistent spacing using a spacing scale');
  }
  
  // Check for shadows (depth)
  if (!content.includes('shadow') && !content.includes('box-shadow')) {
    suggestions.push('Add subtle shadows for depth and hierarchy');
  }
  
  // Check for border radius (modern look)
  if (!content.includes('rounded') && !content.includes('border-radius')) {
    suggestions.push('Use rounded corners for modern aesthetic');
  }
  
  return {
    valid: suggestions.length === 0,
    suggestions
  };
};

// Design token usage validation function
const validateDesignTokenUsage = (fullResponse: string): { valid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  // Check if design-tokens.css exists
  const hasDesignTokens = fullResponse.includes('design-tokens.css') || fullResponse.includes('tokens.css');
  
  if (!hasDesignTokens) {
    issues.push('Missing design-tokens.css file - design system tokens are required');
  }
  
  // Check for hardcoded hex colors (excluding comments and design token definitions)
  const hexColorMatches = fullResponse.match(/#[0-9a-fA-F]{3,6}/g);
  if (hexColorMatches && hexColorMatches.length > 20) {
    // Allow some hex colors in design-tokens.css, but flag excessive use elsewhere
    const tokensSection = fullResponse.split('[FILE:src/styles/design-tokens.css]')[1]?.split('[/FILE]')[0] || '';
    const nonTokenContent = fullResponse.replace(tokensSection, '');
    const nonTokenHex = nonTokenContent.match(/#[0-9a-fA-F]{3,6}/g);
    
    if (nonTokenHex && nonTokenHex.length > 5) {
      issues.push('Hardcoded hex colors found in components - use design tokens like var(--primary-500)');
    }
  }
  
  // Check for hardcoded rgb/rgba colors in components
  if (fullResponse.match(/rgb\s*\(/gi) || fullResponse.match(/rgba\s*\(/gi)) {
    const componentSection = fullResponse.split('[FILE:src/components/')[1];
    if (componentSection && (componentSection.includes('rgb(') || componentSection.includes('rgba('))) {
      issues.push('Hardcoded rgb/rgba colors found in components - use design tokens instead');
    }
  }
  
  // Check for hardcoded pixel spacing (allow 1px and 2px for borders)
  const pxMatches = fullResponse.match(/\d+px/g);
  if (pxMatches) {
    const largePxValues = pxMatches.filter(match => {
      const num = parseInt(match);
      return num > 2 && num < 1000; // Ignore very large values (likely widths/heights)
    });
    
    if (largePxValues.length > 10) {
      issues.push('Hardcoded pixel spacing found - use design token spacing like var(--space-4)');
    }
  }
  
  // Check if components use design tokens
  const hasComponentFiles = fullResponse.includes('[FILE:src/components/');
  const usesDesignTokens = fullResponse.includes('var(--') && fullResponse.match(/var\(--\w+/g);
  
  if (hasComponentFiles && !usesDesignTokens) {
    issues.push('Components should use design tokens with var(--token-name) syntax');
  }
  
  // Check for Tailwind hardcoded values instead of token references
  const hasTailwindColors = fullResponse.match(/bg-(blue|red|green|purple|pink|yellow|indigo|gray)-\d{3}/g);
  if (hasTailwindColors && hasTailwindColors.length > 3) {
    issues.push('Use design token classes like bg-[var(--primary-500)] instead of Tailwind color utilities');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
};

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

    const { prompt, codeType = 'html', framework, conversation_id, model = 'claude-sonnet-4-5' } = await req.json() as GenerateCodeRequest;

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
    const baseFormat = `You are a senior full-stack developer specializing in modern, professional web applications.

CORE PRINCIPLES:
- Create BEAUTIFUL, MODERN, POLISHED user interfaces
- Follow current 2025 design trends and best practices
- Ensure excellent user experience and accessibility
- Use semantic HTML and clean, maintainable code
- Implement responsive design that works on all devices (320px-1920px)
- Add smooth animations and micro-interactions
- Professional color schemes and typography
- High-quality, production-ready code

QUALITY STANDARDS:
- Professional-grade UI that could be used in production
- Modern design patterns (glassmorphism, gradients, subtle shadows)
- Sophisticated color schemes (not basic colors)
- Smooth animations and transitions (0.3s cubic-bezier)
- Proper spacing scale and typography hierarchy
- High accessibility standards (WCAG AA compliant)
- Mobile-first responsive design
- Semantic HTML5 markup

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
- No text outside markers
- Always create PROFESSIONAL, MODERN UI designs
- Never use outdated patterns or basic styling`;

    switch (codeType) {
      case 'html':
        systemPrompt = `${baseFormat}

⚠️⚠️⚠️ CRITICAL RULES ⚠️⚠️⚠️
1. NEVER generate a single HTML file - ALWAYS separate files
2. MUST create MODERN, PROFESSIONAL, POLISHED UI design

FORBIDDEN PATTERNS:
❌ Single standalone HTML file
❌ <style> tags in HTML
❌ <script> code in HTML
❌ Basic unstyled layouts
❌ Outdated CSS patterns
❌ Tables for layout
❌ Inline styles (style="...")
❌ Fixed pixel values everywhere

REQUIRED FILE STRUCTURE:
[PLAN]
{"files":[
  {"path":"index.html","description":"Semantic HTML5 structure with modern markup"},
  {"path":"styles.css","description":"Modern CSS with Grid, Flexbox, animations, gradients"},
  {"path":"script.js","description":"Interactive JavaScript with smooth interactions"}
]}
[/PLAN]

DESIGN REQUIREMENTS (MANDATORY):
✅ Modern CSS Grid/Flexbox layouts (no float-based layouts)
✅ Smooth transitions: transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
✅ Gradient backgrounds: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
✅ Modern typography: Inter, Poppins, Outfit, or system-ui stack
✅ Hover effects: transform: translateY(-2px) with box-shadow enhancement
✅ Glassmorphism: backdrop-filter: blur(10px), background: rgba(255,255,255,0.1)
✅ Mobile-first responsive (320px-1920px with clamp() and fluid units)
✅ High color contrast (WCAG AA compliant, minimum 4.5:1)
✅ Consistent spacing scale (8px base: 8px, 16px, 24px, 32px, 48px, 64px)
✅ Subtle shadows for depth and visual hierarchy
✅ Modern color palettes (sophisticated, not basic colors)

EXAMPLE MODERN PATTERNS TO USE:
- Cards: 
  border-radius: 16px; 
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
- Buttons: 
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 8px;
  padding: 12px 32px;
  font-weight: 600;
- Animations: 
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
- Glassmorphism: 
  backdrop-filter: blur(16px); 
  background: rgba(255, 255, 255, 0.1); 
  border: 1px solid rgba(255, 255, 255, 0.2);
- Modern spacing: 
  margin: clamp(1rem, 4vw, 3rem); 
  padding: clamp(1rem, 2.5vw, 2rem);

MANDATORY CSS FEATURES:
- Use CSS Custom Properties (CSS Variables) for theming
- Implement smooth scrolling: html { scroll-behavior: smooth; }
- Add focus-visible states for keyboard navigation
- Use modern font loading: font-display: swap;
- Include :hover, :active, :focus states for all interactive elements
- Add subtle micro-interactions and animations (fade-in, slide-up on load)
- Use modern CSS features: clamp(), min(), max(), calc()

COLOR PALETTE REQUIREMENTS:
- Use HSL color values for better manipulation
- Primary: hsl(263, 70%, 50%) with variations (lighter/darker)
- Accent: hsl(320, 70%, 50%)
- Background: hsl(220, 13%, 18%) for dark mode or hsl(0, 0%, 98%) for light mode
- Text: High contrast ratios (minimum 4.5:1 for body, 3:1 for large text)
- Use color variables in CSS: --color-primary, --color-accent, etc.

TYPOGRAPHY REQUIREMENTS:
- Font hierarchy: h1(clamp(2rem, 5vw, 3rem)), h2(clamp(1.75rem, 4vw, 2.5rem)), h3(1.5rem), body(1rem)
- Line height: 1.6 for body text, 1.2 for headings
- Font weights: 400 (normal), 600 (semi-bold), 700 (bold)
- Letter spacing: -0.025em for headings, 0 for body
- Use system font stack or Google Fonts (Inter, Poppins recommended)

MANDATORY OUTPUT FORMAT:
[FILE:index.html]
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modern Website Title</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="header">
    <nav class="nav">
      <div class="nav-container">
        <h1 class="logo">Logo</h1>
        <ul class="nav-links">
          <li><a href="#home" class="nav-link">Home</a></li>
          <li><a href="#features" class="nav-link">Features</a></li>
          <li><a href="#about" class="nav-link">About</a></li>
        </ul>
      </div>
    </nav>
  </header>
  <main>
    <section id="hero" class="hero">
      <div class="hero-content">
        <h2 class="hero-title">Professional Hero Title</h2>
        <p class="hero-description">Modern, engaging description text</p>
        <button class="btn btn-primary">Get Started</button>
      </div>
    </section>
  </main>
  <footer class="footer">
    <p>&copy; 2025 Website Name. All rights reserved.</p>
  </footer>
  <script src="script.js"></script>
</body>
</html>
[/FILE]

[FILE:styles.css]
/* CSS Variables for Modern Theming */
:root {
  --color-primary: hsl(263, 70%, 50%);
  --color-primary-light: hsl(263, 70%, 60%);
  --color-accent: hsl(320, 70%, 50%);
  --color-bg: hsl(0, 0%, 98%);
  --color-surface: hsl(0, 0%, 100%);
  --color-text: hsl(220, 13%, 18%);
  --color-text-light: hsl(220, 13%, 40%);
  --spacing-xs: 8px;
  --spacing-sm: 16px;
  --spacing-md: 24px;
  --spacing-lg: 32px;
  --spacing-xl: 48px;
  --spacing-2xl: 64px;
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.15);
}

/* Modern Reset */
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  font-size: 16px;
}

body {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  line-height: 1.6;
  color: var(--color-text);
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Modern Navigation */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(16px);
  background: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: var(--shadow-sm);
}

.nav {
  padding: var(--spacing-sm) 0;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-links {
  display: flex;
  gap: var(--spacing-lg);
  list-style: none;
}

.nav-link {
  color: var(--color-text);
  text-decoration: none;
  font-weight: 600;
  transition: var(--transition);
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

.nav-link:hover::after {
  width: 100%;
}

/* Modern Hero Section */
.hero {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(2rem, 8vw, 6rem) var(--spacing-md);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  width: 500px;
  height: 500px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  filter: blur(80px);
  top: -250px;
  right: -250px;
}

.hero-content {
  max-width: 800px;
  text-align: center;
  animation: fadeInUp 0.8s ease;
}

.hero-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 700;
  color: white;
  margin-bottom: var(--spacing-md);
  line-height: 1.2;
  letter-spacing: -0.025em;
}

.hero-description {
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: var(--spacing-xl);
  line-height: 1.6;
}

/* Modern Button */
.btn {
  display: inline-block;
  padding: 12px 32px;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: var(--transition);
  font-family: inherit;
}

.btn-primary {
  background: white;
  color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Modern Footer */
.footer {
  background: var(--color-text);
  color: white;
  padding: var(--spacing-lg);
  text-align: center;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .nav-links {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-sm);
  }
}

/* Focus Styles for Accessibility */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
[/FILE]

[FILE:script.js]
// Modern JavaScript with smooth interactions
document.addEventListener('DOMContentLoaded', function() {
  console.log('Modern website loaded ✨');
  
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  // Add scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeInUp 0.8s ease forwards';
      }
    });
  }, observerOptions);
  
  // Observe all sections
  document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
  });
  
  // Mobile menu toggle (if needed)
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function() {
      navLinks.classList.toggle('active');
      this.classList.toggle('active');
    });
  }
  
  // Add subtle parallax effect to hero
  const hero = document.querySelector('.hero');
  if (hero) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      hero.style.transform = 'translateY(' + (scrolled * 0.5) + 'px)';
    });
  }
});
[/FILE]

VERIFICATION CHECKLIST (CHECK BEFORE COMPLETING):
✓ Generated 3 files: index.html, styles.css, script.js
✓ index.html has <link rel="stylesheet" href="styles.css">
✓ index.html has <script src="script.js"></script>
✓ index.html has NO <style> tags
✓ index.html has NO <script> tags with code inside
✓ Modern CSS with gradients, transitions, animations
✓ CSS Variables for theming
✓ Glassmorphism and modern effects applied
✓ Mobile-first responsive design (320px-1920px)
✓ Semantic HTML5 (header, main, section, footer, nav)
✓ Accessible (focus states, ARIA, semantic markup)
✓ Color contrast ≥4.5:1
✓ Modern typography with clamp() for fluid sizing
✓ Smooth animations and micro-interactions`;
        break;
      case 'react':
        systemPrompt = `${baseFormat}

MANDATORY: CREATE PROFESSIONAL REACT APPLICATION WITH DESIGN SYSTEM

CRITICAL REQUIREMENT: ALWAYS generate src/styles/design-tokens.css file
This file MUST contain CSS custom properties for the entire design system.

ARCHITECTURE (Vite + React + TypeScript + Tailwind + shadcn/ui):

CRITICAL RULES:
❌ NO single file React apps
❌ NO inline styles
❌ NO basic unstyled components
❌ NO outdated UI patterns
❌ NO missing component structure
❌ NO custom CSS in components (use Tailwind utilities)

MANDATORY FILE STRUCTURE:
[PLAN]
{"files":[
  {"path":"src/App.tsx","description":"Main composition with routing"},
  {"path":"src/components/layout/Navbar.tsx","description":"Modern navigation with mobile menu"},
  {"path":"src/components/sections/Hero.tsx","description":"Stunning hero section with CTA"},
  {"path":"src/components/sections/Features.tsx","description":"Feature showcase grid"},
  {"path":"src/components/sections/Footer.tsx","description":"Footer component"},
  {"path":"src/components/ui/Button.tsx","description":"Reusable button component"},
  {"path":"src/components/ui/Card.tsx","description":"Reusable card component"},
  {"path":"src/styles/design-tokens.css","description":"MANDATORY - Complete design system variables"},
  {"path":"src/styles/globals.css","description":"Global styles importing design tokens"},
  {"path":"src/lib/utils.ts","description":"Utility functions including design helpers"}
]}
[/PLAN]

DESIGN REQUIREMENTS (CRITICAL):
✅ Use Tailwind's extended color palette (blue-500, purple-600, slate-800, indigo-500)
✅ Add smooth transitions (transition-all duration-300 ease-in-out)
✅ Include hover effects (hover:scale-105, hover:shadow-xl, hover:-translate-y-1)
✅ Use gradient text (bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent)
✅ Add glassmorphism effects (backdrop-blur-lg bg-white/10 border border-white/20)
✅ Proper spacing with Tailwind scale (space-y-8, gap-6, p-8, px-4)
✅ Typography hierarchy (text-5xl font-bold, text-lg text-muted-foreground, leading-tight)
✅ Use shadcn/ui components when available (Button, Card, Badge, Input)
✅ Add icons from lucide-react for visual interest
✅ Dark mode support with proper color contrast
✅ Responsive design with mobile-first approach
✅ Accessibility features (aria-labels, focus states, focus-visible:ring-2)
✅ Add subtle animations on scroll (animate-fade-in if available)

MANDATORY design-tokens.css STRUCTURE:
[FILE:src/styles/design-tokens.css]
:root {
  /* === COLORS - Modern Purple/Blue Professional Theme === */
  /* Primary Colors */
  --primary-50: #ede9fe;
  --primary-100: #ddd6fe;
  --primary-200: #c4b5fd;
  --primary-300: #a78bfa;
  --primary-400: #8b5cf6;
  --primary-500: #6366f1;
  --primary-600: #4f46e5;
  --primary-700: #4338ca;
  --primary-800: #3730a3;
  --primary-900: #312e81;
  
  /* Accent Colors */
  --accent-50: #fdf2f8;
  --accent-100: #fce7f3;
  --accent-200: #fbcfe8;
  --accent-300: #f9a8d4;
  --accent-400: #f472b6;
  --accent-500: #ec4899;
  --accent-600: #db2777;
  --accent-700: #be185d;
  --accent-800: #9d174d;
  --accent-900: #831843;
  
  /* Neutral Colors */
  --neutral-50: #f8fafc;
  --neutral-100: #f1f5f9;
  --neutral-200: #e2e8f0;
  --neutral-300: #cbd5e1;
  --neutral-400: #94a3b8;
  --neutral-500: #64748b;
  --neutral-600: #475569;
  --neutral-700: #334155;
  --neutral-800: #1e293b;
  --neutral-900: #0f172a;
  
  /* Semantic Colors */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  
  /* Surface Colors */
  --background: var(--neutral-50);
  --surface: var(--neutral-100);
  --surface-secondary: var(--neutral-200);
  --surface-tertiary: var(--neutral-300);
  
  /* Text Colors */
  --text-primary: var(--neutral-900);
  --text-secondary: var(--neutral-700);
  --text-tertiary: var(--neutral-500);
  --text-inverse: var(--neutral-50);
  
  /* Border Colors */
  --border: var(--neutral-200);
  --border-secondary: var(--neutral-300);
  --border-focus: var(--primary-500);
  
  /* === SPACING SCALE === */
  --space-0: 0;
  --space-px: 1px;
  --space-0-5: 0.125rem;    /* 2px */
  --space-1: 0.25rem;       /* 4px */
  --space-1-5: 0.375rem;    /* 6px */
  --space-2: 0.5rem;        /* 8px */
  --space-2-5: 0.625rem;    /* 10px */
  --space-3: 0.75rem;       /* 12px */
  --space-3-5: 0.875rem;    /* 14px */
  --space-4: 1rem;          /* 16px */
  --space-5: 1.25rem;       /* 20px */
  --space-6: 1.5rem;        /* 24px */
  --space-7: 1.75rem;       /* 28px */
  --space-8: 2rem;          /* 32px */
  --space-9: 2.25rem;       /* 36px */
  --space-10: 2.5rem;       /* 40px */
  --space-11: 2.75rem;      /* 44px */
  --space-12: 3rem;         /* 48px */
  --space-14: 3.5rem;       /* 56px */
  --space-16: 4rem;         /* 64px */
  --space-20: 5rem;         /* 80px */
  --space-24: 6rem;         /* 96px */
  --space-32: 8rem;         /* 128px */
  
  /* === TYPOGRAPHY === */
  /* Font Families */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-serif: 'Playfair Display', Georgia, serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  /* Font Sizes */
  --text-xs: 0.75rem;       /* 12px */
  --text-sm: 0.875rem;      /* 14px */
  --text-base: 1rem;        /* 16px */
  --text-lg: 1.125rem;      /* 18px */
  --text-xl: 1.25rem;       /* 20px */
  --text-2xl: 1.5rem;       /* 24px */
  --text-3xl: 1.875rem;     /* 30px */
  --text-4xl: 2.25rem;      /* 36px */
  --text-5xl: 3rem;         /* 48px */
  --text-6xl: 3.75rem;      /* 60px */
  
  /* Font Weights */
  --font-thin: 100;
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;
  --font-black: 900;
  
  /* Line Heights */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;
  
  /* Letter Spacing */
  --tracking-tighter: -0.05em;
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
  --tracking-widest: 0.1em;
  
  /* === SHADOWS === */
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
  
  /* === BORDER RADIUS === */
  --radius-none: 0;
  --radius-sm: 0.125rem;     /* 2px */
  --radius-md: 0.375rem;     /* 6px */
  --radius-lg: 0.5rem;       /* 8px */
  --radius-xl: 0.75rem;      /* 12px */
  --radius-2xl: 1rem;        /* 16px */
  --radius-3xl: 1.5rem;      /* 24px */
  --radius-full: 9999px;
  
  /* === BORDER WIDTHS === */
  --border-0: 0;
  --border: 1px;
  --border-2: 2px;
  --border-4: 4px;
  --border-8: 8px;
  
  /* === ANIMATIONS === */
  /* Durations */
  --duration-75: 75ms;
  --duration-100: 100ms;
  --duration-150: 150ms;
  --duration-200: 200ms;
  --duration-300: 300ms;
  --duration-500: 500ms;
  --duration-700: 700ms;
  --duration-1000: 1000ms;
  
  /* Timing Functions */
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  
  /* === Z-INDEX SCALE === */
  --z-0: 0;
  --z-10: 10;
  --z-20: 20;
  --z-30: 30;
  --z-40: 40;
  --z-50: 50;
  --z-modal: 1000;
  --z-overlay: 1010;
  --z-dropdown: 1020;
  --z-tooltip: 1030;
}

/* Dark Mode Variants */
@media (prefers-color-scheme: dark) {
  :root {
    --background: var(--neutral-900);
    --surface: var(--neutral-800);
    --surface-secondary: var(--neutral-700);
    --surface-tertiary: var(--neutral-600);
    
    --text-primary: var(--neutral-50);
    --text-secondary: var(--neutral-300);
    --text-tertiary: var(--neutral-400);
    --text-inverse: var(--neutral-900);
    
    --border: var(--neutral-700);
    --border-secondary: var(--neutral-600);
  }
}

/* Utility Classes for Design Tokens */
.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-tertiary { color: var(--text-tertiary); }
.bg-primary { background-color: var(--primary-500); }
.bg-accent { background-color: var(--accent-500); }
.bg-surface { background-color: var(--surface); }
.shadow-card { box-shadow: var(--shadow-lg); }
.rounded-card { border-radius: var(--radius-xl); }
[/FILE]

COMPONENT TOKEN USAGE REQUIREMENTS (CRITICAL):
✅ ALL components MUST use CSS custom properties from design-tokens.css
✅ NO hardcoded colors, spacing, or typography values in components
✅ Use semantic token names (--text-primary instead of #1e293b)
✅ Import design tokens in globals.css: @import './design-tokens.css';
✅ Reference tokens using var() function: color: var(--text-primary);
✅ Use Tailwind utilities that map to design tokens when possible

MANDATORY globals.css CONTENT:
[FILE:src/styles/globals.css]
@import './design-tokens.css';

/* Reset and Base Styles */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-family: var(--font-sans);
  line-height: var(--leading-normal);
  color: var(--text-primary);
  background-color: var(--background);
  scroll-behavior: smooth;
  font-size: 16px;
}

body {
  min-height: 100vh;
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Focus Management for Accessibility */
*:focus {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

*:focus:not(:focus-visible) {
  outline: none;
}

/* Button Reset */
button {
  font-family: inherit;
  font-size: inherit;
  border: none;
  background: none;
  cursor: pointer;
  color: inherit;
}

/* Link Reset */
a {
  color: inherit;
  text-decoration: none;
}

/* Image Reset */
img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
}

/* Form Elements */
input, textarea, select, button {
  font: inherit;
  color: inherit;
}

/* Typography Utilities */
.heading-1 { 
  font-size: var(--text-5xl); 
  font-weight: var(--font-bold); 
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
}

.heading-2 { 
  font-size: var(--text-4xl); 
  font-weight: var(--font-bold); 
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
}

.heading-3 { 
  font-size: var(--text-3xl); 
  font-weight: var(--font-semibold); 
  line-height: var(--leading-snug);
}

.heading-4 { 
  font-size: var(--text-2xl); 
  font-weight: var(--font-semibold); 
  line-height: var(--leading-snug);
}

.body-large { 
  font-size: var(--text-lg); 
  line-height: var(--leading-relaxed);
  color: var(--text-primary);
}

.body-base { 
  font-size: var(--text-base); 
  line-height: var(--leading-normal);
  color: var(--text-primary);
}

.body-small { 
  font-size: var(--text-sm); 
  line-height: var(--leading-normal);
  color: var(--text-secondary);
}

/* Spacing Utilities */
.container {
  width: 100%;
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}

.section {
  padding-top: var(--space-16);
  padding-bottom: var(--space-16);
}

/* Animation Utilities */
.transition-smooth {
  transition-duration: var(--duration-300);
  transition-timing-function: var(--ease-in-out);
}

.transition-fast {
  transition-duration: var(--duration-150);
  transition-timing-function: var(--ease-out);
}

/* Card Utilities */
.card {
  background-color: var(--surface);
  border: var(--border) solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--space-6);
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
  transition: all var(--duration-300) var(--ease-out);
}

/* Screen Reader Only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
[/FILE]

COMPONENT TOKEN USAGE EXAMPLES (MANDATORY):

Example 1: Button Component with Design Tokens
[FILE:src/components/ui/Button.tsx]
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

export default function Button({ 
  variant = 'primary', 
  size = 'medium', 
  children, 
  className = '',
  ...props 
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-[var(--radius-lg)] transition-all duration-[var(--duration-200)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[var(--primary-500)] text-[var(--text-inverse)] hover:bg-[var(--primary-600)] shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]',
    secondary: 'bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--surface-secondary)]',
    outline: 'border-2 border-[var(--primary-500)] text-[var(--primary-500)] hover:bg-[var(--primary-50)]',
    ghost: 'text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
  };
  
  const sizes = {
    small: 'px-[var(--space-3)] py-[var(--space-1-5)] text-[var(--text-sm)]',
    medium: 'px-[var(--space-4)] py-[var(--space-2)] text-[var(--text-base)]',
    large: 'px-[var(--space-6)] py-[var(--space-3)] text-[var(--text-lg)]'
  };
  
  return (
    <button
      className={baseStyles + ' ' + variants[variant] + ' ' + sizes[size] + ' ' + className}
      {...props}
    >
      {children}
    </button>
  );
}
[/FILE]

Example 2: Card Component with Design Tokens
[FILE:src/components/ui/Card.tsx]
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

export default function Card({ 
  children, 
  hover = true,
  className = '', 
  ...props 
}: CardProps) {
  const baseStyles = 'bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] p-[var(--space-6)]';
  const hoverStyles = hover ? 'hover:shadow-[var(--shadow-lg)] hover:-translate-y-1 transition-all duration-[var(--duration-300)]' : '';
  
  return (
    <div
      className={baseStyles + ' ' + hoverStyles + ' ' + className}
      {...props}
    >
      {children}
    </div>
  );
}
[/FILE]

Example 3: Section Component with Design Tokens
[FILE:src/components/sections/Hero.tsx]
import Button from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800), var(--accent-600))'
      }}
    >
      <div 
        className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl"
        style={{
          background: 'var(--primary-300)',
          opacity: 0.2
        }}
      />
      
      <div className="container mx-auto px-[var(--space-4)] text-center relative z-10">
        <h1 
          className="font-bold mb-[var(--space-6)] leading-tight"
          style={{
            fontSize: 'clamp(var(--text-3xl), 5vw, var(--text-6xl))',
            color: 'var(--text-inverse)'
          }}
        >
          Build Amazing Web Experiences
        </h1>
        
        <p 
          className="mb-[var(--space-12)] max-w-3xl mx-auto"
          style={{
            fontSize: 'var(--text-xl)',
            color: 'var(--text-inverse)',
            opacity: 0.9,
            lineHeight: 'var(--leading-relaxed)'
          }}
        >
          Create stunning, modern websites with our powerful platform.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-[var(--space-4)] justify-center">
          <Button variant="primary" size="large">
            Get Started
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button variant="outline" size="large">
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
}
[/FILE]

CRITICAL RULES FOR COMPONENT GENERATION (MANDATORY):
❌ NEVER use hardcoded colors like #ffffff, rgb(255,255,255), or blue-500
❌ NEVER use hardcoded spacing like margin: 20px or padding: 16px or p-4
❌ NEVER use hardcoded font sizes like text-2xl or font-size: 24px
❌ NEVER use hardcoded shadows like shadow-lg or box-shadow: 0 10px 15px
❌ NEVER use hardcoded border radius like rounded-xl or border-radius: 12px

✅ ALWAYS use design tokens with bg-[var(--primary-500)] syntax
✅ ALWAYS use design tokens with style={{backgroundColor: 'var(--primary-500)'}} for inline styles
✅ ALWAYS use semantic token names (--text-primary not --neutral-900)
✅ ALWAYS include hover and focus states using token variants (--primary-600 for hover)
✅ ALWAYS use spacing scale tokens (--space-4, --space-6, etc)
✅ ALWAYS use typography tokens (--text-xl, --font-semibold, --leading-tight)
✅ ALWAYS use shadow tokens (--shadow-md, --shadow-lg)
✅ ALWAYS use radius tokens (--radius-lg, --radius-xl)
✅ ALWAYS use animation tokens (--duration-300, --ease-in-out)

TOKEN REFERENCE PATTERNS:
- Tailwind classes: bg-[var(--primary-500)] text-[var(--text-primary)]
- Inline styles: style={{color: 'var(--text-primary)', padding: 'var(--space-4)'}}
- Pseudo-classes: hover:bg-[var(--primary-600)] focus:ring-[var(--border-focus)]

COMPONENT ARCHITECTURE REQUIREMENTS:
- Each component must be under 120 lines (split into smaller components if needed)
- Use TypeScript interfaces for all props
- Implement proper prop validation
- Use React hooks appropriately (useState, useEffect, useMemo, useCallback)
- Add proper component composition
- Export components as default

MODERN UI PATTERNS TO IMPLEMENT:
1. Hero Section:
   - Full viewport height or near-full (min-h-screen or min-h-[80vh])
   - Gradient background (bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700)
   - Large heading with gradient text
   - Descriptive subtitle
   - CTA buttons with variants (primary solid + secondary outline)
   - Optional: Background effects (blurred circles, patterns)

2. Features Grid:
   - 3-column grid on desktop (grid-cols-1 md:grid-cols-3)
   - Card components with hover effects
   - Icons from lucide-react
   - Title + description for each feature
   - Proper spacing (gap-8, p-6)

3. Navigation:
   - Sticky header (sticky top-0 z-50)
   - Glassmorphism effect (backdrop-blur-lg bg-white/80)
   - Mobile hamburger menu
   - Logo + nav links + CTA button
   - Smooth scroll behavior

4. Cards:
   - Rounded corners (rounded-xl or rounded-2xl)
   - Subtle shadows (shadow-lg)
   - Hover effects (hover:shadow-2xl hover:-translate-y-1)
   - Proper padding (p-6 or p-8)
   - White or surface background

5. Buttons:
   - Multiple variants (primary, secondary, outline, ghost)
   - Proper sizing (px-6 py-3 for default)
   - Hover states (hover:opacity-90 or hover:bg-primary-hover)
   - Rounded (rounded-lg)
   - Font weight (font-semibold)

EXAMPLE MODERN COMPONENT:
[FILE:src/components/sections/Hero.tsx]
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-8 border border-white/30">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">New Feature Available</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Build Amazing
          <span className="block bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
            Web Experiences
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
          Create stunning, modern websites with our powerful platform. 
          No coding required, just your creativity.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-6 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
            Get Started
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-6 text-lg rounded-xl backdrop-blur-sm">
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
}
[/FILE]

ACCESSIBILITY REQUIREMENTS:
- Proper heading hierarchy (single h1, then h2, h3, etc.)
- Alt text for all images
- ARIA labels for interactive elements without text
- Focus management (focus-visible:ring-2 focus-visible:ring-primary)
- Keyboard navigation support
- Color contrast ratios meeting WCAG AA (4.5:1 for text)
- Screen reader friendly markup

RESPONSIVENESS REQUIREMENTS:
- Mobile-first approach (design for 320px up)
- Use Tailwind breakpoints: sm:, md:, lg:, xl:, 2xl:
- Stack layouts on mobile (flex-col), grid on desktop (md:flex-row, md:grid-cols-3)
- No horizontal scroll at any viewport size
- Touch-friendly targets (min 44px for buttons/links)
- Responsive typography (text-3xl md:text-5xl lg:text-7xl)

TYPESCRIPT REQUIREMENTS:
- Define interfaces for all component props
- Use proper type annotations
- Avoid 'any' type
- Export types when reusable

MANDATORY PATTERNS:
- Use existing shadcn/ui components (Button, Card, Badge, Input)
- Import icons from lucide-react
- Use Tailwind utilities only (no inline styles, no custom CSS in components)
- Follow mobile-first responsive design
- Implement proper semantic HTML
- Add meaningful content (no Lorem Ipsum placeholder text)`;
        break;
      case 'vue':
        systemPrompt = `${baseFormat}

MANDATORY: CREATE PROFESSIONAL, MODERN VUE 3 APPLICATION

ARCHITECTURE (Vue 3 + Composition API + TypeScript + Tailwind):

CRITICAL RULES:
❌ NO single file Vue apps with everything in one component
❌ NO Options API (use Composition API with <script setup>)
❌ NO inline styles or basic unstyled components
❌ NO outdated UI patterns
❌ NO missing proper component structure

MANDATORY FILE STRUCTURE:
[PLAN]
{"files":[
  {"path":"src/App.vue","description":"Main Vue app with router-view or layout composition"},
  {"path":"src/components/layout/TheNavbar.vue","description":"Modern navigation with mobile menu"},
  {"path":"src/components/sections/TheHero.vue","description":"Stunning hero section with gradients and CTA"},
  {"path":"src/components/sections/TheFeatures.vue","description":"Feature grid with icons"},
  {"path":"src/components/sections/TheTestimonials.vue","description":"Testimonials section"},
  {"path":"src/components/sections/TheFooter.vue","description":"Footer with links"},
  {"path":"src/components/ui/BaseButton.vue","description":"Reusable button component with variants"},
  {"path":"src/components/ui/BaseCard.vue","description":"Reusable card component"},
  {"path":"src/styles/design-tokens.css","description":"Design system CSS variables"},
  {"path":"src/styles/globals.css","description":"Global styles and resets"}
]}
[/PLAN]

DESIGN REQUIREMENTS (CRITICAL - SAME AS REACT):
✅ Use Tailwind's extended color palette (blue-500, purple-600, indigo-500, slate-800)
✅ Add smooth transitions (transition-all duration-300 ease-in-out)
✅ Include hover effects (hover:scale-105, hover:shadow-xl, hover:-translate-y-1)
✅ Use gradient backgrounds (bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700)
✅ Add glassmorphism effects (backdrop-blur-lg bg-white/10 border border-white/20)
✅ Proper spacing with Tailwind scale (space-y-8, gap-6, p-8, px-4)
✅ Typography hierarchy (text-5xl font-bold, text-lg text-gray-600, leading-tight)
✅ Add icons using a CDN or iconify
✅ Dark mode support with proper color schemes
✅ Responsive design with mobile-first approach
✅ Accessibility features (aria-labels, focus states, focus-visible:ring-2)

MANDATORY design-tokens.css (SAME AS REACT):
[FILE:src/styles/design-tokens.css]
:root {
  /* Modern Color System - Purple/Blue Theme */
  --primary: 262.1 83.3% 57.8%;
  --primary-hover: 262.1 83.3% 47.8%;
  --primary-foreground: 210 40% 98%;
  --accent: 340 82% 52%;
  --accent-hover: 340 82% 42%;
  --accent-foreground: 210 40% 98%;
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --surface: 0 0% 100%;
  --surface-hover: 240 4.8% 95.9%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 262.1 83.3% 57.8%;
  
  /* Spacing, Typography, Shadows, etc. */
  --space-xs: 0.5rem;
  --space-sm: 1rem;
  --space-md: 1.5rem;
  --space-lg: 2rem;
  --space-xl: 3rem;
  --space-2xl: 4rem;
  
  --font-sans: 'Inter', system-ui, sans-serif;
  
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  
  --radius: 0.5rem;
  
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --surface: 217.2 32.6% 17.5%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --border: 217.2 32.6% 17.5%;
}
[/FILE]

COMPONENT ARCHITECTURE REQUIREMENTS:
- Composition API with <script setup lang="ts">
- Each component under 120 lines (split if larger)
- TypeScript interfaces for all props with defineProps<>()
- Use ref(), computed(), onMounted() from Vue
- Scoped styles when needed, but prefer Tailwind utilities
- Emit events properly with defineEmits<>()
- Proper component naming (PascalCase for components, The prefix for layout/unique)

MODERN UI PATTERNS (SAME AS REACT):
1. Hero Section:
   - Full/near-full viewport height (min-h-screen or min-h-[80vh])
   - Gradient background (bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700)
   - Large heading with gradient text effect
   - CTA buttons with variants
   - Background decorative elements

2. Features Grid:
   - 3-column grid on desktop (grid-cols-1 md:grid-cols-3)
   - Card components with hover effects
   - Icons for visual interest
   - Title + description per feature

3. Navigation:
   - Sticky header (sticky top-0 z-50)
   - Glassmorphism effect (backdrop-blur-lg bg-white/80)
   - Mobile hamburger menu with Vue reactivity
   - Logo + nav links + CTA button

4. Cards:
   - Rounded corners (rounded-xl)
   - Subtle shadows (shadow-lg)
   - Hover effects (hover:shadow-2xl hover:-translate-y-1)
   - Proper padding (p-6 or p-8)

5. Buttons:
   - Multiple variants via props
   - Proper sizing (px-6 py-3)
   - Hover states
   - Rounded (rounded-lg)
   - Font weight (font-semibold)

EXAMPLE MODERN VUE COMPONENT:
[FILE:src/components/sections/TheHero.vue]
<script setup lang="ts">
import { ref } from 'vue';
import BaseButton from '@/components/ui/BaseButton.vue';

const showModal = ref(false);
</script>

<template>
  <section class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white relative overflow-hidden">
    <!-- Background decorative elements -->
    <div class="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
    <div class="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
    
    <div class="container mx-auto px-4 text-center relative z-10">
      <div class="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-8 border border-white/30">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span class="text-sm font-medium">New Feature Available</span>
      </div>
      
      <h1 class="text-5xl md:text-7xl font-bold mb-6 leading-tight">
        Build Amazing
        <span class="block bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
          Web Experiences
        </span>
      </h1>
      
      <p class="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
        Create stunning, modern websites with our powerful platform. 
        No coding required, just your creativity.
      </p>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <BaseButton 
          variant="primary" 
          size="lg"
          class="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-6 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
        >
          Get Started
          <svg class="ml-2 w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </BaseButton>
        <BaseButton 
          variant="outline"
          size="lg"
          class="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-6 text-lg rounded-xl backdrop-blur-sm"
        >
          Learn More
        </BaseButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Use scoped styles sparingly - prefer Tailwind utilities */
</style>
[/FILE]

ACCESSIBILITY REQUIREMENTS (SAME AS REACT):
- Proper heading hierarchy (single h1, then h2, h3, etc.)
- Alt text for images (or aria-label for icon images)
- ARIA labels for interactive elements
- Focus management (focus-visible:ring-2)
- Keyboard navigation support
- Color contrast ratios meeting WCAG AA (4.5:1)
- Semantic HTML markup

RESPONSIVENESS REQUIREMENTS (SAME AS REACT):
- Mobile-first approach (320px up)
- Use Tailwind breakpoints: sm:, md:, lg:, xl:, 2xl:
- Stack on mobile (flex-col), grid on desktop
- No horizontal scroll at any viewport
- Touch-friendly targets (min 44px)
- Responsive typography (text-3xl md:text-5xl lg:text-7xl)

TYPESCRIPT REQUIREMENTS:
- Use <script setup lang="ts">
- Define prop interfaces with defineProps<PropsInterface>()
- Define emit interfaces with defineEmits<EmitsInterface>()
- Type all refs and reactive values
- Avoid 'any' type

MANDATORY PATTERNS:
- Composition API with <script setup lang="ts">
- Tailwind utilities only (no inline styles, minimal scoped CSS)
- Mobile-first responsive design
- Semantic HTML5
- Meaningful content (no Lorem Ipsum)`;
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

          // Run design quality validation
          const qualityCheck = validateDesignQuality(fullResponse);
          
          // Run design token usage validation
          const tokenValidation = validateDesignTokenUsage(fullResponse);
          
          // Log quality check results for monitoring
          if (!qualityCheck.valid) {
            console.log('⚠️ Design Quality Suggestions:', qualityCheck.suggestions);
          } else {
            console.log('✅ Design quality validation passed');
          }
          
          // Log token validation results
          if (!tokenValidation.valid) {
            console.log('⚠️ Design Token Issues:', tokenValidation.issues);
          } else {
            console.log('✅ Design token validation passed');
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
            tokens: { input: inputTokens, output: outputTokens, total: totalTokens },
            quality_check: {
              valid: qualityCheck.valid,
              suggestions: qualityCheck.suggestions
            },
            token_validation: {
              valid: tokenValidation.valid,
              issues: tokenValidation.issues
            }
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
