import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectHistoryPage } from '@/components/history/ProjectHistoryPage';
import { ArrowLeft } from 'lucide-react';

const History: FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <ArrowLeft className="w-4 h-4" style={{ color: '#FFB347' }} />
            <span className="text-sm font-medium text-white">Back to Dashboard</span>
          </button>
        </div>
      </div>
      
      <ProjectHistoryPage />
    </div>
  );
};

export default History;
