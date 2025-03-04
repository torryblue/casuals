
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Bell, Star, Coffee, Truck } from "lucide-react";

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    setIsAdmin(user?.role === 'admin');
  }, [user]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-medium text-gray-800">Dashboard</h1>
          
          <div className="flex space-x-3">
            {isAdmin && (
              <>
                <button
                  onClick={() => navigate('/employees/create')}
                  className="btn-primary"
                >
                  Create New Worker
                </button>
                <button
                  onClick={() => navigate('/schedule/create')}
                  className="btn-secondary"
                >
                  Create Today's Schedule
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dashboard cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Updates card */}
          <div className="glass-card p-6 element-transition">
            <div className="flex items-center mb-4">
              <Bell className="h-5 w-5 text-hafta-accent mr-2" />
              <h2 className="text-lg font-medium text-gray-800">Updates</h2>
            </div>
            <p className="text-gray-600">
              List salary increments, payroll to process updates
            </p>
          </div>
          
          {/* Top performer card */}
          <div className="glass-card p-6 element-transition" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center mb-4">
              <Star className="h-5 w-5 text-hafta-accent mr-2" />
              <h2 className="text-lg font-medium text-gray-800">Top Performer</h2>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-sm">No data available</p>
            </div>
          </div>
          
          {/* Late comers card */}
          <div className="glass-card p-6 element-transition" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center mb-4">
              <Coffee className="h-5 w-5 text-hafta-accent mr-2" />
              <h2 className="text-lg font-medium text-gray-800">Late Comers</h2>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-sm">No data available</p>
            </div>
          </div>
          
          {/* Early goers card */}
          <div className="glass-card p-6 element-transition" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center mb-4">
              <Truck className="h-5 w-5 text-hafta-accent mr-2" />
              <h2 className="text-lg font-medium text-gray-800">Early Goers</h2>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-sm">No data available</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
