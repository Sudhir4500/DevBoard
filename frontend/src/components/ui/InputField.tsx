interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
  endAdornment?: React.ReactNode;
}

export default function InputField({
  label,
  placeholder,
  className,
  endAdornment,
  type,
  ...props
}: InputFieldProps) {
    const defaultClasses = "appearance-none block w-full px-4 py-3 bg-brand-dark border border-brand-border placeholder-slate-600 text-brand-text rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary transition-all sm:text-sm";
    const inputClasses = `${defaultClasses} ${className || ""}${endAdornment ? " pr-20" : ""}`.trim();
    return (
        <div>
            {label && (
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-text mb-2">{label}</label>
            )}
            <div className="relative">
                <input
                  type={type}
                  {...props}
                  className={inputClasses}
                  placeholder={placeholder}
                />
                {endAdornment && (
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    {endAdornment}
                  </div>
                )}
            </div>
        </div>
    )
}