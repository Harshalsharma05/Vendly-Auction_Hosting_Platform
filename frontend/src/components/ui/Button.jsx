// File: src/components/ui/Button.jsx
const VARIANTS = {
  primary:   "bg-brand-charcoal text-white hover:bg-brand-dark border border-brand-charcoal",
  secondary: "bg-white text-brand-charcoal border border-brand-charcoal hover:bg-brand-light",
  rust:      "bg-brand-rust text-white hover:opacity-90 border border-brand-rust",
  ghost:     "bg-transparent text-brand-charcoal hover:bg-brand-light border border-transparent",
  outline:   "bg-transparent text-white border border-white hover:bg-white hover:text-brand-charcoal",
};

const SIZES = {
  sm:  "px-3 py-1.5 text-xs",
  md:  "px-5 py-2.5 text-sm",
  lg:  "px-7 py-3.5 text-[15px]",
  xl:  "px-10 py-4 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  type = "button",
  disabled = false,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center gap-2 font-sans font-medium",
        "rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.md,
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}