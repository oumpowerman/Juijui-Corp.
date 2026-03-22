
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FormSectionProps {
    title: string;
    icon: LucideIcon;
    colorClass: string;
    children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({ title, icon: Icon, colorClass, children }) => {
    return (
        <div className="space-y-4">
            <h3 className={`text-sm font-bold ${colorClass} uppercase tracking-widest flex items-center gap-2`}>
                <Icon className="w-5 h-5" /> {title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {children}
            </div>
        </div>
    );
};

export default FormSection;
