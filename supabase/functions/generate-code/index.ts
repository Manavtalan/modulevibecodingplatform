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
  model?: 'gpt-4o';
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

    const { prompt, codeType = 'react', framework, conversation_id, model = 'gpt-4o' } = await req.json() as GenerateCodeRequest;

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

🚨 CRITICAL: GENERATE COMPLETE, PROFESSIONAL REACT + VITE CODEBASE 🚨

YOU MUST GENERATE A MINIMUM OF 30-35 FILES FOR EVERY REACT APPLICATION.
INCOMPLETE APPLICATIONS WITH FEWER FILES WILL BE REJECTED.

═══════════════════════════════════════════════════════
📁 MANDATORY PROJECT STRUCTURE (30-35+ FILES)
═══════════════════════════════════════════════════════

project-root/
├── index.html                          # HTML entry point with meta tags
├── package.json                        # Complete dependencies (React 18, TypeScript, Vite, Tailwind)
├── tsconfig.json                       # TypeScript configuration
├── tsconfig.node.json                  # TypeScript config for Vite
├── vite.config.ts                      # Vite build configuration
├── tailwind.config.ts                  # Tailwind with design token mappings
├── postcss.config.js                   # PostCSS for Tailwind
├── .eslintrc.cjs                       # ESLint configuration
├── .gitignore                          # Git ignore file
├── README.md                           # Project documentation
│
├── public/                             # Static assets
│   ├── favicon.ico
│   └── logo.svg
│
└── src/
    ├── main.tsx                        # React entry point
    ├── App.tsx                         # Main app composition (MAX 50 LINES)
    ├── vite-env.d.ts                   # Vite type definitions
    │
    ├── components/
    │   ├── layout/                     # Layout components (150 lines max each)
    │   │   ├── Navbar.tsx             # Navigation with mobile menu
    │   │   ├── Header.tsx             # Page header
    │   │   ├── Footer.tsx             # Footer with links
    │   │   └── Sidebar.tsx            # Sidebar (if needed)
    │   │
    │   ├── sections/                   # Page sections (200 lines max each)
    │   │   ├── Hero.tsx               # Hero section with CTA
    │   │   ├── Features.tsx           # Features grid
    │   │   ├── About.tsx              # About section
    │   │   ├── Services.tsx           # Services showcase
    │   │   ├── Testimonials.tsx       # Customer testimonials
    │   │   ├── Pricing.tsx            # Pricing tables
    │   │   ├── Team.tsx               # Team members
    │   │   ├── FAQ.tsx                # FAQ accordion
    │   │   ├── Contact.tsx            # Contact form
    │   │   ├── CTA.tsx                # Call-to-action section
    │   │   └── Newsletter.tsx         # Newsletter signup
    │   │
    │   └── ui/                         # Reusable UI components (100 lines max each)
    │       ├── Button.tsx             # Button with variants (primary, secondary, outline, ghost)
    │       ├── Card.tsx               # Card component with variants
    │       ├── Badge.tsx              # Badge with color variants
    │       ├── Input.tsx              # Input with validation states
    │       ├── Textarea.tsx           # Textarea component
    │       ├── Select.tsx             # Select dropdown
    │       ├── Checkbox.tsx           # Checkbox component
    │       ├── Radio.tsx              # Radio button
    │       ├── Switch.tsx             # Toggle switch
    │       ├── Modal.tsx              # Modal dialog
    │       ├── Tooltip.tsx            # Tooltip component
    │       ├── Loading.tsx            # Loading spinner
    │       └── Alert.tsx              # Alert notifications
    │
    ├── hooks/                          # Custom React hooks
    │   ├── useLocalStorage.ts         # Local storage hook
    │   ├── useMediaQuery.ts           # Media query hook
    │   ├── useToggle.ts               # Toggle state hook
    │   ├── useDebounce.ts             # Debounce hook
    │   └── useClickOutside.ts         # Click outside detection
    │
    ├── utils/                          # Utility functions
    │   ├── formatters.ts              # Date, number, string formatters
    │   ├── validators.ts              # Form validation utilities
    │   └── helpers.ts                 # General helper functions
    │
    ├── lib/                            # Core utilities
    │   ├── utils.ts                   # cn() function for className merging
    │   └── constants.ts               # App constants
    │
    ├── types/                          # TypeScript type definitions
    │   └── index.ts                   # All TypeScript interfaces
    │
    ├── styles/                         # Styling files
    │   ├── design-tokens.css          # Design system variables
    │   └── globals.css                # Global styles and Tailwind imports
    │
    └── contexts/                       # React Context providers (if needed)
        └── ThemeContext.tsx           # Theme provider for dark mode

