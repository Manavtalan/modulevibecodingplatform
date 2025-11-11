/**
 * Prompt Type Detector
 * 
 * Classifies user prompts into categories:
 * - code_generation: User wants to generate/modify code
 * - question: User is asking a question or wants an explanation
 * - chat: Conversational or off-topic message
 */

export type PromptType = "code_generation" | "question" | "chat";

export function detectPromptType(message: string): PromptType {
  const lower = message.toLowerCase().trim();
  
  // Code generation indicators
  const codeKeywords = [
    'build', 'create', 'generate', 'write', 'make', 'add', 'implement',
    'develop', 'code', 'fix', 'update', 'modify', 'change', 'convert',
    'design', 'refactor', 'remove', 'delete', 'replace', 'integrate',
    'setup', 'configure', 'install', 'deploy'
  ];
  
  // Question indicators
  const questionKeywords = [
    'what', 'why', 'how', 'when', 'where', 'which', 'who',
    'explain', 'tell me', 'difference', 'compare', 'versus',
    'help', 'error', 'issue', 'problem', 'doesn\'t work',
    'not working', 'failed', 'broken', 'debug'
  ];
  
  // Chat/greeting indicators
  const chatKeywords = [
    'hello', 'hi', 'hey', 'good morning', 'good afternoon',
    'good evening', 'thanks', 'thank you', 'bye', 'goodbye'
  ];
  
  // Check for questions (highest priority for interrogative sentences)
  if (lower.includes('?')) {
    return 'question';
  }
  
  // Check for question keywords
  const hasQuestionKeyword = questionKeywords.some(keyword => 
    lower.startsWith(keyword) || lower.includes(` ${keyword} `)
  );
  if (hasQuestionKeyword) {
    return 'question';
  }
  
  // Check for chat/greetings
  const hasChatKeyword = chatKeywords.some(keyword => 
    lower.startsWith(keyword) || lower === keyword
  );
  if (hasChatKeyword && lower.split(' ').length < 10) {
    return 'chat';
  }
  
  // Check for code generation keywords
  const hasCodeKeyword = codeKeywords.some(keyword => 
    lower.startsWith(keyword) || lower.includes(` ${keyword} `)
  );
  if (hasCodeKeyword) {
    return 'code_generation';
  }
  
  // Default to question if uncertain (safer to explain than generate code)
  return 'question';
}

/**
 * Get a user-friendly description of what the AI will do based on prompt type
 */
export function getPromptTypeDescription(type: PromptType): string {
  switch (type) {
    case 'code_generation':
      return '🔨 Generating code...';
    case 'question':
      return '💬 Answering your question...';
    case 'chat':
      return '💬 Responding...';
  }
}
