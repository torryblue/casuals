
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useSchedules } from "@/contexts/ScheduleContext";
import { useEmployees } from "@/contexts/EmployeeContext";
import { ArrowLeft, Check, Plus, Trash } from "lucide-react";
import { toast } from "sonner";

const EditSchedulePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getScheduleById, updateSchedule, isLoading, isEmployeeAssignedForDate } = useSchedules();
  const { employees } = useEmployees();
  
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  
  useEffect(() => {
    if (id) {
      const schedule = getScheduleById(id);
      if (schedule) {
        setScheduleDate(schedule.date);
        setScheduleItems(schedule.items);
      } else {
        toast.error("Schedule not found");
        navigate('/master/schedules');
      }
    }
  }, [id, getScheduleById, navigate]);
  
  const handleDutyChange = (index: number, value: string) => {
    const newItems = [...scheduleItems];
    newItems[index].dutyName = value;
    setScheduleItems(newItems);
  };
  
  const handleTaskChange = (index: number, value: string) => {
    const newItems = [...scheduleItems];
    newItems[index].task = value;
    setScheduleItems(newItems);
  };
  
  const handleWorkersChange = (index: number, value: string) => {
    const newItems = [...scheduleItems];
    newItems[index].workers = parseInt(value) || 0;
    setScheduleItems(newItems);
  };
  
  const ensureWholeNumber = (value: number): number => {
    return Math.round(value);
  };
  
  const handleTargetMassChange = (index: number, value: string) => {
    const newItems = [...scheduleItems];
    newItems[index].targetMass = ensureWholeNumber(parseFloat(value) || 0);
    setScheduleItems(newItems);
  };
  
  const handleNumberOfScalesChange = (index: number, value: string) => {
    const newItems = [...scheduleItems];
    newItems[index].numberOfScales = ensureWholeNumber(parseFloat(value) || 1);
    setScheduleItems(newItems);
  };
  
  const handleNumberOfBalesChange = (index: number, value: string) => {
    const newItems = [...scheduleItems];
    newItems[index].numberOfBales = ensureWholeNumber(parseFloat(value) || 0);
    setScheduleItems(newItems);
  };
  
  const handleClassGradesChange = (index: number, value: string) => {
    const newItems = [...scheduleItems];
    newItems[index].classGrades = value.split(',').map(grade => grade.trim());
    setScheduleItems(newItems);
  };
  
  const handleQuantityChange = (index: number, value: string) => {
    const newItems = [...scheduleItems];
    newItems[index].quantity = ensureWholeNumber(parseFloat(value) || 0);
    setScheduleItems(newItems);
  };
  
  const handleEmployeeSelection = (index: number, employeeId: string, isSelected: boolean) => {
    const schedule = getScheduleById(id || '');
    if (!schedule) return;
    
    // For adding an employee, check if they're already assigned for this date
    if (isSelected) {
      // Allow them to be added to the same schedule item they were already in
      const isEmployeeInCurrentItem = schedule.items.some(item => 
        item.id === scheduleItems[index].id && item.employeeIds.includes(employeeId)
      );
      
      // Check if employee is assigned to a different item on this date
      const isEmployeeAssignedToDifferentItem = !isEmployeeInCurrentItem && 
        isEmployeeAssignedForDate(employeeId, scheduleDate);
      
      if (isEmployeeAssignedToDifferentItem) {
        toast.error("This employee is already assigned to another duty for this date.");
        return;
      }
    }
    
    const newItems = [...scheduleItems];
    if (isSelected) {
      newItems[index].employeeIds = [...newItems[index].employeeIds, employeeId];
    } else {
      newItems[index].employeeIds = newItems[index].employeeIds.filter(id => id !== employeeId);
    }
    
    setScheduleItems(newItems);
  };
  
  const removeScheduleItem = (index: number) => {
    setScheduleItems(prev => prev.filter((_, i) => i !== index));
  };
  
  const addScheduleItem = () => {
    setScheduleItems(prev => [...prev, {
      id: `temp-${Date.now()}`,
      task: "",
      dutyName: "",
      workers: 0,
      employeeIds: [],
      targetMass: 0,
      numberOfScales: 1,
      numberOfBales: 0,
      classGrades: [],
      quantity: 0
    }]);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    for (const item of scheduleItems) {
      if (!item.task || !item.dutyName || item.workers <= 0) {
        toast.error("Please fill in all required fields for each schedule item.");
        return;
      }
      
      if (item.employeeIds.length <= 0) {
        toast.error("Please assign at least one employee to each schedule item.");
        return;
      }
      
      if (item.workers !== item.employeeIds.length) {
        toast.error(`The number of workers (${item.workers}) must match the number of employees assigned (${item.employeeIds.length}).`);
        return;
      }
    }
    
    // Update schedule
    updateSchedule(id || '', scheduleItems);
    navigate('/master/schedules');
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
          <h1 className="text-2xl font-medium text-gray-800">Edit Schedule</h1>
        </div>
        
        <div className="glass-card p-6 element-transition">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Schedule date - read only since we don't want to change dates for existing schedules */}
            <div className="space-y-2">
              <label htmlFor="scheduleDate" className="block text-sm font-medium text-gray-700">
                Schedule Date <span className="text-red-500">*</span>
              </label>
              <input
                id="scheduleDate"
                type="date"
                className="input-field bg-gray-100"
                value={scheduleDate}
                readOnly
              />
              <p className="text-sm text-gray-500">Date cannot be changed for existing schedules.</p>
            </div>
            
            {/* Schedule items */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-800">Tasks</h2>
              
              {scheduleItems.map((item, index) => (
                <div key={index} className="p-4 border rounded-md bg-gray-50">
                  <div className="flex justify-between">
                    <h3 className="text-md font-medium">Task #{index + 1}</h3>
                    <button 
                      type="button"
                      onClick={() => removeScheduleItem(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Task Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="input-field w-full"
                        value={item.task}
                        onChange={(e) => handleTaskChange(index, e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Duty Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="input-field w-full"
                        value={item.dutyName}
                        onChange={(e) => handleDutyChange(index, e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Number of Workers <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="input-field w-full"
                        value={item.workers}
                        onChange={(e) => handleWorkersChange(index, e.target.value)}
                        required
                      />
                    </div>
                    
                    {/* Task-specific fields */}
                    {item.task.toLowerCase() === "stripping" && (
                      <>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Target Mass (kg)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            className="input-field w-full"
                            value={item.targetMass}
                            onChange={(e) => handleTargetMassChange(index, e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Number of Scales
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            className="input-field w-full"
                            value={item.numberOfScales}
                            onChange={(e) => handleNumberOfScalesChange(index, e.target.value)}
                          />
                        </div>
                      </>
                    )}
                    
                    {item.task.toLowerCase() === "spraying" && (
                      <>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Target Mass (kg)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            className="input-field w-full"
                            value={item.targetMass}
                            onChange={(e) => handleTargetMassChange(index, e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Number of Bales
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            className="input-field w-full"
                            value={item.numberOfBales}
                            onChange={(e) => handleNumberOfBalesChange(index, e.target.value)}
                          />
                        </div>
                      </>
                    )}
                    
                    {item.task.toLowerCase() === "grading" && (
                      <>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Number of Bales
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            className="input-field w-full"
                            value={item.numberOfBales}
                            onChange={(e) => handleNumberOfBalesChange(index, e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Class Grades (comma separated)
                          </label>
                          <input
                            type="text"
                            className="input-field w-full"
                            value={item.classGrades?.join(', ') || ''}
                            onChange={(e) => handleClassGradesChange(index, e.target.value)}
                            placeholder="e.g. A, B, C"
                          />
                        </div>
                      </>
                    )}
                    
                    {(item.task.toLowerCase() === "machine" || item.task.toLowerCase() === "sticks") && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Target Mass (kg)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className="input-field w-full"
                          value={item.targetMass}
                          onChange={(e) => handleTargetMassChange(index, e.target.value)}
                        />
                      </div>
                    )}
                    
                    {!["stripping", "spraying", "grading", "machine", "sticks"].includes(item.task.toLowerCase()) && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Quantity (Tickets)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className="input-field w-full"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Employee assignment */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign Employees <span className="text-red-500">*</span>
                    </label>
                    <div className="border rounded-md p-2 bg-white max-h-40 overflow-y-auto">
                      <div className="space-y-1">
                        {employees.map(employee => (
                          <div key={employee.id} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`employee-${index}-${employee.id}`}
                              checked={item.employeeIds.includes(employee.id)}
                              onChange={(e) => handleEmployeeSelection(index, employee.id, e.target.checked)}
                              className="mr-2"
                            />
                            <label htmlFor={`employee-${index}-${employee.id}`} className="text-sm">
                              {employee.name} {employee.surname}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addScheduleItem}
                className="btn-secondary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Task
              </button>
            </div>
            
            <div className="pt-4 border-t flex justify-end">
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
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Update Schedule
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default EditSchedulePage;
