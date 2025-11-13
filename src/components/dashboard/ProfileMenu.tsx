import { FC, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, LogOut, Zap, LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TokenUsage {
  quota: number;
  used: number;
  remaining: number;
  percentage: number;
}

export const ProfileMenu: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const { user, signOut } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fetch token usage when menu opens
  useEffect(() => {
    const fetchTokenUsage = async () => {
      if (!user || !isOpen) return;
      
      const { data, error } = await supabase.rpc('get_token_usage', {
        _user_id: user.id
      });

      if (!error && data) {
        setTokenUsage(data as unknown as TokenUsage);
      }
    };

    fetchTokenUsage();
  }, [user, isOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/');
  };

  // Get user initials
  const getInitials = () => {
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full backdrop-blur-md shadow-lg border transition-all duration-300 hover:scale-105 flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(255,122,24,0.2) 0%, rgba(255,179,71,0.2) 100%)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
        title="Profile menu"
      >
        <span className="text-sm font-bold text-white">{getInitials()}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-14 right-0 w-80 rounded-2xl backdrop-blur-xl shadow-2xl border overflow-hidden animate-scale-in"
          style={{
            background: 'rgba(26, 26, 26, 0.95)',
            borderColor: 'rgba(255, 122, 24, 0.2)',
            boxShadow: '0 8px 32px rgba(255, 122, 24, 0.15)',
          }}
        >
          {/* User Info Section */}
          <div className="p-5 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,122,24,0.3) 0%, rgba(255,179,71,0.3) 100%)',
                }}
              >
                <span className="text-lg font-bold text-white">{getInitials()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.email || 'guest@module.dev'}</p>
              </div>
            </div>

            {/* Plan Info Box */}
            <div
              className="p-3 rounded-xl"
              style={{
                background: 'rgba(255, 122, 24, 0.08)',
                border: '1px solid rgba(255, 122, 24, 0.2)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-300">Current Plan</span>
                <span className="text-xs font-bold" style={{ color: '#FFB347' }}>
                  Starter
                </span>
              </div>

              {/* Token Usage Bar */}
              {tokenUsage && (
                <>
                  <div className="mb-2">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(tokenUsage.percentage, 100)}%`,
                          background: tokenUsage.percentage >= 80 
                            ? 'linear-gradient(90deg, #ff6b6b 0%, #ff8787 100%)'
                            : 'linear-gradient(90deg, #FF7A18 0%, #FFB347 100%)',
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400">
                      {(tokenUsage.used / 1000).toFixed(1)}K / {(tokenUsage.quota / 1000).toFixed(0)}K tokens
                    </span>
                  </div>
                </>
              )}

              <button
                onClick={() => {
                  navigate('/subscription');
                  setIsOpen(false);
                }}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(90deg, #FF7A18 0%, #FFB347 100%)',
                }}
              >
                <Zap className="w-3 h-3 inline mr-1" />
                Upgrade Plan
              </button>
            </div>
          </div>

          {/* Menu Links */}
          <div className="p-2">
            {user && (
              <button
                onClick={() => {
                  navigate('/profile');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white transition-all duration-200"
                style={{
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Settings className="w-4 h-4" />
                Account Settings
              </button>
            )}

            {/* Divider */}
            <div className="my-2 h-px" style={{ background: 'rgba(255, 255, 255, 0.05)' }} />

            {/* Sign In / Sign Out */}
            {user ? (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200"
                style={{
                  background: 'transparent',
                  color: '#ff6b6b',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => {
                  navigate('/auth');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white transition-all duration-200"
                style={{
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};