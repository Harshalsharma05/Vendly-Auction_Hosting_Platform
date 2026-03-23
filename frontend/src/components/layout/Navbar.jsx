// File: src/components/layout/Navbar.jsx
import { useEffect, useMemo, useState } from "react";
import { Search, Menu, X } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import { NAV_LINKS } from "../../data/mockData";
import { useAuth } from "../../context/AuthContext";

const QUICK_LINKS = [
  { label: "Live Now", to: "/live-auctions" },
  { label: "My Auctions", to: "/my-auctions" },
  { label: "My Bids", to: "/my-bids" },
  { label: "Sell", to: "/sell" },
  { label: "How It Works", to: "/how-it-works" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const avatarLabel = useMemo(() => {
    const seed = user?.name || user?.email || "V";
    return seed.trim().charAt(0).toUpperCase();
  }, [user?.email, user?.name]);

  const displayName = useMemo(
    () => user?.name || user?.email || "Account",
    [user?.email, user?.name],
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    setProfileOpen(false);
  }, [mobileOpen]);

  async function handleLogout() {
    await logout();
    setProfileOpen(false);
    setMobileOpen(false);
    toast.success("Logged out successfully.");
    navigate("/");
  }

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
        <Link to="/" className="shrink-0 flex items-center gap-0.5 mr-4">
          <span className="font-display font-bold text-[17px] tracking-tight text-brand-charcoal leading-none">
            Vend
          </span>
          <span className="font-display font-bold text-[17px] tracking-tight text-brand-rust leading-none">
            ly
          </span>
        </Link>

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
          {QUICK_LINKS.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="hover:text-brand-charcoal transition-colors duration-150"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Auth buttons */}
        <div className="hidden sm:flex items-center gap-2 ml-3">
          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((value) => !value)}
                className="inline-flex items-center gap-2 rounded-full border border-brand-border px-2 py-1.5 hover:bg-brand-light transition"
                aria-label="Open account menu"
              >
                <span className="size-7 rounded-full bg-brand-charcoal text-white text-xs font-semibold grid place-items-center">
                  {avatarLabel}
                </span>
                <span className="text-[13px] text-brand-charcoal pr-1 max-w-30 truncate">
                  {displayName}
                </span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-brand-border bg-white shadow-xl p-2 z-50">
                  <p className="px-3 py-2 text-xs text-brand-muted truncate">
                    {displayName}
                  </p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm rounded-xl hover:bg-brand-light transition"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate("/auth?mode=login")}
              >
                Login
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/auth?mode=register")}
              >
                Sign Up
              </Button>
            </>
          )}
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
          <Link
            key={link.label}
            to={link.href}
            className={[
              "shrink-0 px-3 py-1 text-[13px] font-sans text-brand-muted",
              "rounded-full hover:text-brand-charcoal hover:bg-brand-light",
              "transition-all duration-150 whitespace-nowrap",
            ].join(" ")}
          >
            {link.label}
          </Link>
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
                  <Link
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 text-sm text-brand-charcoal rounded-lg hover:bg-brand-light transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            {isAuthenticated ? (
              <div className="mt-4 rounded-xl border border-brand-border p-3">
                <p className="text-sm text-brand-charcoal mb-3 truncate">
                  {displayName}
                </p>
                <Button
                  variant="secondary"
                  size="md"
                  className="w-full"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 mt-4">
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  onClick={() => {
                    setMobileOpen(false);
                    navigate("/auth?mode=login");
                  }}
                >
                  Login
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  onClick={() => {
                    setMobileOpen(false);
                    navigate("/auth?mode=register");
                  }}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