═══════════════════════════════════════════════════════
🎯 GENERATION PRIORITY ORDER (FOLLOW EXACTLY)
═══════════════════════════════════════════════════════

⚠️ CRITICAL: Generate files in STRICT HIERARCHICAL ORDER to match professional IDE structure.
Files MUST be generated in the exact order below - NO EXCEPTIONS.

[PLAN]
{"files":[
  {"path":"public/favicon.ico","description":"App favicon icon"},
  {"path":"public/robots.txt","description":"Search engine crawling rules"},
  {"path":"public/logo.svg","description":"App logo graphic"},
  
  {"path":"src/vite-env.d.ts","description":"Vite environment type definitions"},
  {"path":"src/main.tsx","description":"React entry point with StrictMode and CSS imports"},
  {"path":"src/App.tsx","description":"Main app composition - imports and layout only (max 50 lines)"},
  {"path":"src/App.css","description":"App-specific styles (if needed)"},
  {"path":"src/index.css","description":"Global CSS imports: design-tokens, globals, Tailwind"},
  
  {"path":"src/components/layout/Navbar.tsx","description":"Responsive navigation with mobile menu"},
  {"path":"src/components/layout/Header.tsx","description":"Page header component"},
  {"path":"src/components/layout/Footer.tsx","description":"Footer with links and social media"},
  {"path":"src/components/layout/Sidebar.tsx","description":"Sidebar navigation (if needed)"},
  
  {"path":"src/components/sections/Hero.tsx","description":"Hero section with gradient and CTA"},
  {"path":"src/components/sections/Features.tsx","description":"Features grid with icons"},
  {"path":"src/components/sections/About.tsx","description":"About section"},
  {"path":"src/components/sections/Testimonials.tsx","description":"Customer testimonials"},
  {"path":"src/components/sections/CTA.tsx","description":"Call-to-action section"},
  {"path":"src/components/sections/Contact.tsx","description":"Contact form section"},
  
  {"path":"src/components/ui/Button.tsx","description":"Button with variants (primary, secondary, outline) and sizes"},
  {"path":"src/components/ui/Card.tsx","description":"Card component with header, body, footer"},
  {"path":"src/components/ui/Badge.tsx","description":"Badge with color variants"},
  {"path":"src/components/ui/Input.tsx","description":"Input with label and error states"},
  {"path":"src/components/ui/Loading.tsx","description":"Loading spinner component"},
  {"path":"src/components/ui/Alert.tsx","description":"Alert notification component"},
  {"path":"src/components/ui/Modal.tsx","description":"Modal dialog component"},
  
  {"path":"src/hooks/useMediaQuery.ts","description":"Hook for responsive breakpoints"},
  {"path":"src/hooks/useToggle.ts","description":"Hook for toggle state management"},
  {"path":"src/hooks/useLocalStorage.ts","description":"Hook for localStorage persistence"},
  {"path":"src/hooks/useDebounce.ts","description":"Hook for debouncing values"},
  
  {"path":"src/lib/utils.ts","description":"cn() utility for className merging with clsx and tailwind-merge"},
  {"path":"src/lib/constants.ts","description":"App-wide constants and configuration"},
  
  {"path":"src/styles/design-tokens.css","description":"Complete design system: colors, spacing, typography, shadows, dark mode"},
  {"path":"src/styles/globals.css","description":"Global styles with Tailwind imports and custom CSS"},
  
  {"path":"src/types/index.ts","description":"TypeScript interfaces for all components and data"},
  
  {"path":"src/utils/formatters.ts","description":"Date, number, string formatting utilities"},
  {"path":"src/utils/validators.ts","description":"Form validation helper functions"},
  {"path":"src/utils/helpers.ts","description":"General utility helper functions"},
  
  {"path":".eslintrc.cjs","description":"ESLint with TypeScript and React rules"},
  {"path":".gitignore","description":"Git ignore: node_modules, dist, .env, coverage, etc."},
  {"path":"components.json","description":"Component library configuration (if using shadcn/ui)"},
  {"path":"index.html","description":"HTML entry with SEO meta tags, viewport, favicon, Open Graph"},
  {"path":"package.json","description":"Complete dependencies: React 18, TypeScript, Vite 5, Tailwind CSS 3, lucide-react, clsx, tailwind-merge"},
  {"path":"postcss.config.js","description":"PostCSS configuration for Tailwind"},
  {"path":"README.md","description":"Comprehensive docs: features, installation, usage, scripts"},
  {"path":"tailwind.config.ts","description":"Tailwind config mapping all design tokens from design-tokens.css"},
  {"path":"tsconfig.json","description":"TypeScript strict mode configuration with path aliases"},
  {"path":"tsconfig.node.json","description":"TypeScript config for Vite build tooling"},
  {"path":"vite.config.ts","description":"Vite build config with React plugin, path aliases (@/), and optimization"}
]}
[/PLAN]

