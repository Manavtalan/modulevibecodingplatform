import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { MODERN_DESIGN_EXAMPLES } from "./designExamples.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateCodeRequest {
  prompt: string;
  conversation_id?: string;
  model?: "claude-sonnet-4-5" | "gpt-4o" | "gpt-4o-mini" | "gpt-5-mini";
}

export interface FileMap {
  [path: string]: string;
}

interface GenerateCodeResponse {
  files: FileMap;
}

// Build system prompt with design system reference
function buildSystemPrompt(): string {
  return `You are the UI code generator for Module, an AI-powered vibe coding platform.

Stack:
- React + TypeScript + Vite + Tailwind CSS.

Important context:
- The project template (Vite config, Tailwind config, index.html, main.tsx, etc.) already exists and is correct.
- You MUST NOT generate or modify any config files, entrypoint HTML, or tooling files.
- Your ONLY job is to generate UI code for files inside \`src/\`, specifically:
  - \`src/App.tsx\`
  - \`src/components/*.tsx\`

Design language:
- Dark UI with a slate background (bg-slate-950) and indigo accents.
- Modern SaaS aesthetic similar to Linear, Vercel, and Lovable.
- Subtle glassmorphism: soft borders, soft shadows, glow accents.
- Use Tailwind CSS utility classes heavily.
- Always build fully responsive layouts (mobile-first, then tablet, then desktop).
- Use consistent spacing, typography, colors, and layout structure inspired by the design system provided in the user message.

VERY IMPORTANT OUTPUT RULES:

1. You MUST respond with a single JSON object of the exact shape:

{
  "files": {
    "src/App.tsx": "TSX CODE HERE",
    "src/components/ComponentName.tsx": "TSX CODE HERE",
    "src/components/AnotherComponent.tsx": "TSX CODE HERE"
  }
}

2. Do NOT wrap code in backticks.
3. Do NOT include markdown, comments, or any descriptive text outside the JSON.
4. Every file's value must be valid TypeScript React (TSX) code.
   - Example: \`export default function App() { ... }\`
5. You may ONLY import from:
   - "react"
   - Relative paths such as "./components/Hero" or "./components/Features"
6. You MUST NOT import from any external UI or icon libraries, e.g.:
   - lucide-react, shadcn/ui, framer-motion, "@/components", @radix-ui, clsx, tailwind-merge, etc.
7. You MUST NOT generate or reference:
   - package.json
   - tsconfig.json
   - vite.config.*
   - tailwind.config.*
   - index.html
   - src/main.tsx

If the user request is ambiguous, make reasonable assumptions and still produce a valid JSON object of the described shape.
`;
}

// Call model to get file map
async function callModelForFiles(
  userPrompt: string,
  model: string,
  anthropicKey?: string,
  openaiKey?: string
): Promise<FileMap> {
  const system = buildSystemPrompt();
  
  // Build structured user prompt with design examples
  const userRequestMessage = `User wants: ${userPrompt}

Generate a single-page UI (or appropriate layout) using React + TypeScript + Tailwind with:
- A clear structure.
- At least a navbar, a hero section, and some supporting sections (features / stats / CTA) when it's a landing page.
- The design language and patterns from the provided design system.

Remember: You only output the JSON { "files": { ... } } object, nothing else.`;

  const designExamples = {
    tokens: MODERN_DESIGN_EXAMPLES.tokens,
    components: MODERN_DESIGN_EXAMPLES.components,
  };

  // Use Claude by default
  if (model === 'claude-sonnet-4-5' && anthropicKey) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system,
        messages: [
          {
            role: 'user',
            content: JSON.stringify({
              designExamples,
              request: userRequestMessage,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-code] Anthropic API error:', response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[generate-code] Anthropic response received');

    // Extract text from response
    const textBlock = data.content?.find((block: any) => block.type === 'text');
    if (!textBlock?.text) {
      throw new Error('No text content in Anthropic response');
    }

    return parseAndValidateFileMap(textBlock.text);
  }

  // Use OpenAI for other models
  if (openaiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: model === 'gpt-4o' ? 'gpt-4o' : 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          {
            role: 'user',
            content: JSON.stringify({
              designExamples,
              request: userRequestMessage,
            }),
          },
        ],
        max_tokens: 4096,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-code] OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[generate-code] OpenAI response received');

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    return parseAndValidateFileMap(content);
  }

  throw new Error('No API key available for the selected model');
}

