import { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { User, Home, LogIn, UserPlus } from 'lucide-react';

const Navigation: FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="glass-card p-4 mb-8">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <Logo size="md" />
          <span className="text-xl font-bold text-foreground hidden sm:block">
            Module
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {location.pathname !== '/' && (
            <Button 
              variant={isActive('/') ? 'default' : 'ghost'} 
              size="sm" 
              asChild
            >
              <Link to="/" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </Button>
          )}

          {location.pathname !== '/profile' && (
            <Button 
              variant={isActive('/profile') ? 'default' : 'ghost'} 
              size="sm" 
              asChild
            >
              <Link to="/profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
            </Button>
          )}

          {location.pathname !== '/signup' && (
            <Button 
              variant={isActive('/signup') ? 'default' : 'ghost'} 
              size="sm" 
              asChild
            >
              <Link to="/signup" className="flex items-center gap-2">
                {location.pathname === '/login' ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign Up</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign In</span>
                  </>
                )}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;