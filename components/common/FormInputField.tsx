import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface FormInputFieldProps {
  id?: string;
  containerId?: string;
  label?: string;
  required?: boolean;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  type?: 'text' | 'email' | 'tel' | 'password' | 'number';
  value: string;
  onChange: (value: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  helperText?: React.ReactNode;
  showPasswordToggle?: boolean;
  isPasswordShown?: boolean;
  onTogglePassword?: () => void;
  autoComplete?: string;
  disabled?: boolean;
  inputClassName?: string;
  containerClassName?: string;
}

export const getInputClass = (hasError: boolean, extraClasses = '') => {
  const base = `w-full py-3 rounded-xl outline-none transition-all duration-300 font-bold text-sm ${extraClasses}`;
  
  if (hasError) {
    return `${base} bg-red-50/50 border-2 border-red-200 text-red-900 placeholder:text-red-350 focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-100 shadow-[0_0_10px_rgba(239,68,68,0.05)]`;
  }
  return `${base} bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-400 text-slate-700`;
};

export const FormInputField: React.FC<FormInputFieldProps> = ({
  id,
  containerId,
  label,
  required,
  icon,
  rightElement,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  showPasswordToggle,
  isPasswordShown,
  onTogglePassword,
  autoComplete,
  disabled = false,
  inputClassName = '',
  containerClassName = 'space-y-1',
}) => {
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (isPasswordShown ? 'text' : 'password') : type;
  const hasRightAction = showPasswordToggle || !!rightElement;
  
  const paddingLeft = icon ? 'pl-11' : 'pl-4';
  const paddingRight = hasRightAction ? 'pr-12' : 'pr-4';

  return (
    <div id={containerId} className={containerClassName}>
      {label && (
        <label htmlFor={id} className="text-xs font-bold text-slate-500 ml-1 uppercase">
          {label} {required && '*'}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={effectiveType}
          value={value}
          onChange={(e) => onChange(e.target.value, e)}
          disabled={disabled}
          autoComplete={autoComplete}
          className={getInputClass(
            !!error, 
            `${paddingLeft} ${paddingRight} ${isPassword ? '[&::-ms-reveal]:hidden [&::-webkit-password-reveal-button]:hidden' : ''} ${inputClassName}`
          )}
          placeholder={placeholder}
        />
        {showPasswordToggle && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            tabIndex={-1}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors outline-none focus:ring-0 z-20"
          >
            {isPasswordShown ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
        {!showPasswordToggle && rightElement && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
            {rightElement}
          </div>
        )}
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

export default FormInputField;
