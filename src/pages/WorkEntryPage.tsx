
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { ArrowLeft, Calendar, ClipboardList } from "lucide-react";
import { useSchedules, Schedule, ScheduleItem } from "@/contexts/ScheduleContext";
import { useEmployees } from "@/contexts/EmployeeContext";
import StrippingWorkEntryForm from "@/components/StrippingWorkEntryForm";
import { toast } from "sonner";

const WorkEntryPage = () => {
  const navigate = useNavigate();
  const { schedules, workEntries, getWorkEntriesForEmployee, addWorkEntry, isEmployeeEntryLocked } = useSchedules();
  const { employees } = useEmployees();
  
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<ScheduleItem | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);
  const [remarks, setRemarks] = useState<string>("");
  
  // Get the selected schedule object
  const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);
  
  // Filter schedule items that have the selected employee assigned
  const filteredScheduleItems = selectedSchedule?.items.filter(item => 
    item.employeeIds.includes(selectedEmployeeId)
  ) || [];
  
  // Get work entries for the selected employee and schedule
  const employeeWorkEntries = selectedScheduleId && selectedEmployeeId
    ? getWorkEntriesForEmployee(selectedScheduleId, selectedEmployeeId)
    : [];
  
  // Filter entries for the selected schedule item
  const scheduleItemEntries = selectedScheduleItem 
    ? employeeWorkEntries.filter(entry => entry.scheduleItemId === selectedScheduleItem.id)
    : [];

  // Check if the employee is locked for the selected task
  const isLocked = selectedScheduleId && selectedScheduleItem && selectedEmployeeId
    ? isEmployeeEntryLocked(selectedScheduleId, selectedScheduleItem.id, selectedEmployeeId)
    : false;

  // Get the employee name
  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.name} ${employee.surname}` : employeeId;
  };

  // Reset form when changing schedule or employee
  useEffect(() => {
    setSelectedScheduleItem(null);
    setQuantity(0);
    setRemarks("");
  }, [selectedScheduleId, selectedEmployeeId]);
  
  // Handle refresh after entry is added
  const handleEntryAdded = () => {
    // Form reset is handled by the component submitting the entry
  };

  // Handle form submission for regular entries
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedScheduleId || !selectedScheduleItem || !selectedEmployeeId) {
      toast.error("Please select all required fields");
      return;
    }
    
    // Check if employee is locked for this task
    if (isLocked) {
      toast.error("This worker has been locked for this task");
      return;
    }
    
    addWorkEntry({
      scheduleId: selectedScheduleId,
      scheduleItemId: selectedScheduleItem.id,
      employeeId: selectedEmployeeId,
      quantity,
      remarks
    });
    
    // Reset form after submission
    setQuantity(0);
    setRemarks("");
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
          <h1 className="text-2xl font-medium text-gray-800">Work Entry</h1>
        </div>

        <div className="glass-card p-6 element-transition">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Record Work Entry</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Schedule Selection */}
              <div>
                <label htmlFor="scheduleSelect" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Schedule <span className="text-red-500">*</span>
                </label>
                <select
                  id="scheduleSelect"
                  className="input-field w-full"
                  value={selectedScheduleId}
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                >
                  <option value="">-- Select a Schedule --</option>
                  {schedules.map((schedule) => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.date} ({schedule.id})
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Employee Selection (only shown when schedule is selected) */}
              {selectedScheduleId && (
                <div>
                  <label htmlFor="employeeSelect" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Employee <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="employeeSelect"
                    className="input-field w-full"
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  >
                    <option value="">-- Select an Employee --</option>
                    {selectedSchedule?.items.flatMap(item => 
                      item.employeeIds.map(empId => ({
                        id: empId,
                        name: getEmployeeName(empId)
                      }))
                    )
                    .filter((emp, index, self) => 
                      index === self.findIndex((e) => e.id === emp.id)
                    )
                    .map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            {/* Task Selection (only shown when employee is selected) */}
            {selectedEmployeeId && filteredScheduleItems.length > 0 && (
              <div className="mb-4">
                <label htmlFor="taskSelect" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Task <span className="text-red-500">*</span>
                </label>
                <select
                  id="taskSelect"
                  className="input-field w-full"
                  value={selectedScheduleItem?.id || ""}
                  onChange={(e) => {
                    const selectedItemId = e.target.value;
                    const item = selectedSchedule?.items.find(i => i.id === selectedItemId) || null;
                    setSelectedScheduleItem(item);
                  }}
                >
                  <option value="">-- Select a Task --</option>
                  {filteredScheduleItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.task}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Conditional rendering based on the selected task */}
            {selectedScheduleItem?.task === "Stripping" && selectedScheduleItem?.targetMass && selectedScheduleItem?.numberOfScales ? (
              // Stripping task entry form with dynamic table
              <StrippingWorkEntryForm
                scheduleId={selectedScheduleId}
                scheduleItemId={selectedScheduleItem.id}
                employeeId={selectedEmployeeId}
                targetMass={selectedScheduleItem.targetMass}
                numberOfScales={selectedScheduleItem.numberOfScales}
                onEntryAdded={handleEntryAdded}
                existingEntries={scheduleItemEntries}
              />
            ) : (
              selectedScheduleItem && (
                <div className="mt-4">
                  <div className="glass-card p-4">
                    <h3 className="text-md font-medium mb-4">Regular Work Entry for {getEmployeeName(selectedEmployeeId)}</h3>
                    
                    {isLocked ? (
                      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                        <p className="text-gray-700">This worker's entries have been locked. No further entries can be recorded.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                            Quantity {selectedScheduleItem.task.toLowerCase() !== "tickets" ? <span className="text-red-500">*</span> : "(N/A for tickets)"}
                          </label>
                          {selectedScheduleItem.task.toLowerCase() === "tickets" ? (
                            <div className="input-field w-full mt-1 bg-gray-100">N/A</div>
                          ) : (
                            <input
                              type="number"
                              id="quantity"
                              min="0"
                              step="0.01"
                              className="input-field w-full mt-1"
                              value={quantity}
                              onChange={(e) => setQuantity(Number(e.target.value))}
                              required
                            />
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
                            Remarks (optional)
                          </label>
                          <textarea
                            id="remarks"
                            rows={3}
                            className="input-field w-full mt-1"
                            placeholder="Add any remarks about this entry"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                          ></textarea>
                        </div>
                        
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="btn-primary"
                          >
                            Record Entry
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Display existing entries if any */}
                    {scheduleItemEntries.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium mb-3">Previous Entries</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date & Time
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Quantity
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Remarks
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {scheduleItemEntries.map((entry) => (
                                <tr key={entry.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(entry.recordedAt).toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {selectedScheduleItem?.task.toLowerCase() === "tickets" ? "N/A" : `${entry.quantity}`}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {entry.remarks || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
            
            {/* No tasks message */}
            {selectedEmployeeId && filteredScheduleItems.length === 0 && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">This employee has no tasks assigned in the selected schedule.</p>
              </div>
            )}
            
            {/* No schedules message */}
            {schedules.length === 0 && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No schedules found. Create a schedule first.</p>
                <button
                  onClick={() => navigate('/schedule/create')}
                  className="mt-3 btn-primary"
                >
                  Create Schedule
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default WorkEntryPage;
