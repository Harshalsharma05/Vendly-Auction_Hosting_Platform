// File: src/components/layout/Navbar.jsx
import { useState, useEffect } from "react";
import { Search, Menu, X } from "lucide-react";
import Button from "../ui/Button";
import { NAV_LINKS } from "../../data/mockData";

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchVal,  setSearchVal]  = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-brand-border"
          : "bg-white border-b border-brand-border",
      ].join(" ")}
    >
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-6 lg:px-10 h-14">

        {/* Logo — "Vendly" */}
        <a href="/" className="shrink-0 flex items-center gap-0.5 mr-4">
          <span className="font-display font-bold text-[17px] tracking-tight text-brand-charcoal leading-none">
            Vend
          </span>
          <span className="font-display font-bold text-[17px] tracking-tight text-brand-rust leading-none">
            ly
          </span>
        </a>

        {/* Search */}
        <div className="relative hidden sm:flex items-center flex-1 max-w-xs">
          <Search
            size={14}
            className="absolute left-3 text-brand-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search lots, hosts, categories..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className={[
              "w-full pl-8 pr-4 py-1.5 text-[13px] font-sans",
              "bg-brand-light border border-brand-border rounded-full",
              "outline-none focus:ring-2 focus:ring-brand-rust/20 focus:border-brand-rust/40",
              "placeholder:text-brand-muted transition-all duration-200",
            ].join(" ")}
          />
        </div>

        {/* Spacer */}
        <div className="flex-1 hidden lg:block" />

        {/* Right-side quick links */}
        <nav className="hidden lg:flex items-center gap-5 text-[13px] text-brand-muted">
          {["Live Now", "Sell", "Blog", "How It Works"].map((item) => (
            
              <a key={item}
              href="#"
              className="hover:text-brand-charcoal transition-colors duration-150"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Auth buttons */}
        <div className="hidden sm:flex items-center gap-2 ml-3">
          <Button variant="secondary" size="sm">
            Login
          </Button>
          <Button variant="primary" size="sm">
            Sign Up
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="sm:hidden ml-auto p-1.5 rounded-lg hover:bg-brand-light transition"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ── Bottom nav row ───────────────────────────────────── */}
      <nav className="hidden lg:flex items-center gap-1 px-10 h-9 border-t border-brand-border overflow-x-auto">
        {NAV_LINKS.map((link) => (
          
            <a key={link.label}
            href={link.href}
            className={[
              "shrink-0 px-3 py-1 text-[13px] font-sans text-brand-muted",
              "rounded-full hover:text-brand-charcoal hover:bg-brand-light",
              "transition-all duration-150 whitespace-nowrap",
            ].join(" ")}
          >
            {link.label}
          </a>
        ))}
      </nav>

      {/* ── Mobile drawer ────────────────────────────────────── */}
      {mobileOpen && (
        <div className="sm:hidden bg-white border-t border-brand-border shadow-xl">
          <div className="px-5 py-3">
            <div className="relative mb-4">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted"
              />
              <input
                type="text"
                placeholder="Search lots, hosts..."
                className="w-full pl-8 pr-4 py-2 text-[13px] bg-brand-light border border-brand-border rounded-full outline-none"
              />
            </div>
            <ul className="space-y-0.5">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  
                    <a href={link.href}
                    className="block px-3 py-2 text-sm text-brand-charcoal rounded-lg hover:bg-brand-light transition"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 mt-4">
              <Button variant="secondary" size="md" className="flex-1">
                Login
              </Button>
              <Button variant="primary" size="md" className="flex-1">
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}