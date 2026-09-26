import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  showCount?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      showCount = false,
      maxLength,
      className = '',
      id,
      value,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const textareaId =
      id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full space-y-1.5 text-left">
        <div className="flex items-center justify-between">
          {label && (
            <label htmlFor={textareaId} className="block text-xs font-semibold text-slate-700">
              {label}
              {props.required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
          )}
          {showCount && maxLength && (
            <span className="text-[11px] text-slate-400 font-mono tabular-nums">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
        <textarea
          id={textareaId}
          ref={ref}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          className={`w-full bg-white text-slate-900 text-sm rounded-lg border p-3 min-h-[90px] transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
            error
              ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500 text-rose-900'
              : 'border-slate-300 hover:border-slate-400'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
