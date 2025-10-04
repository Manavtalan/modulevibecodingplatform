import { FC, useState, useEffect, useRef } from 'react';
import { MessageCircle, Clock, Info, DollarSign, Sparkles, User, ChevronDown, Settings, LogOut } from 'lucide-react';
import Logo from '@/components/Logo';
import SidebarItem, { SidebarItemProps } from './SidebarItem';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';

export interface SidebarProps {
  items?: Omit<SidebarItemProps, 'expanded'>[];
  initialCollapsed?: boolean;
  onSelect?: (itemId: string) => void;
}

const Sidebar: FC<SidebarProps> = ({ 
  items: customItems, 
  initialCollapsed = true,
  onSelect 
}) => {
  const [expanded, setExpanded] = useState(!initialCollapsed);
  const [isMobile, setIsMobile] = useState(false);
  const collapseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();

  // Default navigation items
  const defaultItems: Omit<SidebarItemProps, 'expanded'>[] = [
    { id: 'new-chat', label: 'New Chat', icon: MessageCircle, href: '/' },
    { id: 'history', label: 'Chats History', icon: Clock, href: '/history' },
  ];

  const secondaryItems: Omit<SidebarItemProps, 'expanded'>[] = [
    { id: 'about', label: 'About', icon: Info, href: '/about' },
    { id: 'pricing', label: 'Pricing', icon: DollarSign, href: '/pricing' },
    { id: 'prompts', label: 'Prompts', icon: Sparkles, href: '/prompts' },
  ];

  const items = customItems || defaultItems;

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mouse enter handler
  const handleMouseEnter = () => {
    if (isMobile) return;
    
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
    setExpanded(true);
  };

  // Mouse leave handler with delay
  const handleMouseLeave = () => {
    if (isMobile) return;
    
    collapseTimerRef.current = setTimeout(() => {
      setExpanded(false);
    }, 350);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setExpanded(false);
      sidebarRef.current?.blur();
    }
  };

  const handleFocus = () => {
    if (!isMobile) {
      setExpanded(true);
    }
  };

  const handleItemClick = (itemId: string) => {
    onSelect?.(itemId);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Mobile bottom navigation
  if (isMobile) {
    return (
      <nav 
        className="fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-xl border-t border-border z-50"
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around h-full px-2">
          {[...items, ...secondaryItems, { id: 'profile', label: 'Profile', icon: User, href: '/profile' }].map((item) => (
            <Link
              key={item.id}
              to={item.href || '/'}
              className="flex flex-col items-center justify-center gap-1 p-2 hover:bg-muted/50 rounded-lg transition-colors"
              onClick={() => handleItemClick(item.id)}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    );
  }

  // Desktop sidebar
  return (
    <aside
      ref={sidebarRef}
      className={`
        fixed left-0 top-0 h-screen
        bg-background/95 backdrop-blur-xl border-r border-border
        transition-[width] duration-[260ms] ease-[cubic-bezier(0.2,0.9,0.2,1)]
        z-10
        ${expanded ? 'w-[280px]' : 'w-[72px]'}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="navigation"
      aria-label="Main sidebar"
      aria-expanded={expanded}
    >
      {/* Logo area */}
      <div className="h-[72px] flex items-center border-b border-border px-4">
        {expanded ? (
          <div className="flex items-center gap-3 animate-fade-in-label">
            <Logo size="sm" animated={false} />
            <span className="text-xl font-bold">Module</span>
          </div>
        ) : (
          <div className="mx-auto">
            <Logo size="sm" animated={false} />
          </div>
        )}
      </div>

      {/* Primary navigation */}
      <div className="py-4">
        {items.map((item) => (
          <SidebarItem
            key={item.id}
            {...item}
            expanded={expanded}
            onClick={() => handleItemClick(item.id)}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Secondary navigation */}
      <div className="py-4">
        {secondaryItems.map((item) => (
          <SidebarItem
            key={item.id}
            {...item}
            expanded={expanded}
            onClick={() => handleItemClick(item.id)}
          />
        ))}
      </div>

      {/* Profile section at bottom */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`
                  w-full h-[72px] flex items-center gap-3 px-4 py-3
                  hover:bg-muted/50 transition-colors
                  ${expanded ? 'justify-start' : 'justify-center px-0'}
                `}
                aria-label="User menu"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                {expanded && (
                  <div className="flex-1 flex items-center justify-between animate-fade-in-label">
                    <span className="text-sm font-medium">
                      {user?.email?.split('@')[0] || 'User'}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              side="right"
              className="w-48 bg-card/95 backdrop-blur-xl border-border z-50"
            >
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-4 h-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link 
            to="/auth"
            className={`
              w-full h-[72px] flex items-center gap-3 px-4 py-3
              hover:bg-muted/50 transition-colors
              ${expanded ? 'justify-start' : 'justify-center px-0'}
            `}
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            {expanded && (
              <span className="text-sm font-medium animate-fade-in-label">
                Sign In
              </span>
            )}
          </Link>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
