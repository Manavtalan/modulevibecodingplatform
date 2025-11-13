import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushRequest {
  project_id: string;
  repo_name: string;
  visibility: 'private' | 'public';
  branch: string;
  commit_message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get GitHub access token from user identities
    const { data: identities } = await supabaseClient.auth.getUserIdentities();
    const githubIdentity = identities?.identities?.find(
      (identity) => identity.provider === 'github'
    );

    if (!githubIdentity) {
      throw new Error('GitHub account not connected');
    }

    const githubToken = githubIdentity.identity_data?.provider_token;
    if (!githubToken) {
      throw new Error('GitHub access token not found');
    }

    // Parse request body
    const body: PushRequest = await req.json();
    const { repo_name, visibility, branch, commit_message } = body;

    console.log('Creating GitHub repository:', repo_name);

    // Get GitHub username
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Module-Vibe-Coding-Platform',
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get GitHub user info');
    }

    const githubUser = await userResponse.json();
    const githubUsername = githubUser.login;

    // Create repository
    const createRepoResponse = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Module-Vibe-Coding-Platform',
      },
      body: JSON.stringify({
        name: repo_name,
        private: visibility === 'private',
        auto_init: false,
        description: 'Project created with Module – Vibe Coding Platform',
      }),
    });

    if (!createRepoResponse.ok) {
      const errorData = await createRepoResponse.json();
      if (createRepoResponse.status === 422 && errorData.errors?.some((e: any) => e.message?.includes('already exists'))) {
        throw new Error(`Repository "${repo_name}" already exists. Please choose a different name.`);
      }
      throw new Error(`Failed to create repository: ${errorData.message || 'Unknown error'}`);
    }

    const repoData = await createRepoResponse.json();
    console.log('Repository created:', repoData.html_url);

    // Get project files from conversations/generated code
    // For now, we'll use example files. In production, you'd fetch actual generated files
    const projectFiles = await getProjectFiles(supabaseClient, user.id, body.project_id);

    // Create a tree of files
    const treeItems = projectFiles.map((file) => ({
      path: file.path,
      mode: '100644',
      type: 'blob',
      content: file.content,
    }));

    // Create blobs for each file
    const blobShas: { [key: string]: string } = {};
    for (const item of treeItems) {
      const blobResponse = await fetch(
        `https://api.github.com/repos/${githubUsername}/${repo_name}/git/blobs`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'Module-Vibe-Coding-Platform',
          },
          body: JSON.stringify({
            content: item.content,
            encoding: 'utf-8',
          }),
        }
      );

      if (!blobResponse.ok) {
        console.error('Failed to create blob for', item.path);
        continue;
      }

      const blobData = await blobResponse.json();
      blobShas[item.path] = blobData.sha;
    }

    // Create tree
    const tree = Object.entries(blobShas).map(([path, sha]) => ({
      path,
      mode: '100644',
      type: 'blob',
      sha,
    }));

    const treeResponse = await fetch(
      `https://api.github.com/repos/${githubUsername}/${repo_name}/git/trees`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Module-Vibe-Coding-Platform',
        },
        body: JSON.stringify({ tree }),
      }
    );

    if (!treeResponse.ok) {
      throw new Error('Failed to create git tree');
    }

    const treeData = await treeResponse.json();

    // Create commit
    const commitResponse = await fetch(
      `https://api.github.com/repos/${githubUsername}/${repo_name}/git/commits`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Module-Vibe-Coding-Platform',
        },
        body: JSON.stringify({
          message: commit_message,
          tree: treeData.sha,
        }),
      }
    );

    if (!commitResponse.ok) {
      throw new Error('Failed to create commit');
    }

    const commitData = await commitResponse.json();

    // Update reference (create branch)
    const refResponse = await fetch(
      `https://api.github.com/repos/${githubUsername}/${repo_name}/git/refs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Module-Vibe-Coding-Platform',
        },
        body: JSON.stringify({
          ref: `refs/heads/${branch}`,
          sha: commitData.sha,
        }),
      }
    );

    if (!refResponse.ok) {
      throw new Error('Failed to create branch reference');
    }

    console.log('Successfully pushed to GitHub');

    return new Response(
      JSON.stringify({
        success: true,
        repo_url: repoData.html_url,
        message: 'Project successfully pushed to GitHub',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Push to GitHub error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to push to GitHub',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

// Helper function to get project files
async function getProjectFiles(supabaseClient: any, userId: string, projectId: string) {
  // For now, return sample project structure
  // In production, you'd fetch actual generated files from your database or storage
  
  const files = [
    {
      path: 'README.md',
      content: `# Module Project

This project was created with Module – Vibe Coding Platform.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Features

- Built with React + Vite
- TypeScript support
- Modern UI components
- AI-powered code generation

Generated on: ${new Date().toISOString()}
`,
    },
    {
      path: 'package.json',
      content: JSON.stringify({
        name: 'module-project',
        version: '0.1.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'tsc && vite build',
          preview: 'vite preview',
        },
        dependencies: {
          react: '^18.3.1',
          'react-dom': '^18.3.1',
        },
        devDependencies: {
          '@types/react': '^18.3.3',
          '@types/react-dom': '^18.3.0',
          '@vitejs/plugin-react': '^4.3.1',
          typescript: '^5.5.3',
          vite: '^5.3.4',
        },
      }, null, 2),
    },
    {
      path: '.gitignore',
      content: `# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage

# Production
build
dist

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode
.idea
*.swp
*.swo
`,
    },
    {
      path: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Module Project</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    },
    {
      path: 'src/main.tsx',
      content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`,
    },
    {
      path: 'src/App.tsx',
      content: `import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>Module Project</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Created with Module – Vibe Coding Platform
        </p>
      </div>
    </div>
  )
}

export default App
`,
    },
    {
      path: 'src/index.css',
      content: `:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}
`,
    },
    {
      path: 'src/App.css',
      content: `#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}
`,
    },
    {
      path: 'tsconfig.json',
      content: JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true,
        },
        include: ['src'],
        references: [{ path: './tsconfig.node.json' }],
      }, null, 2),
    },
    {
      path: 'vite.config.ts',
      content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`,
    },
  ];

  return files;
}
