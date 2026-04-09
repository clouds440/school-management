'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { GraduationCap, User as UserIcon } from 'lucide-react';
import { PLATFORM_NAME, DASHBOARD_MODULES } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
import { getPublicUrl } from '@/lib/utils';
import Link from 'next/link';
import { JwtPayload } from '@/context/GlobalContext';
import { Role } from '@/types';
import { useTheme } from '@/context/ThemeContext';

type BrandSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero';
type BrandIdentity = {
  id?: string;
  name?: string | null;
  userName?: string;
  orgName?: string;
  orgLogoUrl?: string | null;
  avatarUrl?: string | null;
  avatarUpdatedAt?: string | null;
  role?: Role;
  orgSlug?: string;
};

interface BrandIconProps {
  variant?: 'brand' | 'user';
  size?: BrandSize;
  className?: string;
  forcePlatform?: boolean;
  user?: BrandIdentity;
  initialsFallback?: boolean;
}

const failedBrandImageUrls = new Set<string>();

export const BrandIcon = React.memo(function BrandIcon({
  variant = 'brand',
  size = 'md',
  className = "",
  forcePlatform = false,
  user: externalUser,
  initialsFallback = false,
}: BrandIconProps) {
  const { user: sessionUser } = useAuth();
  const pathname = usePathname();

  const user: BrandIdentity | JwtPayload | null = externalUser || sessionUser;

  const segments = pathname?.split('/').filter(Boolean) || [];
  const isDashboardContext = segments.length >= 2 && DASHBOARD_MODULES.includes(segments[1]);
  const isOrgBrandingActive = !forcePlatform && isDashboardContext && user?.orgName;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
    hero: 'w-20 h-20',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
    xl: 'w-8 h-8',
    hero: 'w-12 h-12',
  };
  const initialsTextClasses: Record<BrandSize, string> = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    hero: 'text-3xl',
  };

  // Logic for Logo/Avatar
  const FallbackIcon = variant === 'brand' ? (isOrgBrandingActive ? GraduationCap : BrandLogoIcon) : UserIcon;
  const displayLogo = variant === 'brand'
    ? (isOrgBrandingActive ? (user?.orgLogoUrl ? getPublicUrl(user.orgLogoUrl, user.avatarUpdatedAt) : null) : null)
    : (user?.avatarUrl || user?.orgLogoUrl ? getPublicUrl(user.avatarUrl || user.orgLogoUrl, user.avatarUpdatedAt) : null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const shouldShowImage = !!displayLogo && failedSrc !== displayLogo && !failedBrandImageUrls.has(displayLogo);

  return (
    <div className={`rounded-full ${sizeClasses[size]} flex items-center justify-center shrink-0 ${className}`}>
      {shouldShowImage ? (
        <div className={`relative w-full h-full rounded-full overflow-hidden shadow-sm shadow-black/5 transition-transform group-hover:scale-110`}>
          <Image
            src={displayLogo}
            alt="Identity"
            fill
            className="object-cover"
            unoptimized
            onError={() => {
              if (displayLogo) failedBrandImageUrls.add(displayLogo);
              setFailedSrc(displayLogo);
            }}
          />
        </div>
      ) : (
        // When no image: if user variant and initialsFallback requested, render initials with deterministic color
        (variant === 'user' && (initialsFallback)) ? (
          (() => {
            const name = user?.name || user?.userName || '';

            // FNV-1a hash
            const fnv1aHash = (str: string) => {
              let h = 2166136261 >>> 0;
              for (let i = 0; i < str.length; i++) {
                h ^= str.charCodeAt(i);
                h = Math.imul(h, 16777619) >>> 0;
              }
              return h >>> 0;
            };

            const palette = [
              '#F97316', '#EF4444', '#0EA5E9', '#10B981', '#A78BFA', '#F59E0B', '#EC4899', '#60A5FA', '#34D399', '#FB7185', '#8B5CF6', '#06B6D4', '#F472B6', '#7C3AED', '#E11D48', '#EA580C', '#0EA5A4', '#0369A1', '#059669', '#A3E635'
            ];

            const seed = user?.id || name || 'anon';
            const color = palette[fnv1aHash(seed) % palette.length];

            const getInitials = (n: string) => {
              if (!n) return '?';
              const parts = n.trim().split(/\s+/).filter(Boolean);
              if (parts.length === 0) return '?';
              if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
              return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            };

            const initials = getInitials(name || seed || 'U');

            return (
              <div className={`w-full h-full flex items-center justify-center rounded-full shadow-lg shadow-primary/5 transition-transform group-hover:scale-110`} style={{ backgroundColor: color }}>
                <span className={`inline-flex items-center justify-center w-full h-full text-white font-bold ${initialsTextClasses[size]}`}>{initials}</span>
              </div>
            );
          })()
        ) : (
          <div className={`w-full h-full ${variant === 'brand' ? 'rotate-3 group-hover:rotate-0' : 'bg-primary/60'} flex items-center justify-center rounded-full shadow-lg shadow-primary/5 transition-transform group-hover:scale-110`}>
            <FallbackIcon className={`${iconSizes[size]} ${variant === 'brand' ? 'text-foreground' : 'text-primary'}`} />
          </div>
        )
      )}
    </div>
  );
});