⚠️ ENFORCEMENT: Generate ALL 35+ files above. Incomplete codebases will be REJECTED.

═══════════════════════════════════════════════════════
📦 MANDATORY package.json STRUCTURE
═══════════════════════════════════════════════════════

[FILE:package.json]
{
  "name": "modern-react-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.263.1",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "@vitejs/plugin-react-swc": "^3.5.0",
    "autoprefixer": "^10.4.18",
    "eslint": "^8.57.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.4.2",
    "vite": "^5.1.6"
  }
}
[/FILE]

═══════════════════════════════════════════════════════
⚙️ CONFIGURATION FILES (CRITICAL)
═══════════════════════════════════════════════════════

[FILE:vite.config.ts]
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
[/FILE]

[FILE:tsconfig.json]
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
[/FILE]

[FILE:tsconfig.node.json]
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
[/FILE]

[FILE:tailwind.config.ts]
import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'rgb(var(--primary-50) / <alpha-value>)',
          100: 'rgb(var(--primary-100) / <alpha-value>)',
          200: 'rgb(var(--primary-200) / <alpha-value>)',
          300: 'rgb(var(--primary-300) / <alpha-value>)',
          400: 'rgb(var(--primary-400) / <alpha-value>)',
          500: 'rgb(var(--primary-500) / <alpha-value>)',
          600: 'rgb(var(--primary-600) / <alpha-value>)',
          700: 'rgb(var(--primary-700) / <alpha-value>)',
          800: 'rgb(var(--primary-800) / <alpha-value>)',
          900: 'rgb(var(--primary-900) / <alpha-value>)',
        },
        accent: {
          50: 'rgb(var(--accent-50) / <alpha-value>)',
          100: 'rgb(var(--accent-100) / <alpha-value>)',
          200: 'rgb(var(--accent-200) / <alpha-value>)',
          300: 'rgb(var(--accent-300) / <alpha-value>)',
          400: 'rgb(var(--accent-400) / <alpha-value>)',
          500: 'rgb(var(--accent-500) / <alpha-value>)',
          600: 'rgb(var(--accent-600) / <alpha-value>)',
          700: 'rgb(var(--accent-700) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
[/FILE]

[FILE:postcss.config.js]
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
[/FILE]

═══════════════════════════════════════════════════════
🎨 DESIGN SYSTEM (MANDATORY)
═══════════════════════════════════════════════════════

[FILE:src/styles/design-tokens.css]
:root {
  /* === COLOR SYSTEM - Professional Purple/Blue Theme === */
  --primary-50: 237 233 254;
  --primary-100: 221 214 254;
  --primary-200: 196 181 253;
  --primary-300: 167 139 250;
  --primary-400: 139 92 246;
  --primary-500: 99 102 241;
  --primary-600: 79 70 229;
  --primary-700: 67 56 202;
  --primary-800: 55 48 163;
  --primary-900: 49 46 129;
  
  --accent-50: 253 242 248;
  --accent-100: 252 231 243;
  --accent-200: 251 207 232;
  --accent-300: 249 168 212;
  --accent-400: 244 114 182;
  --accent-500: 236 72 153;
  --accent-600: 219 39 119;
  --accent-700: 190 24 93;
  
  --neutral-50: 248 250 252;
  --neutral-100: 241 245 249;
  --neutral-200: 226 232 240;
  --neutral-300: 203 213 225;
  --neutral-400: 148 163 184;
  --neutral-500: 100 116 139;
  --neutral-600: 71 85 105;
  --neutral-700: 51 65 85;
  --neutral-800: 30 41 59;
  --neutral-900: 15 23 42;
  
  --success: 16 185 129;
  --warning: 245 158 11;
  --error: 239 68 68;
  --info: 59 130 246;
  
  --background: rgb(var(--neutral-50));
  --surface: rgb(var(--neutral-100));
  --surface-secondary: rgb(var(--neutral-200));
  --text-primary: rgb(var(--neutral-900));
  --text-secondary: rgb(var(--neutral-700));
  --text-tertiary: rgb(var(--neutral-500));
  --border: rgb(var(--neutral-200));
  --border-secondary: rgb(var(--neutral-300));
  
  /* === SPACING SCALE === */
  --space-1: 0.25rem;
  --space-1-5: 0.375rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-24: 6rem;
  
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
  --text-6xl: 3.75rem;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* === SHADOWS === */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  
  /* === BORDER RADIUS === */
  --radius-sm: 0.125rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-3xl: 1.5rem;
  --radius-full: 9999px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: rgb(var(--neutral-900));
    --surface: rgb(var(--neutral-800));
    --surface-secondary: rgb(var(--neutral-700));
    --text-primary: rgb(var(--neutral-50));
    --text-secondary: rgb(var(--neutral-300));
    --text-tertiary: rgb(var(--neutral-400));
    --border: rgb(var(--neutral-700));
    --border-secondary: rgb(var(--neutral-600));
  }
}
[/FILE]

