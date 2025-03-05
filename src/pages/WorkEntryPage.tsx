
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ArrowLeft, Save, CalendarDays, User, CheckSquare, FileText } from "lucide-react";
import { toast } from "sonner";
import { useEmployees } from "@/contexts/EmployeeContext";
import { useSchedules, Schedule, ScheduleItem, WorkEntry } from "@/contexts/ScheduleContext";

const WorkEntryPage = () => {
  const navigate = useNavigate();
  const { employees } = useEmployees();
  const { schedules, addWorkEntry, getWorkEntriesForEmployee } = useSchedules();
  
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [remarks, setRemarks] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [previousEntries, setPreviousEntries] = useState<WorkEntry[]>([]);

  // Reset the form when schedule changes
  useEffect(() => {
    setSelectedItem(null);
    setSelectedEmployee(null);
    setQuantity(0);
    setRemarks("");
    setPreviousEntries([]);
  }, [selectedSchedule]);

  // Reset employee and update entries when item changes
  useEffect(() => {
    setSelectedEmployee(null);
    setQuantity(0);
    setRemarks("");
    setPreviousEntries([]);
  }, [selectedItem]);

  // Load previous entries when employee is selected
  useEffect(() => {
    if (selectedSchedule && selectedItem && selectedEmployee) {
      const entries = getWorkEntriesForEmployee(selectedSchedule.id, selectedEmployee);
      setPreviousEntries(entries.filter(entry => entry.scheduleItemId === selectedItem.id));
    } else {
      setPreviousEntries([]);
    }
  }, [selectedEmployee, selectedItem, selectedSchedule, getWorkEntriesForEmployee]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSchedule || !selectedItem || !selectedEmployee) {
      toast.error("Please select all required fields");
      return;
    }
    
    setIsLoading(true);
    
    addWorkEntry({
      scheduleId: selectedSchedule.id,
      scheduleItemId: selectedItem.id,
      employeeId: selectedEmployee,
      quantity,
      remarks
    });
    
    // Reset form after submission
    setTimeout(() => {
      setQuantity(0);
      setRemarks("");
      // Refresh previous entries
      const entries = getWorkEntriesForEmployee(selectedSchedule.id, selectedEmployee);
      setPreviousEntries(entries.filter(entry => entry.scheduleItemId === selectedItem.id));
      setIsLoading(false);
    }, 1200);
  };

  // Helper function to get employee name by ID
  const getEmployeeName = (id: string) => {
    const employee = employees.find(emp => emp.id === id);
    return employee ? `${employee.name} ${employee.surname}` : 'Unknown Employee';
  };

  // Get employees assigned to selected task
  const getAssignedEmployees = () => {
    if (!selectedItem) return [];
    
    return employees.filter(employee => 
      selectedItem.employeeIds.includes(employee.id)
    );
  };

  // Sort schedules by date (newest first)
  const sortedSchedules = [...schedules].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

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
          <h1 className="text-2xl font-medium text-gray-800">Work Entry</h1>
        </div>

        <div className="glass-card p-6 element-transition">
          {schedules.length === 0 ? (
            <div className="text-center py-10">
              <CalendarDays className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Schedules Available</h3>
              <p className="text-gray-500 mb-4">Create a schedule first to record work entries</p>
              <button
                onClick={() => navigate('/schedule/create')}
                className="btn-primary"
              >
                Create Schedule
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Schedule Selection */}
              <div className="space-y-2">
                <label htmlFor="scheduleSelect" className="block text-sm font-medium text-gray-700">
                  Select Schedule
                </label>
                <select
                  id="scheduleSelect"
                  className="input-field w-full"
                  value={selectedSchedule?.id || ""}
                  onChange={(e) => {
                    const schedule = schedules.find(s => s.id === e.target.value);
                    setSelectedSchedule(schedule || null);
                  }}
                >
                  <option value="">-- Select a schedule --</option>
                  {sortedSchedules.map((schedule) => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.date} ({schedule.items.length} tasks)
                    </option>
                  ))}
                </select>
              </div>

              {selectedSchedule && (
                <div className="space-y-4">
                  {/* Task Selection */}
                  <div className="space-y-2">
                    <label htmlFor="taskSelect" className="block text-sm font-medium text-gray-700">
                      Select Task
                    </label>
                    <select
                      id="taskSelect"
                      className="input-field w-full"
                      value={selectedItem?.id || ""}
                      onChange={(e) => {
                        const item = selectedSchedule.items.find(i => i.id === e.target.value);
                        setSelectedItem(item || null);
                      }}
                    >
                      <option value="">-- Select a task --</option>
                      {selectedSchedule.items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.task} ({item.employeeIds.length} employees assigned)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {selectedItem && (
                    <>
                      {/* Employee Selection - show as clickable cards */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Select Employee
                        </label>
                        
                        {getAssignedEmployees().length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {getAssignedEmployees().map((employee) => (
                              <div
                                key={employee.id}
                                onClick={() => setSelectedEmployee(employee.id)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                  selectedEmployee === employee.id
                                    ? "border-torryblue-accent bg-torryblue-accent/10"
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center">
                                  <User className="h-5 w-5 text-gray-400 mr-2" />
                                  <span className="font-medium">
                                    {employee.name} {employee.surname}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  ID: {employee.id}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center p-4 border border-dashed border-gray-300 rounded-md">
                            <p className="text-gray-500">No employees assigned to this task</p>
                          </div>
                        )}
                      </div>
                      
                      {selectedEmployee && (
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
                          {/* Previous Entries */}
                          {previousEntries.length > 0 && (
                            <div className="p-3 bg-gray-50 rounded-md space-y-2">
                              <div className="flex items-center text-sm font-medium text-gray-700">
                                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                                Previous Entries
                              </div>
                              <div className="max-h-40 overflow-y-auto">
                                <table className="min-w-full text-sm">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-left py-2 px-1">Time</th>
                                      <th className="text-right py-2 px-1">Quantity</th>
                                      <th className="text-left py-2 px-1">Remarks</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {previousEntries.map((entry) => (
                                      <tr key={entry.id} className="border-b border-gray-100">
                                        <td className="py-2 px-1">
                                          {new Date(entry.recordedAt).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </td>
                                        <td className="py-2 px-1 text-right">
                                          {entry.quantity}
                                        </td>
                                        <td className="py-2 px-1 text-gray-600">
                                          {entry.remarks || "-"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                          
                          {/* Quantity Input */}
                          <div className="space-y-2">
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                              Quantity <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="quantity"
                              type="number"
                              required
                              min="1"
                              className="input-field w-full"
                              value={quantity}
                              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                            />
                          </div>
                          
                          {/* Remarks Input */}
                          <div className="space-y-2">
                            <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
                              Remarks
                            </label>
                            <textarea
                              id="remarks"
                              className="input-field w-full h-20"
                              value={remarks}
                              onChange={(e) => setRemarks(e.target.value)}
                              placeholder="Any additional notes..."
                            />
                          </div>
                          
                          {/* Submit Button */}
                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={isLoading}
                              className={`btn-primary flex items-center ${
                                isLoading ? "opacity-70 cursor-not-allowed" : ""
                              }`}
                            >
                              {isLoading ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <CheckSquare className="h-4 w-4 mr-2" />
                                  Record Work
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default WorkEntryPage;
