'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { GraduationCap, Sparkles, User as UserIcon } from 'lucide-react';
import { PLATFORM_NAME, DASHBOARD_MODULES } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
import { getPublicUrl } from '@/lib/utils';
import Link from 'next/link';
import { JwtPayload } from '@/context/GlobalContext';
import { Role } from '@/types';

type BrandSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero';

interface BrandIconProps {
  variant?: 'brand' | 'user';
  size?: BrandSize;
  className?: string;
  forcePlatform?: boolean;
  user?: Partial<JwtPayload> | any; // Supports both session user and external user data from APIs
}

export function BrandIcon({
  variant = 'brand',
  size = 'md',
  className = "",
  forcePlatform = false,
  user: externalUser
}: BrandIconProps) {
  const { user: sessionUser } = useAuth();
  const pathname = usePathname();

  const user = externalUser || sessionUser;

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

  // Logic for Logo/Avatar
  let displayLogo: string | null = null;
  let FallbackIcon = variant === 'brand' ? (isOrgBrandingActive ? GraduationCap : BrandLogoIcon) : UserIcon;

  if (variant === 'brand') {
    displayLogo = isOrgBrandingActive ? (user?.orgLogoUrl ? getPublicUrl(user.orgLogoUrl, user.avatarUpdatedAt) : null) : null;
  } else {
    displayLogo = user?.avatarUrl || user?.orgLogoUrl ? getPublicUrl(user.avatarUrl || user.orgLogoUrl, user.avatarUpdatedAt) : null;
  }

  return (
    <div className={`rounded-full ${sizeClasses[size]} flex items-center justify-center shrink-0 ${className}`}>
      {displayLogo ? (
        <div className={`relative w-full h-full rounded-full overflow-hidden shadow-sm shadow-black/5 transition-transform group-hover:scale-110`}>
          <Image
            src={displayLogo}
            alt="Identity"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className={`w-full h-full ${variant === 'brand' ? 'rotate-3 group-hover:rotate-0' : 'bg-primary/60'} flex items-center justify-center rounded-full shadow-lg shadow-primary/5 transition-transform group-hover:scale-110`}>
          <FallbackIcon className={`${iconSizes[size]} ${variant === 'brand' ? 'text-foreground' : 'text-primary'}`} />
        </div>
      )}
    </div>
  );
}

interface BrandProps extends BrandIconProps {
  showName?: boolean;
  showLogo?: boolean;
  useGradient?: boolean;
  linkHref?: string;
  showNameOnly?: boolean;
}

export function Brand({
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
          <img src="/assets/eduverse.png" alt={PLATFORM_NAME} className={`object-contain transition-all duration-300 ${size === 'sm' ? 'h-5' : size === 'md' ? 'h-7' : size === 'lg' ? 'h-8' : size === 'xl' ? 'h-10' : 'h-16 md:h-28'}`} />
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
}

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
