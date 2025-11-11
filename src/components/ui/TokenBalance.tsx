import { useEffect, useState } from "react";
import { getCurrentProject } from "@/stores/projectStore";
import { supabase } from "@/integrations/supabase/client";
import { Zap } from "lucide-react";

interface TokenUsage {
  quota: number;
  used: number;
  remaining: number;
  percentage: number;
}

export default function TokenBalance() {
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const project = getCurrentProject();

  const fetchTokenUsage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.rpc('get_token_usage', {
      _user_id: user.id
    });

    if (!error && data) {
      setTokenUsage(data as unknown as TokenUsage);
    }
  };

  useEffect(() => {
    fetchTokenUsage();
    const interval = setInterval(fetchTokenUsage, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!tokenUsage) return null;

  const percentage = Math.min(tokenUsage.percentage, 100);
  
  const getBarColor = () => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-orange-500";
    return "bg-gradient-to-r from-emerald-500 to-emerald-400";
  };

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-colors group">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-emerald-500" />
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wide text-neutral-500">
            {project.plan}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="h-1 w-16 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getBarColor()}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs font-medium text-neutral-300 tabular-nums">
              {tokenUsage.used.toLocaleString()} / {tokenUsage.quota.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
