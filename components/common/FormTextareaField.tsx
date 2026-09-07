import React from 'react';

export interface FormTextareaFieldProps {
  id?: string;
  containerId?: string;
  label?: string;
  required?: boolean;
  icon?: React.ReactNode;
  value: string;
  onChange: (value: string, e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  error?: string;
  rows?: number;
  helperText?: React.ReactNode;
  disabled?: boolean;
  textareaClassName?: string;
  containerClassName?: string;
}

export const FormTextareaField: React.FC<FormTextareaFieldProps> = ({
  id,
  containerId,
  label,
  required,
  icon,
  value,
  onChange,
  placeholder,
  error,
  rows = 2,
  helperText,
  disabled = false,
  textareaClassName = '',
  containerClassName = 'space-y-1',
}) => {
  const paddingLeft = icon ? 'pl-11' : 'pl-4';

  return (
    <div id={containerId} className={containerClassName}>
      {label && (
        <label htmlFor={id} className="text-xs font-bold text-slate-500 ml-1 uppercase">
          {label} {required && '*'}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-4 z-10 pointer-events-none text-slate-400 group-focus-within:text-pink-500 transition-colors">
            {icon}
          </div>
        )}
        <textarea
          id={id}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value, e)}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full ${paddingLeft} pr-4 py-3 rounded-xl outline-none transition-all duration-300 font-medium text-slate-700 text-sm resize-none ${
            error
              ? 'bg-red-50/50 border-2 border-red-200 text-red-900 placeholder:text-red-350 focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-100 shadow-[0_0_10px_rgba(239,68,68,0.05)]'
              : 'bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-400 text-slate-700'
          } ${textareaClassName}`}
        />
      </div>
      {error ? (
        <p className="text-xs font-bold text-red-500 mt-1 ml-1 animate-in fade-in duration-300">
          {error}
        </p>
      ) : helperText ? (
        <div className="text-[10px] text-slate-400 mt-0.5 ml-1">
          {helperText}
        </div>
      ) : null}
    </div>
  );
};

export default FormTextareaField;
