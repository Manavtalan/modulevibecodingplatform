import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, Rocket } from 'lucide-react';
import ConversationHistory from '@/components/ConversationHistory';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface ProjectSidebarProps {
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  currentConversationId?: string;
  refreshKey: number;
}

const ProjectSidebar: FC<ProjectSidebarProps> = ({
  onNewConversation,
  onSelectConversation,
  currentConversationId,
  refreshKey,
}) => {
  return (
    <div className="glass-card h-full flex flex-col">
      {/* New Chat Button */}
      <div className="p-4 border-b border-border/50">
        <Button
          onClick={onNewConversation}
          className="w-full justify-start gap-2"
          variant="default"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {/* History Section */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted rounded-md transition-colors">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                History
              </div>
              <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <ConversationHistory
                key={refreshKey}
                onSelectConversation={onSelectConversation}
                onNewConversation={onNewConversation}
                currentConversationId={currentConversationId}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Deployed Projects Section */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted rounded-md transition-colors">
              <div className="flex items-center gap-2">
                <Rocket className="h-4 w-4" />
                Deployed Projects
              </div>
              <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                No deployed projects yet
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ProjectSidebar;
