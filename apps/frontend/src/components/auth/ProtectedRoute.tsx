import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute() {
  const { currentUser, loading } = useAuth();

  // Show spinner while Firebase resolves auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-on-surface-variant font-medium">
            Verifying session…
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated → render protected page
  return <Outlet />;
}
