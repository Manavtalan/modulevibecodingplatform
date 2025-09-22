import { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { User, Home, LogIn, UserPlus, LogOut } from 'lucide-react';

const Navigation: FC = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
  };

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

          {user ? (
            <>
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
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Sign Out</span>
              </Button>
            </>
          ) : (
            location.pathname !== '/login' && location.pathname !== '/signup' && (
              <Button 
                variant="outline" 
                size="sm" 
                asChild
              >
                <Link to="/login" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
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