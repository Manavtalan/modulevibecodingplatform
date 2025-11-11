import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, LayoutGrid, Info, Sparkles } from 'lucide-react';
import { ProfileMenu } from './ProfileMenu';

interface TopNavbarProps {
  onNewChat?: () => void;
}

export const TopNavbar: FC<TopNavbarProps> = ({ onNewChat }) => {
  const navigate = useNavigate();

  return (
    <div className="absolute top-6 right-8 flex items-center gap-3 z-50">
      {/* New Chat */}
      <button
        onClick={onNewChat}
        className="group px-4 py-2.5 rounded-xl backdrop-blur-md shadow-lg border transition-all duration-300 hover:scale-105 flex items-center gap-2"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        }}
        title="Start a new chat"
      >
        <MessageCircle className="w-[18px] h-[18px]" style={{ color: '#FFB347' }} />
        <span className="text-sm font-medium text-white hidden sm:inline">New Chat</span>
      </button>

      {/* My Projects */}
      <button
        onClick={() => navigate('/history')}
        className="group px-4 py-2.5 rounded-xl backdrop-blur-md shadow-lg border transition-all duration-300 hover:scale-105 flex items-center gap-2"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        }}
        title="View all projects"
      >
        <LayoutGrid className="w-[18px] h-[18px]" style={{ color: '#FFB347' }} />
        <span className="text-sm font-medium text-white hidden sm:inline">My Projects</span>
      </button>

      {/* About */}
      <button
        onClick={() => navigate('/about')}
        className="group px-4 py-2.5 rounded-xl backdrop-blur-md shadow-lg border transition-all duration-300 hover:scale-105 flex items-center gap-2"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        }}
        title="About Module"
      >
        <Info className="w-[18px] h-[18px]" style={{ color: '#FFB347' }} />
        <span className="text-sm font-medium text-white hidden sm:inline">About</span>
      </button>

      {/* Prompts */}
      <button
        onClick={() => navigate('/prompts')}
        className="group px-4 py-2.5 rounded-xl backdrop-blur-md shadow-lg border transition-all duration-300 hover:scale-105 flex items-center gap-2"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        }}
        title="Browse prompts library"
      >
        <Sparkles className="w-[18px] h-[18px]" style={{ color: '#FFB347' }} />
        <span className="text-sm font-medium text-white hidden sm:inline">Prompts</span>
      </button>

      {/* Profile Menu */}
      <ProfileMenu />
    </div>
  );
};