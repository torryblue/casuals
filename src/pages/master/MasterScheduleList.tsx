
import React, { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useSchedules } from "@/contexts/ScheduleContext";
import { useEmployees } from "@/contexts/EmployeeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Calendar, ArrowLeft, Edit, Trash, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";

const MasterScheduleList = () => {
  const { schedules, deleteSchedule, isLoading } = useSchedules();
  const { employees } = useEmployees();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Check if user is admin, if not, redirect to dashboard
  if (user?.role !== 'admin') {
    navigate('/');
    return null;
  }

  // Helper function to get employee name by ID
  const getEmployeeName = (id: string) => {
    const employee = employees.find(emp => emp.id === id);
    return employee ? `${employee.name} ${employee.surname}` : 'Unknown';
  };

  // Filter schedules based on search term
  const filteredSchedules = schedules
    .filter(schedule => 
      schedule.date.includes(searchTerm) ||
      schedule.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date (newest first)

  const handleDeleteSchedule = (id: string) => {
    if (window.confirm("Are you sure you want to delete this schedule? This action cannot be undone.")) {
      deleteSchedule(id);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <h1 className="text-2xl font-medium text-gray-800">Master Schedule List</h1>
        </div>

        <div className="glass-card p-4 element-transition">
          <div className="flex flex-col md:flex-row justify-between gap-4 pb-4">
            {/* Search box */}
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search schedules..."
                className="input-field pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Schedule listing */}
          <div className="overflow-x-auto">
            {filteredSchedules.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">ID</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Tasks</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Workers</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Created</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSchedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{schedule.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{schedule.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {schedule.items.map(item => item.task).join(", ")}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {schedule.items.reduce((total, item) => total + item.workers, 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {format(new Date(schedule.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex space-x-2">
                          <button 
                            className="p-1 text-blue-500 hover:text-blue-700"
                            onClick={() => navigate(`/work-entry?scheduleId=${schedule.id}`)}
                            title="View Work Entries"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            className="p-1 text-green-500 hover:text-green-700"
                            onClick={() => toast.info("Edit functionality to be implemented")}
                            title="Edit Schedule"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="p-1 text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            disabled={isLoading}
                            title="Delete Schedule"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-8 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No schedules found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default MasterScheduleList;
