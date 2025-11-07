import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ChatPanel } from "@/components/studio/ChatPanel";
import { PreviewPanel } from "@/components/studio/PreviewPanel";
import { TokenUsageDisplay } from "@/components/TokenUsageDisplay";
import { ModelSelector } from "@/components/ModelSelector";
import { useAuth } from "@/contexts/AuthContext";
import { useCodeGeneration } from "@/hooks/useCodeGeneration";
import { CodeQualityValidator, ValidationResult } from "@/utils/codeQualityValidator";
import { toast } from "@/hooks/use-toast";
import QualitySettings from "@/components/QualitySettings";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [originalPrompt, setOriginalPrompt] = useState<string>("");
  const [currentCodeType, setCurrentCodeType] = useState<string>("html");
  
  // Quality settings state
  const [showSettings, setShowSettings] = useState(false);
  const [autoRetry, setAutoRetry] = useState(true);
  const [minQualityScore, setMinQualityScore] = useState(80);
  const [maxRetries, setMaxRetries] = useState(2);

  const {
    isGenerating,
    generationPhase,
    currentFile,
    generatedFiles,
    filePlan,
    error: generationError,
    qualityCheck,
    tokenValidation,
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

  // Display token validation issues when generation completes
  useEffect(() => {
    if (generationPhase === 'complete' && tokenValidation) {
      if (!tokenValidation.valid && tokenValidation.issues.length > 0) {
        const issuesText = `⚠️ Design Token Issues:\n${tokenValidation.issues.map(i => `• ${i}`).join('\n')}\n\nComponents should use design tokens (var(--primary-500)) instead of hardcoded values for consistency.`;
        addStatusMessage(issuesText, "status");
      } else {
        addStatusMessage("✨ Design token validation passed! All components use the design system properly.", "status");
      }
    }
  }, [generationPhase, tokenValidation]);

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

  // Quality validation function
  const runQualityValidation = async (files: CodeFile[], codeType: string): Promise<ValidationResult> => {
    setIsValidating(true);
    
    try {
      // Simulate brief validation delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Convert CodeFile to the format expected by validator
      const validatorFiles = files.map(f => ({
        path: f.path,
        content: f.content,
        language: f.path.endsWith('.tsx') ? 'tsx' : 
                 f.path.endsWith('.jsx') ? 'jsx' : 
                 f.path.endsWith('.ts') ? 'ts' : 
                 f.path.endsWith('.js') ? 'js' : 
                 f.path.endsWith('.css') ? 'css' : 
                 f.path.endsWith('.html') ? 'html' : 'text'
      }));
      
      const result = CodeQualityValidator.validateCodebase(validatorFiles, codeType);
      setValidationResult(result);
      
      // Log validation results for debugging
      console.log('Quality Validation Results:', {
        valid: result.valid,
        score: result.score,
        issuesCount: result.issues.length,
        criticalIssues: result.issues.filter(i => i.severity === 1).length
      });
      
      return result;
    } finally {
      setIsValidating(false);
    }
  };

  // Auto-retry function with enhanced prompt
  const autoRetryWithBetterSettings = async (
    prompt: string, 
    codeType: string, 
    validationResult: ValidationResult
  ): Promise<void> => {
    // Check if auto-retry is enabled
    if (!autoRetry) {
      toast({
        title: "Quality validation failed",
        description: "Auto-retry is disabled. Enable it in settings to automatically improve code quality.",
        variant: "destructive"
      });
      addStatusMessage(`⚠️ Quality validation failed (Score: ${validationResult.score}/100). Auto-retry is disabled.`, "error");
      return;
    }

    // Check retry limit
    if (retryCount >= maxRetries) {
      toast({
        title: "Maximum retry attempts reached",
        description: `Reached ${maxRetries} retry attempts. Please try a different approach or adjust settings.`,
        variant: "destructive"
      });
      return;
    }

    // Check if score meets minimum requirement
    if (validationResult.score >= minQualityScore) {
      // Score is acceptable, no retry needed
      return;
    }

    setRetryCount(prev => prev + 1);
    
    // Build enhanced prompt based on validation issues
    let enhancedPrompt = `${prompt}\n\nIMPORTANT QUALITY REQUIREMENTS:\n`;
    
    // Add specific fixes based on validation issues
    if (validationResult.issues.some(i => i.category === 'structure')) {
      enhancedPrompt += '- ENSURE PROPER FILE STRUCTURE: ';
      if (codeType === 'html') {
        enhancedPrompt += 'Generate separate index.html, styles.css, and script.js files\n';
      } else if (codeType === 'react') {
        enhancedPrompt += 'Generate App.tsx, Navbar, Hero, Features, Footer components plus design-tokens.css\n';
      }
    }

    if (validationResult.issues.some(i => i.category === 'design')) {
      enhancedPrompt += '- MODERN DESIGN PATTERNS: Use CSS Grid/Flexbox, smooth animations, gradients, hover effects, responsive design\n';
    }

    if (validationResult.issues.some(i => i.category === 'modern')) {
      enhancedPrompt += '- MODERN DEVELOPMENT: Use semantic HTML, CSS custom properties, functional components\n';
    }

    if (validationResult.issues.some(i => i.category === 'accessibility')) {
      enhancedPrompt += '- ACCESSIBILITY: Include alt attributes, proper labels, heading hierarchy\n';
    }

    enhancedPrompt += '\nEMPHASIZE MODERN PROFESSIONAL DESIGN with production-ready quality standards.';

    toast({
      title: `Quality validation failed (Score: ${validationResult.score}/100)`,
      description: "Retrying with enhanced prompt...",
    });

    addStatusMessage(`🔄 Auto-retrying with quality improvements (Attempt ${retryCount + 1}/${maxRetries})...`, "status");

    // Always retry with Claude for better results
    await generateCode({
      prompt: enhancedPrompt,
      codeType,
      model: 'claude-sonnet-4-5', // Force Claude for retry
      conversationId: conversationId || undefined
    });
  };

  const handleSendMessage = async (text: string, files?: File[]) => {
    if (!text.trim()) return;

    // Reset validation state for new request
    setValidationResult(null);
    setRetryCount(0);
    setOriginalPrompt(text);

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
    const isCodeRequest = /generate|create|build|make|code|website|app|webpage|html|css|js|react|vue/i.test(text);

    if (isCodeRequest) {
      // Determine code type from the request
      const codeType = /react/i.test(text) ? 'react' : 
                      /vue/i.test(text) ? 'vue' : 
                      'html';
      setCurrentCodeType(codeType);

      // Trigger code generation
      addStatusMessage("🔨 Module is working on your request...", "status");
      
      await generateCode({
        prompt: text,
        codeType,
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

  // Run quality validation when generation completes
  useEffect(() => {
    const runValidationAfterGeneration = async () => {
      if (generationPhase === 'complete' && generatedFiles.length > 0 && !isValidating) {
        addStatusMessage("🔍 Running quality validation...", "status");
        
        const validation = await runQualityValidation(generatedFiles, currentCodeType);
        
        if (!validation.valid) {
          // Auto-retry with enhanced prompt if validation fails
          addStatusMessage(
            `⚠️ Quality check failed (Score: ${validation.score}/100)\n\nIssues found:\n${validation.issues.slice(0, 3).map(i => `• ${i.message}`).join('\n')}${validation.issues.length > 3 ? `\n...and ${validation.issues.length - 3} more` : ''}`,
            "error"
          );
          
          await autoRetryWithBetterSettings(originalPrompt, currentCodeType, validation);
        } else {
          // Success message with score
          toast({
            title: "✅ Quality validation passed!",
            description: `Score: ${validation.score}/100`,
          });
          
          addStatusMessage(
            `✅ Quality validation passed! Score: ${validation.score}/100\n\nFiles generated: ${generatedFiles.map(f => f.path).join(', ')}`,
            "status"
          );
        }
      }
    };

    runValidationAfterGeneration();
  }, [generationPhase, generatedFiles.length]);

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex flex-col border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Module Studio</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant={showSettings ? "default" : "ghost"}
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              title="Quality Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <ModelSelector value={selectedModel} onChange={setSelectedModel} />
            {user && <TokenUsageDisplay />}
          </div>
        </div>

        {/* Quality Settings Panel */}
        <Collapsible open={showSettings}>
          <CollapsibleContent className="px-4 pb-4">
            <QualitySettings
              autoRetry={autoRetry}
              setAutoRetry={setAutoRetry}
              minQualityScore={minQualityScore}
              setMinQualityScore={setMinQualityScore}
              maxRetries={maxRetries}
              setMaxRetries={setMaxRetries}
            />
          </CollapsibleContent>
        </Collapsible>
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
              validationResult={validationResult}
              isValidating={isValidating}
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
