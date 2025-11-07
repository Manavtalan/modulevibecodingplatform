import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { MODERN_DESIGN_EXAMPLES } from './designExamples.ts';

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

// Design token usage validation function - ENHANCED
const validateDesignTokenUsage = (fullResponse: string): { valid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  // Check if design-tokens.css exists AND has actual token definitions
  const hasDesignTokens = fullResponse.includes('design-tokens.css') || fullResponse.includes('tokens.css');
  
  if (!hasDesignTokens) {
    issues.push('CRITICAL: Missing design-tokens.css file - design system tokens are required');
  } else {
    // Check if tokens file has actual content
    const tokensSection = fullResponse.split('[FILE:src/styles/design-tokens.css]')[1]?.split('[/FILE]')[0] || '';
    const hasColorTokens = tokensSection.includes('--primary-') && tokensSection.includes('--accent-');
    const hasSpacingTokens = tokensSection.includes('--space-');
    const hasTypographyTokens = tokensSection.includes('--text-') || tokensSection.includes('--font-');
    
    if (!hasColorTokens) issues.push('CRITICAL: design-tokens.css missing color palette (--primary-*, --accent-*)');
    if (!hasSpacingTokens) issues.push('CRITICAL: design-tokens.css missing spacing scale (--space-*)');
    if (!hasTypographyTokens) issues.push('CRITICAL: design-tokens.css missing typography tokens (--text-*, --font-*)');
  }
  
  // Check if tailwind.config.js exists AND maps to design tokens
  const hasTailwindConfig = fullResponse.includes('tailwind.config.js');
  
  if (!hasTailwindConfig) {
    issues.push('CRITICAL: Missing tailwind.config.js - Tailwind configuration mapped to design tokens is required');
  } else {
    // Check if config actually maps to tokens
    const configSection = fullResponse.split('[FILE:tailwind.config.js]')[1]?.split('[/FILE]')[0] || '';
    const mapsToTokens = configSection.includes("'var(--") && configSection.includes('colors:');
    if (!mapsToTokens) {
      issues.push('WARNING: tailwind.config.js does not properly map colors to design tokens');
    }
  }
  
  // Check if utils.ts exists with cn() function
  const hasUtils = fullResponse.includes('src/lib/utils.ts') || fullResponse.includes('lib/utils.ts');
  
  if (!hasUtils) {
    issues.push('CRITICAL: Missing src/lib/utils.ts - design system utilities are required');
  } else {
    // Verify it has cn() function
    const utilsSection = fullResponse.split('[FILE:src/lib/utils.ts]')[1]?.split('[/FILE]')[0] || '';
    if (!utilsSection.includes('export function cn(')) {
      issues.push('WARNING: src/lib/utils.ts missing cn() utility function');
    }
  }
  
  // Check for hardcoded Tailwind color utilities in components (STRICTER CHECK)
  const componentSections = fullResponse.split('[FILE:src/components/').slice(1);
  if (componentSections.length > 0) {
    for (const section of componentSections) {
      const componentCode = section.split('[/FILE]')[0];
      
      // Check for purple-*, blue-*, pink-*, indigo-*, slate-*, gray-* etc
      const badColorPatterns = [
        /\b(bg|text|border|from|via|to|ring|outline)-(purple|blue|pink|indigo|slate|gray|red|green|yellow|amber|orange|teal|cyan|emerald|lime|fuchsia|violet|rose)-\d{2,3}\b/g,
        /\btext-white\b/g,
        /\bbg-white\b/g,
        /\btext-black\b/g,
        /\bbg-black\b/g
      ];
      
      for (const pattern of badColorPatterns) {
        const matches = componentCode.match(pattern);
        if (matches && matches.length > 2) { // Allow a few for very specific cases
          issues.push(`CRITICAL: Component has hardcoded Tailwind colors (${matches[0]}) - use bg-[var(--primary-500)] syntax instead`);
          break;
        }
      }
    }
  }
  
  // Check for hardcoded hex colors (excluding design-tokens.css file)
  const tokensSection = fullResponse.split('[FILE:src/styles/design-tokens.css]')[1]?.split('[/FILE]')[0] || '';
  const nonTokenContent = fullResponse.replace(tokensSection, '');
  const hexColorMatches = nonTokenContent.match(/#[0-9a-fA-F]{3,6}/g);
  
  if (hexColorMatches && hexColorMatches.length > 5) {
    issues.push('WARNING: Hardcoded hex colors found outside design tokens - use var(--primary-500) instead');
  }
  
  // Check for hardcoded rgb/rgba colors in components
  if (componentSections.length > 0) {
    for (const section of componentSections) {
      const componentCode = section.split('[/FILE]')[0];
      if (componentCode.match(/rgb\s*\(/gi) || componentCode.match(/rgba\s*\(/gi)) {
        issues.push('WARNING: Hardcoded rgb/rgba colors found in components - use design tokens instead');
        break;
      }
    }
  }
  
  // Check if components actually USE design tokens
  const hasComponentFiles = fullResponse.includes('[FILE:src/components/');
  const usesDesignTokens = fullResponse.includes('var(--') && fullResponse.match(/var\(--\w+/g);
  
  if (hasComponentFiles && !usesDesignTokens) {
    issues.push('CRITICAL: Components do not use design tokens - ALL styling must use var(--token-name) syntax');
  }
  
  // Check if globals.css imports design tokens
  if (fullResponse.includes('[FILE:src/styles/globals.css]')) {
    const globalsSection = fullResponse.split('[FILE:src/styles/globals.css]')[1]?.split('[/FILE]')[0] || '';
    if (!globalsSection.includes("@import './design-tokens.css'")) {
      issues.push('WARNING: globals.css does not import design-tokens.css');
    }
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

🎯 EXAMPLE-DRIVEN MODERN DESIGN REQUIREMENTS 🎯

You MUST follow these EXACT modern design patterns shown in the examples below.
Do NOT deviate from these patterns - they represent current 2025 professional web design standards.

═══════════════════════════════════════════════════════
1. GRADIENT BACKGROUNDS (MANDATORY)
═══════════════════════════════════════════════════════
${MODERN_DESIGN_EXAMPLES.gradientBackgrounds.examples[0].css}

${MODERN_DESIGN_EXAMPLES.gradientBackgrounds.examples[1].css}

${MODERN_DESIGN_EXAMPLES.gradientBackgrounds.examples[2].css}

USE THESE PATTERNS FOR:
- Hero sections: Animated gradients with overlay
- Feature cards: Subtle gradient backgrounds with glassmorphism
- Buttons: Interactive gradients with hover shine effects

═══════════════════════════════════════════════════════
2. GLASSMORPHISM EFFECTS (MANDATORY)
═══════════════════════════════════════════════════════
${MODERN_DESIGN_EXAMPLES.glassmorphismCards.examples[0].css}

${MODERN_DESIGN_EXAMPLES.glassmorphismCards.examples[1].css}

USE GLASSMORPHISM FOR:
- Feature cards
- Pricing tables
- Navigation overlays
- Modal dialogs
- Floating elements

═══════════════════════════════════════════════════════
3. SMOOTH ANIMATIONS (MANDATORY)
═══════════════════════════════════════════════════════
${MODERN_DESIGN_EXAMPLES.smoothAnimations.examples[0].css}

REQUIRED ANIMATIONS:
✓ Card hover: translateY(-6px) + scale(1.02)
✓ Button press: scale(0.96)
✓ Floating elements: 6s infinite animation
✓ Staggered list items: 0.1s, 0.2s, 0.3s delays
✓ Text reveal: translateY(100%) to 0

═══════════════════════════════════════════════════════
4. MODERN TYPOGRAPHY (MANDATORY)
═══════════════════════════════════════════════════════
${MODERN_DESIGN_EXAMPLES.modernTypography.examples[0].css}

TYPOGRAPHY RULES:
✓ Use Inter for body, Poppins for display
✓ Modular scale: 1.250 ratio (12px → 72px)
✓ Letter spacing: -0.05em to -0.025em for headings
✓ Line height: 1.25 for headings, 1.625 for body
✓ Font weights: 400, 600, 700 only
✓ Gradient text for emphasis

═══════════════════════════════════════════════════════
5. ACCESSIBLE COLORS (MANDATORY - WCAG AAA)
═══════════════════════════════════════════════════════
${MODERN_DESIGN_EXAMPLES.colorContrast.examples[0].css}

COLOR CONTRAST REQUIREMENTS:
✓ Minimum 4.5:1 for normal text (WCAG AA)
✓ Minimum 7.0:1 for body text (WCAG AAA)
✓ Use --neutral-600 minimum for text on light backgrounds
✓ Use white text only on --primary-600 or darker
✓ Status colors: success/warning/error with proper contrast

═══════════════════════════════════════════════════════
6. RESPONSIVE GRIDS (MANDATORY)
═══════════════════════════════════════════════════════
${MODERN_DESIGN_EXAMPLES.responsiveGrids.examples[0].css}

RESPONSIVE PATTERNS:
✓ CSS Grid with auto-fit: minmax(300px, 1fr)
✓ clamp() for fluid spacing: clamp(1.5rem, 4vw, 3rem)
✓ Mobile-first breakpoints: 768px, 1024px
✓ Container max-width: 1200px with fluid padding
✓ Section spacing: clamp(3rem, 8vw, 6rem)

═══════════════════════════════════════════════════════

⚠️⚠️⚠️ CRITICAL RULES ⚠️⚠️⚠️
1. NEVER generate a single HTML file - ALWAYS separate files
2. MUST use the EXACT patterns shown above
3. Apply ALL design patterns: gradients, glassmorphism, animations, typography, accessible colors, responsive grids

FORBIDDEN PATTERNS:
❌ Single standalone HTML file
❌ <style> tags in HTML
❌ <script> code in HTML
❌ Flat solid backgrounds (use gradients)
❌ No hover effects (use scale + translateY)
❌ Default system fonts (use Inter/Poppins)
❌ Poor contrast colors (follow WCAG AAA)
❌ Fixed-width layouts (use clamp() + Grid)
❌ Basic cards (use glassmorphism)
❌ No animations (add smooth transitions)

REQUIRED FILE STRUCTURE:
[PLAN]
{"files":[
  {"path":"index.html","description":"Semantic HTML5 structure with modern markup"},
  {"path":"styles.css","description":"Modern CSS with the EXACT patterns shown above"},
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

MANDATORY: ENFORCE STRICT REACT COMPONENT ARCHITECTURE

CRITICAL RULES:
❌ NO flat component structure
❌ NO components over 200 lines  
❌ NO mixing layout, section, and UI components in same folder
❌ NO hardcoded styles - must use design tokens
❌ NO inline styles or className strings without proper organization

REQUIRED FILE STRUCTURE (EXACTLY AS SHOWN):
[PLAN]
{"files":[
  {"path":"src/App.tsx","description":"Main composition only - no business logic"},
  {"path":"src/components/layout/Navbar.tsx","description":"Navigation component with mobile responsiveness"},
  {"path":"src/components/layout/Footer.tsx","description":"Footer with links and social media"},
  {"path":"src/components/sections/Hero.tsx","description":"Hero section with CTA"},
  {"path":"src/components/sections/Features.tsx","description":"Features showcase grid"},
  {"path":"src/components/sections/Testimonials.tsx","description":"Customer testimonials carousel"},
  {"path":"src/components/sections/CTA.tsx","description":"Call-to-action section"},
  {"path":"src/components/ui/Button.tsx","description":"Reusable button component with variants"},
  {"path":"src/components/ui/Card.tsx","description":"Reusable card component"},
  {"path":"src/components/ui/Badge.tsx","description":"Reusable badge component"},
  {"path":"src/styles/design-tokens.css","description":"Design system variables"},
  {"path":"src/styles/globals.css","description":"Global styles and resets"},
  {"path":"src/lib/utils.ts","description":"Utility functions and helpers"},
  {"path":"src/types/index.ts","description":"TypeScript interfaces and types"},
  {"path":"package.json","description":"Dependencies and scripts"}
]}
[/PLAN]

COMPONENT ARCHITECTURE RULES:

1. APP COMPOSITION (App.tsx):
✅ ONLY imports and composes other components
✅ NO business logic or state management
✅ Maximum 50 lines
✅ Clean component composition only

Example App.tsx structure:
import Navbar from './components/layout/Navbar';
import Hero from './components/sections/Hero';
import Features from './components/sections/Features';
import Testimonials from './components/sections/Testimonials';
import CTA from './components/sections/CTA';
import Footer from './components/layout/Footer';

function App() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

export default App;

2. LAYOUT COMPONENTS (components/layout/):
✅ Handle page structure and navigation
✅ Responsive design with mobile-first approach
✅ Proper semantic HTML (nav, footer, header)
✅ Maximum 150 lines each
✅ Use design tokens for all styling

3. SECTION COMPONENTS (components/sections/):
✅ Self-contained page sections
✅ Import and use UI components
✅ Handle their own local state if needed
✅ Maximum 200 lines each
✅ Use design tokens and UI components

4. UI COMPONENTS (components/ui/):
✅ Reusable, atomic components
✅ Accept props for customization
✅ Include proper TypeScript interfaces
✅ Maximum 100 lines each
✅ Support multiple variants/sizes

COMPONENT REQUIREMENTS:

Button Component MUST include:
- Multiple variants (primary, secondary, outline, ghost)
- Size options (sm, md, lg)
- Loading and disabled states
- Proper TypeScript interface
- Design token usage

Card Component MUST include:
- Different card styles (default, elevated, flat)
- Optional header, body, footer sections
- Responsive design
- Hover effects using design tokens

Badge Component MUST include:
- Color variants (success, warning, error, info)
- Size options (sm, md, lg)
- Icon support
- Proper contrast ratios

TYPESCRIPT REQUIREMENTS:
✅ EVERY component must have proper interface definitions
✅ Props must be typed with interfaces
✅ Export interfaces for reuse
✅ Use generic types where appropriate

Example TypeScript interfaces:
// In src/types/index.ts
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export interface CardProps {
  variant?: 'default' | 'elevated' | 'flat';
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

DESIGN TOKEN USAGE:
✅ ALL components MUST use design tokens from design-tokens.css
✅ NO hardcoded colors, spacing, or typography
✅ Use CSS custom properties: var(--token-name)
✅ Import tokens in each component file

COMPONENT BEST PRACTICES:
✅ Single Responsibility Principle - one purpose per component
✅ Pure functions where possible
✅ Proper error boundaries
✅ Accessible markup with ARIA labels
✅ Semantic HTML elements
✅ Mobile-first responsive design
✅ Proper focus management

FOLDER STRUCTURE ENFORCEMENT:
src/
├── App.tsx                    (Composition only, max 50 lines)
├── components/
│   ├── layout/               (Page structure components)
│   │   ├── Navbar.tsx        (Navigation, max 150 lines)
│   │   └── Footer.tsx        (Footer, max 150 lines)
│   ├── sections/             (Page section components)
│   │   ├── Hero.tsx          (Hero section, max 200 lines)
│   │   ├── Features.tsx      (Features grid, max 200 lines)
│   │   ├── Testimonials.tsx  (Testimonials, max 200 lines)
│   │   └── CTA.tsx           (Call-to-action, max 200 lines)
│   └── ui/                   (Reusable UI components)
│       ├── Button.tsx        (Button variants, max 100 lines)
│       ├── Card.tsx          (Card component, max 100 lines)
│       └── Badge.tsx         (Badge variants, max 100 lines)
├── styles/
│   ├── design-tokens.css     (Design system variables)
│   └── globals.css           (Global styles)
├── lib/
│   └── utils.ts             (Utility functions)
├── types/
│   └── index.ts             (TypeScript interfaces)
└── package.json

PACKAGE.JSON REQUIREMENTS:
Include these essential dependencies:
{
  "name": "generated-react-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.263.1",
    "clsx": "^2.0.0",
    "tailwind-merge": "^1.14.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.14",
    "eslint": "^8.45.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.3",
    "postcss": "^8.4.27",
    "tailwindcss": "^3.3.0",
    "typescript": "^5.0.2",
    "vite": "^4.4.5"
  }
}

MANDATORY design-tokens.css STRUCTURE:
[FILE:src/styles/design-tokens.css]
:root {
  /* === COLORS - Modern Purple/Blue Professional Theme === */
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
  
  --accent-50: #fdf2f8;
  --accent-100: #fce7f3;
  --accent-200: #fbcfe8;
  --accent-300: #f9a8d4;
  --accent-400: #f472b6;
  --accent-500: #ec4899;
  --accent-600: #db2777;
  --accent-700: #be185d;
  
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
  
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  
  --background: var(--neutral-50);
  --surface: var(--neutral-100);
  --text-primary: var(--neutral-900);
  --text-secondary: var(--neutral-700);
  --text-tertiary: var(--neutral-500);
  --border: var(--neutral-200);
  
  /* === SPACING SCALE === */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  
  /* === TYPOGRAPHY === */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  --text-5xl: 3rem;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* === SHADOWS === */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  
  /* === BORDER RADIUS === */
  --radius-sm: 0.125rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: var(--neutral-900);
    --surface: var(--neutral-800);
    --text-primary: var(--neutral-50);
    --text-secondary: var(--neutral-300);
    --text-tertiary: var(--neutral-400);
    --border: var(--neutral-700);
  }
}
[/FILE]

MANDATORY globals.css CONTENT:
[FILE:src/styles/globals.css]
@import './design-tokens.css';

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-family: var(--font-sans);
  line-height: 1.5;
  color: var(--text-primary);
  background-color: var(--background);
}

body {
  min-height: 100vh;
}
[/FILE]

MANDATORY tailwind.config.js:
[FILE:tailwind.config.js]
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--primary-50)',
          100: 'var(--primary-100)',
          200: 'var(--primary-200)',
          300: 'var(--primary-300)',
          400: 'var(--primary-400)',
          500: 'var(--primary-500)',
          600: 'var(--primary-600)',
          700: 'var(--primary-700)',
          800: 'var(--primary-800)',
          900: 'var(--primary-900)',
        },
        accent: {
          50: 'var(--accent-50)',
          100: 'var(--accent-100)',
          200: 'var(--accent-200)',
          300: 'var(--accent-300)',
          400: 'var(--accent-400)',
          500: 'var(--accent-500)',
          600: 'var(--accent-600)',
          700: 'var(--accent-700)',
        },
        neutral: {
          50: 'var(--neutral-50)',
          100: 'var(--neutral-100)',
          200: 'var(--neutral-200)',
          300: 'var(--neutral-300)',
          400: 'var(--neutral-400)',
          500: 'var(--neutral-500)',
          600: 'var(--neutral-600)',
          700: 'var(--neutral-700)',
          800: 'var(--neutral-800)',
          900: 'var(--neutral-900)',
        },
      },
    },
  },
  plugins: [],
}
[/FILE]