interface BrandProps extends BrandIconProps {
  showName?: boolean;
  showLogo?: boolean;
  useGradient?: boolean;
  linkHref?: string;
  showNameOnly?: boolean;
}

export const Brand = React.memo(function Brand({
  variant = 'brand',
  showName = true,
  showLogo = true,
  useGradient = false,
  className = "",
  forcePlatform = false,
  size = 'md',
  linkHref,
  user,
}: BrandProps) {
  const { user: sessionUser } = useAuth();
  const pathname = usePathname();
  const { themeMode } = useTheme();

  const activeUser = user || sessionUser;

  const segments = pathname?.split('/').filter(Boolean) || [];
  const isDashboardContext = segments.length >= 2 && DASHBOARD_MODULES.includes(segments[1]);
  const isOrgBrandingActive = !forcePlatform && isDashboardContext && activeUser?.orgName;

  const displayName = isOrgBrandingActive ? activeUser.orgName : PLATFORM_NAME;
  const nameStyles = isOrgBrandingActive ? 'text-primary' : (useGradient ? 'text-transparent bg-clip-text bg-linear-to-r from-primary via-indigo-600 to-purple-600' : 'text-foreground');

  const sizeTextClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
    hero: 'text-5xl md:text-7xl',
  };

  const defaultHref = isDashboardContext ?
    activeUser?.orgSlug
      ? activeUser.role === Role.ORG_ADMIN
        ? `/${activeUser.orgSlug}/admin`
        : activeUser.role === Role.TEACHER || activeUser.role === Role.ORG_MANAGER
          ? `/${activeUser.orgSlug}/teachers/${activeUser.userName}`
          : `/${activeUser.orgSlug}/students/${activeUser.userName}`
      : '/'
    : '/';

  const content = (
    <div className={`inline-flex items-center space-x-3 group ${className}`}>
      {showLogo && (
        <BrandIcon variant={variant} size={size} forcePlatform={forcePlatform} user={user} />
      )}

      {showName && (
        isOrgBrandingActive ? (
          <span className={`font-black tracking-tighter ${nameStyles} ${sizeTextClasses[size]} transition-all duration-300`}>
            {displayName}
          </span>
        ) : (
          <img src="/assets/eduverse.png" alt={PLATFORM_NAME} 
          className={`${
            themeMode === 'DARK' ||
            (themeMode === 'SYSTEM' &&
              window.matchMedia('(prefers-color-scheme: dark)').matches)
              ? 'filter invert'
              : ''
            } object-contain transition-all duration-300 ${
              size === 'sm' ? 'h-5'
                : size === 'md' ? 'h-7'
                : size === 'lg' ? 'h-8'
                : size === 'xl' ? 'h-10'
                : 'h-16 md:h-28'
            }`}
          />
        )
      )}
    </div>
  );

  if (linkHref === null) return content;

  return (
    <Link href={linkHref || defaultHref} className="outline-none">
      {content}
    </Link>
  );
});

/**
 * Our new custom platform logo icon
 */
export function BrandLogoIcon() {
  return (
    <div className={`relative flex items-center justify-center`}>
      <img src="/assets/eduverse-icon.png" alt="Eduverse" className="w-full h-full object-contain" />
    </div>
  )
}
