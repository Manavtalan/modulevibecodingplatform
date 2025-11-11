import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Info, Sparkles } from 'lucide-react';

export const CenterNavigation: FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {/* My Projects */}
      <button
        onClick={() => navigate('/history')}
        className="px-5 py-2.5 rounded-xl backdrop-blur-md shadow-lg border transition-all duration-300 hover:scale-105 flex items-center gap-2"
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
      >
        <LayoutGrid className="w-[18px] h-[18px]" style={{ color: '#FFB347' }} />
        <span className="text-sm font-medium text-white">My Projects</span>
      </button>

      {/* About */}
      <button
        onClick={() => navigate('/about')}
        className="px-5 py-2.5 rounded-xl backdrop-blur-md shadow-lg border transition-all duration-300 hover:scale-105 flex items-center gap-2"
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
      >
        <Info className="w-[18px] h-[18px]" style={{ color: '#FFB347' }} />
        <span className="text-sm font-medium text-white">About</span>
      </button>

      {/* Prompts */}
      <button
        onClick={() => navigate('/prompts')}
        className="px-5 py-2.5 rounded-xl backdrop-blur-md shadow-lg border transition-all duration-300 hover:scale-105 flex items-center gap-2"
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
      >
        <Sparkles className="w-[18px] h-[18px]" style={{ color: '#FFB347' }} />
        <span className="text-sm font-medium text-white">Prompts</span>
      </button>
    </div>
  );
};