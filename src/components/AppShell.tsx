import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/cn";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <nav className="border-b" style={{ borderColor: "hsl(var(--muted))" }}>
        <div className="container-page py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xl font-bold" style={{ color: "hsl(var(--brand))" }}>
              Module
            </Link>
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className={cn(
                  "px-4 py-2 rounded-lg transition",
                  isActive("/") ? "font-semibold" : "hover:bg-white/5"
                )}
                style={{ color: isActive("/") ? "hsl(var(--brand))" : "hsl(var(--fg))" }}
              >
                Dashboard
              </Link>
              <Link
                to="/code-generator"
                className={cn(
                  "px-4 py-2 rounded-lg transition",
                  isActive("/code-generator") ? "font-semibold" : "hover:bg-white/5"
                )}
                style={{ color: isActive("/code-generator") ? "hsl(var(--brand))" : "hsl(var(--fg))" }}
              >
                Generator
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};
