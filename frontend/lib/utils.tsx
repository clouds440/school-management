import { School } from 'lucide-react';
import { API_BASE_URL } from './api';

export const API_BASE = API_BASE_URL?.replace('/api', '') ?? '';

interface OrgLogoOrIconProps {
    logoUrl?: string | null;
    orgName?: string | null;
    className?: string;
}

export function OrgLogoOrIcon({ logoUrl, orgName, className }: OrgLogoOrIconProps) {
    const isValidUrl = logoUrl && logoUrl.startsWith('/uploads/');
    
    if (isValidUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={`${API_BASE}${logoUrl}`}
                alt={orgName ?? 'Org logo'}
                className={className || "w-8 h-8 md:w-9 md:h-9 rounded-full object-cover ring-2 ring-primary/20 shrink-0"}
            />
        );
    }
    
    return (
        <div className={className || "bg-primary/10 p-2 md:p-2.5 rounded-sm group-hover:bg-primary/20 group-hover:scale-105 group-focus-visible:ring-2 ring-primary transition-all duration-300 shrink-0"}>
            <School className="w-6 h-6 md:w-7 md:h-7 text-primary" />
        </div>
    );
}
