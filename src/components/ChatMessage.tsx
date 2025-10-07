interface ChatMessageProps {
  message: string;
  isUser: boolean;
}

const ChatMessage = ({ message, isUser }: ChatMessageProps) => {
  return (
    <div
      className={`flex mb-6 animate-fade-in ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[80%] ${
          isUser
            ? "rounded-2xl rounded-tr-sm px-5 py-3.5"
            : "border-l-2 pl-4 py-3"
        }`}
        style={
          isUser
            ? {
                backgroundColor: "#2A2A2A",
                color: "#FFFFFF",
              }
            : {
                borderColor: "#FF7A18",
                background: "transparent",
                boxShadow: "0 0 20px rgba(255, 122, 24, 0.1)",
              }
        }
      >
        <p 
          className={`text-sm leading-relaxed ${
            isUser ? "text-white" : "text-white/90"
          }`}
          style={{
            fontFamily: 'Inter, system-ui, sans-serif'
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
