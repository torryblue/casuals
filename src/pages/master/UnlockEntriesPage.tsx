
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Unlock, AlertCircle, CheckCircle2 } from "lucide-react";
import { useSchedules } from "@/contexts/ScheduleContext";
import { useEmployees } from "@/contexts/EmployeeContext";
import { getEmployeeById } from "@/services/employeeService";

const UnlockEntriesPage = () => {
  const navigate = useNavigate();
  const { getLockedEmployeeEntries, unlockEmployeeEntry, isLoading } = useSchedules();
  const { employees } = useEmployees();
  
  const [lockedEntries, setLockedEntries] = useState<{
    scheduleId: string;
    scheduleItemId: string;
    employeeId: string;
    date: string;
    task: string;
    employee: string;
    employeeName?: string;
  }[]>([]);
  
  const [unlocking, setUnlocking] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch locked entries when component mounts
  useEffect(() => {
    const fetchEntries = async () => {
      const entries = getLockedEmployeeEntries();
      
      // Enhance entries with employee names
      const enhancedEntries = await Promise.all(
        entries.map(async (entry) => {
          const employee = employees.find(e => e.id === entry.employeeId);
          
          if (employee) {
            return {
              ...entry,
              employeeName: `${employee.name} ${employee.surname}`
            };
          } else {
            // If employee not in context, try fetching directly
            const fetchedEmployee = await getEmployeeById(entry.employeeId);
            return {
              ...entry,
              employeeName: fetchedEmployee ? 
                `${fetchedEmployee.name} ${fetchedEmployee.surname}` : 
                `Unknown (${entry.employeeId})`
            };
          }
        })
      );
      
      setLockedEntries(enhancedEntries);
    };
    
    fetchEntries();
  }, [getLockedEmployeeEntries, employees]);

  // Handle unlocking of employee entries
  const handleUnlock = async (scheduleId: string, scheduleItemId: string, employeeId: string, employeeName?: string) => {
    // Create a unique identifier for the entry
    const entryId = `${scheduleId}-${scheduleItemId}-${employeeId}`;
    setSelectedEntry(entryId);
    setUnlocking(true);
    setSuccessMessage(null);
    
    const success = await unlockEmployeeEntry(scheduleId, scheduleItemId, employeeId);
    
    if (success) {
      // Remove this entry from the local state
      setSuccessMessage(`Entries for ${employeeName || employeeId} unlocked successfully`);
      setTimeout(() => {
        setLockedEntries(prev => 
          prev.filter(entry => 
            !(entry.scheduleId === scheduleId && 
              entry.scheduleItemId === scheduleItemId && 
              entry.employeeId === employeeId)
          )
        );
        setSuccessMessage(null);
      }, 2000);
    }
    
    setUnlocking(false);
    setSelectedEntry(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-medium text-gray-800">Admin - Unlock Entries</h1>
      </div>

      <div className="glass-card p-6 element-transition">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Locked Employee Entries</h2>
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center text-green-800">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              {successMessage}
            </div>
          )}
          
          {lockedEntries.length === 0 ? (
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No locked employee entries found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lockedEntries.map((entry) => {
                    const entryId = `${entry.scheduleId}-${entry.scheduleItemId}-${entry.employeeId}`;
                    const isSelected = selectedEntry === entryId;
                    
                    return (
                      <tr key={entryId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.employeeName || entry.employee}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.task}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium 
                              ${isSelected || unlocking ? 
                                'bg-gray-100 text-gray-400 cursor-not-allowed' : 
                                'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                            onClick={() => handleUnlock(entry.scheduleId, entry.scheduleItemId, entry.employeeId, entry.employeeName)}
                            disabled={isSelected || unlocking}
                          >
                            <Unlock className="h-3.5 w-3.5 mr-1.5" />
                            {isSelected ? 'Unlocking...' : 'Unlock'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnlockEntriesPage;
