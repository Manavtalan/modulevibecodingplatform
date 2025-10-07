interface ChatMessageProps {
  message: string;
  isUser: boolean;
}

const ChatMessage = ({ message, isUser }: ChatMessageProps) => {
  return (
    <div
      className={`flex mb-4 animate-fade-in ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[80%] ${
          isUser
            ? "bg-gradient-orange text-white rounded-2xl rounded-tr-sm px-4 py-3"
            : "bg-transparent border-l-2 border-[hsl(var(--accent))] pl-4 py-3"
        }`}
      >
        <p className={`text-sm ${isUser ? "text-white" : "text-foreground"}`}>
          {message}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
