
import React, { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useSchedules } from "@/contexts/ScheduleContext";
import { useEmployees } from "@/contexts/EmployeeContext";
import { ArrowLeft, Unlock, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";

const UnlockEntriesPage = () => {
  const navigate = useNavigate();
  const { getLockedEmployeeEntries, unlockEmployeeEntry } = useSchedules();
  const { employees } = useEmployees();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [filterTask, setFilterTask] = useState("");
  
  const lockedEntries = getLockedEmployeeEntries();
  
  // Helper function to get employee name by ID
  const getEmployeeName = (id: string) => {
    const employee = employees.find(emp => emp.id === id);
    return employee ? `${employee.name} ${employee.surname}` : 'Unknown';
  };
  
  // Filter entries based on search term and task filter
  const filteredEntries = lockedEntries.filter(entry => 
    (getEmployeeName(entry.employeeId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.entryType.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterTask === "" || entry.entryType === filterTask)
  );
  
  // Get unique tasks for filter dropdown
  const uniqueTasks = [...new Set(lockedEntries.map(entry => entry.entryType))];
  
  const handleUnlockEntry = async (entry) => {
    setIsUnlocking(true);
    try {
      // Call unlockEmployeeEntry function but don't check its return value
      unlockEmployeeEntry(entry.scheduleId, entry.scheduleItemId, entry.employeeId);
      toast.success(`Entry for ${getEmployeeName(entry.employeeId)} unlocked successfully`);
    } catch (error) {
      console.error("Error unlocking entry:", error);
      toast.error("Failed to unlock entry");
    } finally {
      setIsUnlocking(false);
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
          <h1 className="text-2xl font-medium text-gray-800">Unlock Work Entries</h1>
        </div>

        <div className="glass-card p-6 element-transition">
          <div className="flex flex-col md:flex-row justify-between gap-4 pb-4">
            {/* Search box */}
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search entries..."
                className="input-field pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Task filter */}
            <div className="relative flex items-center">
              <Filter className="h-5 w-5 text-gray-400 mr-2" />
              <select
                className="input-field"
                value={filterTask}
                onChange={(e) => setFilterTask(e.target.value)}
              >
                <option value="">All Tasks</option>
                {uniqueTasks.map(task => (
                  <option key={task} value={task}>{task}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Employee</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Task</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Quantity/Mass</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Recorded At</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {getEmployeeName(entry.employeeId)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {entry.entryType}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {entry.quantity} {entry.entryType.toLowerCase().includes('stripping') ? 'kg' : ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {format(new Date(entry.recordedAt), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleUnlockEntry(entry)}
                          disabled={isUnlocking}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Unlock className="h-3.5 w-3.5 mr-1" />
                          Unlock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Unlock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No locked entries found.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default UnlockEntriesPage;
