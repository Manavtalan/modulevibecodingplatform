import { FC } from 'react';
import logo from '@/assets/logo.png';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
}

const Logo: FC<LogoProps> = ({ 
  className = '', 
  size = 'md', 
  animated = true 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const animationClasses = animated 
    ? 'logo-float logo-hover cursor-pointer' 
    : 'transition-transform duration-300 hover:scale-105';

  return (
    <div className={`${sizeClasses[size]} ${animationClasses} ${className}`}>
      <img 
        src={logo} 
        alt="Coding Assistant Logo" 
        className="w-full h-full object-contain filter drop-shadow-lg"
      />
    </div>
  );
};

export default Logo;