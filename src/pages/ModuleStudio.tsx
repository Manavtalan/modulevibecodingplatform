import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ChatPanel } from "@/components/studio/ChatPanel";
import { PreviewPanel } from "@/components/studio/PreviewPanel";
import { TokenUsageDisplay } from "@/components/TokenUsageDisplay";
import { ModelSelector } from "@/components/ModelSelector";
import { useAuth } from "@/contexts/AuthContext";
import { useCodeGeneration } from "@/hooks/useCodeGeneration";

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'user' | 'assistant' | 'status' | 'error';
  statusIcon?: string;
}

export interface CodeFile {
  path: string;
  content: string;
}

const ModuleStudio = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(location.state?.conversationId || null);
  const [selectedModel, setSelectedModel] = useState("claude-sonnet-4-5");
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  const {
    isGenerating,
    generationPhase,
    currentFile,
    generatedFiles,
    filePlan,
    error: generationError,
    qualityCheck,
    generateCode,
    resetGeneration
  } = useCodeGeneration();

  // Load conversation history if conversationId exists
  useEffect(() => {
    const loadConversation = async () => {
      if (!conversationId) return;

      const { supabase } = await import("@/integrations/supabase/client");
      const { data: conversation, error } = await supabase
        .from("conversations")
        .select("id, created_at")
        .eq("id", conversationId)
        .single();

      if (conversation && !error) {
        // Conversation exists, messages will be loaded from chat history
        console.log("Loaded conversation:", conversation.id);
      }
    };

    loadConversation();
  }, [conversationId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add status messages during generation
  useEffect(() => {
    if (generationPhase === 'planning') {
      addStatusMessage("🎯 Planning file structure...", "status");
    } else if (generationPhase === 'generating' && filePlan.length > 0) {
      addStatusMessage(`📝 Generating files... (${filePlan.length} files planned)`, "status");
    } else if (generationPhase === 'complete') {
      addStatusMessage("✅ Generation complete! Preview is ready.", "status");
    } else if (generationPhase === 'error' && generationError) {
      addStatusMessage(`❌ Error: ${generationError}`, "error");
    }
  }, [generationPhase, filePlan.length, generationError]);

  // Update status when current file changes
  useEffect(() => {
    if (currentFile && generationPhase === 'generating') {
      const currentIndex = filePlan.findIndex(f => f.path === currentFile);
      if (currentIndex >= 0) {
        addStatusMessage(
          `📝 Generating ${currentFile}... (${currentIndex + 1}/${filePlan.length})`,
          "status"
        );
      }
    }
  }, [currentFile]);

  // Display quality check suggestions when generation completes
  useEffect(() => {
    if (generationPhase === 'complete' && qualityCheck) {
      if (!qualityCheck.valid && qualityCheck.suggestions.length > 0) {
        const suggestionsText = `⚠️ Design Quality Suggestions:\n${qualityCheck.suggestions.map(s => `• ${s}`).join('\n')}\n\nConsider regenerating with these improvements for a more modern, professional result.`;
        addStatusMessage(suggestionsText, "status");
      } else {
        addStatusMessage("✨ Code quality check passed! All modern design patterns detected.", "status");
      }
    }
  }, [generationPhase, qualityCheck]);

  const addStatusMessage = (text: string, type: 'status' | 'error') => {
    setMessages(prev => {
      // Don't add duplicate status messages
      const lastMessage = prev[prev.length - 1];
      if (lastMessage?.text === text) return prev;

      return [...prev, {
        id: `status-${Date.now()}`,
        text,
        isUser: false,
        timestamp: new Date(),
        type,
        statusIcon: type === 'status' ? '🔨' : '❌'
      }];
    });
  };

  const handleSendMessage = async (text: string, files?: File[]) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text,
      isUser: true,
      timestamp: new Date(),
      type: 'user'
    };
    setMessages(prev => [...prev, userMessage]);

    // Check if this is a code generation request
    const isCodeRequest = /generate|create|build|make|code|website|app|webpage|html|css|js/i.test(text);

    if (isCodeRequest) {
      // Trigger code generation
      addStatusMessage("🔨 Module is working on your request...", "status");
      
      await generateCode({
        prompt: text,
        codeType: "html", // Default to HTML for now
        model: selectedModel,
        conversationId: conversationId || undefined
      });
    } else {
      // Regular chat message - call the ask function
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        
        const { data, error } = await supabase.functions.invoke("ask", {
          body: {
            message: text,
            conversationId: conversationId,
            userId: user?.id,
            model: selectedModel
          }
        });

        if (error) throw error;

        if (data?.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          text: data.response || "I'm here to help! Ask me to generate code or chat about your project.",
          isUser: false,
          timestamp: new Date(),
          type: 'assistant'
        };
        setMessages(prev => [...prev, assistantMessage]);
      } catch (err: any) {
        console.error("Error sending message:", err);
        addStatusMessage(`❌ Error: ${err.message || "Failed to send message"}`, "error");
      }
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Module Studio</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <ModelSelector value={selectedModel} onChange={setSelectedModel} />
          {user && <TokenUsageDisplay />}
        </div>
      </header>

      {/* Main Content - Resizable Split Layout */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel - Chat */}
          <ResizablePanel defaultSize={40} minSize={30} maxSize={60}>
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              isGenerating={isGenerating}
              messagesEndRef={messagesEndRef}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Preview/Code */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <PreviewPanel
              files={generatedFiles}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isGenerating={isGenerating}
              generationPhase={generationPhase}
              currentFile={currentFile}
              filePlan={filePlan}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default ModuleStudio;
