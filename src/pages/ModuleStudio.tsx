import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ChatPanel } from "@/components/studio/ChatPanel";
import { PreviewPanel } from "@/components/studio/PreviewPanel";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useCodeGeneration } from "@/hooks/useCodeGeneration";
// DISABLED: Unused imports removed for raw output analysis
// import { CodeQualityValidator, ValidationResult } from "@/utils/codeQualityValidator";
// import { toast } from "@/hooks/use-toast";
// import QualitySettings from "@/components/QualitySettings";
// import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview'); // Default to preview
  // DISABLED: All validation state removed for raw output analysis
  const [currentCodeType, setCurrentCodeType] = useState<string>("react");

  const {
    isGenerating,
    generationPhase,
    currentFile,
    generatedFiles,
    filePlan,
    error: generationError,
    qualityCheck,
    tokenValidation,
    diagnosticInfo,
    rawOutputAvailable,
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

  // Debug: Track generated files with detailed logging
  useEffect(() => {
    console.log('🔄 Generated files state updated:', {
      count: generatedFiles.length,
      phase: generationPhase,
      isGenerating,
      paths: generatedFiles.map(f => f.path),
      sizes: generatedFiles.map(f => f.content.length)
    });
    
    if (generatedFiles.length > 0) {
      console.log('📊 File details:');
      generatedFiles.forEach((file, idx) => {
        console.log(`  ${idx + 1}. ${file.path} (${file.content.length} bytes)`);
        console.log(`     Preview: ${file.content.substring(0, 100)}...`);
      });
    } else {
      console.warn('⚠️ Generated files array is empty');
    }
  }, [generatedFiles, generationPhase, isGenerating]);

  // Add detailed status messages during generation (like Lovable)
  useEffect(() => {
    if (generationPhase === 'planning') {
      addStatusMessage("🎯 Analyzing your request and planning the project structure...", "status");
    } else if (generationPhase === 'generating' && filePlan.length > 0) {
      addStatusMessage(`🏗️ Building your project with ${filePlan.length} files...\n📦 This includes: components, pages, styles, utilities, and configurations`, "status");
    } else if (generationPhase === 'complete') {
      addStatusMessage("✅ Generation complete! Your project is ready to preview.", "status");
    } else if (generationPhase === 'error' && generationError) {
      addStatusMessage(`❌ Error: ${generationError}`, "error");
    }
  }, [generationPhase, filePlan.length, generationError]);

  // Update status when current file changes (detailed like Lovable)
  useEffect(() => {
    if (currentFile && generationPhase === 'generating') {
      const currentIndex = filePlan.findIndex(f => f.path === currentFile);
      if (currentIndex >= 0) {
        const fileType = currentFile.includes('component') ? 'component' : 
                        currentFile.includes('page') ? 'page' :
                        currentFile.includes('style') ? 'styles' :
                        currentFile.includes('util') ? 'utility' : 'file';
        addStatusMessage(
          `✍️ Writing ${fileType}: ${currentFile}\n📊 Progress: ${currentIndex + 1} of ${filePlan.length} files`,
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

  // DISABLED: Quality validation function temporarily disabled for raw output analysis
  // const runQualityValidation = async (files: CodeFile[], codeType: string): Promise<ValidationResult> => {
  //   setIsValidating(true);
  //   try {
  //     await new Promise(resolve => setTimeout(resolve, 500));
  //     const validatorFiles = files.map(f => ({
  //       path: f.path,
  //       content: f.content,
  //       language: f.path.endsWith('.tsx') ? 'tsx' : 
  //                f.path.endsWith('.jsx') ? 'jsx' : 
  //                f.path.endsWith('.ts') ? 'ts' : 
  //                f.path.endsWith('.js') ? 'js' : 
  //                f.path.endsWith('.css') ? 'css' : 
  //                f.path.endsWith('.html') ? 'html' : 'text'
  //     }));
  //     const result = CodeQualityValidator.validateCodebase(validatorFiles, codeType);
  //     setValidationResult(result);
  //     console.log('Quality Validation Results:', {
  //       valid: result.valid,
  //       score: result.score,
  //       issuesCount: result.issues.length,
  //       criticalIssues: result.issues.filter(i => i.severity === 1).length
  //     });
  //     return result;
  //   } finally {
  //     setIsValidating(false);
  //   }
  // };

  // DISABLED: Auto-retry temporarily disabled for raw output analysis
  // const autoRetryWithBetterSettings = async (
  //   prompt: string, 
  //   codeType: string, 
  //   validationResult: ValidationResult
  // ): Promise<void> => {
  //   if (!autoRetry) {
  //     toast({
  //       title: "Quality validation failed",
  //       description: "Auto-retry is disabled. Enable it in settings to automatically improve code quality.",
  //       variant: "destructive"
  //     });
  //     addStatusMessage(`⚠️ Quality validation failed (Score: ${validationResult.score}/100). Auto-retry is disabled.`, "error");
  //     return;
  //   }
  //   if (retryCount >= maxRetries) {
  //     toast({
  //       title: "Maximum retry attempts reached",
  //       description: `Reached ${maxRetries} retry attempts. Please try a different approach or adjust settings.`,
  //       variant: "destructive"
  //     });
  //     return;
  //   }
  //   if (validationResult.score >= minQualityScore) {
  //     return;
  //   }
  //   setRetryCount(prev => prev + 1);
  //   let enhancedPrompt = `${prompt}\n\nIMPORTANT QUALITY REQUIREMENTS:\n`;
  //   if (validationResult.issues.some(i => i.category === 'structure')) {
  //     enhancedPrompt += '- ENSURE PROPER FILE STRUCTURE: ';
  //     if (codeType === 'react') {
  //       enhancedPrompt += 'Generate 25+ files: App.tsx, multiple components (Navbar, Hero, Features, Footer), design-tokens.css, tailwind.config, utils\n';
  //     } else if (codeType === 'vue') {
  //       enhancedPrompt += 'Generate multiple .vue components with proper structure\n';
  //     }
  //   }
  //   if (validationResult.issues.some(i => i.category === 'design')) {
  //     enhancedPrompt += '- MODERN DESIGN PATTERNS: Use CSS Grid/Flexbox, smooth animations, gradients, hover effects, responsive design\n';
  //   }
  //   if (validationResult.issues.some(i => i.category === 'modern')) {
  //     enhancedPrompt += '- MODERN DEVELOPMENT: Use semantic HTML, CSS custom properties, functional components\n';
  //   }
  //   if (validationResult.issues.some(i => i.category === 'accessibility')) {
  //     enhancedPrompt += '- ACCESSIBILITY: Include alt attributes, proper labels, heading hierarchy\n';
  //   }
  //   enhancedPrompt += '\nEMPHASIZE MODERN PROFESSIONAL DESIGN with production-ready quality standards.';
  //   toast({
  //     title: `Quality validation failed (Score: ${validationResult.score}/100)`,
  //     description: "Retrying with enhanced prompt...",
  //   });
  //   addStatusMessage(`🔄 Auto-retrying with quality improvements (Attempt ${retryCount + 1}/${maxRetries})...`, "status");
  //   await generateCode({
  //     prompt: enhancedPrompt,
  //     codeType,
  //     model: 'gpt-4o-mini',
  //     conversationId: conversationId || undefined
  //   });
  // };

  const handleSendMessage = async (text: string, files?: File[]) => {
    if (!text.trim()) return;

    // DISABLED: Validation reset disabled
    // setValidationResult(null);
    // setRetryCount(0);
    // setOriginalPrompt(text);

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
      // Determine code type - default to React for comprehensive multi-file apps
      const codeType = /vue/i.test(text) ? 'vue' : 'react';
      setCurrentCodeType(codeType);

      // Trigger code generation with detailed status
      addStatusMessage("🚀 Starting code generation...\n🤖 Using GPT-4o with 128K context window for highly intelligent code generation", "status");
      
      await generateCode({
        prompt: text,
        codeType,
        model: 'gpt-4o',
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
            model: 'gpt-4o'
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

  // DISABLED: Quality validation after generation temporarily disabled for raw output analysis
  // useEffect(() => {
  //   const runValidationAfterGeneration = async () => {
  //     if (generationPhase === 'complete' && generatedFiles.length > 0 && !isValidating) {
  //       addStatusMessage("🔍 Running quality validation...", "status");
  //       const validation = await runQualityValidation(generatedFiles, currentCodeType);
  //       if (!validation.valid) {
  //         addStatusMessage(
  //           `⚠️ Quality check failed (Score: ${validation.score}/100)\n\nIssues found:\n${validation.issues.slice(0, 3).map(i => `• ${i.message}`).join('\n')}${validation.issues.length > 3 ? `\n...and ${validation.issues.length - 3} more` : ''}`,
  //           "error"
  //         );
  //         await autoRetryWithBetterSettings(originalPrompt, currentCodeType, validation);
  //       } else {
  //         toast({
  //           title: "✅ Quality validation passed!",
  //           description: `Score: ${validation.score}/100`,
  //         });
  //         addStatusMessage(
  //           `✅ Quality validation passed! Score: ${validation.score}/100\n\nFiles generated: ${generatedFiles.map(f => f.path).join(', ')}`,
  //           "status"
  //         );
  //       }
  //     }
  //   };
  //   runValidationAfterGeneration();
  // }, [generationPhase, generatedFiles.length]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header - Lovable Style */}
      <Header />

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
              diagnosticInfo={diagnosticInfo}
              rawOutputAvailable={rawOutputAvailable}
              onRegenerate={() => {
                // DISABLED: Regenerate disabled during raw output analysis
                console.log("Regenerate disabled");
              }}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default ModuleStudio;
