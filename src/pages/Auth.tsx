import { FC, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/Logo';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, Github } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Auth: FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const { signUp, signIn, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (!error) {
          navigate('/');
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          alert('Passwords do not match');
          return;
        }
        await signUp(formData.email, formData.password);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      console.error('GitHub sign-in error:', error);
      toast.error('Failed to sign in with GitHub');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ email: '', password: '', confirmPassword: '' });
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="xl" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isLogin ? 'Welcome Back' : 'Join'} <span className="bg-gradient-primary bg-clip-text text-transparent">Module</span>
          </h1>
          <p className="text-muted-foreground">
            {isLogin 
              ? 'Sign in to continue your coding journey'
              : 'Start your coding journey with AI assistance'
            }
          </p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-foreground font-medium">
                Email Address
              </Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="chat-input pl-10 border-0 text-foreground"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-foreground font-medium">
                Password
              </Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="chat-input pl-10 pr-10 border-0 text-foreground"
                  placeholder={isLogin ? "Enter your password" : "Create a password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                  Confirm Password
                </Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="chat-input pl-10 border-0 text-foreground"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            variant="hero" 
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              "Loading..."
            ) : (
              <>
                {isLogin ? <LogIn className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                {isLogin ? 'Sign In' : 'Create Account'}
              </>
            )}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* GitHub OAuth */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGitHubSignIn}
            disabled={loading}
          >
            <Github className="w-4 h-4 mr-2" />
            GitHub
          </Button>

          <div className="text-center">
            <p className="text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </form>

        {/* Additional Options */}
        <div className="text-center mt-6">
          <Button variant="ghost" asChild>
            <Link to="/">
              Continue to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;