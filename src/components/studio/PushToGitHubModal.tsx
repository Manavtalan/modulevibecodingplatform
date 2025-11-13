import { useState, useEffect } from "react";
import { Github, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getCurrentProject } from "@/stores/projectStore";

interface PushToGitHubModalProps {
  open: boolean;
  onClose: () => void;
}

export const PushToGitHubModal = ({ open, onClose }: PushToGitHubModalProps) => {
  const { user } = useAuth();
  const [isGitHubConnected, setIsGitHubConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [pushing, setPushing] = useState(false);
  const [repoUrl, setRepoUrl] = useState<string | null>(null);

  // Form state
  const [repoName, setRepoName] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [branch, setBranch] = useState("main");
  const [commitMessage, setCommitMessage] = useState(
    "Initial commit from Module – Vibe Coding Platform"
  );

  // Initialize default repo name
  useEffect(() => {
    if (open) {
      const project = getCurrentProject();
      const timestamp = Date.now();
      setRepoName(`module-project-${project?.id.slice(0, 8) || timestamp}`);
    }
  }, [open]);

  // Check GitHub connection
  useEffect(() => {
    if (!open || !user) return;

    const checkGitHubConnection = async () => {
      setCheckingConnection(true);
      try {
        // Check if user has GitHub provider linked
        const { data: identities } = await supabase.auth.getUserIdentities();
        const hasGitHub = identities?.identities?.some(
          (identity) => identity.provider === "github"
        );
        setIsGitHubConnected(!!hasGitHub);
      } catch (error) {
        console.error("Error checking GitHub connection:", error);
        setIsGitHubConnected(false);
      } finally {
        setCheckingConnection(false);
      }
    };

    checkGitHubConnection();
  }, [open, user]);

  const handleConnectGitHub = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/studio`,
          scopes: "repo",
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("GitHub connection error:", error);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect to GitHub",
        variant: "destructive",
      });
    }
  };

  const handlePushToGitHub = async () => {
    if (!repoName.trim()) {
      toast({
        title: "Repository name required",
        description: "Please enter a repository name",
        variant: "destructive",
      });
      return;
    }

    setPushing(true);
    setRepoUrl(null);

    try {
      const project = getCurrentProject();
      
      // Call edge function to push to GitHub
      const { data, error } = await supabase.functions.invoke("push-to-github", {
        body: {
          project_id: project?.id,
          repo_name: repoName,
          visibility,
          branch,
          commit_message: commitMessage,
        },
      });

      if (error) throw error;

      if (data?.repo_url) {
        setRepoUrl(data.repo_url);
        toast({
          title: "Success!",
          description: "Project successfully pushed to GitHub",
        });
      }
    } catch (error: any) {
      console.error("Push to GitHub error:", error);
      toast({
        title: "Push failed",
        description: error.message || "Failed to push project to GitHub",
        variant: "destructive",
      });
    } finally {
      setPushing(false);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setRepoUrl(null);
    }
  }, [open]);

  if (checkingConnection) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // GitHub not connected view
  if (!isGitHubConnected) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              Connect GitHub
            </DialogTitle>
            <DialogDescription>
              Connect your GitHub account to push your Module project code.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-6">
            <Github className="h-16 w-16 text-muted-foreground" />
            <p className="text-sm text-center text-muted-foreground">
              You'll be redirected to GitHub to authorize access. We'll only request
              permissions needed to create repositories.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConnectGitHub} className="gap-2">
              <Github className="h-4 w-4" />
              Connect GitHub
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Success view with repo link
  if (repoUrl) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github className="h-5 w-5 text-green-500" />
              Successfully Pushed!
            </DialogTitle>
            <DialogDescription>
              Your project has been pushed to GitHub
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-6">
            <div className="rounded-full bg-green-500/10 p-3">
              <Github className="h-8 w-8 text-green-500" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Repository created successfully!</p>
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                View on GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Main push configuration view
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Push Project to GitHub
          </DialogTitle>
          <DialogDescription>
            Configure your repository and push your project code to GitHub
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Repository Name */}
          <div className="space-y-2">
            <Label htmlFor="repo-name">Repository Name</Label>
            <Input
              id="repo-name"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="module-project-12345"
              disabled={pushing}
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label htmlFor="visibility">Repository Visibility</Label>
            <Select
              value={visibility}
              onValueChange={(value: "private" | "public") => setVisibility(value)}
              disabled={pushing}
            >
              <SelectTrigger id="visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Private repositories are only visible to you
            </p>
          </div>

          {/* Branch Name */}
          <div className="space-y-2">
            <Label htmlFor="branch">Branch Name</Label>
            <Input
              id="branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              disabled={pushing}
            />
          </div>

          {/* Commit Message */}
          <div className="space-y-2">
            <Label htmlFor="commit-message">Commit Message</Label>
            <Textarea
              id="commit-message"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Initial commit from Module"
              rows={3}
              disabled={pushing}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pushing}>
            Cancel
          </Button>
          <Button onClick={handlePushToGitHub} disabled={pushing} className="gap-2">
            {pushing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Pushing...
              </>
            ) : (
              <>
                <Github className="h-4 w-4" />
                Push to GitHub
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
