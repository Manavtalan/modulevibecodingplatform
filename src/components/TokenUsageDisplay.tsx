import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TokenUsage {
  quota: number;
  used: number;
  remaining: number;
  percentage: number;
}

export const TokenUsageDisplay = () => {
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [hasShown80Warning, setHasShown80Warning] = useState(false);
  const { toast } = useToast();

  const fetchTokenUsage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.rpc('get_token_usage', {
      _user_id: user.id
    });

    if (!error && data) {
      const usage = data as unknown as TokenUsage;
      setTokenUsage(usage);
      
      // Show 80% warning once
      if (usage.percentage >= 80 && usage.percentage < 100 && !hasShown80Warning) {
        toast({
          title: "⚠️ Token Limit Warning",
          description: "You've used 80% of your free token limit. Upgrade for more access.",
          variant: "destructive",
        });
        setHasShown80Warning(true);
      }
      
      // Show limit reached warning
      if (usage.remaining <= 0) {
        toast({
          title: "🚫 Token Limit Reached",
          description: "Token limit reached. Upgrade your plan to continue building.",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    fetchTokenUsage();
    
    // Refresh token usage every 10 seconds
    const interval = setInterval(fetchTokenUsage, 10000);
    
    return () => clearInterval(interval);
  }, []);

  if (!tokenUsage) return null;

  const getColor = () => {
    if (tokenUsage.percentage >= 100) return 'text-red-500';
    if (tokenUsage.percentage >= 80) return 'text-orange-500';
    return 'text-[#FF7A00]';
  };

  const getBarColor = () => {
    if (tokenUsage.percentage >= 100) return 'bg-red-500';
    if (tokenUsage.percentage >= 80) return 'bg-orange-500';
    return 'bg-gradient-to-r from-[#FF7A18] to-[#FFAE00]';
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg p-4 min-w-[280px] shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className={`w-5 h-5 ${getColor()}`} />
          <span className="text-white font-semibold">Token Usage</span>
        </div>
        {tokenUsage.percentage >= 80 && (
          <AlertCircle className={`w-4 h-4 ${getColor()}`} />
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Used:</span>
          <span className={`font-semibold ${getColor()}`}>
            {tokenUsage.used.toLocaleString()} / {tokenUsage.quota.toLocaleString()}
          </span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${getBarColor()}`}
            style={{ width: `${Math.min(tokenUsage.percentage, 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Remaining:</span>
          <span className={`font-semibold ${getColor()}`}>
            {tokenUsage.remaining.toLocaleString()} tokens
          </span>
        </div>
      </div>
      
      {tokenUsage.percentage >= 80 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-gray-400">
            {tokenUsage.percentage >= 100 
              ? '🚫 Upgrade to continue building' 
              : '⚠️ Consider upgrading for more tokens'}
          </p>
        </div>
      )}
    </div>
  );
};
