import { useMemo, useState } from "react";
import { buildFileTree, TreeNode } from "@/lib/buildFileTree";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { ChevronRight, ChevronDown } from "lucide-react";

type GeneratedFile = { path: string; content?: string };

type Props = {
  files: GeneratedFile[];
  activePath?: string | null;
  onOpen: (path: string) => void;
};

export default function FileExplorer({ files, activePath, onOpen }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({
    "": true,
    "src": true,
    "public": true,
  });

  const tree = useMemo(() => buildFileTree(files), [files]);

  const match = (name: string) =>
    !query || name.toLowerCase().includes(query.toLowerCase());

  return (
    <div className="flex h-full flex-col">
      <Input
        className="mb-3 h-9 bg-background"
        placeholder="Search files..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ScrollArea className="flex-1">
        <Tree
          node={tree}
          open={open}
          setOpen={setOpen}
          onOpen={onOpen}
          activePath={activePath}
          query={query}
          match={match}
        />
      </ScrollArea>
    </div>
  );
}

function Tree({
  node,
  open,
  setOpen,
  onOpen,
  activePath,
  query,
  match,
}: {
  node: TreeNode;
  open: Record<string, boolean>;
  setOpen: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onOpen: (path: string) => void;
  activePath?: string | null;
  query: string;
  match: (name: string) => boolean;
}) {
  if (!node.children) return null;

  return (
    <ul className={node.path === "" ? "space-y-0.5" : "ml-3 space-y-0.5 mt-0.5"}>
      {node.children
        .filter((c) => (c.type === "dir" ? true : match(c.name)))
        .map((child) =>
          child.type === "dir" ? (
            <li key={child.path}>
              <button
                className="flex w-full items-center gap-1 rounded px-2 py-1 text-sm hover:bg-muted transition-colors"
                onClick={() =>
                  setOpen((o) => ({ ...o, [child.path]: !o[child.path] }))
                }
                title={child.path}
              >
                {open[child.path] ? (
                  <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
                )}
                <span className="opacity-90 font-medium">{child.name}</span>
              </button>
              {open[child.path] && (
                <Tree
                  node={child}
                  open={open}
                  setOpen={setOpen}
                  onOpen={onOpen}
                  activePath={activePath}
                  query={query}
                  match={match}
                />
              )}
            </li>
          ) : (
            <li key={child.path}>
              <button
                className={`flex w-full items-center gap-1.5 rounded px-2 py-1 text-sm transition-colors ${
                  activePath === child.path
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
                onClick={() => onOpen(child.path)}
                title={child.path}
              >
                <span className="inline-block w-3.5 flex-shrink-0 text-center text-xs opacity-70">
                  {fileIcon(child.path)}
                </span>
                <span className="truncate">{child.name}</span>
              </button>
            </li>
          )
        )}
    </ul>
  );
}

function fileIcon(p: string) {
  const ext = p.split(".").pop() || "";
  if (p.endsWith(".tsx") || p.endsWith(".ts")) return "𝑻";
  if (ext === "js" || ext === "jsx") return "JS";
  if (ext === "css") return "≋";
  if (ext === "json") return "{}";
  if (ext === "html") return "⌂";
  if (ext === "md") return "ℳ";
  return "•";
}