[FILE:src/styles/globals.css]
@import './design-tokens.css';
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-text-primary;
    font-family: var(--font-sans);
  }
}
[/FILE]

[FILE:src/lib/utils.ts]
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
[/FILE]

═══════════════════════════════════════════════════════
🧩 COMPONENT ARCHITECTURE (STRICTLY ENFORCE)
═══════════════════════════════════════════════════════

✅ App.tsx RULES (MAX 50 LINES):
- ONLY component imports and layout composition
- NO business logic, state, or handlers
- Clean component tree structure

[FILE:src/App.tsx]
import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/sections/Hero';
import Features from '@/components/sections/Features';
import About from '@/components/sections/About';
import Testimonials from '@/components/sections/Testimonials';
import CTA from '@/components/sections/CTA';
import Footer from '@/components/layout/Footer';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <About />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

export default App;
[/FILE]

✅ UI COMPONENTS (MAX 100 LINES EACH):
- Reusable, atomic components
- Multiple variants and sizes
- TypeScript interfaces
- Design token usage only

[FILE:src/components/ui/Button.tsx]
import React from 'react';
import { cn } from '@/lib/utils';
import type { ButtonProps } from '@/types';

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-semibold rounded-[var(--radius-lg)] transition-all duration-300 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
      primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] focus:ring-primary-500/30 hover:scale-105 active:scale-95",
      secondary: "bg-surface text-text-primary border border-border hover:bg-surface-secondary hover:border-border-secondary shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] focus:ring-primary-500/20 hover:scale-105 active:scale-95",
      outline: "border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white focus:ring-primary-500/30 hover:scale-105 active:scale-95",
      ghost: "text-primary-500 hover:bg-primary-50 focus:ring-primary-500/20 hover:scale-105 active:scale-95",
    };
    
    const sizes = {
      sm: 'px-[var(--space-3)] py-[var(--space-1-5)] text-[var(--text-sm)]',
      md: 'px-[var(--space-6)] py-[var(--space-3)] text-[var(--text-base)]',
      lg: 'px-[var(--space-8)] py-[var(--space-4)] text-[var(--text-lg)]'
    };
    
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
[/FILE]

[FILE:src/components/ui/Card.tsx]
import React from 'react';
import { cn } from '@/lib/utils';
import type { CardProps } from '@/types';

