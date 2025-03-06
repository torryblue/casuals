
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { EmployeeProvider } from "@/contexts/EmployeeContext";
import { ScheduleProvider } from "@/contexts/ScheduleContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from "./pages/EmployeesPage";
import CreateEmployeePage from "./pages/CreateEmployeePage";
import CreateSchedulePage from "./pages/CreateSchedulePage";
import WorkEntryPage from "./pages/WorkEntryPage";
import NotFound from "./pages/NotFound";

// Import master list pages
import MasterEmployeeList from "./pages/master/MasterEmployeeList";
import MasterScheduleList from "./pages/master/MasterScheduleList";
import MasterReports from "./pages/master/MasterReports";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <EmployeeProvider>
        <ScheduleProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                
                <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/employees" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
                <Route path="/employees/create" element={<ProtectedRoute><CreateEmployeePage /></ProtectedRoute>} />
                <Route path="/schedule/create" element={<ProtectedRoute><CreateSchedulePage /></ProtectedRoute>} />
                <Route path="/work-entry" element={<ProtectedRoute><WorkEntryPage /></ProtectedRoute>} />
                
                {/* Master List Routes - Admin Only */}
                <Route path="/master/employees" element={<ProtectedRoute><MasterEmployeeList /></ProtectedRoute>} />
                <Route path="/master/schedules" element={<ProtectedRoute><MasterScheduleList /></ProtectedRoute>} />
                <Route path="/master/reports" element={<ProtectedRoute><MasterReports /></ProtectedRoute>} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ScheduleProvider>
      </EmployeeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
