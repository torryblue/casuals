
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Clock, 
  FileText, 
  Settings,
  ChevronDown,
  LogOut,
  Database,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarItem = {
  title: string;
  icon: React.ElementType;
  path: string;
  children?: { title: string; path: string }[];
  requiredRole?: 'admin' | 'user' | undefined; // Add role requirement
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "GENERAL": true
  });

  // Define sidebar items with role requirements
  const SIDEBAR_ITEMS: SidebarItem[] = [
    {
      title: "GENERAL",
      icon: ChevronDown,
      path: "",
      children: [
        { title: "Dashboard", path: "/" },
        { title: "Employees", path: "/employees" }
      ]
    },
    {
      title: "MASTER",
      icon: ChevronDown,
      path: "",
      requiredRole: 'admin', // Only admins can see this
      children: [
        { title: "Employee List", path: "/master/employees" },
        { title: "Schedule List", path: "/master/schedules" },
        { title: "Work Reports", path: "/master/reports" },
        { title: "Payroll", path: "/master/payroll" }
      ]
    }
  ];

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter sidebar items based on user role
  const filteredSidebarItems = SIDEBAR_ITEMS.filter(item => 
    !item.requiredRole || (user && user.role === item.requiredRole)
  );

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-[220px] bg-torryblue-dark text-white flex flex-col">
        {/* Logo */}
        <div className="px-6 py-4 border-b border-gray-800">
          <h1 className="text-2xl font-light">TorryBlue Tobacco</h1>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="px-2 py-4">
            {filteredSidebarItems.map((section) => (
              <div key={section.title} className="mb-2">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:text-white"
                >
                  <section.icon className={cn("w-4 h-4 mr-2", {
                    "transform rotate-180": !expandedSections[section.title]
                  })} />
                  <span>{section.title}</span>
                </button>
                
                {expandedSections[section.title] && section.children && (
                  <div className="mt-1 ml-4 space-y-1">
                    {section.children.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={cn(
                          "flex w-full text-left px-4 py-2 text-sm rounded-md",
                          location.pathname === item.path
                            ? "text-white bg-gray-800"
                            : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                        )}
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* User info and role */}
        <div className="px-6 py-2 border-t border-gray-800">
          <div className="text-sm text-gray-400">
            <span>Logged in as: </span>
            <span className="text-white">{user?.username}</span>
          </div>
          <div className="text-xs text-gray-500">
            Role: {user?.role === 'admin' ? 'Administrator' : 'Standard User'}
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="flex items-center px-6 py-3 mt-2 text-sm text-gray-400 hover:text-white border-t border-gray-800"
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span>Logout</span>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6 page-transition">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
