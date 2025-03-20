import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { ArrowLeft, Calendar, ClipboardList } from "lucide-react";
import { useSchedules, Schedule, ScheduleItem, WorkEntry } from "../contexts/ScheduleContext";
import { useEmployees } from "../contexts/EmployeeContext";
import { useAuth } from "../contexts/AuthContext";
import StrippingWorkEntryForm from "../components/StrippingWorkEntryForm";
import MachineWorkEntryForm from "../components/MachineWorkEntryForm";
import BailingLaminaWorkEntryForm from "../components/BailingLaminaWorkEntryForm";
import BailingStickWorkEntryForm from "../components/BailingStickWorkEntryForm";
import TicketWorkEntryForm from "../components/TicketWorkEntryForm";
import { toast } from "sonner";

// ... keep existing code (const WorkEntryPage, navigate, useSchedules, etc.)

const WorkEntryPage = () => {
  const navigate = useNavigate();
  const { schedules, workEntries, getWorkEntriesForEmployee, addWorkEntry, updateWorkEntry, isEmployeeEntryLocked, lockEmployeeEntry } = useSchedules();
  const { employees } = useEmployees();
  const { user } = useAuth();
  
  // ... keep existing code (state variables, filter logic)
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<ScheduleItem | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [remarks, setRemarks] = useState<string>("");
  const [formComplete, setFormComplete] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editEntryId, setEditEntryId] = useState<string | null>(null);
  
  const today = new Date().toISOString().split('T')[0];
  
  // Filter schedules to only include today's schedules for non-admin users
  const visibleSchedules = user?.role === 'admin' 
    ? schedules // Admins see all schedules
    : schedules.filter(s => s.date === today); // Non-admins see only today's schedules
  
  const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);
  
  const filteredScheduleItems = selectedSchedule?.items.filter(item => 
    item.employeeIds.includes(selectedEmployeeId)
  ) || [];
  
  const employeeWorkEntries = selectedScheduleId && selectedEmployeeId
    ? getWorkEntriesForEmployee(selectedScheduleId, selectedEmployeeId)
    : [];
  
  const scheduleItemEntries = selectedScheduleItem 
    ? employeeWorkEntries.filter(entry => entry.scheduleItemId === selectedScheduleItem.id)
    : [];

  const isLocked = selectedScheduleId && selectedScheduleItem && selectedEmployeeId
    ? isEmployeeEntryLocked(selectedScheduleId, selectedScheduleItem.id, selectedEmployeeId)
    : false;

  // ... keep existing code (useEffect, handlers)
  useEffect(() => {
    if (selectedScheduleItem && selectedEmployeeId) {
      const isTicketTask = selectedScheduleItem.task.toLowerCase().includes("ticket");
      const hasQuantity = isTicketTask || (quantity !== "" && quantity >= 0);
      const hasRemarks = remarks.trim() !== "";
      setFormComplete(hasQuantity && hasRemarks);
    } else {
      setFormComplete(false);
    }
  }, [selectedScheduleItem, selectedEmployeeId, quantity, remarks]);

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.name} ${employee.surname}` : employeeId;
  };

  useEffect(() => {
    setSelectedScheduleItem(null);
    setQuantity("");
    setRemarks("");
    setEditMode(false);
    setEditEntryId(null);
  }, [selectedScheduleId, selectedEmployeeId]);
  
  const handleEntryAdded = () => {
    setEditMode(false);
    setEditEntryId(null);
  };

  const handleEditEntry = (entry: any) => {
    if (entry.locked) {
      toast.error("Cannot edit a locked entry");
      return;
    }

    setEditMode(true);
    setEditEntryId(entry.id);
    setQuantity(entry.quantity);
    setRemarks(entry.remarks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedScheduleId || !selectedScheduleItem || !selectedEmployeeId) {
      toast.error("Please select all required fields");
      return;
    }
    
    if (!editMode && isLocked) {
      toast.error("This worker has been locked for this task");
      return;
    }
    
    const finalQuantity = quantity === "" ? 0 : Number(quantity);

    if (editMode && editEntryId) {
      const success = await updateWorkEntry(editEntryId, {
        quantity: finalQuantity,
        remarks
      });

      if (success) {
        toast.success("Work entry updated successfully");
        setEditMode(false);
        setEditEntryId(null);
        setQuantity("");
        setRemarks("");
      }
    } else {
      addWorkEntry({
        scheduleId: selectedScheduleId,
        scheduleItemId: selectedScheduleItem.id,
        employeeId: selectedEmployeeId,
        quantity: finalQuantity,
        remarks
      });
      
      setQuantity("");
      setRemarks("");
      
      toast.success("Work entry recorded successfully");
    }
  };

  const handleLockEntries = () => {
    if (selectedScheduleId && selectedScheduleItem && selectedEmployeeId) {
      lockEmployeeEntry(selectedScheduleId, selectedScheduleItem.id, selectedEmployeeId);
      toast.success("Entries locked successfully");
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
          <h1 className="text-2xl font-medium text-gray-800">Work Entry</h1>
        </div>

        <div className="glass-card p-6 element-transition">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Record Work Entry</h2>
            
            {user?.role !== 'admin' && visibleSchedules.length === 0 && (
              <div className="text-center p-4 bg-amber-50 rounded-lg mb-4">
                <p className="text-amber-800">Only today's schedules ({today}) are available for recording entries.</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                  {visibleSchedules.map((schedule) => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.date} ({schedule.id})
                    </option>
                  ))}
                </select>
              </div>
              
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
            
            {selectedScheduleItem?.task.toLowerCase().includes("ticket") && (
              <TicketWorkEntryForm
                scheduleId={selectedScheduleId}
                scheduleItemId={selectedScheduleItem.id}
                employeeId={selectedEmployeeId}
                onEntryAdded={handleEntryAdded}
                existingEntries={scheduleItemEntries}
              />
            )}
            {selectedScheduleItem?.task === "Stripping" && selectedScheduleItem?.targetMass && selectedScheduleItem?.numberOfScales ? (
              <StrippingWorkEntryForm
                scheduleId={selectedScheduleId}
                scheduleItemId={selectedScheduleItem.id}
                employeeId={selectedEmployeeId}
                targetMass={selectedScheduleItem.targetMass}
                numberOfScales={selectedScheduleItem.numberOfScales}
                onEntryAdded={handleEntryAdded}
                existingEntries={scheduleItemEntries}
              />
            ) : selectedScheduleItem?.task === "Machine" ? (
              <MachineWorkEntryForm
                scheduleId={selectedScheduleId}
                scheduleItemId={selectedScheduleItem.id}
                employeeId={selectedEmployeeId}
                targetMass={selectedScheduleItem.targetMass || 0}
                onEntryAdded={handleEntryAdded}
                existingEntries={scheduleItemEntries}
              />
            ) : selectedScheduleItem?.task === "Bailing Lamina" ? (
              <BailingLaminaWorkEntryForm
                scheduleId={selectedScheduleId}
                scheduleItemId={selectedScheduleItem.id}
                employeeId={selectedEmployeeId}
                onEntryAdded={handleEntryAdded}
                existingEntries={scheduleItemEntries}
                targetMass={selectedScheduleItem.targetMass || 0}
              />
            ) : selectedScheduleItem?.task === "Bailing Sticks" ? (
              <BailingStickWorkEntryForm
                      scheduleId={selectedScheduleId}
                      scheduleItemId={selectedScheduleItem.id}
                      employeeId={selectedEmployeeId}
                      onEntryAdded={handleEntryAdded}
                      existingEntries={scheduleItemEntries} targetMass={0}              />
            ) : (
              selectedScheduleItem && (
                <div className="mt-4">
                  <div className="glass-card p-4">
                    <h3 className="text-md font-medium mb-4">
                      {editMode ? 'Edit' : 'Regular'} Work Entry for {getEmployeeName(selectedEmployeeId)}
                    </h3>
                    
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
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
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
                                    {selectedScheduleItem?.task.toLowerCase().includes("ticket") ? "N/A" : `${entry.quantity}`}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {entry.remarks || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {entry.locked ? (
                                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Locked</span>
                                    ) : (
                                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {!entry.locked && (
                                      <button
                                        type="button"
                                        className="text-blue-600 hover:text-blue-800"
                                        onClick={() => handleEditEntry(entry)}
                                      >
                                        Edit
                                      </button>
                                    )}
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
            
            {selectedEmployeeId && filteredScheduleItems.length === 0 && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">This employee has no tasks assigned in the selected schedule.</p>
              </div>
            )}
            
            {visibleSchedules.length === 0 && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">
                  {user?.role === 'admin' 
                    ? "No schedules found. Create a schedule first."
                    : `No schedules found for today (${today}). Please contact an administrator.`
                  }
                </p>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => navigate('/schedule/create')}
                    className="mt-3 btn-primary"
                  >
                    Create Schedule
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default WorkEntryPage;
