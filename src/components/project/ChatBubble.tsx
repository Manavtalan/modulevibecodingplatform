import { formatDistanceToNow } from "date-fns";
import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

export const ChatBubble = ({ role, text, timestamp }: ChatBubbleProps) => {
  const isUser = role === "user";
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true });

  return (
    <div className={cn(
      "flex gap-3 p-3 rounded-lg transition-colors",
      isUser ? "bg-primary/10" : "bg-muted/50"
    )}>
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium">
            {isUser ? "You" : "Module"}
          </span>
          <span className="text-xs text-muted-foreground">
            {timeAgo}
          </span>
        </div>
        <p className="text-sm whitespace-pre-wrap break-words">
          {text}
        </p>
      </div>
    </div>
  );
};
