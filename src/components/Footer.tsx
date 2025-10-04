import { FC } from 'react';
import { Linkedin, Instagram, Mail, Twitter } from 'lucide-react';

const Footer: FC = () => {
  const socialLinks = [
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: 'https://linkedin.com',
      color: 'hover:text-[#0077B5]'
    },
    {
      name: 'Instagram',
      icon: Instagram,
      url: 'https://instagram.com',
      color: 'hover:text-[#E4405F]'
    },
    {
      name: 'Email',
      icon: Mail,
      url: 'mailto:contact@module.com',
      color: 'hover:text-primary'
    },
    {
      name: 'X (Twitter)',
      icon: Twitter,
      url: 'https://twitter.com',
      color: 'hover:text-[#1DA1F2]'
    }
  ];

  return (
    <footer className="border-t border-border/50 bg-background/95 backdrop-blur-xl mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Module. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-muted-foreground transition-colors ${link.color}`}
                aria-label={link.name}
              >
                <link.icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