MANDATORY src/lib/utils.ts:
[FILE:src/lib/utils.ts]
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
[/FILE]

COMPONENT TEMPLATES (MUST FOLLOW THESE PATTERNS):

[FILE:src/App.tsx]
// App.tsx Template (Max 50 lines - COMPOSITION ONLY)
import Navbar from './components/layout/Navbar';
import Hero from './components/sections/Hero';
import Features from './components/sections/Features';
import Testimonials from './components/sections/Testimonials';
import CTA from './components/sections/CTA';
import Footer from './components/layout/Footer';

function App() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

export default App;
[/FILE]

[FILE:src/components/ui/Button.tsx]
// Button.tsx Template (UI Component - Max 100 lines)
import React from 'react';
import { ButtonProps } from '../../types';
import { cn } from '../../lib/utils';

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  children, 
  className,
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[var(--primary-500)] text-[var(--text-inverse)] hover:bg-[var(--primary-600)] focus:ring-[var(--primary-500)]',
    secondary: 'bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--surface-secondary)]',
    outline: 'border-2 border-[var(--primary-500)] text-[var(--primary-500)] hover:bg-[var(--primary-500)] hover:text-[var(--text-inverse)]',
    ghost: 'text-[var(--primary-500)] hover:bg-[var(--primary-50)]'
  };

  const sizes = {
    sm: 'px-[var(--space-3)] py-[var(--space-1-5)] text-[var(--text-sm)]',
    md: 'px-[var(--space-4)] py-[var(--space-2)] text-[var(--text-base)]',
    lg: 'px-[var(--space-6)] py-[var(--space-3)] text-[var(--text-lg)]'
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
};

