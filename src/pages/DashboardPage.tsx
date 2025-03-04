
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { CalendarClock, FileText } from "lucide-react";

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
        </div>

        {/* New Dashboard tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Schedule tile */}
          <div 
            className="glass-card p-6 element-transition cursor-pointer hover:shadow-md transition-all"
            onClick={() => navigate('/schedule/create')}
          >
            <div className="flex items-center mb-4">
              <CalendarClock className="h-6 w-6 text-torryblue-accent mr-3" />
              <h2 className="text-xl font-medium text-gray-800">Create Schedule</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Create and manage daily work schedules for employees
            </p>
            <div className="mt-2 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/schedule/create');
                }}
                className="btn-primary"
              >
                Create Schedule
              </button>
            </div>
          </div>
          
          {/* Work Entry tile */}
          <div 
            className="glass-card p-6 element-transition cursor-pointer hover:shadow-md transition-all"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-torryblue-accent mr-3" />
              <h2 className="text-xl font-medium text-gray-800">Work Entry</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Record and track employee work entries and attendance
            </p>
            <div className="mt-2 flex justify-end">
              <button className="btn-primary">
                Record Work
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
