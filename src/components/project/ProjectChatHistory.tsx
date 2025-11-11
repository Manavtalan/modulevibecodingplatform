import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2, MessageSquare } from "lucide-react";
import { ChatBubble } from "./ChatBubble";
import { getCurrentProject, subscribe, updateCurrent } from "@/stores/projectStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

export const ProjectChatHistory = () => {
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [projectName, setProjectName] = useState<string>("");

  useEffect(() => {
    const loadHistory = () => {
      const project = getCurrentProject();
      if (project) {
        setChatHistory(project.chat || []);
        setProjectName(project.name);
      }
    };

    loadHistory();

    // Subscribe to project changes
    const unsubscribe = subscribe(loadHistory);
    return unsubscribe;
  }, []);

  const handleClearHistory = () => {
    updateCurrent({ chat: [] });
    toast({
      title: "Chat history cleared",
      description: "All chat messages have been removed from this project.",
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Chat History</span>
          {chatHistory.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({chatHistory.length} messages)
            </span>
          )}
        </div>
        {chatHistory.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all chat messages from "{projectName}". 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearHistory}>
                  Clear History
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">
                No chat history yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Start chatting to see messages here!
              </p>
            </div>
          ) : (
            chatHistory.map((entry, idx) => (
              <ChatBubble
                key={idx}
                role={entry.role}
                text={entry.text}
                timestamp={entry.at}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
