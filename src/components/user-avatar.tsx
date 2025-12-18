"use client";

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { getUserSettings } from '@/lib/settings-api';
import { 
  User, 
  Shield, 
  Stethoscope, 
  Users, 
  UserCheck 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  className?: string;
  fallbackClassName?: string;
}

const ROLE_ICONS = {
  admin: Shield,
  secretary: Users,
  doctor: Stethoscope,
  patient: UserCheck,
};

const ROLE_COLORS = {
  admin: 'bg-red-100 text-red-600 border-red-200',
  secretary: 'bg-blue-100 text-blue-600 border-blue-200',
  doctor: 'bg-green-100 text-green-600 border-green-200',
  patient: 'bg-purple-100 text-purple-600 border-purple-200',
};

const SIZE_CLASSES = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const ICON_SIZE_CLASSES = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

export function UserAvatar({ 
  size = 'md', 
  showName = false,
  className,
  fallbackClassName 
}: UserAvatarProps) {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAvatar = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const settings = await getUserSettings();
        if (settings.profile.avatar) {
          // Construct full URL if needed
          let url = settings.profile.avatar;
          if (url && !url.startsWith('http')) {
            const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            url = `${base}${url.startsWith('/') ? '' : '/'}${url}`;
          }
          setAvatarUrl(url);
        }
      } catch (error) {
        // Avatar loading is non-critical - fail silently
        if (process.env.NODE_ENV === 'development') {
          console.debug('Avatar not available:', error instanceof Error ? error.message : 'Unknown error');
        }
      } finally {
        setLoading(false);
      }
    };

    loadAvatar();
  }, [user]);

  if (!user) return null;

  const getUserInitials = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.username[0]?.toUpperCase() || 'U';
  };

  const RoleIcon = ROLE_ICONS[user.role] || User;
  const roleColor = ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600 border-gray-200';
  const sizeClass = SIZE_CLASSES[size];
  const iconSizeClass = ICON_SIZE_CLASSES[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Avatar className={cn(sizeClass, "border-2", roleColor.split(' ')[2])}>
        <AvatarImage 
          src={avatarUrl || undefined} 
          alt={user.username}
          className="object-cover"
        />
        <AvatarFallback className={cn(roleColor, "font-semibold")}>
          {avatarUrl ? (
            <User className={iconSizeClass} />
          ) : (
            <RoleIcon className={iconSizeClass} />
          )}
        </AvatarFallback>
      </Avatar>
      {showName && (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.username}
          </span>
        </div>
      )}
    </div>
  );
}

