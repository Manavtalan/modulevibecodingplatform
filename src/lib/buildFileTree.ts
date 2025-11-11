export type FileLeaf = { path: string; content?: string };

export type TreeNode = {
  name: string;
  path: string;
  type: "dir" | "file";
  children?: TreeNode[];
};

export function buildFileTree(files: FileLeaf[]): TreeNode {
  const root: TreeNode = { name: "", path: "", type: "dir", children: [] };

  for (const f of files) {
    const clean = f.path.replace(/^\/+/, "");
    if (!clean) continue;
    const parts = clean.split("/").filter(Boolean);
    let cur = root;

    parts.forEach((segment, i) => {
      const isFile = i === parts.length - 1 && !clean.endsWith("/");
      if (isFile) {
        cur.children!.push({ name: segment, path: clean, type: "file" });
      } else {
        let next = cur.children!.find(
          (c) => c.type === "dir" && c.name === segment
        );
        if (!next) {
          next = {
            name: segment,
            path: (cur.path ? cur.path + "/" : "") + segment,
            type: "dir",
            children: [],
          };
          cur.children!.push(next);
        }
        cur = next;
      }
    });
  }

  sortTree(root);
  return root;
}

const GROUP_ORDER = ["src", "public"]; // put these first at root

function sortTree(node: TreeNode) {
  if (!node.children) return;
  node.children.sort((a, b) => {
    // folders before files
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;

    // custom root ordering
    if (node.path === "") {
      const ai = GROUP_ORDER.indexOf(a.name);
      const bi = GROUP_ORDER.indexOf(b.name);
      if (ai !== -1 || bi !== -1) {
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      }
    }
    return a.name.localeCompare(b.name);
  });

  node.children.forEach(sortTree);
}
