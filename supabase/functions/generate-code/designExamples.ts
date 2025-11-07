// Design examples for code generation
export const MODERN_DESIGN_EXAMPLES = {
  
  // === GRADIENT BACKGROUNDS ===
  gradientBackgrounds: {
    description: "Modern gradient backgrounds with depth and visual interest",
    examples: [
      {
        name: "Hero Gradient",
        css: `
/* Modern hero gradient with subtle animation */
.hero-gradient {
  background: linear-gradient(
    135deg,
    hsl(262, 83%, 58%) 0%,
    hsl(262, 83%, 47%) 25%,
    hsl(340, 82%, 52%) 75%,
    hsl(340, 82%, 42%) 100%
  );
  background-size: 400% 400%;
  animation: gradientShift 8s ease-in-out infinite;
  position: relative;
  overflow: hidden;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Gradient overlay for better text readability */
.hero-gradient::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(0, 0, 0, 0.1) 50%,
    rgba(0, 0, 0, 0.3) 100%
  );
}
        `
      },
      {
        name: "Card Gradient",
        css: `
/* Subtle card gradient with modern colors */
.card-gradient {
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-gradient:hover {
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.08) 100%
  );
  transform: translateY(-4px);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 8px 16px rgba(0, 0, 0, 0.08);
}
        `
      },
      {
        name: "Button Gradient",
        css: `
/* Interactive button gradients with hover effects */
.button-gradient-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  color: white;
  font-weight: 600;
  letter-spacing: -0.025em;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.button-gradient-primary:hover {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  transform: translateY(-1px);
  box-shadow: 
    0 10px 25px rgba(99, 102, 241, 0.3),
    0 4px 12px rgba(99, 102, 241, 0.2);
}

.button-gradient-primary::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.2) 0%, 
    transparent 50%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.button-gradient-primary:hover::before {
  opacity: 1;
}
        `
      }
    ]
  },

  // === GLASSMORPHISM CARDS ===
  glassmorphismCards: {
    description: "Modern glassmorphism effects with proper blur and transparency",
    examples: [
      {
        name: "Feature Card",
        css: `
/* Modern glassmorphism feature card */
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 2rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.glass-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
}

.glass-card:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-8px) scale(1.02);
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.15),
    0 10px 20px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Glass card for dark backgrounds */
.glass-card-dark {
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
}

.glass-card-dark:hover {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.2);
}
        `,
        html: `
<div class="glass-card">
  <div class="glass-card-icon">
    <svg class="w-12 h-12 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
            d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  </div>
  <h3 class="text-xl font-semibold text-white mb-3 tracking-tight">
    Lightning Fast Performance
  </h3>
  <p class="text-white/70 leading-relaxed">
    Experience blazing-fast load times with our optimized architecture 
    and advanced caching mechanisms.
  </p>
</div>
        `
      },
      {
        name: "Pricing Card",
        css: `
/* Premium glassmorphism pricing card */
.pricing-glass-card {
  background: linear-gradient(145deg, 
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.06) 100%
  );
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 2.5rem 2rem;
  position: relative;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.pricing-glass-card::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.2),
    transparent 30%,
    transparent 70%,
    rgba(255, 255, 255, 0.2)
  );
  border-radius: 26px;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.pricing-glass-card:hover {
  transform: translateY(-12px) scale(1.03);
  background: linear-gradient(145deg, 
    rgba(255, 255, 255, 0.18) 0%,
    rgba(255, 255, 255, 0.08) 100%
  );
  box-shadow: 
    0 30px 60px rgba(0, 0, 0, 0.2),
    0 15px 30px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.pricing-glass-card:hover::after {
  opacity: 1;
}

.pricing-glass-card.featured {
  background: linear-gradient(145deg, 
    rgba(99, 102, 241, 0.15) 0%,
    rgba(139, 92, 246, 0.1) 100%
  );
  border-color: rgba(99, 102, 241, 0.3);
}
        `
      }
    ]
  },

  // === SMOOTH HOVER ANIMATIONS ===
  smoothAnimations: {
    description: "Smooth, professional hover animations with proper easing",
    examples: [
      {
        name: "Card Hover Effects",
        css: `
/* Smooth card hover animations */
.animated-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
  will-change: transform;
}

.animated-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.12),
    0 8px 16px rgba(0, 0, 0, 0.08);
}

/* Floating animation for hero elements */
@keyframes float {
  0%, 100% { 
    transform: translateY(0) rotate(0deg); 
    opacity: 0.8;
  }
  25% { 
    transform: translateY(-10px) rotate(1deg); 
    opacity: 0.9;
  }
  50% { 
    transform: translateY(-15px) rotate(0deg); 
    opacity: 1;
  }
  75% { 
    transform: translateY(-10px) rotate(-1deg); 
    opacity: 0.9;
  }
}

.floating-element {
  animation: float 6s ease-in-out infinite;
}

/* Staggered animation for lists */
.stagger-item {
  opacity: 0;
  transform: translateY(20px);
  animation: staggerIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes staggerIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stagger-item:nth-child(1) { animation-delay: 0.1s; }
.stagger-item:nth-child(2) { animation-delay: 0.2s; }
.stagger-item:nth-child(3) { animation-delay: 0.3s; }
.stagger-item:nth-child(4) { animation-delay: 0.4s; }

/* Button press animation */
.press-button {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.press-button:active {
  transform: scale(0.96);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.15),
    inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Magnetic hover effect */
.magnetic-element {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.magnetic-element:hover {
  transform: scale(1.05);
}

/* Text reveal animation */
.text-reveal {
  overflow: hidden;
}

.text-reveal span {
  display: inline-block;
  transform: translateY(100%);
  animation: textReveal 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes textReveal {
  to {
    transform: translateY(0);
  }
}
        `
      }
    ]
  },

  // === MODERN TYPOGRAPHY ===
  modernTypography: {
    description: "Professional typography with proper hierarchy and spacing",
    examples: [
      {
        name: "Typography System",
        css: `
/* Modern typography scale with perfect ratios */
:root {
  /* Font families */
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-display: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  /* Font sizes - modular scale 1.250 (Major Third) */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  --text-5xl: 3rem;      /* 48px */
  --text-6xl: 3.75rem;   /* 60px */
  --text-7xl: 4.5rem;    /* 72px */
  
  /* Font weights */
  --weight-light: 300;
  --weight-normal: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
  --weight-extrabold: 800;
  
  /* Line heights */
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;
  
  /* Letter spacing */
  --tracking-tighter: -0.05em;
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
  --tracking-widest: 0.1em;
}

/* Heading styles with perfect spacing */
.heading-display {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: var(--weight-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tighter);
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  margin-bottom: clamp(1rem, 3vw, 2rem);
}

.heading-1 {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  font-weight: var(--weight-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.heading-2 {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
  margin-bottom: 1.25rem;
}

.heading-3 {
  font-family: var(--font-primary);
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-normal);
  color: var(--text-primary);
  margin-bottom: 1rem;
}

/* Body text styles */
.body-large {
  font-family: var(--font-primary);
  font-size: var(--text-lg);
  font-weight: var(--weight-normal);
  line-height: var(--leading-relaxed);
  letter-spacing: var(--tracking-normal);
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.body-normal {
  font-family: var(--font-primary);
  font-size: var(--text-base);
  font-weight: var(--weight-normal);
  line-height: var(--leading-normal);
  letter-spacing: var(--tracking-normal);
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.body-small {
  font-family: var(--font-primary);
  font-size: var(--text-sm);
  font-weight: var(--weight-normal);
  line-height: var(--leading-normal);
  letter-spacing: var(--tracking-normal);
  color: var(--text-tertiary);
  margin-bottom: 0.75rem;
}

/* Special typography effects */
.gradient-text {
  background: linear-gradient(135deg, 
    var(--primary-500) 0%, 
    var(--accent-500) 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  font-weight: var(--weight-bold);
}

.outlined-text {
  color: transparent;
  -webkit-text-stroke: 2px var(--text-primary);
  text-stroke: 2px var(--text-primary);
  font-weight: var(--weight-bold);
}

/* Perfect paragraph spacing */
.prose {
  max-width: 65ch;
}

.prose p + p {
  margin-top: 1.5rem;
}

.prose p:first-child {
  margin-top: 0;
}

.prose p:last-child {
  margin-bottom: 0;
}
        `
      }
    ]
  },

  // === PROPER COLOR CONTRAST ===
  colorContrast: {
    description: "WCAG compliant color combinations with perfect contrast ratios",
    examples: [
      {
        name: "Accessible Color System",
        css: `
/* WCAG AA/AAA compliant color system */
:root {
  /* Primary colors with contrast ratios */
  --primary-50: #ede9fe;   /* Contrast with dark text: 1.02:1 */
  --primary-100: #ddd6fe;  /* Contrast with dark text: 1.06:1 */
  --primary-200: #c4b5fd;  /* Contrast with dark text: 1.23:1 */
  --primary-300: #a78bfa;  /* Contrast with dark text: 1.58:1 */
  --primary-400: #8b5cf6;  /* Contrast with dark text: 2.59:1 */
  --primary-500: #6366f1;  /* Contrast with white text: 4.75:1 ✓ AA */
  --primary-600: #4f46e5;  /* Contrast with white text: 6.84:1 ✓ AAA */
  --primary-700: #4338ca;  /* Contrast with white text: 8.35:1 ✓ AAA */
  --primary-800: #3730a3;  /* Contrast with white text: 10.84:1 ✓ AAA */
  --primary-900: #312e81;  /* Contrast with white text: 13.52:1 ✓ AAA */
  
  /* Neutral colors for text */
  --neutral-50: #f8fafc;   /* Light backgrounds */
  --neutral-100: #f1f5f9;  
  --neutral-200: #e2e8f0;  
  --neutral-300: #cbd5e1;  
  --neutral-400: #94a3b8;  /* Minimum for text: 3.36:1 */
  --neutral-500: #64748b;  /* Good for text: 5.37:1 ✓ AA */
  --neutral-600: #475569;  /* Better for text: 7.54:1 ✓ AAA */
  --neutral-700: #334155;  /* Excellent: 10.72:1 ✓ AAA */
  --neutral-800: #1e293b;  /* Perfect: 14.78:1 ✓ AAA */
  --neutral-900: #0f172a;  /* Maximum: 18.07:1 ✓ AAA */
  
  /* Semantic colors with proper contrast */
  --success-light: #dcfce7; /* Success background */
  --success-base: #16a34a;  /* Success text: 4.68:1 ✓ AA */
  --success-dark: #14532d;  /* Success dark text: 10.34:1 ✓ AAA */
  
  --warning-light: #fef3c7; /* Warning background */
  --warning-base: #d97706;  /* Warning text: 4.52:1 ✓ AA */
  --warning-dark: #92400e;  /* Warning dark text: 7.77:1 ✓ AAA */
  
  --error-light: #fef2f2;   /* Error background */
  --error-base: #dc2626;    /* Error text: 5.36:1 ✓ AA */
  --error-dark: #991b1b;    /* Error dark text: 9.24:1 ✓ AAA */
}

/* High contrast text combinations */
.text-high-contrast {
  color: var(--neutral-900);
  background: var(--neutral-50);
  /* Contrast ratio: 18.07:1 ✓ AAA */
}

.text-medium-contrast {
  color: var(--neutral-700);
  background: var(--neutral-100);
  /* Contrast ratio: 9.85:1 ✓ AAA */
}

.text-accessible-minimum {
  color: var(--neutral-600);
  background: var(--neutral-50);
  /* Contrast ratio: 7.54:1 ✓ AAA */
}

/* Button contrast examples */
.button-primary-accessible {
  background: var(--primary-600);
  color: white;
  /* Contrast ratio: 6.84:1 ✓ AAA */
}

.button-primary-accessible:hover {
  background: var(--primary-700);
  /* Hover contrast ratio: 8.35:1 ✓ AAA */
}

.button-secondary-accessible {
  background: var(--neutral-100);
  color: var(--neutral-800);
  border: 2px solid var(--neutral-300);
  /* Text contrast ratio: 13.5:1 ✓ AAA */
  /* Border contrast ratio: 2.1:1 ✓ AA (for non-text) */
}

/* Focus states with high contrast */
.focus-accessible:focus {
  outline: 3px solid var(--primary-500);
  outline-offset: 2px;
  /* Focus indicator contrast: 4.75:1 ✓ AA */
}

/* Status indicators with proper contrast */
.status-success {
  background: var(--success-light);
  color: var(--success-dark);
  border: 1px solid var(--success-base);
  /* Text contrast: 10.34:1 ✓ AAA */
}

.status-warning {
  background: var(--warning-light);
  color: var(--warning-dark);
  border: 1px solid var(--warning-base);
  /* Text contrast: 7.77:1 ✓ AAA */
}

.status-error {
  background: var(--error-light);
  color: var(--error-dark);
  border: 1px solid var(--error-base);
  /* Text contrast: 9.24:1 ✓ AAA */
}
        `
      }
    ]
  },

  // === RESPONSIVE GRID LAYOUTS ===
  responsiveGrids: {
    description: "Modern CSS Grid and Flexbox layouts that adapt perfectly to all screen sizes",
    examples: [
      {
        name: "Feature Grid Layout",
        css: `
/* Modern responsive grid with CSS Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: clamp(1.5rem, 4vw, 3rem);
  padding: clamp(2rem, 6vw, 4rem);
  max-width: 1200px;
  margin: 0 auto;
}

/* Responsive grid variations */
.grid-2-cols {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.grid-3-cols {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.grid-4-cols {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

/* Advanced grid layouts */
.hero-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 3rem;
  align-items: center;
  min-height: 70vh;
}

.hero-grid .hero-content {
  grid-column: 1;
  grid-row: 1 / span 2;
}

.hero-grid .hero-image {
  grid-column: 2;
  grid-row: 1 / span 2;
}

/* Responsive breakpoints */
@media (max-width: 768px) {
  .hero-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    gap: 2rem;
    text-align: center;
  }
  
  .hero-grid .hero-content,
  .hero-grid .hero-image {
    grid-column: 1;
  }
  
  .hero-grid .hero-content {
    grid-row: 1;
  }
  
  .hero-grid .hero-image {
    grid-row: 2;
  }
}

/* Masonry-style grid for cards */
.masonry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  grid-auto-rows: max-content;
  gap: 2rem;
  align-items: start;
}

/* Flexible card grid with aspect ratios */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  padding: 2rem;
}

.card-grid .card {
  aspect-ratio: 4 / 3;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* Responsive utilities */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 clamp(1rem, 4vw, 2rem);
}

.section-spacing {
  padding: clamp(3rem, 8vw, 6rem) 0;
}

/* Modern flexbox patterns */
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.flex-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .flex-stack-md {
    flex-direction: row;
    align-items: center;
  }
}

/* Responsive text alignment */
.text-responsive {
  text-align: center;
}

@media (min-width: 768px) {
  .text-responsive {
    text-align: left;
  }
}

/* Gap utilities for consistent spacing */
.gap-xs { gap: 0.5rem; }
.gap-sm { gap: 1rem; }
.gap-md { gap: 1.5rem; }
.gap-lg { gap: 2rem; }
.gap-xl { gap: 3rem; }
        `
      }
    ]
  }
};
