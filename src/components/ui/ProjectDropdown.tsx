import { useState, useEffect, useRef } from "react";
import { Settings, ChevronRight, ExternalLink, Sun, Moon, Monitor } from "lucide-react";
import { getCurrentProject, updateProject } from "@/stores/projectStore";
import { supabase } from "@/integrations/supabase/client";

interface TokenUsage {
  quota: number;
  used: number;
  remaining: number;
  percentage: number;
}

export default function ProjectDropdown() {
  const [open, setOpen] = useState(false);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
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
    if (open) {
      fetchTokenUsage();
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    updateProject({ theme });
    
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // System preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 transition-colors"
        title="Settings"
      >
        <Settings className="w-4 h-4 text-neutral-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Current Plan Section */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">
                  Current Plan
                </div>
                <div className="text-sm font-semibold text-neutral-100">
                  {project.plan}
                </div>
              </div>
              <button className="text-xs px-3 py-1 rounded-md bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium transition-all">
                Upgrade
              </button>
            </div>

            {tokenUsage && (
              <div className="text-xs text-neutral-400 pt-2 border-t border-neutral-800">
                Token balance:{" "}
                <span className="font-medium text-neutral-300">
                  {tokenUsage.used.toLocaleString()} / {tokenUsage.quota.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="space-y-1">
            <DropdownItem label="Visibility" />
            <DropdownItem label="Project settings" />
            <DropdownItem 
              label="Help" 
              external 
              onClick={() => window.open("https://docs.lovable.dev", "_blank")}
            />
            <DropdownItem label="Appearance" />
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
            <span className="text-xs text-neutral-400">Theme</span>
            <div className="flex gap-1">
              <ThemeButton
                icon={<Sun className="w-3.5 h-3.5" />}
                active={project.theme === "light"}
                onClick={() => handleThemeChange("light")}
                title="Light"
              />
              <ThemeButton
                icon={<Moon className="w-3.5 h-3.5" />}
                active={project.theme === "dark"}
                onClick={() => handleThemeChange("dark")}
                title="Dark"
              />
              <ThemeButton
                icon={<Monitor className="w-3.5 h-3.5" />}
                active={project.theme === "system"}
                onClick={() => handleThemeChange("system")}
                title="System"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownItem({
  label,
  external,
  onClick
}: {
  label: string;
  external?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
    >
      <span>{label}</span>
      {external ? (
        <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
      ) : (
        <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
      )}
    </button>
  );
}

function ThemeButton({
  icon,
  active,
  onClick,
  title
}: {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-md border transition-all ${
        active
          ? "border-blue-500 bg-blue-500/10 text-blue-400"
          : "border-neutral-800 hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300"
      }`}
    >
      {icon}
    </button>
  );
}