export default Button;
[/FILE]

[FILE:src/components/ui/Card.tsx]
// Card.tsx Template (UI Component - Max 100 lines)
import React from 'react';
import { CardProps } from '../../types';
import { cn } from '../../lib/utils';

const Card: React.FC<CardProps> = ({ 
  variant = 'default',
  children, 
  className,
  header,
  footer,
  ...props 
}) => {
  const variants = {
    default: 'bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)]',
    elevated: 'bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)]',
    flat: 'bg-[var(--surface-secondary)] rounded-[var(--radius-lg)]'
  };

  return (
    <div className={cn(variants[variant], className)} {...props}>
      {header && (
        <div className="border-b border-[var(--border)] px-[var(--space-6)] py-[var(--space-4)]">
          {header}
        </div>
      )}
      <div className="p-[var(--space-6)]">
        {children}
      </div>
      {footer && (
        <div className="border-t border-[var(--border)] px-[var(--space-6)] py-[var(--space-4)]">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
[/FILE]

[FILE:src/components/sections/Hero.tsx]
// Hero.tsx Template (Section Component - Max 200 lines)
import React from 'react';
import Button from '../ui/Button';
import { ArrowRight, Play } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--primary-500)] to-[var(--accent-500)] overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-[var(--space-4)] text-center">
        <h1 className="text-[var(--text-5xl)] md:text-[var(--text-6xl)] font-bold text-white mb-[var(--space-6)] leading-tight">
          Build Amazing Products with{' '}
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Modern Technology
          </span>
        </h1>
        
        <p className="text-[var(--text-xl)] text-white/90 mb-[var(--space-8)] max-w-3xl mx-auto leading-relaxed">
          Create beautiful, scalable applications with our cutting-edge platform. 
          Transform your ideas into reality with professional-grade tools.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-[var(--space-4)] justify-center">
          <Button size="lg" className="group">
            Get Started
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
          
          <Button variant="outline" size="lg" className="bg-white/10 backdrop-blur-sm">
            <Play className="mr-2 h-5 w-5" />
            Watch Demo
          </Button>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-white/5 to-transparent rounded-full blur-3xl"></div>
    </section>
  );
};

