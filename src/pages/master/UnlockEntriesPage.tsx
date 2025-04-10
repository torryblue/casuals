
import { useState, useEffect } from "react";
import { ArrowLeft, Unlock, Search, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSchedules } from "@/contexts/ScheduleContext";
import { useEmployees } from "@/contexts/EmployeeContext";
import { toast } from "sonner";

const UnlockEntriesPage = () => {
  const navigate = useNavigate();
  const { getLockedEmployeeEntries, unlockEmployeeEntry } = useSchedules();
  const { employees } = useEmployees();
  
  const [lockedEntries, setLockedEntries] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  
  useEffect(() => {
    // Get locked entries from context
    const entries = getLockedEmployeeEntries();
    
    // Add employee names to entries
    const entriesWithNames = entries.map(entry => {
      const employee = employees.find(emp => emp.id === entry.employeeId);
      return {
        ...entry,
        employeeName: employee ? `${employee.name} ${employee.surname}` : 'Unknown Employee'
      };
    });
    
    setLockedEntries(entriesWithNames);
  }, [getLockedEmployeeEntries, employees]);
  
  // Filter entries based on search query
  const filteredEntries = lockedEntries.filter(entry => {
    const searchString = `${entry.employeeName} ${entry.date} ${entry.task}`.toLowerCase();
    return searchString.includes(searchQuery.toLowerCase());
  });
  
  // Handle unlock entry
  const handleUnlock = async (scheduleId: string, scheduleItemId: string, employeeId: string) => {
    setIsUnlocking(true);
    
    try {
      const success = await unlockEmployeeEntry(scheduleId, scheduleItemId, employeeId);
      
      if (success) {
        // Remove the unlocked entry from the list
        setLockedEntries(prev => 
          prev.filter(entry => 
            !(entry.scheduleId === scheduleId && 
              entry.scheduleItemId === scheduleItemId && 
              entry.employeeId === employeeId)
          )
        );
      }
    } finally {
      setIsUnlocking(false);
    }
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
        <h1 className="text-2xl font-medium text-gray-800">Unlock Work Entries</h1>
      </div>

      <div className="glass-card p-6 element-transition">
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="input-field pl-10 w-full"
              placeholder="Search employees, dates, or tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {filteredEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
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
                {filteredEntries.map((entry, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.employeeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.task}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleUnlock(entry.scheduleId, entry.scheduleItemId, entry.employeeId)}
                        disabled={isUnlocking}
                        className="text-torryblue-accent hover:text-torryblue-accent/80 flex items-center space-x-1"
                      >
                        <Unlock className="h-4 w-4" />
                        <span>Unlock</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No locked entries</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no locked employee entries at this time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnlockEntriesPage;
