import { FC } from 'react';
import logo from '@/assets/module-logo.png';

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
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24'
  };

  const animationClasses = animated 
    ? 'logo-float logo-hover cursor-pointer' 
    : 'transition-transform duration-300 hover:scale-105';

  return (
    <div className={`${sizeClasses[size]} ${animationClasses} ${className}`}>
      <img 
        src={logo} 
        alt="Module Logo" 
        className="w-full h-full object-contain filter drop-shadow-lg"
      />
    </div>
  );
};

export default Logo;