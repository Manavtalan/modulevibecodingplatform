import { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Logo from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { User, Bell, Sparkles, LogOut, Settings } from 'lucide-react';

const Navigation: FC = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="glass-card p-4 mb-8 sticky top-0 z-50 backdrop-blur-xl">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Logo size="md" />
          <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Module
          </span>
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Prompts Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="gap-2"
          >
            <Link to="/prompts">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">Prompts</span>
            </Link>
          </Button>

          {user ? (
            <>
              {/* Notifications */}
              <Button 
                variant="ghost" 
                size="icon"
                className="relative"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
              </Button>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="rounded-full"
                  >
                    <User className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card/95 backdrop-blur-xl border-glass-border">
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
            </>
          ) : (
            location.pathname !== '/login' && location.pathname !== '/signup' && (
              <Button 
                variant="default" 
                size="sm" 
                asChild
                className="bg-gradient-primary hover:scale-105 transition-transform"
              >
                <Link to="/login">
                  Sign In
                </Link>
              </Button>
            )
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;