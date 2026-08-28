import { forwardRef, type InputHTMLAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, hint, error, id, className = '', ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-[8px]">
        <label
          htmlFor={inputId}
          className="font-mono text-[10px] font-bold uppercase tracking-label text-ghost/70"
        >
          {label}
        </label>
        <input
          id={inputId}
          ref={ref}
          className={`bg-transparent border rounded-button px-[15px] py-[10px] font-mono text-[16px] text-ghost placeholder:text-ghost/30 outline-none transition-colors duration-150 ${
            error ? 'border-kippo-pink' : 'border-ash focus:border-ghost'
          } ${className}`}
          {...props}
        />
        {error ? (
          <span className="font-mono text-[10px] text-kippo-pink">{error}</span>
        ) : hint ? (
          <span className="font-mono text-[10px] text-ghost/40">{hint}</span>
        ) : null}
      </div>
    )
  },
)

TextField.displayName = 'TextField'

export default TextField
