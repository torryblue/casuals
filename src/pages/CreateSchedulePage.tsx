
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { useEmployees } from "@/contexts/EmployeeContext";
import { useSchedules } from "@/contexts/ScheduleContext";
import { useAuth } from "@/contexts/AuthContext";
import BailingLaminaScheduleForm from "@/components/BailingLaminaScheduleForm";
import StrippingScheduleForm from "@/components/StrippingScheduleForm";
import MachineScheduleForm from "@/components/MachineScheduleForm";
import GradingScheduleForm from "@/components/GradingScheduleForm";
import EmployeeSearch from "@/components/EmployeeSearch";
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
  const { user } = useAuth();
  const { 
    addSchedule, 
    schedules, 
    isLoading: isScheduleLoading
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
  
  // Check if the user is trying to create a schedule for a date other than today
  const isToday = scheduleDate === new Date().toISOString().split("T")[0];
  const isAdmin = user?.role === 'admin';
  const canCreateSchedule = isAdmin || isToday;

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
          return availableTask 
            ? { ...item, task: availableTask }
            : item;
        }
        return item;
      });
    });
  }, [scheduleDate, schedules]);

  // Check if the employee is already assigned to another task on the same date
  const isEmployeeAssignedForDate = (employeeId: string, date: string, currentItemIndex: number): boolean => {
    // First check in other items in the current form
    const isAssignedInCurrentForm = scheduleItems.some((item, index) => 
      index !== currentItemIndex && item.employeeIds.includes(employeeId)
    );
    
    if (isAssignedInCurrentForm) return true;
    
    // Then check in existing schedules
    const schedulesForDate = schedules.filter(schedule => schedule.date === date);
    
    return schedulesForDate.some(schedule => 
      schedule.items.some(item => 
        item.employeeIds.includes(employeeId)
      )
    );
  };

  // Add a new schedule item
  const addScheduleItem = () => {
    setScheduleItems([
      ...scheduleItems,
      {
        task: PREDEFINED_TASKS.find(task => !tasksScheduledForDay.includes(task)) || PREDEFINED_TASKS[0],
        workers: 0,
        employeeIds: [],
        targetMass: 0,
        numberOfScales: 1,
        numberOfBales: 0,
        classGrades: [],
        quantity: 0
      }
    ]);
  };

  // Remove a schedule item
  const removeScheduleItem = (index: number) => {
    if (scheduleItems.length > 1) {
      setScheduleItems(scheduleItems.filter((_, i) => i !== index));
    }
  };

  // Update a schedule item
  const updateScheduleItem = (index: number, updatedItem: any) => {
    const newItems = [...scheduleItems];
    newItems[index] = { ...newItems[index], ...updatedItem };
    setScheduleItems(newItems);
  };

  // Handle employee selection for tasks that don't have specialized forms
  const handleEmployeeSelection = (index: number, employeeId: string, isSelected: boolean) => {
    const currentItem = scheduleItems[index];
    let updatedEmployeeIds = [...currentItem.employeeIds];
    
    if (isSelected) {
      // Check if already assigned
      if (isEmployeeAssignedForDate(employeeId, scheduleDate, index)) {
        const employee = employees.find(emp => emp.id === employeeId);
        toast.error(`${employee?.name} ${employee?.surname} is already assigned to another task on this date`);
        return;
      }
      updatedEmployeeIds.push(employeeId);
    } else {
      updatedEmployeeIds = updatedEmployeeIds.filter(id => id !== employeeId);
    }
    
    updateScheduleItem(index, { employeeIds: updatedEmployeeIds, workers: updatedEmployeeIds.length });
  };

  // Handle task change
  const handleTaskChange = (index: number, task: string) => {
    // Check if task is already scheduled
    if (tasksScheduledForDay.includes(task)) {
      toast.error(`${task} is already scheduled for this date`);
      return;
    }
    
    updateScheduleItem(index, { task, employeeIds: [] });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canCreateSchedule) {
      toast.error(`Regular users can only create schedules for today (${new Date().toISOString().split('T')[0]})`);
      return;
    }
    
    // Validate form data
    const hasEmptyTasks = scheduleItems.some(item => !item.task);
    if (hasEmptyTasks) {
      toast.error("Please select a task for all schedule items");
      return;
    }
    
    const hasEmptyEmployees = scheduleItems.some(item => item.employeeIds.length === 0);
    if (hasEmptyEmployees) {
      toast.error("Please assign at least one employee to each task");
      return;
    }
    
    // Format data for submission
    const formattedItems = scheduleItems.map(({ workers, ...item }) => ({
      ...item
    }));
    
    setIsLoading(true);
    try {
      await addSchedule(scheduleDate, formattedItems);
      navigate('/schedule');
      toast.success("Schedule created successfully");
    } catch (error) {
      console.error("Error creating schedule:", error);
      toast.error("Failed to create schedule");
    } finally {
      setIsLoading(false);
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
          <h1 className="text-2xl font-medium text-gray-800">Create Schedule</h1>
        </div>

        <div className="glass-card p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {!isAdmin && (
              <div className="bg-amber-50 p-4 rounded-lg">
                <p className="text-amber-700">As a regular user, you can only create schedules for today.</p>
              </div>
            )}
            
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-800">Schedule Details</h2>
              
              <div className="space-y-2">
                <label htmlFor="scheduleDate" className="block text-sm font-medium text-gray-700">
                  Schedule Date
                </label>
                <input
                  type="date"
                  id="scheduleDate"
                  className="input-field w-full md:w-auto"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  disabled={!isAdmin}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-800">Task Assignments</h2>
                
                <button
                  type="button"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  onClick={addScheduleItem}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Task
                </button>
              </div>
              
              {scheduleItems.map((item, index) => (
                <div key={index} className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Task
                      </label>
                      <select
                        className="input-field w-full"
                        value={item.task}
                        onChange={(e) => handleTaskChange(index, e.target.value)}
                      >
                        {PREDEFINED_TASKS.map(task => (
                          <option key={task} value={task} disabled={tasksScheduledForDay.includes(task) && item.task !== task}>
                            {task} {tasksScheduledForDay.includes(task) && item.task !== task ? "(Already Scheduled)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {scheduleItems.length > 1 && (
                      <button
                        type="button"
                        className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded"
                        onClick={() => removeScheduleItem(index)}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  
                  {/* Task-specific forms */}
                  {item.task === "Stripping" && (
                    <StrippingScheduleForm
                      employeeIds={item.employeeIds}
                      onChange={(data) => updateScheduleItem(index, data)}
                    />
                  )}
                  
                  {item.task === "Bailing Lamina" && (
                    <BailingLaminaScheduleForm
                      employeeIds={item.employeeIds}
                      targetMass={item.targetMass}
                      numberOfBales={item.numberOfBales}
                      onChange={(data) => updateScheduleItem(index, data)}
                    />
                  )}
                  
                  {item.task === "Machine" && (
                    <MachineScheduleForm
                      employeeIds={item.employeeIds}
                      targetMass={item.targetMass}
                      onChange={(data) => updateScheduleItem(index, data)}
                    />
                  )}
                  
                  {item.task === "Ticket Based Work" && (
                    <GradingScheduleForm
                      employeeIds={item.employeeIds}
                      classGrades={item.classGrades}
                      quantity={item.quantity}
                      onChange={(data) => updateScheduleItem(index, data)}
                    />
                  )}
                  
                  {/* Generic employee selection for other tasks */}
                  {item.task === "Bailing Sticks" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-600">
                          Assign Workers
                        </label>
                        <EmployeeSearch 
                          selectedEmployees={item.employeeIds}
                          onEmployeeSelect={(empId, isSelected) => handleEmployeeSelection(index, empId, isSelected)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || isScheduleLoading || !canCreateSchedule}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm ${
                  canCreateSchedule
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading || isScheduleLoading ? 'Saving...' : 'Create Schedule'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default CreateSchedulePage;