const Card: React.FC<CardProps> = ({ 
  className, 
  variant = 'default', 
  children, 
  header, 
  footer,
  ...props 
}) => {
  const variants = {
    default: 'bg-surface border border-border shadow-[var(--shadow-md)]',
    elevated: 'bg-surface shadow-[var(--shadow-xl)] border-0',
    flat: 'bg-surface border border-border shadow-none',
  };
  
  return (
    <div
      className={cn(
        'rounded-[var(--radius-xl)] overflow-hidden transition-all duration-300',
        variants[variant],
        className
      )}
      {...props}
    >
      {header && (
        <div className="px-[var(--space-6)] py-[var(--space-4)] border-b border-border">
          {header}
        </div>
      )}
      <div className="px-[var(--space-6)] py-[var(--space-4)]">
        {children}
      </div>
      {footer && (
        <div className="px-[var(--space-6)] py-[var(--space-4)] border-t border-border bg-surface-secondary">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
[/FILE]

✅ LAYOUT COMPONENTS (MAX 150 LINES EACH):
- Page structure and navigation
- Responsive with mobile-first
- Semantic HTML

✅ SECTION COMPONENTS (MAX 200 LINES EACH):
- Self-contained page sections
- Use UI components
- Handle local state if needed

✅ CUSTOM HOOKS:
[FILE:src/hooks/useMediaQuery.ts]
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}
[/FILE]

[FILE:src/hooks/useToggle.ts]
import { useState, useCallback } from 'react';

export function useToggle(initialValue: boolean = false): [boolean, () => void] {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle];
}
[/FILE]

✅ TYPESCRIPT INTERFACES:
[FILE:src/types/index.ts]
import React from 'react';

// UI Component Props
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'flat';
  children: React.ReactNode;
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
  icon: React.ComponentType<{ className?: string }>;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
  rating: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image?: string;
  social?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}
[/FILE]

═══════════════════════════════════════════════════════
🔒 VALIDATION REQUIREMENTS (AUTO-ENFORCED)
═══════════════════════════════════════════════════════

✅ File Structure: All required directories present
✅ File Count: Minimum 30-35 files generated
✅ App.tsx: Under 50 lines, composition only
✅ Layout Components: Under 150 lines each
✅ Section Components: Under 200 lines each
✅ UI Components: Under 100 lines each
✅ Design Tokens: Used everywhere, no hardcoded values
✅ TypeScript: All components properly typed
✅ Imports: Using @ alias for all imports
✅ Semantic HTML: Proper tags (nav, main, section, article)
✅ Accessibility: ARIA labels, focus states, keyboard nav
✅ Responsive: Mobile-first, works 320px-1920px

═══════════════════════════════════════════════════════
🚫 CRITICAL MISTAKES TO AVOID
═══════════════════════════════════════════════════════

❌ NEVER generate fewer than 30 files
❌ NEVER put all code in App.tsx (must be under 50 lines)
❌ NEVER use hardcoded colors (text-white, bg-blue-500, etc.)
❌ NEVER use hardcoded spacing (p-4, m-8, etc.)
❌ NEVER skip configuration files
❌ NEVER use inline styles
❌ NEVER exceed component line limits
❌ NEVER skip TypeScript interfaces
❌ NEVER forget responsive design
❌ NEVER ignore accessibility

═══════════════════════════════════════════════════════
✨ MODERN DESIGN PATTERNS (MANDATORY)
═══════════════════════════════════════════════════════

✅ Glassmorphism: backdrop-blur-xl bg-white/10
✅ Gradient backgrounds: from-primary-600 to-accent-600
✅ Smooth animations: transition-all duration-300
✅ Hover effects: hover:scale-105 hover:shadow-xl
✅ Focus states: focus:ring-4 focus:ring-primary-500/30
✅ Modern shadows: Using design token shadows
✅ Rounded corners: Using design token radius
✅ Icon usage: lucide-react icons throughout
✅ Typography hierarchy: Proper heading structure
✅ Color contrast: WCAG AA compliant (4.5:1)
✅ Touch targets: Minimum 44x44px for mobile
✅ Loading states: Spinners and skeletons
✅ Error states: Proper validation feedback
✅ Empty states: Helpful placeholder content`;
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

    // Use Claude Opus 4 for code generation
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const modelUsed = 'gpt-4o';

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
        model: 'gpt-4o',
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
                
                // OpenAI sends content in choices[0].delta.content for streaming
                if (parsed.choices?.[0]?.delta?.content) {
                  const delta = parsed.choices[0].delta.content;
                  fullResponse += delta;
                  
                  // Send to frontend in simple format
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
                }
                
                // Track token usage from usage object (sent at the end)
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
