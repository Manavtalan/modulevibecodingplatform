import { FC } from 'react';
import { Linkedin, Instagram, Twitter, Github } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';

/**
 * Footer Component
 * 
 * Professional footer section with three main areas:
 * 1. About Module - Brief description and branding
 * 2. Social Links - Social media and contact links
 * 3. Legal - Terms, Privacy Policy, and other legal links
 * 
 * Fully responsive and consistent with Module's design system
 */
const Footer: FC = () => {
  // Social media links with icons and URLs (easily editable)
  const socialLinks = [
    {
      name: 'Twitter',
      icon: Twitter,
      url: 'https://twitter.com/module',
      hoverColor: 'hover:text-[#1DA1F2]'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: 'https://linkedin.com/company/module',
      hoverColor: 'hover:text-[#0077B5]'
    },
    {
      name: 'Instagram',
      icon: Instagram,
      url: 'https://instagram.com/module',
      hoverColor: 'hover:text-[#E4405F]'
    },
    {
      name: 'GitHub',
      icon: Github,
      url: 'https://github.com/module',
      hoverColor: 'hover:text-foreground'
    }
  ];

  // Legal links (easily editable)
  const legalLinks = [
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Cookie Policy', href: '/cookies' }
  ];

  return (
    <footer className="border-t border-border/50 bg-background/95 backdrop-blur-xl mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
        
        {/* Main Footer Content - Three Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 mb-8">
          
          {/* Section 1: About Module */}
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Logo size="sm" animated={false} />
              <span className="text-xl font-bold text-foreground">Module</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto md:mx-0">
              AI Development Platform simplifying web app creation with AI-powered tools. 
              Build, learn, and deploy faster.
            </p>
          </div>

          {/* Section 2: Social Links */}
          <div className="space-y-4 text-center">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Connect With Us
            </h3>
            <div className="flex items-center justify-center gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-muted-foreground transition-all duration-300 ${link.hoverColor} hover:scale-110`}
                  aria-label={link.name}
                  title={link.name}
                >
                  <link.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Follow us for updates and insights
            </p>
          </div>

          {/* Section 3: Legal */}
          <div className="space-y-4 text-center md:text-right">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Legal
            </h3>
            <nav className="flex flex-col gap-2">
              {legalLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 hover:underline underline-offset-4"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Separator Line */}
        <div className="border-t border-border/30 mb-6"></div>

        {/* Bottom Bar - Copyright and Additional Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-xs sm:text-sm text-muted-foreground">
            © {new Date().getFullYear()} Module. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with ❤️ for developers worldwide
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
