import { FC } from 'react';
import { ProfileMenu } from './ProfileMenu';

export const TopNavbar: FC = () => {
  return (
    <div className="absolute top-6 right-8 z-50">
      <ProfileMenu />
    </div>
  );
};