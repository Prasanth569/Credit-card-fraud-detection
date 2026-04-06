import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// ─── Password strength checker ─────────────────────────────────────────────
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: "Very Weak", color: "bg-danger" };
  if (score === 2) return { score, label: "Weak", color: "bg-warning" };
  if (score === 3) return { score, label: "Fair", color: "bg-yellow-400" };
  if (score === 4) return { score, label: "Strong", color: "bg-success/70" };
  return { score, label: "Very Strong", color: "bg-success" };
}

function getFirebaseError(code: string): string {
  switch (code) {
    case "auth/email-already-in-use": return "An account with this email already exists.";
    case "auth/invalid-email": return "Please enter a valid email address.";
    case "auth/weak-password": return "Password must be at least 6 characters.";
    case "auth/network-request-failed": return "Network error. Check your connection.";
    case "auth/popup-closed-by-user": return "Google sign-in was cancelled.";
    case "auth/too-many-requests": return "Too many attempts. Please try again later.";
    default: return "Something went wrong. Please try again.";
  }
}

export default function Register() {
  const { signup, googleLogin, currentUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    if (currentUser) navigate("/", { replace: true });
  }, [currentUser, navigate]);

  const strength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const validate = (): string | null => {
    if (!email.trim()) return "Email is required.";
    if (!password) return "Password is required.";
    if (strength.score < 3) return "Please use a stronger password (min 8 chars, uppercase, number).";
    if (!confirmPassword) return "Please confirm your password.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError("");
    setLoading(true);
    try {
      await signup(email, password);
      navigate("/");
    } catch (err: any) {
      setError(getFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await googleLogin();
      navigate("/");
    } catch (err: any) {
      setError(getFirebaseError(err.code));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0a1628] to-slate-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="material-symbols-outlined text-white text-[20px]">security</span>
          </div>
          <div>
            <h1 className="text-white font-black font-headline text-lg leading-tight">Fraud Detection</h1>
            <p className="text-white/40 text-[10px] uppercase tracking-widest">CLN-ARCH v1.0</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-black font-headline text-white">Create account</h2>
            <p className="text-white/50 text-sm mt-1">Start detecting fraud in real time</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 bg-danger/10 border border-danger/20 rounded-lg px-4 py-3">
              <span className="material-symbols-outlined text-danger text-[18px] mt-0.5 flex-shrink-0">error</span>
              <p className="text-danger text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-white/70 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[18px]">
                  mail
                </span>
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-white/70 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[18px]">
                  lock
                </span>
                <input
                  id="register-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars, uppercase, number"
                  autoComplete="new-password"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPw ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {/* Strength bar */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength.score ? strength.color : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-white/40">
                    Strength: <span className="text-white/70 font-semibold">{strength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-white/70 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] transition-colors ${
                  passwordsMatch ? "text-success" : passwordsMismatch ? "text-danger" : "text-white/30"
                }`}>
                  {passwordsMatch ? "check_circle" : passwordsMismatch ? "cancel" : "lock"}
                </span>
                <input
                  id="register-confirm-password"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className={`w-full bg-white/5 border rounded-lg pl-10 pr-10 py-3 text-sm text-white placeholder-white/25 outline-none transition-all ${
                    passwordsMatch
                      ? "border-success/40 focus:ring-2 focus:ring-success/20"
                      : passwordsMismatch
                      ? "border-danger/40 focus:ring-2 focus:ring-danger/20"
                      : "border-white/10 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showConfirm ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {passwordsMismatch && (
                <p className="mt-1 text-[11px] text-danger font-medium">Passwords do not match</p>
              )}
              {passwordsMatch && (
                <p className="mt-1 text-[11px] text-success font-medium">Passwords match ✓</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs font-medium">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google */}
          <button
            id="register-google"
            onClick={handleGoogle}
            disabled={loading || googleLoading}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-3"
          >
            {googleLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </button>

          {/* Login link */}
          <p className="text-center text-white/40 text-sm mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:text-primary-light font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
