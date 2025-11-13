import { useState } from "react";
import { Settings, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PushToGitHubModal } from "./PushToGitHubModal";

export const ChatSettings = () => {
  const [showPushModal, setShowPushModal] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setShowPushModal(true)}>
            <Github className="mr-2 h-4 w-4" />
            <span>Push Project to GitHub</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PushToGitHubModal 
        open={showPushModal} 
        onClose={() => setShowPushModal(false)} 
      />
    </>
  );
};
