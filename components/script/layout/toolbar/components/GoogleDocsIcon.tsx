import React from 'react';

export const GoogleDocsIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 36 36" fill="currentColor">
        <path fill="#4285F4" d="M21.5,2H7C5.62,2,4.5,3.12,4.5,4.5v27C4.5,32.88,5.62,34,7,34h22c1.38,0,2.5-1.12,2.5-2.5v-20L21.5,2z" />
        <path fill="#2979FF" d="M21.5,2v9.5H31L21.5,2z" />
        <rect x="9.5" y="16" fill="#FFFFFF" width="17" height="2" rx="0.5" />
        <rect x="9.5" y="21" fill="#FFFFFF" width="17" height="2" rx="0.5" />
        <rect x="9.5" y="26" fill="#FFFFFF" width="10" height="2" rx="0.5" />
    </svg>
);
