import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { useEmployees } from "@/contexts/EmployeeContext";
import { useSchedules } from "@/contexts/ScheduleContext";
import BailingLaminaScheduleForm from "@/components/BailingLaminaScheduleForm";
import StrippingScheduleForm from "@/components/StrippingScheduleForm";
import MachineScheduleForm from "@/components/MachineScheduleForm";
import GradingScheduleForm from "@/components/GradingScheduleForm";
import AppLayout from "@/components/AppLayout";

const PREDEFINED_TASKS = [
  "Stripping",
  "Bailing Lamina", 
  "Machine",
  "Bailing Sticks",
  "Ticket Based Work"
];

const CreateSchedulePage = () => {
  const navigate = useNavigate();
  const { employees } = useEmployees();
  const { 
    addSchedule, 
    isEmployeeAssignedForDate, 
    isLoading: isScheduleLoading, 
    schedules 
  } = useSchedules();
  
  const [isLoading, setIsLoading] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [scheduleItems, setScheduleItems] = useState([
    { 
      task: PREDEFINED_TASKS[0],
      workers: 0, 
      employeeIds: [],
      targetMass: 0,
      numberOfScales: 1,
      numberOfBales: 0,
      classGrades: [],
      quantity: 0
    }
  ]);
  const [tasksScheduledForDay, setTasksScheduledForDay] = useState<string[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setScheduleDate(today);
  }, []);

  // Check which tasks are already scheduled for the selected date
  useEffect(() => {
    const tasksForSelectedDate = schedules
      .filter(schedule => schedule.date === scheduleDate)
      .flatMap(schedule => schedule.items.map(item => item.task));
    
    // Get unique tasks
    const uniqueTasksScheduled = [...new Set(tasksForSelectedDate)];
    setTasksScheduledForDay(uniqueTasksScheduled);
    
    // Update the task selection if it's already scheduled
    setScheduleItems(prev => {
      return prev.map(item => {
        if (uniqueTasksScheduled.includes(item.task)) {
          // Find the first available task that's not scheduled
          const availableTask = PREDEFINED_TASKS.find(task => !uniqueTasksScheduled.includes(task));
          return {
            ...item,
            task: availableTask || item.task // Keep the current task if no alternatives
          };
        }
        return item;
      });
    });
  }, [scheduleDate, schedules]);

  const handleAddItem = () => {
    // Find first non-scheduled task
    const availableTask = PREDEFINED_TASKS.find(task => !tasksScheduledForDay.includes(task)) || PREDEFINED_TASKS[0];
    
    setScheduleItems([...scheduleItems, { 
      task: availableTask,
      workers: 0, 
      employeeIds: [],
      targetMass: 0,
      numberOfScales: 1,
      numberOfBales: 0,
      classGrades: [],
      quantity: 0
    }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...scheduleItems];
    newItems.splice(index, 1);
    setScheduleItems(newItems);
  };

  const handleItemChange = (
    index: number,
    field: string,
    value: string | number | string[]
  ) => {
    const newItems = [...scheduleItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setScheduleItems(newItems);
  };

  const handleEmployeeSelection = (index: number, employeeId: string, isSelected: boolean) => {
    if (isSelected && isEmployeeAssignedForDate(employeeId, scheduleDate)) {
      toast.error("This employee is already assigned to another duty for this date.");
      return;
    }

    const newItems = [...scheduleItems];
    let currentEmployees = [...(newItems[index].employeeIds as string[])];
    
    if (isSelected) {
      currentEmployees.push(employeeId);
    } else {
      currentEmployees = currentEmployees.filter(id => id !== employeeId);
    }
    
    newItems[index] = { ...newItems[index], employeeIds: currentEmployees };
    setScheduleItems(newItems);
  };

  const ensureWholeNumber = (value: number): number => {
    return Math.round(value);
  };

  const handleStrippingDataChange = (index: number, data: { employeeIds: string[], targetMass: number, numberOfScales: number }) => {
    const newItems = [...scheduleItems];
    newItems[index] = { 
      ...newItems[index], 
      employeeIds: data.employeeIds,
      workers: data.employeeIds.length,
      targetMass: ensureWholeNumber(data.targetMass),
      numberOfScales: ensureWholeNumber(data.numberOfScales)
    };
    setScheduleItems(newItems);
  };

  const handleBailingLaminaDataChange = (index: number, data: { employeeIds: string[], targetMass: number }) => {
    const newItems = [...scheduleItems];
    newItems[index] = { 
      ...newItems[index], 
      employeeIds: data.employeeIds,
      workers: data.employeeIds.length,
      targetMass: ensureWholeNumber(data.targetMass)
    };
    setScheduleItems(newItems);
  };

  const handleMachineDataChange = (index: number, data: { employeeIds: string[], targetMass: number, workers: number }) => {
    const newItems = [...scheduleItems];
    newItems[index] = { 
      ...newItems[index], 
      employeeIds: data.employeeIds,
      workers: data.workers,
      targetMass: ensureWholeNumber(data.targetMass)
    };
    setScheduleItems(newItems);
  };

  const handleGradingDataChange = (index: number, data: { employeeIds: string[], numberOfBales: number, classGrades: string[] }) => {
    const newItems = [...scheduleItems];
    newItems[index] = { 
      ...newItems[index], 
      employeeIds: data.employeeIds,
      workers: data.employeeIds.length,
      numberOfBales: ensureWholeNumber(data.numberOfBales),
      classGrades: data.classGrades
    };
    setScheduleItems(newItems);
  };

  const validateScheduleItems = () => {
    for (const item of scheduleItems) {
      if (item.employeeIds.length === 0) {
        toast.error(`Please assign at least one employee to the task: ${item.task}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateScheduleItems()) {
      return;
    }
    
    setIsLoading(true);
    
    // Add console logging
    console.log('Submitting schedule with date:', scheduleDate);
    console.log('Schedule items:', JSON.stringify(scheduleItems, null, 2));
    
    addSchedule(scheduleDate, scheduleItems);
    
    setTimeout(() => {
      setIsLoading(false);
      navigate('/');
    }, 1200);
  };

  // Check if a task is already scheduled for the selected date
  const isTaskScheduledForDay = (task: string) => {
    return tasksScheduledForDay.includes(task);
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
          <h1 className="text-2xl font-medium text-gray-800">Create Today's Schedule</h1>
        </div>

        <div className="glass-card p-6 element-transition">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="scheduleDate" className="block text-sm font-medium text-gray-700">
                  Schedule Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="scheduleDate"
                  name="scheduleDate"
                  type="date"
                  required
                  className="input-field w-full md:w-64"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-medium text-gray-700">Schedule Items</h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center text-sm text-torryblue-accent hover:text-torryblue-accent/80"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </button>
                </div>
                
                <div className="space-y-4">
                  {scheduleItems.map((item, index) => (
                    <div key={index} className="glass-card p-4 rounded-md">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-sm font-medium text-gray-500">Item {index + 1}</h4>
                        {scheduleItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-gray-600">
                            Task
                          </label>
                          <select
                            required
                            className="input-field w-full"
                            value={item.task}
                            onChange={(e) => handleItemChange(index, "task", e.target.value)}
                          >
                            {PREDEFINED_TASKS.map((task) => (
                              <option 
                                key={task} 
                                value={task}
                                disabled={isTaskScheduledForDay(task) && item.task !== task}
                                className={isTaskScheduledForDay(task) && item.task !== task ? "text-gray-400" : ""}
                              >
                                {task} {isTaskScheduledForDay(task) ? "(Already Scheduled)" : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        {item.task !== "Stripping" && 
                         item.task !== "Machine" && 
                         item.task !== "Grading" &&
                         item.task !== "Bailing Lamina" &&
                         item.task !== "Bailing Sticks" && (
                          <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-600">
                              Workers Needed
                            </label>
                            <input
                              type="number"
                              required
                              min="1"
                              className="input-field w-full"
                              placeholder="Number of workers"
                              value={item.workers}
                              onChange={(e) => handleItemChange(index, "workers", parseInt(e.target.value) || 0)}
                            />
                          </div>
                        )}
                      </div>
                      
                      {item.task === "Stripping" ? (
                        <div className="mt-4">
                          <StrippingScheduleForm 
                            employeeIds={item.employeeIds}
                            targetMass={item.targetMass}
                            numberOfScales={item.numberOfScales}
                            onChange={(data) => handleStrippingDataChange(index, data)}
                          />
                        </div>
                      ) : item.task === "Bailing Lamina" ? (
                        <div className="mt-4">
                          <BailingLaminaScheduleForm 
                            employeeIds={item.employeeIds}
                            targetMass={item.targetMass}
                            onChange={(data) => handleBailingLaminaDataChange(index, data)}
                          />
                        </div>
                      ) : item.task === "Machine" || item.task === "Bailing Sticks" ? (
                        <div className="mt-4">
                          <MachineScheduleForm 
                            employeeIds={item.employeeIds}
                            targetMass={item.targetMass}
                            onChange={(data) => handleMachineDataChange(index, data)}
                          />
                        </div>
                      ) : item.task === "Grading" ? (
                        <div className="mt-4">
                          <GradingScheduleForm
                            employeeIds={item.employeeIds}
                            numberOfBales={item.numberOfBales}
                            classGrades={item.classGrades}
                            onChange={(data) => handleGradingDataChange(index, data)}
                          />
                        </div>
                      ) : (
                        <div className="mt-4 space-y-2">
                          <label className="block text-xs font-medium text-gray-600">
                            Assign Employees
                          </label>
                          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
                            {employees.length > 0 ? (
                              <div className="space-y-2">
                                {employees.map((employee) => (
                                  <div key={employee.id} className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`employee-${index}-${employee.id}`}
                                      checked={(item.employeeIds as string[]).includes(employee.id)}
                                      onChange={(e) => handleEmployeeSelection(index, employee.id, e.target.checked)}
                                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <label
                                      htmlFor={`employee-${index}-${employee.id}`}
                                      className="ml-2 block text-sm text-gray-700"
                                    >
                                      {employee.name} {employee.surname} ({employee.id})
                                    </label>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 py-2 text-center">
                                No employees available. Add employees first.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
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
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Schedule
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

export default CreateSchedulePage;
