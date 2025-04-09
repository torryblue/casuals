import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useSchedules } from "@/contexts/ScheduleContext";
import { useEmployees } from "@/contexts/EmployeeContext";
import { ArrowLeft, Check, Plus, Trash, AlertCircle } from "lucide-react";
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
    
    // Check if adding an employee
    if (isSelected) {
      // Check if the employee is already assigned to this specific item (in case of editing)
      const isEmployeeInCurrentItem = scheduleItems[index].employeeIds.includes(employeeId);
      
      // Only check for other assignments if the employee is not already in this item
      if (!isEmployeeInCurrentItem) {
        // Check if employee is assigned to another item in this schedule
        const isEmployeeAssignedToAnotherItemInSameSchedule = scheduleItems.some((item, idx) => 
          idx !== index && item.employeeIds.includes(employeeId)
        );
        
        // Check if employee is assigned to another schedule on the same date
        const isEmployeeAssignedToAnotherSchedule = isEmployeeAssignedForDate(employeeId, scheduleDate) && 
          !schedule.items.some(item => item.employeeIds.includes(employeeId));
        
        if (isEmployeeAssignedToAnotherItemInSameSchedule || isEmployeeAssignedToAnotherSchedule) {
          toast.error("This employee is already assigned to another duty for this date.", {
            description: "Employees cannot be assigned to multiple tasks on the same day."
          });
          return;
        }
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
    
    for (const item of scheduleItems) {
      if (!item.task || item.workers <= 0) {
        toast.error("Please fill in all required fields for each schedule item.");
        return;
      }
      
      if (item.employeeIds.length <= 0) {
        toast.error("Please assign at least one employee to each schedule item.");
        return;
      }
    }
    
    // Check for duplicate employee assignments across items
    const employeeAssignments = new Map<string, number>();
    let hasDuplicateAssignments = false;
    
    scheduleItems.forEach((item, itemIndex) => {
      item.employeeIds.forEach(empId => {
        if (employeeAssignments.has(empId)) {
          const existingItemIndex = employeeAssignments.get(empId);
          if (existingItemIndex !== itemIndex) {
            hasDuplicateAssignments = true;
            toast.error(`Employee ${getEmployeeName(empId)} is assigned to multiple tasks in this schedule.`, {
              description: "Employees cannot be assigned to multiple tasks on the same day."
            });
          }
        } else {
          employeeAssignments.set(empId, itemIndex);
        }
      });
    });
    
    if (hasDuplicateAssignments) {
      return;
    }
    
    console.log('Updating schedule with items:', JSON.stringify(scheduleItems, null, 2));
    
    // Fix: Pass scheduleDate as the second argument
    updateSchedule(id || '', scheduleDate, scheduleItems);
    navigate('/master/schedules');
  };
  
  // Helper function to get employee name by ID
  const getEmployeeName = (id: string) => {
    const employee = employees.find(emp => emp.id === id);
    return employee ? `${employee.name} ${employee.surname}` : 'Unknown';
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
          <div className="p-3 mb-4 bg-amber-50 rounded-md border border-amber-200 flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              Note: Employees cannot be assigned to multiple tasks on the same day. Any attempt to assign an employee to multiple tasks will be prevented.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
                    
                    {item.task.toLowerCase() === "bailing lamina" && (
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
                    
                    {!["stripping", "bailing lamina", "grading", "machine", "sticks"].includes(item.task.toLowerCase()) && (
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
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign Employees <span className="text-red-500">*</span>
                    </label>
                    <div className="border rounded-md p-2 bg-white max-h-40 overflow-y-auto">
                      <div className="space-y-1">
                        {employees.map(employee => {
                          // Check if employee is assigned elsewhere for this date
                          const isEmployeeAssignedElsewhere = 
                            !item.employeeIds.includes(employee.id) && 
                            (isEmployeeAssignedForDate(employee.id, scheduleDate) || 
                             scheduleItems.some((otherItem, otherIndex) => 
                               index !== otherIndex && otherItem.employeeIds.includes(employee.id)
                             ));
                          
                          return (
                            <div key={employee.id} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`employee-${index}-${employee.id}`}
                                checked={item.employeeIds.includes(employee.id)}
                                onChange={(e) => handleEmployeeSelection(index, employee.id, e.target.checked)}
                                className="mr-2"
                                disabled={isEmployeeAssignedElsewhere}
                              />
                              <label 
                                htmlFor={`employee-${index}-${employee.id}`} 
                                className={`text-sm ${isEmployeeAssignedElsewhere ? 'text-gray-400' : ''}`}
                              >
                                {employee.name} {employee.surname}
                                {isEmployeeAssignedElsewhere && " (assigned elsewhere)"}
                              </label>
                            </div>
                          );
                        })}
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