// Parse and validate the file map from model response
function parseAndValidateFileMap(rawText: string): FileMap {
  console.log('[generate-code] Parsing response...');
  
  // Clean up markdown if present
  let cleanedText = rawText.trim();
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  // Try to parse JSON
  let parsed: GenerateCodeResponse;
  try {
    parsed = JSON.parse(cleanedText);
  } catch (err) {
    console.error('[generate-code] Failed to parse JSON. Raw text:', cleanedText.substring(0, 500));
    throw new Error('Model did not return valid JSON');
  }

  // Validate structure
  if (!parsed.files || typeof parsed.files !== 'object') {
    console.error('[generate-code] Invalid structure:', parsed);
    throw new Error('Model JSON missing "files" object');
  }

  // BACKEND GUARD: Must have src/App.tsx
  if (typeof parsed.files['src/App.tsx'] !== 'string' && typeof parsed.files['/src/App.tsx'] !== 'string') {
    console.error('[generate-code] Missing src/App.tsx in:', Object.keys(parsed.files));
    throw new Error('Model did not include "src/App.tsx"');
  }

  // Sanitize: ensure all file contents are strings
  const sanitized: FileMap = {};
  for (const [path, content] of Object.entries(parsed.files)) {
    if (typeof content === 'string') {
      // BACKEND GUARD: Check content is not empty
      if (content.trim().length === 0) {
        console.error(`[generate-code] Empty file content in ${path}`);
        throw new Error(`Generated file is empty: ${path}`);
      }
      sanitized[path] = content;
    } else {
      console.error(`[generate-code] Invalid content type in ${path}:`, typeof content);
      throw new Error(`Invalid file content type in ${path}`);
    }
  }

  // Validate imports - reject broken imports
  for (const [path, content] of Object.entries(sanitized)) {
    if (!content) continue;

    // Check for invalid empty imports
    if (
      content.includes('from ""') ||
      content.includes("from ''") ||
      content.includes('from null') ||
      content.includes('import null')
    ) {
      console.error(`[generate-code] Invalid empty import in ${path}`);
      throw new Error(`Invalid imports in generated code: ${path}`);
    }

    // Check for markdown fences (AI forgot to extract)
    if (content.includes('```tsx') || content.includes('```typescript') || content.includes('```jsx')) {
      console.error(`[generate-code] Markdown fences in ${path}`);
      throw new Error(`Markdown code fences found in ${path} - model formatting error`);
    }

    // Check for forbidden third-party imports
    const forbiddenImports = [
      'lucide-react',
      'framer-motion',
      '@radix-ui',
      '@/components/ui',
      'clsx',
      'tailwind-merge',
      'shadcn',
    ];

    for (const forbidden of forbiddenImports) {
      if (content.includes(`from "${forbidden}"`) || content.includes(`from '${forbidden}'`)) {
        console.error(`[generate-code] Forbidden import "${forbidden}" in ${path}`);
        throw new Error(`Invalid imports in generated code: forbidden library "${forbidden}" in ${path}`);
      }
    }
  }

  console.log('[generate-code] Validation passed. Files:', Object.keys(sanitized));
  return sanitized;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing required environment variables');
    }

    if (!ANTHROPIC_API_KEY && !OPENAI_API_KEY) {
      throw new Error('No AI API keys configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt, model = 'claude-sonnet-4-5' } = await req.json() as GenerateCodeRequest;

    if (!prompt || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[generate-code] Request from user ${user.id}, model: ${model}`);
    console.log(`[generate-code] Prompt: ${prompt.substring(0, 100)}...`);

    // Check token quota
    const { data: tokenCheck } = await supabase.rpc('check_and_deduct_tokens', {
      _user_id: user.id,
      _tokens_to_use: 0
    });

    if (tokenCheck && !tokenCheck.allowed) {
      return new Response(JSON.stringify({
        error: '🚫 You have reached your 500,000 token usage limit. Please upgrade or contact support to continue using Module.',
        remaining: tokenCheck.remaining
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate files
    const files = await callModelForFiles(prompt, model, ANTHROPIC_API_KEY, OPENAI_API_KEY);

    // Log request to database
    const { error: logError } = await supabase.from('requests_log').insert({
      user_id: user.id,
      prompt,
      model_used: model,
      input_tokens: 0, // Will be updated if we track tokens
      output_tokens: 0,
      total_tokens: 0,
    });

    if (logError) {
      console.error('[generate-code] Failed to log request:', logError);
    }

    console.log(`[generate-code] Success! Generated ${Object.keys(files).length} files`);

    // Return the file map
    return new Response(
      JSON.stringify({ files } as GenerateCodeResponse),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[generate-code] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
