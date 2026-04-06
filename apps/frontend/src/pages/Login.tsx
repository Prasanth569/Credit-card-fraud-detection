import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function getFirebaseError(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password": return "Invalid email or password. Please try again.";
    case "auth/invalid-email": return "Please enter a valid email address.";
    case "auth/user-disabled": return "This account has been disabled. Contact support.";
    case "auth/too-many-requests": return "Too many failed attempts. Please try again later.";
    case "auth/network-request-failed": return "Network error. Check your connection.";
    case "auth/popup-closed-by-user": return "Google sign-in was cancelled.";
    default: return "Sign in failed. Please check your credentials.";
  }
}

export default function Login() {
  const { login, googleLogin, currentUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    if (currentUser) navigate("/", { replace: true });
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
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
      {/* Background glow */}
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
            <h2 className="text-2xl font-black font-headline text-white">Welcome back</h2>
            <p className="text-white/50 text-sm mt-1">Sign in to your account to continue</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 bg-danger/10 border border-danger/20 rounded-lg px-4 py-3">
              <span className="material-symbols-outlined text-danger text-[18px] mt-0.5 flex-shrink-0">error</span>
              <p className="text-danger text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Google Sign-In — primary CTA on Login */}
          <button
            id="login-google"
            onClick={handleGoogle}
            disabled={loading || googleLoading}
            className="w-full bg-white hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed text-gray-800 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-md mb-5"
          >
            {googleLoading ? (
              <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
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

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

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
                  id="login-email"
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-white/70 text-xs font-semibold uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[18px]">
                  lock
                </span>
                <input
                  id="login-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
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
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-white/40 text-sm mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:text-primary-light font-semibold transition-colors">
              Create one
            </Link>
          </p>
        </div>

        {/* Security note */}
        <p className="text-center text-white/20 text-[11px] mt-4 flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[14px]">shield</span>
          Protected by Firebase Authentication · 256-bit TLS
        </p>
      </div>
    </div>
  );
}
