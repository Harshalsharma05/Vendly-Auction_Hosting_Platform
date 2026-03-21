// File: src/components/ui/SectionHeader.jsx

export default function SectionHeader({ title, linkLabel = "View All", href = "#", className = "" }) {
  return (
    <div className={`flex items-baseline justify-between mb-5 ${className}`}>
      <h2 className="font-display font-bold text-brand-charcoal text-xl sm:text-2xl tracking-tight">
        {title}
      </h2>
      
        <a href={href}
        className="text-[12px] font-sans text-brand-muted hover:text-brand-charcoal underline underline-offset-2 transition-colors duration-150 whitespace-nowrap"
      >
        {linkLabel}
      </a>
    </div>
  );
}