export default Hero;
[/FILE]

[FILE:src/types/index.ts]
// Types Template - TypeScript Interfaces
import React from 'react';

// Component Props Interfaces
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'flat';
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

// Data Interfaces
export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar: string;
}
[/FILE]

COMPONENT LINE LIMITS (STRICTLY ENFORCED):
- App.tsx: Maximum 50 lines (composition only, no business logic)
- Layout components (Navbar, Footer): Maximum 150 lines each
- Section components (Hero, Features, Testimonials, CTA): Maximum 200 lines each
- UI components (Button, Card, Badge): Maximum 100 lines each
- Types file: No limit (interfaces only)

VALIDATION REQUIREMENTS:
✅ Verify ALL files follow the exact structure above
✅ Check that App.tsx is under 50 lines
✅ Ensure layout components are under 150 lines
✅ Ensure section components are under 200 lines
✅ Ensure UI components are under 100 lines
✅ Verify design tokens are used everywhere
✅ Confirm NO hardcoded colors or spacing
✅ Check TypeScript interfaces are defined in types/index.ts
✅ Verify proper semantic HTML
✅ Confirm proper imports with @ alias
✅ Verify all components have proper TypeScript typing
✅ Check that cn() utility is used for className merging

ARCHITECTURE VALIDATION (AUTOMATIC):
Every React project will be validated for:
✅ Correct folder structure (layout/, sections/, ui/)
✅ Component size limits strictly enforced
✅ Design token usage (no hardcoded values)
✅ TypeScript interfaces exported from types/
✅ Modern React patterns (functional components)
✅ Proper imports and exports
✅ Single Responsibility Principle per component
✅ Reusable UI components with variants

