import { FC, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

export interface SidebarItemProps {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  expanded: boolean;
}

const SidebarItem: FC<SidebarItemProps> = ({ 
  id, 
  label, 
  icon: Icon, 
  href, 
  onClick, 
  expanded 
}) => {
  const location = useLocation();
  const isActive = href ? location.pathname === href : false;

  const content = (
    <div className={`
      h-[56px] flex items-center gap-3 px-4 py-3 
      transition-colors duration-200
      hover:bg-muted/50
      ${isActive ? 'bg-muted relative' : ''}
      ${expanded ? 'justify-start' : 'justify-center px-0'}
    `}>
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
      )}
      <Icon className="w-6 h-6 flex-shrink-0" />
      {expanded && (
        <span 
          className="text-sm leading-5 font-normal whitespace-nowrap animate-fade-in-label"
          style={{ 
            animation: 'fadeInLabel 160ms ease-out 40ms both'
          }}
        >
          {label}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        to={href}
        className="block"
        aria-current={isActive ? 'page' : undefined}
        aria-label={expanded ? undefined : label}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full text-left"
      aria-label={expanded ? undefined : label}
    >
      {content}
    </button>
  );
};

export default SidebarItem;
