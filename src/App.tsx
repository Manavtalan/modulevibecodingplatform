import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Prompts from "./pages/Prompts";
import Subscription from "./pages/Subscription";
import About from "./pages/About";
import ChatHistory from "./pages/ChatHistory";
import Demo from "./pages/Demo";
import CodeGenerator from "./pages/CodeGenerator";
import ModuleStudio from "./pages/ModuleStudio";
import History from "./pages/History";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/prompts" element={<Prompts />} />
            <Route path="/pricing" element={<Subscription />} />
            <Route path="/about" element={<About />} />
            <Route path="/history" element={<ChatHistory />} />
            <Route path="/demo" element={<ModuleStudio />} />
            <Route path="/code-generator" element={<ModuleStudio />} />
            <Route path="/studio" element={<ModuleStudio />} />
            <Route path="/projects" element={<History />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
