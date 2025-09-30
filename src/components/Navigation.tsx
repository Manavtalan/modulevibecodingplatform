import { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Logo from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { User, Sparkles, LogOut, Settings } from 'lucide-react';

const Navigation: FC = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="glass-card p-3 mb-6 sticky top-0 z-50 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-4">
        {/* Left: Logo + Name */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <Logo size="md" animated={true} />
          <span className="text-xl font-bold text-foreground">
            Module
          </span>
        </Link>

        {/* Right: Prompts + Login/Logout */}
        <div className="flex items-center gap-4">
          {/* Prompts Link */}
          {location.pathname !== '/auth' && (
            <Link 
              to="/prompts"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors flex items-center gap-2 group"
            >
              <Sparkles className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Prompts</span>
            </Link>
          )}

          {/* Auth */}
          {location.pathname !== '/auth' && location.pathname !== '/login' && location.pathname !== '/signup' && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="hover:bg-white/10"
                    >
                      <User className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-card/95 backdrop-blur-xl border-border">
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
                <Button 
                  variant="default" 
                  size="sm" 
                  asChild
                  className="font-semibold"
                >
                  <Link to="/auth">
                    Sign In
                  </Link>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;