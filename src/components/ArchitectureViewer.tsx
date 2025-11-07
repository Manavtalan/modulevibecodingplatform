// File: src/components/ArchitectureViewer.tsx
import React from 'react';
import { Folder, FileText, Package, Settings } from 'lucide-react';

interface ArchitectureViewerProps {
  files: Array<{ path: string; content: string; }>;
}

const ArchitectureViewer: React.FC<ArchitectureViewerProps> = ({ files }) => {
  const getFileIcon = (path: string) => {
    if (path.endsWith('.tsx')) return <FileText className="h-4 w-4 text-blue-500" />;
    if (path.endsWith('.css')) return <Settings className="h-4 w-4 text-green-500" />;
    if (path.endsWith('.ts')) return <Package className="h-4 w-4 text-orange-500" />;
    if (path.endsWith('.json')) return <Settings className="h-4 w-4 text-yellow-500" />;
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  const getComponentCategory = (path: string) => {
    if (path.includes('/layout/')) return 'Layout';
    if (path.includes('/sections/')) return 'Sections';
    if (path.includes('/ui/')) return 'UI Components';
    if (path.includes('/styles/')) return 'Styles';
    if (path.includes('/types/')) return 'Types';
    if (path.includes('/lib/')) return 'Utils';
    return 'Root';
  };

  const groupedFiles = files.reduce((acc, file) => {
    const category = getComponentCategory(file.path);
    if (!acc[category]) acc[category] = [];
    acc[category].push(file);
    return acc;
  }, {} as Record<string, typeof files>);

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Folder className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Component Architecture</h3>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedFiles).map(([category, categoryFiles]) => (
          <div key={category}>
            <h4 className="font-medium text-gray-700 mb-2 flex items-center">
              <Folder className="h-4 w-4 mr-2 text-gray-500" />
              {category} ({categoryFiles.length})
            </h4>
            <div className="ml-6 space-y-1">
              {categoryFiles.map((file, index) => {
                const lineCount = file.content.split('\n').length;
                const fileName = file.path.split('/').pop();
                
                return (
                  <div key={index} className="flex items-center justify-between py-1">
                    <div className="flex items-center space-x-2">
                      {getFileIcon(file.path)}
                      <span className="text-sm text-gray-700">{fileName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        lineCount <= 50 ? 'bg-green-100 text-green-800' :
                        lineCount <= 100 ? 'bg-yellow-100 text-yellow-800' :
                        lineCount <= 200 ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {lineCount} lines
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Architecture Quality Score */}
      <div className="mt-4 pt-4 border-t">
        <div className="text-sm text-gray-600">
          <strong>Architecture Quality:</strong>
          {Object.keys(groupedFiles).includes('Layout') && 
           Object.keys(groupedFiles).includes('Sections') && 
           Object.keys(groupedFiles).includes('UI Components') ? (
            <span className="text-green-600 ml-2">✓ Well Organized</span>
          ) : (
            <span className="text-red-600 ml-2">✗ Needs Organization</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchitectureViewer;
