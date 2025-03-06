
import React, { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useSchedules } from "@/contexts/ScheduleContext";
import { useEmployees } from "@/contexts/EmployeeContext";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Search, User, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const MasterReports = () => {
  const { schedules, workEntries } = useSchedules();
  const { employees } = useEmployees();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of current month
    end: new Date().toISOString().split('T')[0] // Today
  });
  
  // Check if user is admin, if not, redirect to dashboard
  if (user?.role !== 'admin') {
    navigate('/');
    return null;
  }

  // Filter work entries based on selected employee and date range
  const filteredWorkEntries = workEntries.filter(entry => {
    const entryDate = new Date(entry.recordedAt);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999); // End of the day
    
    return (
      (!selectedEmployee || entry.employeeId === selectedEmployee) &&
      entryDate >= startDate &&
      entryDate <= endDate
    );
  });

  // Group work entries by employee
  const entriesByEmployee = filteredWorkEntries.reduce<Record<string, typeof filteredWorkEntries>>(
    (acc, entry) => {
      if (!acc[entry.employeeId]) {
        acc[entry.employeeId] = [];
      }
      acc[entry.employeeId].push(entry);
      return acc;
    }, 
    {}
  );

  // Helper function to get employee name by ID
  const getEmployeeName = (id: string) => {
    const employee = employees.find(emp => emp.id === id);
    return employee ? `${employee.name} ${employee.surname}` : 'Unknown';
  };

  // Helper function to get schedule details by ID
  const getScheduleDetails = (scheduleId: string, itemId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return { date: 'Unknown', task: 'Unknown' };
    
    const item = schedule.items.find(i => i.id === itemId);
    return {
      date: schedule.date,
      task: item?.task || 'Unknown'
    };
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
          <h1 className="text-2xl font-medium text-gray-800">Work Reports</h1>
        </div>

        <div className="glass-card p-4 element-transition">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Employee filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
              <select
                className="input-field w-full"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="">All Employees</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} {employee.surname}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Date range filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                className="input-field w-full"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                className="input-field w-full"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>

          {/* Display summary statistics */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-3">Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-500">Total Work Entries</p>
                <p className="text-2xl font-medium">{filteredWorkEntries.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-500">Employees Working</p>
                <p className="text-2xl font-medium">{Object.keys(entriesByEmployee).length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-500">Average Quantity per Entry</p>
                <p className="text-2xl font-medium">
                  {filteredWorkEntries.length > 0 
                    ? (filteredWorkEntries.reduce((sum, entry) => sum + entry.quantity, 0) / filteredWorkEntries.length).toFixed(2)
                    : '0.00'}
                </p>
              </div>
            </div>
          </div>

          {/* Display work entries */}
          <div>
            <h2 className="text-lg font-medium text-gray-800 mb-3">Work Entries</h2>
            {Object.entries(entriesByEmployee).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(entriesByEmployee).map(([employeeId, entries]) => (
                  <div key={employeeId} className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-md font-medium text-gray-800 mb-2 flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      {getEmployeeName(employeeId)}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-2 text-left">Date</th>
                            <th className="px-4 py-2 text-left">Task</th>
                            <th className="px-4 py-2 text-left">Quantity</th>
                            <th className="px-4 py-2 text-left">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map((entry) => {
                            const details = getScheduleDetails(entry.scheduleId, entry.scheduleItemId);
                            return (
                              <tr key={entry.id} className="border-t border-gray-100">
                                <td className="px-4 py-2">{details.date}</td>
                                <td className="px-4 py-2">{details.task}</td>
                                <td className="px-4 py-2">{entry.quantity}</td>
                                <td className="px-4 py-2">{entry.remarks}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <BarChart2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No work entries found for the selected criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default MasterReports;