ACCESSIBILITY REQUIREMENTS:
- Proper heading hierarchy
- Alt text for images
- ARIA labels where needed
- Keyboard navigation
- Focus states
- Color contrast ≥4.5:1

RESPONSIVENESS:
- Mobile-first design
- Tailwind breakpoints (sm:, md:, lg:)
- No horizontal scroll
- Touch-friendly targets (44px min)`;
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

DESIGN REQUIREMENTS (CRITICAL):
❌ NEVER use hardcoded Tailwind colors (no purple-600, blue-500, text-white, bg-white)
❌ NEVER use hardcoded spacing (no p-4, m-8)
❌ NEVER use hardcoded shadows or borders

✅ ALWAYS use design token approach with Vue
✅ Use CSS custom properties: style="background: var(--primary-500)"
✅ Use Tailwind with tokens: class="bg-[var(--primary-500)]"
✅ Add smooth transitions (transition-all duration-300 ease-in-out)
✅ Include hover effects (hover:scale-105, hover:shadow-xl)
✅ Use gradient backgrounds with tokens: linear-gradient(var(--primary-600), var(--accent-600))
✅ Add glassmorphism effects
✅ Proper spacing with design tokens
✅ Typography hierarchy using token variables
✅ Add icons using iconify or CDN
✅ Dark mode support with token variants
✅ Responsive design with mobile-first approach
✅ Accessibility features (aria-labels, focus states)

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

EXAMPLE MODERN VUE COMPONENT WITH DESIGN TOKENS:
[FILE:src/components/sections/TheHero.vue]
<script setup lang="ts">
import { ref } from 'vue';
import BaseButton from '@/components/ui/BaseButton.vue';

const showModal = ref(false);
</script>

<template>
  <section 
    class="min-h-screen flex items-center justify-center relative overflow-hidden"
    :style="{
      background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-800) 50%, var(--accent-600) 100%)'
    }"
  >
    <!-- Background decorative elements using design tokens -->
    <div 
      class="absolute blur-3xl rounded-full"
      :style="{
        top: 'var(--space-20)',
        left: 'var(--space-10)',
        width: '18rem',
        height: '18rem',
        backgroundColor: 'var(--primary-300)',
        opacity: 0.2
      }"
    />
    <div 
      class="absolute blur-3xl rounded-full"
      :style="{
        bottom: 'var(--space-20)',
        right: 'var(--space-10)',
        width: '24rem',
        height: '24rem',
        backgroundColor: 'var(--accent-400)',
        opacity: 0.15
      }"
    />
    
    <div 
      class="container mx-auto text-center relative z-10"
      :style="{
        paddingLeft: 'var(--space-4)',
        paddingRight: 'var(--space-4)'
      }"
    >
      <div 
        class="inline-flex items-center backdrop-blur-sm rounded-full border"
        :style="{
          gap: 'var(--space-2)',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          padding: 'var(--space-2) var(--space-4)',
          marginBottom: 'var(--space-8)',
          borderColor: 'rgba(255, 255, 255, 0.25)',
          color: 'var(--text-inverse)'
        }"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span :style="{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }">
          New Feature Available
        </span>
      </div>
      
      <h1 
        class="font-bold leading-tight"
        :style="{
          fontSize: 'clamp(var(--text-3xl), 5vw, var(--text-6xl))',
          marginBottom: 'var(--space-6)',
          color: 'var(--text-inverse)'
        }"
      >
        Build Amazing
        <span 
          class="block"
          :style="{
            backgroundImage: 'linear-gradient(to right, var(--accent-300), var(--primary-300))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }"
        >
          Web Experiences
        </span>
      </h1>
      
      <p 
        class="max-w-3xl mx-auto"
        :style="{
          fontSize: 'clamp(var(--text-lg), 2vw, var(--text-2xl))',
          color: 'var(--text-inverse)',
          opacity: 0.9,
          marginBottom: 'var(--space-12)',
          lineHeight: 'var(--leading-relaxed)'
        }"
      >
        Create stunning, modern websites with our powerful platform. 
        No coding required, just your creativity.
      </p>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <BaseButton variant="primary" size="lg">
          Get Started
          <svg class="ml-2 w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </BaseButton>
        <BaseButton variant="outline" size="lg">
          Learn More
        </BaseButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Use scoped styles sparingly - prefer design tokens */
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

🚨 CRITICAL DESIGN SYSTEM REQUIREMENTS 🚨

MANDATORY FILES (MUST GENERATE ALL):
1. src/styles/design-tokens.css - Complete design system with colors, spacing, typography, shadows
2. src/styles/globals.css - Must import design-tokens.css: @import './design-tokens.css';
3. tailwind.config.js - Must map all design tokens to Tailwind utilities
4. src/lib/utils.ts - Must have cn() function and token utilities

COMPONENT REQUIREMENTS:
- Generate multiple component files (NOT a single App.tsx with everything)
- Split into focused sections: Navbar, Hero, Features, Footer, etc.
- Each component in its own file under src/components/sections/
- Use existing UI components from @/components/ui/*`;
    } else if (codeType === 'vue') {
      enhancedPrompt = `${prompt}

🚨 CRITICAL DESIGN SYSTEM REQUIREMENTS 🚨

MANDATORY FILES (MUST GENERATE ALL):
1. src/styles/design-tokens.css - Complete design system with colors, spacing, typography, shadows
2. src/styles/globals.css - Must import design-tokens.css: @import './design-tokens.css';

COMPONENT REQUIREMENTS:
- Generate multiple .vue component files
- Split into logical components (Navbar, Hero, Features, Footer)
- Each component ≤120 lines
- ALL components MUST use design tokens via Vue :style bindings or class="bg-[var(--primary-500)]"
- ZERO hardcoded Tailwind colors (no purple-600, blue-500, text-white)`;
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
