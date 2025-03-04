
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="glass-card max-w-md p-8 w-full text-center space-y-6 element-transition">
        <h1 className="text-6xl font-light text-gray-800">404</h1>
        <p className="text-xl text-gray-600">Oops! Page not found</p>
        <p className="text-gray-500">
          The page you are looking for might have been removed or is temporarily unavailable.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center btn-primary mx-auto mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotFound;
