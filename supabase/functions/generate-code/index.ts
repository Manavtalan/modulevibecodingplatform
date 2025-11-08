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
  codeType?: 'react' | 'vue' | 'javascript' | 'typescript' | 'css';
  framework?: string;
  conversation_id?: string;
  model?: 'gpt-4o-mini';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing required environment variables');
    }
    
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
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

    const { prompt, codeType = 'react', framework, conversation_id, model = 'gpt-4o-mini' } = await req.json() as GenerateCodeRequest;

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
      case 'react':
        systemPrompt = `${baseFormat}

🎯 REACT COMPONENT EXAMPLES - FOLLOW THESE EXACTLY:

═══════════════════════════════════════════════════════
HERO COMPONENT EXAMPLE (Modern Gradient Background):
═══════════════════════════════════════════════════════
\`\`\`tsx
import React from 'react';
import { ArrowRight, Play } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--primary-500)] to-[var(--accent-500)] overflow-hidden">
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-black/20"></div>
      
      {/* Floating background elements with animation */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/3 rounded-full blur-3xl animate-pulse" 
           style={{ animationDelay: '1000ms' }}></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-[var(--space-4)] text-center">
        <h1 className="text-[var(--text-5xl)] md:text-[var(--text-6xl)] font-bold text-white mb-[var(--space-6)] leading-tight animate-fade-in">
          Build Amazing Products with{' '}
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Modern Technology
          </span>
        </h1>
        
        <p className="text-[var(--text-xl)] text-white/90 mb-[var(--space-8)] max-w-3xl mx-auto leading-relaxed"
           style={{ animationDelay: '200ms' }}>
          Create beautiful, scalable applications with our cutting-edge platform. 
          Transform your ideas into reality with professional-grade tools.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-[var(--space-4)] justify-center"
             style={{ animationDelay: '400ms' }}>
          <button className="group bg-gradient-to-r from-[var(--primary-600)] to-[var(--primary-500)] 
                           text-white px-[var(--space-8)] py-[var(--space-4)] rounded-[var(--radius-xl)] 
                           font-semibold text-[var(--text-lg)] transition-all duration-300
                           hover:scale-105 hover:shadow-[0_20px_40px_rgba(99,102,241,0.3)]
                           focus:outline-none focus:ring-4 focus:ring-[var(--primary-500)]/30
                           active:scale-95">
            Get Started
            <ArrowRight className="ml-2 h-5 w-5 inline transition-transform group-hover:translate-x-1" />
          </button>
          
          <button className="group bg-white/10 backdrop-blur-md border border-white/20 
                           text-white px-[var(--space-8)] py-[var(--space-4)] rounded-[var(--radius-xl)]
                           font-semibold text-[var(--text-lg)] transition-all duration-300
                           hover:bg-white/15 hover:scale-105 hover:shadow-[0_20px_40px_rgba(255,255,255,0.1)]
                           focus:outline-none focus:ring-4 focus:ring-white/20 active:scale-95">
            <Play className="mr-2 h-5 w-5 inline" />
            Watch Demo
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
\`\`\`

═══════════════════════════════════════════════════════
GLASSMORPHISM CARD COMPONENT EXAMPLE:
═══════════════════════════════════════════════════════
\`\`\`tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  delay = 0 
}) => {
  return (
    <div 
      className="group relative bg-white/10 backdrop-blur-xl border border-white/20 
                 rounded-[var(--radius-2xl)] p-[var(--space-8)] 
                 transition-all duration-500 hover:bg-white/15 hover:scale-105 
                 hover:shadow-[0_25px_50px_rgba(0,0,0,0.15)] hover:-translate-y-2
                 before:absolute before:inset-0 before:bg-gradient-to-br 
                 before:from-white/10 before:to-transparent before:rounded-[var(--radius-2xl)]
                 before:opacity-0 before:transition-opacity before:duration-500 
                 hover:before:opacity-100"
      style={{ animationDelay: \`\${delay}ms\` }}
    >
      {/* Gradient border glow effect on hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-br from-[var(--primary-500)] to-[var(--accent-500)] 
                      rounded-[var(--radius-2xl)] opacity-0 blur transition-opacity duration-500 
                      group-hover:opacity-30 -z-10"></div>
      
      <div className="relative">
        {/* Icon container with gradient background */}
        <div className="w-16 h-16 bg-gradient-to-br from-[var(--primary-500)] to-[var(--accent-500)] 
                        rounded-[var(--radius-xl)] flex items-center justify-center mb-[var(--space-6)]
                        shadow-[0_8px_32px_rgba(99,102,241,0.3)] transition-all duration-300
                        group-hover:scale-110 group-hover:shadow-[0_12px_40px_rgba(99,102,241,0.4)]">
          <Icon className="w-8 h-8 text-white" strokeWidth={1.5} />
        </div>
        
        <h3 className="text-[var(--text-2xl)] font-semibold text-white mb-[var(--space-4)] 
                       tracking-tight transition-colors duration-300">
          {title}
        </h3>
        
        <p className="text-white/80 leading-relaxed text-[var(--text-base)]
                      transition-colors duration-300 group-hover:text-white/90">
          {description}
        </p>
      </div>
    </div>
  );
};

export default FeatureCard;
\`\`\`

═══════════════════════════════════════════════════════
BUTTON COMPONENT WITH MODERN VARIANTS:
═══════════════════════════════════════════════════════
\`\`\`tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  children,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = \`
    inline-flex items-center justify-center font-semibold rounded-[var(--radius-lg)]
    transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden
    transform-gpu will-change-transform
  \`;

  const variants = {
    primary: \`
      bg-[var(--primary-600)] text-white hover:bg-[var(--primary-700)]
      shadow-[0_4px_12px_rgba(99,102,241,0.3)] hover:shadow-[0_8px_25px_rgba(99,102,241,0.4)]
      focus:ring-[var(--primary-500)]/30 hover:scale-105 active:scale-95
    \`,
    secondary: \`
      bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)]
      hover:bg-[var(--surface-secondary)] hover:border-[var(--border-secondary)]
      shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)]
      focus:ring-[var(--primary-500)]/20 hover:scale-105 active:scale-95
    \`,
    outline: \`
      border-2 border-[var(--primary-500)] text-[var(--primary-500)]
      hover:bg-[var(--primary-500)] hover:text-white
      focus:ring-[var(--primary-500)]/30 hover:scale-105 active:scale-95
      shadow-[0_2px_8px_rgba(99,102,241,0.2)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.3)]
    \`,
    ghost: \`
      text-[var(--primary-500)] hover:bg-[var(--primary-50)]
      focus:ring-[var(--primary-500)]/20 hover:scale-105 active:scale-95
    \`,
    gradient: \`
      bg-gradient-to-r from-[var(--primary-600)] via-[var(--primary-500)] to-[var(--accent-500)]
      text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)] 
      hover:shadow-[0_8px_25px_rgba(99,102,241,0.4)] hover:scale-105 active:scale-95
      focus:ring-[var(--primary-500)]/30
      before:absolute before:inset-0 before:bg-gradient-to-r 
      before:from-white/20 before:to-transparent before:opacity-0 
      before:transition-opacity before:duration-300 hover:before:opacity-100
    \`
  };

  const sizes = {
    sm: 'px-[var(--space-3)] py-[var(--space-1-5)] text-[var(--text-sm)]',
    md: 'px-[var(--space-6)] py-[var(--space-3)] text-[var(--text-base)]',
    lg: 'px-[var(--space-8)] py-[var(--space-4)] text-[var(--text-lg)]'
  };

  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className={\`mr-2 \${iconSize} animate-spin rounded-full border-2 border-current border-t-transparent\`} />
      )}
      
      {Icon && iconPosition === 'left' && !loading && (
        <Icon className={\`mr-2 \${iconSize} transition-transform duration-200 group-hover:scale-110\`} />
      )}
      
      <span className="relative z-10">{children}</span>
      
      {Icon && iconPosition === 'right' && !loading && (
        <Icon className={\`ml-2 \${iconSize} transition-transform duration-200 group-hover:translate-x-1\`} />
      )}
    </button>
  );
};

export default Button;
\`\`\`

═══════════════════════════════════════════════════════

🚨 CRITICAL: COMPLETE APPLICATION GENERATION REQUIREMENTS 🚨

YOU MUST GENERATE A MINIMUM OF 25 FILES FOR EVERY REACT APPLICATION.
INCOMPLETE APPLICATIONS WILL BE REJECTED.

MANDATORY: ENFORCE STRICT REACT COMPONENT ARCHITECTURE

CRITICAL RULES:
❌ NO flat component structure
❌ NO components over 200 lines  
❌ NO mixing layout, section, and UI components in same folder
❌ NO hardcoded styles - must use design tokens EXACTLY as shown above
❌ NO inline styles or className strings without proper organization
❌ MUST use the EXACT component patterns shown in examples above
❌ NO SKIPPING configuration files (package.json, tsconfig.json, etc.)
❌ NO PLACEHOLDER CODE - every file must be complete and production-ready

🎯 FILE GENERATION PRIORITY ORDER:
1. Configuration files FIRST (package.json, tsconfig.json, tailwind.config.js, etc.)
2. Entry points SECOND (index.html, src/main.tsx)
3. Utility files THIRD (src/lib/utils.ts, src/types/index.ts)
4. Styles FOURTH (src/styles/design-tokens.css, src/styles/globals.css)
5. UI components FIFTH (src/components/ui/*.tsx)
6. Layout components SIXTH (src/components/layout/*.tsx)
7. Section components SEVENTH (src/components/sections/*.tsx)
8. App composition EIGHTH (src/App.tsx)
9. Documentation LAST (README.md)

REQUIRED FILE STRUCTURE (YOU MUST GENERATE ALL 25 FILES):
[PLAN]
{"files":[
  {"path":"package.json","description":"Complete dependencies with React 18, TypeScript, Vite, Tailwind CSS, lucide-react"},
  {"path":"tsconfig.json","description":"TypeScript configuration with strict mode and modern settings"},
  {"path":"vite.config.ts","description":"Vite build configuration with React plugin"},
  {"path":"tailwind.config.js","description":"Tailwind CSS configuration with design tokens and custom colors"},
  {"path":"postcss.config.js","description":"PostCSS configuration for Tailwind processing"},
  {"path":".eslintrc.json","description":"ESLint configuration with TypeScript and React rules"},
  {"path":".gitignore","description":"Git ignore file for node_modules, dist, .env, etc."},
  {"path":"index.html","description":"HTML entry point with meta tags, viewport, and favicon"},
  {"path":"README.md","description":"Project documentation with features, installation, and usage"},
  {"path":"src/main.tsx","description":"React entry point with StrictMode and CSS imports"},
  {"path":"src/App.tsx","description":"Main app composition - ONLY component imports and layout"},
  {"path":"src/components/layout/Navbar.tsx","description":"Responsive navigation with mobile menu and logo"},
  {"path":"src/components/layout/Footer.tsx","description":"Footer with links, social media, and copyright"},
  {"path":"src/components/sections/Hero.tsx","description":"Hero section with headline, description, and CTA buttons"},
  {"path":"src/components/sections/Features.tsx","description":"Features showcase in responsive grid with icons"},
  {"path":"src/components/sections/Testimonials.tsx","description":"Customer testimonials with cards and ratings"},
  {"path":"src/components/sections/CTA.tsx","description":"Call-to-action section with gradient background"},
  {"path":"src/components/ui/Button.tsx","description":"Reusable button with variants (primary, secondary, outline, ghost) and sizes"},
  {"path":"src/components/ui/Card.tsx","description":"Reusable card component with header, body, footer sections"},
  {"path":"src/components/ui/Badge.tsx","description":"Badge component with color variants and sizes"},
  {"path":"src/components/ui/Input.tsx","description":"Input component with label, error states, and validation"},
  {"path":"src/styles/design-tokens.css","description":"CSS custom properties for colors, spacing, typography, shadows"},
  {"path":"src/styles/globals.css","description":"Global styles with Tailwind imports and base resets"},
  {"path":"src/lib/utils.ts","description":"Utility functions including cn() for className merging"},
  {"path":"src/types/index.ts","description":"TypeScript interfaces for all components and data structures"},
  {"path":"src/vite-env.d.ts","description":"Vite environment type definitions"}
]}
[/PLAN]

⚠️ ENFORCEMENT: If you generate fewer than 25 files, the application will be considered INCOMPLETE and REJECTED.

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

    // Auto-enhance user prompt to enforce multi-file generation
    let enhancedPrompt = prompt;

    if (codeType === 'react') {
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

    // Use OpenAI GPT-5 Mini for code generation
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const modelUsed = 'gpt-4o-mini';

    console.log('=== Code Generation Request ===');
    console.log('Model:', modelUsed);
    console.log('Code Type:', codeType);
    console.log('Framework:', framework || 'none');
    console.log('Prompt length:', prompt.length);
    console.log('Expected files:', codeType === 'react' ? '25+ files' : 'multiple files');

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 16000, // GPT-4o-mini uses max_tokens parameter
        temperature: 0.7,
        messages: messages,
        stream: true,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', openaiResponse.status, errorText);
      
      // Handle rate limiting
      if (openaiResponse.status === 429) {
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
                
                // OpenAI sends content in delta.content
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  fullResponse += delta;
                  
                  // Send to frontend in simple format
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
                }
                
                // Track token usage if provided
                if (parsed.usage) {
                  inputTokens = parsed.usage.prompt_tokens || 0;
                  outputTokens = parsed.usage.completion_tokens || 0;
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

          // Simplified validation (less strict)
          const qualityCheck = {
            valid: fullResponse.includes('gradient') || fullResponse.includes('backdrop-blur') || fullResponse.includes('transition'),
            suggestions: []
          };
          
          const tokenValidation = {
            valid: true,
            issues: []
          };
          
          // Extract file count from the generated content
          const fileMatches = fullResponse.match(/\[FILE:/g);
          const fileCount = fileMatches ? fileMatches.length : 0;
          
          console.log(`✅ Generation complete: ${fullResponse.length} characters, ${fileCount} files generated`);
          
          if (codeType === 'react' && fileCount < 25) {
            console.warn(`⚠️ WARNING: Expected 26+ files for React, but only ${fileCount} were generated`);
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
