import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Trash2, Copy, Edit2, Check, X } from "lucide-react";
import { ProjectMeta } from "@/stores/projectStore";
import { formatDistanceToNow } from "date-fns";

interface ProjectCardProps {
  project: ProjectMeta;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export function ProjectCard({ project, onOpen, onDelete, onDuplicate, onRename }: ProjectCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);

  const handleSave = () => {
    if (editName.trim() && editName !== project.name) {
      onRename(project.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(project.name);
    setIsEditing(false);
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {project.color && (
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: project.color }}
              />
            )}
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") handleCancel();
                  }}
                  className="h-8 text-lg font-semibold"
                  autoFocus
                />
                <Button size="icon" variant="ghost" onClick={handleSave} className="h-8 w-8">
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={handleCancel} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold truncate">{project.name}</h3>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="h-6 w-6 flex-shrink-0"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>

          {project.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {project.description}
            </p>
          )}

          <div className="flex items-center gap-2 mb-3">
            {project.model && (
              <Badge variant="secondary" className="text-xs">
                {project.model}
              </Badge>
            )}
            {project.stack && (
              <Badge variant="outline" className="text-xs">
                {project.stack}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
            </span>
            <span>•</span>
            <span>{formatTokens(project.tokensUsed)} tokens</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            onClick={() => onOpen(project.id)}
            className="gap-2"
          >
            <FolderOpen className="h-4 w-4" />
            Open
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDuplicate(project.id)}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Duplicate
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (confirm(`Delete "${project.name}"? This cannot be undone.`)) {
                onDelete(project.id);
              }
            }}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
