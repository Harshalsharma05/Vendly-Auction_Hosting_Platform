import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";

function useInitialMode(search) {
  const query = new URLSearchParams(search);
  const mode = query.get("mode");
  return mode === "register" ? "register" : "login";
}

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuth();

  const [mode, setMode] = useState(() => useInitialMode(location.search));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "participant",
  });

  const heading = useMemo(
    () =>
      mode === "login"
        ? "Welcome back to Vendly"
        : "Create your Vendly account",
    [mode],
  );

  const subheading = useMemo(
    () =>
      mode === "login"
        ? "Continue bidding and hosting premium live auctions."
        : "Join the marketplace for exceptional live auction experiences.",
    [mode],
  );

  async function handleLoginSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await login(loginForm);
      toast.success("Logged in successfully.");
      navigate("/");
    } catch (error) {
      toast.error(error.message || "Unable to login.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await register(registerForm);

      if (isAuthenticated || localStorage.getItem("token")) {
        toast.success("Account created. You are now signed in.");
        navigate("/");
        return;
      }

      toast.success("Account created. Please login to continue.");
      setMode("login");
      setLoginForm((prev) => ({ ...prev, email: registerForm.email }));
    } catch (error) {
      toast.error(error.message || "Unable to register.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="pt-23 min-h-screen bg-white">
      <section className="px-6 lg:px-10 py-12 lg:py-16">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-stretch">
          <div className="rounded-[28px] border border-brand-border bg-brand-charcoal text-white p-8 lg:p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(193,122,92,0.22),transparent_48%),radial-gradient(circle_at_80%_65%,rgba(255,255,255,0.08),transparent_42%)] pointer-events-none" />
            <div className="relative z-10">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70 mb-4">
                Vendly Access
              </p>
              <h1 className="font-display text-3xl sm:text-4xl leading-tight mb-4">
                {heading}
              </h1>
              <p className="text-sm sm:text-base text-white/80 max-w-md">
                {subheading}
              </p>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                  Real-time live bidding
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                  Multi-tenant host control
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                  Secure role-based access
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                  Elegant premium auction UI
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-brand-border bg-white shadow-sm p-6 sm:p-8 lg:p-10">
            <div className="flex items-center gap-2 p-1 rounded-full bg-brand-light border border-brand-border mb-7">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={[
                  "flex-1 rounded-full py-2.5 text-sm font-medium transition-all duration-200",
                  mode === "login"
                    ? "bg-white text-brand-charcoal shadow-sm"
                    : "text-brand-muted hover:text-brand-charcoal",
                ].join(" ")}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={[
                  "flex-1 rounded-full py-2.5 text-sm font-medium transition-all duration-200",
                  mode === "register"
                    ? "bg-white text-brand-charcoal shadow-sm"
                    : "text-brand-muted hover:text-brand-charcoal",
                ].join(" ")}
              >
                Register
              </button>
            </div>

            {mode === "login" ? (
              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <label className="block">
                  <span className="text-sm text-brand-muted">Email</span>
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    className="mt-1.5 w-full rounded-2xl border border-brand-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-rust/20 focus:border-brand-rust/40"
                    placeholder="you@example.com"
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-brand-muted">Password</span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((prev) => ({
                        ...prev,
                        password: event.target.value,
                      }))
                    }
                    className="mt-1.5 w-full rounded-2xl border border-brand-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-rust/20 focus:border-brand-rust/40"
                    placeholder="Enter your password"
                  />
                </label>

                <Button
                  type="submit"
                  variant="rust"
                  size="md"
                  className="w-full rounded-2xl!"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                <label className="block">
                  <span className="text-sm text-brand-muted">Full Name</span>
                  <input
                    type="text"
                    required
                    value={registerForm.name}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    className="mt-1.5 w-full rounded-2xl border border-brand-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-rust/20 focus:border-brand-rust/40"
                    placeholder="John Doe"
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-brand-muted">Email</span>
                  <input
                    type="email"
                    required
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    className="mt-1.5 w-full rounded-2xl border border-brand-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-rust/20 focus:border-brand-rust/40"
                    placeholder="you@example.com"
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-brand-muted">Password</span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        password: event.target.value,
                      }))
                    }
                    className="mt-1.5 w-full rounded-2xl border border-brand-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-rust/20 focus:border-brand-rust/40"
                    placeholder="At least 6 characters"
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-brand-muted">Role</span>
                  <select
                    value={registerForm.role}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        role: event.target.value,
                      }))
                    }
                    className="mt-1.5 w-full rounded-2xl border border-brand-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-rust/20 focus:border-brand-rust/40"
                  >
                    <option value="participant">Participant</option>
                    <option value="client">Client (Host)</option>
                  </select>
                </label>

                <Button
                  type="submit"
                  variant="rust"
                  size="md"
                  className="w-full rounded-2xl!"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            )}

            <p className="mt-6 text-sm text-brand-muted">
              Returning to the auction floor?{" "}
              <Link to="/" className="text-brand-rust hover:underline">
                Go to home
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
