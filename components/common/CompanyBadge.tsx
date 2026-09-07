import React from 'react';
import { Building2 } from 'lucide-react';
import { Company } from '../../types';
import { useCompanies } from '../../hooks/useCompanies';

interface CompanyBadgeProps {
    company?: Company | null;
    companyId?: string | null;
    companyName?: string | null;
    companyShortName?: string | null;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    showIcon?: boolean;
    showFullName?: boolean;
    className?: string;
    /** Force display even if activeCompanies <= 1 (e.g. in Company Master Data previews) */
    forceShow?: boolean;
}

// Fallback color mapping based on shortName if color class isn't explicitly defined
const getFallbackColors = (nameOrCode: string = '') => {
    const code = nameOrCode.toUpperCase().trim();
    if (code.includes('JJ') || code.includes('JUIJUI') || code.includes('จุ๋ยจุ๋ย')) {
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
    }
    if (code.includes('JP') || code.includes('JUIPROD') || code.includes('โปรดักชั่น')) {
        return 'bg-pink-50 text-pink-700 border-pink-200/80';
    }
    if (code.includes('MM') || code.includes('MEMEE') || code.includes('มีมี่')) {
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200/80';
};

export const CompanyBadge: React.FC<CompanyBadgeProps> = ({
    company,
    companyId,
    companyName,
    companyShortName,
    size = 'xs',
    showIcon = false,
    showFullName = false,
    className = '',
    forceShow = false
}) => {
    const { activeCompanies } = useCompanies();

    // Auto-hide if only 1 (or 0) active company in single-company mode, unless forceShow is true
    if (!forceShow && activeCompanies.length <= 1) {
        return null;
    }

    const displayName = company?.name || companyName || '';
    const displayShort = company?.shortName || companyShortName || company?.code || (displayName ? displayName.slice(0, 3) : 'JJ');
    const colorClasses = company?.color || getFallbackColors(displayShort || displayName);

    const sizeClasses = {
        xs: 'text-[10px] px-1.5 py-0.5 rounded-md font-bold tracking-wider',
        sm: 'text-xs px-2 py-0.5 rounded-lg font-bold tracking-wider',
        md: 'text-xs px-2.5 py-1 rounded-lg font-bold tracking-wide',
        lg: 'text-sm px-3 py-1.5 rounded-xl font-bold tracking-wide'
    }[size];

    return (
        <span 
            title={displayName ? `สังกัดบริษัท: ${displayName}` : undefined}
            className={`inline-flex items-center gap-1 border shrink-0 uppercase select-none transition-all shadow-xs ${colorClasses} ${sizeClasses} ${className}`}
        >
            {showIcon && <Building2 className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />}
            <span>{showFullName && displayName ? displayName : displayShort}</span>
        </span>
    );
};

export default CompanyBadge;

