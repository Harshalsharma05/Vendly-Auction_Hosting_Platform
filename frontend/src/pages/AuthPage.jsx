import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, Loader2, XCircle } from "lucide-react";
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
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "participant",
  });

  const passwordChecks = useMemo(() => {
    const password = registerForm.password || "";

    return [
      {
        key: "length",
        label: "At least 8 characters",
        met: password.length >= 8,
      },
      {
        key: "uppercase",
        label: "Contains an uppercase letter",
        met: /[A-Z]/.test(password),
      },
      { key: "number", label: "Contains a number", met: /\d/.test(password) },
      {
        key: "special",
        label: "Contains a special character",
        met: /[^A-Za-z0-9]/.test(password),
      },
    ];
  }, [registerForm.password]);

  const passwordStrengthScore = useMemo(
    () => passwordChecks.filter((rule) => rule.met).length,
    [passwordChecks],
  );

  const passwordStrengthTone = useMemo(() => {
    if (passwordStrengthScore <= 1) {
      return "bg-red-500";
    }
    if (passwordStrengthScore <= 2) {
      return "bg-amber-500";
    }
    return "bg-emerald-500";
  }, [passwordStrengthScore]);

  const passwordStrengthLabel = useMemo(() => {
    if (passwordStrengthScore <= 1) {
      return "Weak";
    }
    if (passwordStrengthScore <= 2) {
      return "Medium";
    }
    if (passwordStrengthScore === 3) {
      return "Strong";
    }
    return "Very Strong";
  }, [passwordStrengthScore]);

  const hasStartedConfirm = registerForm.confirmPassword.length > 0;
  const passwordsMatch = registerForm.password === registerForm.confirmPassword;
  const isPasswordTooWeak = passwordStrengthScore < 3;
  const disableRegisterSubmit =
    isSubmitting || isPasswordTooWeak || !passwordsMatch;

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

    if (isPasswordTooWeak) {
      toast.error("Please choose a stronger password.");
      return;
    }

    if (!passwordsMatch) {
      toast.error("Passwords do not match.");
      return;
    }

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
                  <div className="relative mt-1.5">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={loginForm.password}
                      onChange={(event) =>
                        setLoginForm((prev) => ({
                          ...prev,
                          password: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-brand-border bg-white px-4 py-3 pr-11 text-sm outline-none focus:ring-2 focus:ring-brand-rust/20 focus:border-brand-rust/40"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-charcoal transition-colors duration-150"
                      aria-label={
                        showLoginPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showLoginPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
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
                  <div className="relative mt-1.5">
                    <input
                      type={showRegisterPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={registerForm.password}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          password: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-brand-border bg-white px-4 py-3 pr-11 text-sm outline-none focus:ring-2 focus:ring-brand-rust/20 focus:border-brand-rust/40"
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-charcoal transition-colors duration-150"
                      aria-label={
                        showRegisterPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showRegisterPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="grid grid-cols-4 gap-1.5 flex-1">
                        {Array.from({ length: 4 }).map((_, index) => {
                          const isActive = index < passwordStrengthScore;
                          return (
                            <div
                              key={`pwd-strength-${index}`}
                              className={[
                                "h-1.5 rounded-full transition-colors duration-200",
                                isActive
                                  ? passwordStrengthTone
                                  : "bg-brand-border",
                              ].join(" ")}
                            />
                          );
                        })}
                      </div>
                      <span className="text-xs text-brand-muted min-w-18.5 text-right">
                        {passwordStrengthLabel}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {passwordChecks.map((rule) => (
                        <p
                          key={rule.key}
                          className="text-xs text-brand-muted inline-flex items-center gap-1.5"
                        >
                          {rule.met ? (
                            <CheckCircle2
                              size={14}
                              className="text-emerald-500"
                            />
                          ) : (
                            <XCircle size={14} className="text-red-500" />
                          )}
                          {rule.label}
                        </p>
                      ))}
                    </div>
                  </div>
                </label>

                <label className="block">
                  <span className="text-sm text-brand-muted">
                    Confirm Password
                  </span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={registerForm.confirmPassword}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        confirmPassword: event.target.value,
                      }))
                    }
                    className="mt-1.5 w-full rounded-2xl border border-brand-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-rust/20 focus:border-brand-rust/40"
                    placeholder="Re-enter your password"
                  />
                  {hasStartedConfirm && !passwordsMatch && (
                    <p className="mt-1.5 text-xs text-red-500">
                      Passwords do not match.
                    </p>
                  )}
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
                  disabled={disableRegisterSubmit}
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
