// IMPORTANT: This file is used ONLY as context for the LLM.
// It is NEVER imported by runtime code.
// Contains design tokens and component blueprints for Module's AI code generation.

export const MODERN_DESIGN_EXAMPLES = {
  tokens: {
    colors: {
      // Backgrounds
      background: "bg-slate-950",
      backgroundSoft: "bg-slate-950/95",
      backgroundAlt: "bg-slate-900",
      surface: "bg-slate-900/80",
      surfaceStrong: "bg-slate-900",
      surfaceElevated: "bg-slate-900/90",
      surfaceHover: "hover:bg-slate-900/95",
      
      // Borders
      borderSubtle: "border-white/5",
      borderMedium: "border-white/10",
      borderStrong: "border-white/20",
      borderAccent: "border-indigo-500/30",
      
      // Primary/Accent
      primary: "bg-indigo-500",
      primaryHover: "hover:bg-indigo-400",
      primaryDark: "bg-indigo-600",
      primarySoft: "bg-indigo-500/10",
      primaryText: "text-indigo-300",
      primaryTextBright: "text-indigo-400",
      
      // Text
      textMain: "text-slate-50",
      textMuted: "text-slate-400",
      textSoft: "text-slate-500",
      textVeryMuted: "text-slate-600",
      
      // Status colors
      success: "text-emerald-400",
      successBg: "bg-emerald-500/10",
      warning: "text-amber-400",
      warningBg: "bg-amber-500/10",
      danger: "text-rose-400",
      dangerBg: "bg-rose-500/10",
      
      // Glass effects
      glassLight: "bg-white/5",
      glassMedium: "bg-white/10",
      glassStrong: "bg-white/15",
      glassDark: "bg-black/20",
    },
    
    radii: {
      xs: "rounded",
      sm: "rounded-md",
      md: "rounded-xl",
      lg: "rounded-2xl",
      xl: "rounded-3xl",
      pill: "rounded-full",
    },
    
    shadows: {
      soft: "shadow-[0_18px_45px_rgba(0,0,0,0.45)]",
      card: "shadow-[0_20px_50px_rgba(15,23,42,0.7)]",
      cardHover: "shadow-[0_25px_60px_rgba(15,23,42,0.8)]",
      glow: "shadow-[0_0_60px_rgba(79,70,229,0.45)]",
      glowSoft: "shadow-[0_0_40px_rgba(79,70,229,0.25)]",
      inner: "shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
    },
    
    spacing: {
      sectionY: "py-16 md:py-24",
      sectionYLarge: "py-20 md:py-32",
      sectionYSmall: "py-10 md:py-16",
      gapXs: "gap-2 md:gap-3",
      gapSm: "gap-4 md:gap-6",
      gapMd: "gap-6 md:gap-8",
      gapLg: "gap-10 md:gap-14",
      gapXl: "gap-12 md:gap-20",
    },
    
    layout: {
      container: "max-w-6xl mx-auto px-4 md:px-6",
      containerWide: "max-w-7xl mx-auto px-4 md:px-8",
      containerNarrow: "max-w-4xl mx-auto px-4 md:px-6",
      stackCenter: "flex flex-col items-center",
      stackCenterGap: "flex flex-col items-center gap-6",
      rowCenter: "flex items-center justify-center",
      rowBetween: "flex items-center justify-between",
      gridCols2: "grid md:grid-cols-2 gap-8 md:gap-12",
      gridCols3: "grid md:grid-cols-3 gap-6 md:gap-8",
      gridCols4: "grid md:grid-cols-2 lg:grid-cols-4 gap-6",
    },
    
    typography: {
      h1: "text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight",
      h2: "text-3xl md:text-4xl font-semibold tracking-tight",
      h3: "text-2xl md:text-3xl font-semibold",
      h4: "text-xl md:text-2xl font-semibold",
      h5: "text-lg md:text-xl font-semibold",
      body: "text-sm md:text-base",
      bodyLarge: "text-base md:text-lg",
      bodySmall: "text-xs md:text-sm",
      label: "text-[11px] font-medium uppercase tracking-wide",
      labelLarge: "text-xs md:text-sm font-medium uppercase tracking-wide",
      code: "font-mono text-xs",
      gradientText: "bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent",
    },
    
    effects: {
      blur: "backdrop-blur-md",
      blurStrong: "backdrop-blur-lg",
      blurLight: "backdrop-blur-sm",
      transition: "transition-all duration-300 ease-out",
      transitionSlow: "transition-all duration-500 ease-out",
      transitionFast: "transition-all duration-200 ease-out",
      hoverLift: "hover:translate-y-[-4px]",
      hoverLiftStrong: "hover:translate-y-[-8px]",
      hoverScale: "hover:scale-105",
      hoverScaleSmall: "hover:scale-102",
    },
  },
  
  components: {
    navbar: `
<!-- Modern dark navbar with glassmorphism -->
<nav class="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-white/5">
  <div class="max-w-7xl mx-auto px-4 md:px-8">
    <div class="flex items-center justify-between h-16 md:h-20">
      <!-- Logo -->
      <div class="flex items-center gap-2">
        <div class="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center">
          <span class="text-sm font-bold text-white">M</span>
        </div>
        <span class="text-lg font-semibold text-slate-50">Module</span>
      </div>
      
      <!-- Center nav links - hidden on mobile -->
      <div class="hidden md:flex items-center gap-8">
        <a href="#features" class="text-sm text-slate-400 hover:text-slate-50 transition-colors">Features</a>
        <a href="#pricing" class="text-sm text-slate-400 hover:text-slate-50 transition-colors">Pricing</a>
        <a href="#docs" class="text-sm text-slate-400 hover:text-slate-50 transition-colors">Docs</a>
        <a href="#about" class="text-sm text-slate-400 hover:text-slate-50 transition-colors">About</a>
      </div>
      
      <!-- Right side CTAs -->
      <div class="flex items-center gap-3">
        <button class="hidden md:inline-flex items-center px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-50 transition-colors">
          Sign in
        </button>
        <button class="inline-flex items-center px-4 py-2 rounded-full bg-indigo-500 hover:bg-indigo-400 text-sm font-medium text-white transition-all">
          Get started
        </button>
      </div>
    </div>
  </div>
</nav>
`,

    hero: `
<!-- Hero section with left content + right preview card -->
<section class="pt-24 md:pt-32 pb-16 md:pb-24 bg-slate-950 relative overflow-hidden">
  <!-- Background glow effect -->
  <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[120px] opacity-30"></div>
  
  <div class="max-w-7xl mx-auto px-4 md:px-8 relative">
    <div class="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center gap-12 md:gap-16">
      <!-- Left: Content -->
      <div class="space-y-6 md:space-y-8">
        <!-- Badge -->
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 backdrop-blur-sm">
          <span class="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
          <span class="text-[11px] font-medium text-indigo-200 uppercase tracking-wide">
            AI Vibe Coding Platform
          </span>
        </div>
        
        <!-- Heading -->
        <div class="space-y-4">
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-50 leading-[1.1]">
            Generate beautiful web apps with a single prompt
          </h1>
          <p class="text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed">
            Module turns your ideas into responsive React + Tailwind UIs in seconds. 
            No boilerplate, just instant previews and production-ready code.
          </p>
        </div>
        
        <!-- CTAs -->
        <div class="flex flex-col sm:flex-row gap-3">
          <button class="inline-flex justify-center items-center px-6 py-3 rounded-full bg-indigo-500 hover:bg-indigo-400 text-sm font-medium text-white transition-all shadow-[0_0_40px_rgba(79,70,229,0.25)] hover:shadow-[0_0_60px_rgba(79,70,229,0.45)]">
            Try the live demo
          </button>
          <button class="inline-flex justify-center items-center px-6 py-3 rounded-full bg-transparent border border-white/10 hover:border-white/20 hover:bg-white/5 text-sm font-medium text-slate-50 transition-all backdrop-blur-sm">
            View examples
          </button>
        </div>
        
        <!-- Social proof stats -->
        <div class="flex items-center gap-8 pt-4">
          <div class="flex items-center gap-2">
            <div class="flex -space-x-2">
              <div class="h-8 w-8 rounded-full bg-slate-700 border-2 border-slate-950"></div>
              <div class="h-8 w-8 rounded-full bg-slate-700 border-2 border-slate-950"></div>
              <div class="h-8 w-8 rounded-full bg-slate-700 border-2 border-slate-950"></div>
            </div>
            <span class="text-xs text-slate-400">2,000+ developers</span>
          </div>
          <div class="h-4 w-px bg-white/10"></div>
          <div class="text-xs text-slate-400">
            <span class="text-indigo-400 font-semibold">5.0</span> rating
          </div>
        </div>
      </div>
      
      <!-- Right: Glass preview card -->
      <div class="relative lg:block hidden">
        <div class="relative rounded-2xl bg-slate-900/80 backdrop-blur-lg border border-white/10 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.8)]">
          <!-- Fake window controls -->
          <div class="flex items-center gap-2 mb-4 pb-4 border-b border-white/5">
            <div class="h-3 w-3 rounded-full bg-rose-500/80"></div>
            <div class="h-3 w-3 rounded-full bg-amber-500/80"></div>
            <div class="h-3 w-3 rounded-full bg-emerald-500/80"></div>
          </div>
          
          <!-- Fake code preview -->
          <div class="space-y-3">
            <div class="h-4 bg-slate-800 rounded w-3/4"></div>
            <div class="h-4 bg-slate-800 rounded w-full"></div>
            <div class="h-4 bg-slate-800 rounded w-5/6"></div>
            <div class="h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-lg mt-4"></div>
          </div>
        </div>
        
        <!-- Floating badge accent -->
        <div class="absolute -top-4 -right-4 px-4 py-2 rounded-full bg-indigo-500 text-xs font-medium text-white shadow-[0_0_30px_rgba(79,70,229,0.5)]">
          ✨ Live Preview
        </div>
      </div>
    </div>
  </div>
</section>
`,

    featureGrid: `
<!-- Feature grid with 3 glassmorphism cards -->
<section class="py-16 md:py-24 bg-slate-950 relative">
  <div class="max-w-6xl mx-auto px-4 md:px-6">
    <!-- Section header -->
    <div class="text-center mb-12 md:mb-16 space-y-4">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-medium text-indigo-300 uppercase tracking-wide">
        Features
      </div>
      <h2 class="text-3xl md:text-4xl font-semibold tracking-tight text-slate-50">
        Everything you need to build fast
      </h2>
      <p class="text-base text-slate-400 max-w-2xl mx-auto">
        Module provides powerful tools to generate, preview, and deploy production-ready React applications.
      </p>
    </div>
    
    <!-- Feature cards -->
    <div class="grid md:grid-cols-3 gap-6 md:gap-8">
      <!-- Card 1 -->
      <div class="group relative rounded-2xl bg-slate-900/60 backdrop-blur-lg border border-white/10 hover:border-white/20 p-8 transition-all duration-300 hover:translate-y-[-4px] shadow-[0_20px_50px_rgba(15,23,42,0.7)] hover:shadow-[0_25px_60px_rgba(15,23,42,0.8)]">
        <!-- Icon -->
        <div class="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5">
          <svg class="h-6 w-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        
        <h3 class="text-xl font-semibold text-slate-50 mb-3">
          Lightning Fast Generation
        </h3>
        <p class="text-sm text-slate-400 leading-relaxed">
          Generate complete React components with Tailwind CSS in seconds. From idea to live preview instantly.
        </p>
      </div>
      
      <!-- Card 2 -->
      <div class="group relative rounded-2xl bg-slate-900/60 backdrop-blur-lg border border-white/10 hover:border-white/20 p-8 transition-all duration-300 hover:translate-y-[-4px] shadow-[0_20px_50px_rgba(15,23,42,0.7)] hover:shadow-[0_25px_60px_rgba(15,23,42,0.8)]">
        <div class="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5">
          <svg class="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        
        <h3 class="text-xl font-semibold text-slate-50 mb-3">
          Live Preview
        </h3>
        <p class="text-sm text-slate-400 leading-relaxed">
          See your changes in real-time with hot module reloading. Test across desktop, tablet, and mobile views.
        </p>
      </div>
      
      <!-- Card 3 -->
      <div class="group relative rounded-2xl bg-slate-900/60 backdrop-blur-lg border border-white/10 hover:border-white/20 p-8 transition-all duration-300 hover:translate-y-[-4px] shadow-[0_20px_50px_rgba(15,23,42,0.7)] hover:shadow-[0_25px_60px_rgba(15,23,42,0.8)]">
        <div class="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
          <svg class="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h3 class="text-xl font-semibold text-slate-50 mb-3">
          Production Ready
        </h3>
        <p class="text-sm text-slate-400 leading-relaxed">
          Export clean, optimized code ready for deployment. No vendor lock-in, just standard React + Tailwind.
        </p>
      </div>
    </div>
  </div>
</section>
`,

    pricing: `
<!-- Pricing section with 3 tiers -->
<section class="py-20 md:py-32 bg-slate-950 relative">
  <div class="max-w-7xl mx-auto px-4 md:px-8">
    <!-- Header -->
    <div class="text-center mb-12 md:mb-16 space-y-4">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-medium text-indigo-300 uppercase tracking-wide">
        Pricing
      </div>
      <h2 class="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-50">
        Simple, transparent pricing
      </h2>
      <p class="text-base md:text-lg text-slate-400 max-w-2xl mx-auto">
        Choose the plan that fits your needs. All plans include access to our core features.
      </p>
    </div>
    
    <!-- Pricing cards -->
    <div class="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
      <!-- Starter -->
      <div class="relative rounded-2xl bg-slate-900/60 backdrop-blur-lg border border-white/10 p-8 transition-all duration-300 hover:translate-y-[-4px] shadow-[0_20px_50px_rgba(15,23,42,0.7)]">
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-slate-50 mb-2">Starter</h3>
          <div class="flex items-baseline gap-2">
            <span class="text-4xl font-bold text-slate-50">$0</span>
            <span class="text-sm text-slate-500">/month</span>
          </div>
          <p class="text-sm text-slate-400 mt-2">Perfect for trying out Module</p>
        </div>
        
        <ul class="space-y-3 mb-8">
          <li class="flex items-start gap-3 text-sm text-slate-400">
            <svg class="h-5 w-5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>5 projects</span>
          </li>
          <li class="flex items-start gap-3 text-sm text-slate-400">
            <svg class="h-5 w-5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Basic components</span>
          </li>
          <li class="flex items-start gap-3 text-sm text-slate-400">
            <svg class="h-5 w-5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Community support</span>
          </li>
        </ul>
        
        <button class="w-full py-3 px-4 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/5 text-sm font-medium text-slate-50 transition-all">
          Get started
        </button>
      </div>
      
      <!-- Pro (featured) -->
      <div class="relative rounded-2xl bg-gradient-to-br from-indigo-500/15 to-purple-500/10 backdrop-blur-lg border border-indigo-500/30 p-8 transition-all duration-300 hover:translate-y-[-8px] shadow-[0_0_60px_rgba(79,70,229,0.45)]">
        <!-- Popular badge -->
        <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-500 text-xs font-medium text-white">
          Most Popular
        </div>
        
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-slate-50 mb-2">Pro</h3>
          <div class="flex items-baseline gap-2">
            <span class="text-4xl font-bold text-slate-50">$29</span>
            <span class="text-sm text-slate-500">/month</span>
          </div>
          <p class="text-sm text-slate-400 mt-2">For professional developers</p>
        </div>
        
        <ul class="space-y-3 mb-8">
          <li class="flex items-start gap-3 text-sm text-slate-300">
            <svg class="h-5 w-5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Unlimited projects</span>
          </li>
          <li class="flex items-start gap-3 text-sm text-slate-300">
            <svg class="h-5 w-5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>All components</span>
          </li>
          <li class="flex items-start gap-3 text-sm text-slate-300">
            <svg class="h-5 w-5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Priority support</span>
          </li>
          <li class="flex items-start gap-3 text-sm text-slate-300">
            <svg class="h-5 w-5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Export to GitHub</span>
          </li>
        </ul>
        
        <button class="w-full py-3 px-4 rounded-full bg-indigo-500 hover:bg-indigo-400 text-sm font-medium text-white transition-all shadow-[0_0_30px_rgba(79,70,229,0.4)]">
          Start free trial
        </button>
      </div>
      
      <!-- Enterprise -->
      <div class="relative rounded-2xl bg-slate-900/60 backdrop-blur-lg border border-white/10 p-8 transition-all duration-300 hover:translate-y-[-4px] shadow-[0_20px_50px_rgba(15,23,42,0.7)]">
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-slate-50 mb-2">Enterprise</h3>
          <div class="flex items-baseline gap-2">
            <span class="text-4xl font-bold text-slate-50">Custom</span>
          </div>
          <p class="text-sm text-slate-400 mt-2">For large teams</p>
        </div>
        
        <ul class="space-y-3 mb-8">
          <li class="flex items-start gap-3 text-sm text-slate-400">
            <svg class="h-5 w-5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Everything in Pro</span>
          </li>
          <li class="flex items-start gap-3 text-sm text-slate-400">
            <svg class="h-5 w-5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Dedicated support</span>
          </li>
          <li class="flex items-start gap-3 text-sm text-slate-400">
            <svg class="h-5 w-5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Custom integration</span>
          </li>
          <li class="flex items-start gap-3 text-sm text-slate-400">
            <svg class="h-5 w-5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>SLA guarantee</span>
          </li>
        </ul>
        
        <button class="w-full py-3 px-4 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/5 text-sm font-medium text-slate-50 transition-all">
          Contact sales
        </button>
      </div>
    </div>
  </div>
</section>
`,

    stats: `
<!-- Stats section with 4 key metrics -->
<section class="py-16 md:py-20 bg-slate-950">
  <div class="max-w-6xl mx-auto px-4 md:px-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
      <!-- Stat 1 -->
      <div class="text-center space-y-2">
        <div class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
          5x
        </div>
        <div class="text-xs md:text-sm text-slate-400">
          Faster Development
        </div>
      </div>
      
      <!-- Stat 2 -->
      <div class="text-center space-y-2">
        <div class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
          2K+
        </div>
        <div class="text-xs md:text-sm text-slate-400">
          Active Developers
        </div>
      </div>
      
      <!-- Stat 3 -->
      <div class="text-center space-y-2">
        <div class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
          100K+
        </div>
        <div class="text-xs md:text-sm text-slate-400">
          Components Generated
        </div>
      </div>
      
      <!-- Stat 4 -->
      <div class="text-center space-y-2">
        <div class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
          99.9%
        </div>
        <div class="text-xs md:text-sm text-slate-400">
          Uptime
        </div>
      </div>
    </div>
  </div>
</section>
`,

    testimonial: `
<!-- Testimonial card -->
<section class="py-16 md:py-24 bg-slate-950">
  <div class="max-w-4xl mx-auto px-4 md:px-6">
    <div class="relative rounded-2xl bg-slate-900/60 backdrop-blur-lg border border-white/10 p-8 md:p-12 shadow-[0_20px_50px_rgba(15,23,42,0.7)]">
      <!-- Quote icon -->
      <div class="absolute top-8 left-8 opacity-10">
        <svg class="h-16 w-16 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
      </div>
      
      <!-- Quote text -->
      <div class="relative z-10 space-y-6">
        <p class="text-lg md:text-xl text-slate-300 leading-relaxed italic">
          "Module has completely transformed how we prototype. What used to take days now takes minutes. 
          The quality of generated code is impressive, and the live preview makes iteration seamless."
        </p>
        
        <!-- Author -->
        <div class="flex items-center gap-4 pt-4 border-t border-white/5">
          <div class="h-12 w-12 rounded-full bg-slate-800 border border-white/10"></div>
          <div>
            <div class="text-sm font-semibold text-slate-50">Sarah Chen</div>
            <div class="text-xs text-slate-500">Lead Developer, TechCorp</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
`,

    ctaStrip: `
<!-- Full-width CTA strip -->
<section class="py-16 md:py-20 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-y border-white/5">
  <div class="max-w-4xl mx-auto px-4 md:px-6 text-center space-y-6">
    <h2 class="text-3xl md:text-4xl font-semibold tracking-tight text-slate-50">
      Ready to build your next project?
    </h2>
    <p class="text-base md:text-lg text-slate-400 max-w-2xl mx-auto">
      Join thousands of developers using Module to create beautiful web applications faster than ever.
    </p>
    <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
      <button class="inline-flex items-center px-6 py-3 rounded-full bg-indigo-500 hover:bg-indigo-400 text-sm font-medium text-white transition-all shadow-[0_0_40px_rgba(79,70,229,0.25)] hover:shadow-[0_0_60px_rgba(79,70,229,0.45)]">
        Start building for free
      </button>
      <button class="inline-flex items-center px-6 py-3 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/5 text-sm font-medium text-slate-50 transition-all backdrop-blur-sm">
        View documentation
      </button>
    </div>
  </div>
</section>
`,

    footer: `
<!-- Footer -->
<footer class="py-12 md:py-16 bg-slate-950 border-t border-white/5">
  <div class="max-w-7xl mx-auto px-4 md:px-8">
    <div class="grid md:grid-cols-[1fr_auto_auto_auto] gap-10 md:gap-16 mb-10">
      <!-- Brand -->
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <div class="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <span class="text-sm font-bold text-white">M</span>
          </div>
          <span class="text-lg font-semibold text-slate-50">Module</span>
        </div>
        <p class="text-sm text-slate-500 max-w-xs">
          AI-powered coding platform for building beautiful web applications.
        </p>
      </div>
      
      <!-- Product links -->
      <div>
        <h3 class="text-sm font-semibold text-slate-50 mb-4">Product</h3>
        <ul class="space-y-3">
          <li><a href="#features" class="text-sm text-slate-500 hover:text-slate-300 transition-colors">Features</a></li>
          <li><a href="#pricing" class="text-sm text-slate-500 hover:text-slate-300 transition-colors">Pricing</a></li>
          <li><a href="#docs" class="text-sm text-slate-500 hover:text-slate-300 transition-colors">Documentation</a></li>
          <li><a href="#changelog" class="text-sm text-slate-500 hover:text-slate-300 transition-colors">Changelog</a></li>
        </ul>
      </div>
      
      <!-- Company links -->
      <div>
        <h3 class="text-sm font-semibold text-slate-50 mb-4">Company</h3>
        <ul class="space-y-3">
          <li><a href="#about" class="text-sm text-slate-500 hover:text-slate-300 transition-colors">About</a></li>
          <li><a href="#blog" class="text-sm text-slate-500 hover:text-slate-300 transition-colors">Blog</a></li>
          <li><a href="#careers" class="text-sm text-slate-500 hover:text-slate-300 transition-colors">Careers</a></li>
          <li><a href="#contact" class="text-sm text-slate-500 hover:text-slate-300 transition-colors">Contact</a></li>
        </ul>
      </div>
      
      <!-- Legal links -->
      <div>
        <h3 class="text-sm font-semibold text-slate-50 mb-4">Legal</h3>
        <ul class="space-y-3">
          <li><a href="#privacy" class="text-sm text-slate-500 hover:text-slate-300 transition-colors">Privacy</a></li>
          <li><a href="#terms" class="text-sm text-slate-500 hover:text-slate-300 transition-colors">Terms</a></li>
          <li><a href="#security" class="text-sm text-slate-500 hover:text-slate-300 transition-colors">Security</a></li>
        </ul>
      </div>
    </div>
    
    <!-- Bottom bar -->
    <div class="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-xs text-slate-500">
        © 2025 Module. All rights reserved.
      </p>
      <div class="flex items-center gap-6">
        <a href="#twitter" class="text-slate-500 hover:text-slate-300 transition-colors">
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
          </svg>
        </a>
        <a href="#github" class="text-slate-500 hover:text-slate-300 transition-colors">
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
          </svg>
        </a>
        <a href="#discord" class="text-slate-500 hover:text-slate-300 transition-colors">
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
        </a>
      </div>
    </div>
  </div>
</footer>
`,

    authCard: `
<!-- Auth card (login/register) -->
<section class="min-h-screen flex items-center justify-center bg-slate-950 py-12 px-4">
  <div class="w-full max-w-md">
    <!-- Card -->
    <div class="relative rounded-2xl bg-slate-900/60 backdrop-blur-lg border border-white/10 p-8 shadow-[0_25px_60px_rgba(15,23,42,0.8)]">
      <!-- Logo/Brand -->
      <div class="flex justify-center mb-8">
        <div class="flex items-center gap-2">
          <div class="h-10 w-10 rounded-xl bg-indigo-500 flex items-center justify-center">
            <span class="text-lg font-bold text-white">M</span>
          </div>
          <span class="text-xl font-semibold text-slate-50">Module</span>
        </div>
      </div>
      
      <!-- Heading -->
      <div class="text-center mb-8 space-y-2">
        <h2 class="text-2xl font-semibold text-slate-50">
          Welcome back
        </h2>
        <p class="text-sm text-slate-400">
          Sign in to your account to continue
        </p>
      </div>
      
      <!-- Form -->
      <div class="space-y-4">
        <!-- Email -->
        <div class="space-y-2">
          <label class="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Email
          </label>
          <input 
            type="email" 
            placeholder="you@example.com"
            class="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-white/10 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-50 placeholder:text-slate-600 transition-all outline-none"
          />
        </div>
        
        <!-- Password -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Password
            </label>
            <a href="#forgot" class="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              Forgot password?
            </a>
          </div>
          <input 
            type="password" 
            placeholder="••••••••"
            class="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-white/10 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-50 placeholder:text-slate-600 transition-all outline-none"
          />
        </div>
        
        <!-- Sign in button -->
        <button class="w-full py-3 px-4 rounded-full bg-indigo-500 hover:bg-indigo-400 text-sm font-medium text-white transition-all shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_40px_rgba(79,70,229,0.5)] mt-6">
          Sign in
        </button>
        
        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-white/5"></div>
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-slate-900 px-3 text-slate-500">Or continue with</span>
          </div>
        </div>
        
        <!-- Social login -->
        <div class="grid grid-cols-2 gap-3">
          <button class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-sm text-slate-400 transition-all">
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
            </svg>
            Google
          </button>
          <button class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-sm text-slate-400 transition-all">
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </button>
        </div>
        
        <!-- Sign up link -->
        <p class="text-center text-sm text-slate-500 pt-4">
          Don't have an account?{" "}
          <a href="#signup" class="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Sign up
          </a>
        </p>
      </div>
    </div>
  </div>
</section>
`,
  },
} as const;
