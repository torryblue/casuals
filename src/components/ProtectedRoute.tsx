
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Routes that require admin role
const ADMIN_ONLY_ROUTES = [
  "/master",
  "/master/employees",
  "/master/schedules", 
  "/master/reports"
];

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Check if current path is an admin-only route
  const isAdminRoute = ADMIN_ONLY_ROUTES.some(route => 
    location.pathname.startsWith(route)
  );

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 w-8 mx-auto rounded-full bg-gray-200"></div>
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has admin rights for admin-only routes
  if (isAdminRoute && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
