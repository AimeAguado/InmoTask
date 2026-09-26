import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  prefixText?: string;
  suffixText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      prefixText,
      suffixText,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700">
            {label}
            {props.required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center rounded-lg shadow-xs transition-colors">
          {leftIcon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          {prefixText && (
            <span className="inline-flex items-center px-3 border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-xs font-medium rounded-l-lg h-9.5">
              {prefixText}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={`w-full bg-white text-slate-900 text-sm rounded-lg border px-3 py-2 h-9.5 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-9' : ''
            } ${rightIcon ? 'pr-9' : ''} ${
              prefixText ? 'rounded-l-none' : ''
            } ${suffixText ? 'rounded-r-none' : ''} ${
              error
                ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500 text-rose-900'
                : 'border-slate-300 hover:border-slate-400'
            } ${className}`}
            {...props}
          />
          {suffixText && (
            <span className="inline-flex items-center px-3 border border-l-0 border-slate-300 bg-slate-50 text-slate-500 text-xs font-medium rounded-r-lg h-9.5">
              {suffixText}
            </span>
          )}
          {rightIcon && (
            <div className="absolute right-3 text-slate-400 flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
