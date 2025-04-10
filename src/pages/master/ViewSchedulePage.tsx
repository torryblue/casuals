
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useSchedules } from "@/contexts/ScheduleContext";
import { useEmployees } from "@/contexts/EmployeeContext";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Calendar, User, Lock, FileText, Unlock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const ViewSchedulePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getScheduleById, workEntries, isEmployeeEntryLocked, unlockEmployeeEntry } = useSchedules();
  const { employees } = useEmployees();
  const { user } = useAuth();
  
  const [schedule, setSchedule] = useState<any>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  
  useEffect(() => {
    if (id) {
      const foundSchedule = getScheduleById(id);
      if (foundSchedule) {
        setSchedule(foundSchedule);
      } else {
        toast.error("Schedule not found");
        navigate('/master/schedules');
      }
    }
  }, [id, getScheduleById, navigate]);

  const getEmployeeName = (id: string) => {
    const employee = employees.find(emp => emp.id === id);
    return employee ? `${employee.name} ${employee.surname}` : 'Unknown';
  };

  const getScheduleWorkEntries = () => {
    return workEntries.filter(entry => entry.scheduleId === id);
  };

  const checkIfLocked = (scheduleItemId: string, employeeId: string) => {
    return isEmployeeEntryLocked(id || '', scheduleItemId, employeeId);
  };

  const handleUnlockEntry = async (entry) => {
    if (!user || user.role !== 'admin') {
      toast.error("Only admins can unlock entries");
      return;
    }

    setIsUnlocking(true);
    try {
      const success = await unlockEmployeeEntry(entry.scheduleId, entry.scheduleItemId, entry.employeeId);
      if (success) {
        toast.success(`Entry for ${getEmployeeName(entry.employeeId)} unlocked successfully`);
      }
    } catch (error) {
      console.error("Error unlocking entry:", error);
      toast.error("Failed to unlock entry");
    } finally {
      setIsUnlocking(false);
    }
  };

  if (!schedule) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse">Loading schedule information...</div>
        </div>
      </AppLayout>
    );
  }

  const scheduleWorkEntries = getScheduleWorkEntries();

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
          <h1 className="text-2xl font-medium text-gray-800">Schedule Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Schedule Information Card */}
          <div className="glass-card p-6 element-transition">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <h2 className="text-xl font-medium text-center mb-4">
              Schedule for {schedule.date}
            </h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">ID</p>
                <p className="font-medium">{schedule.id}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Created At</p>
                <p className="font-medium">{format(new Date(schedule.createdAt), 'MMM dd, yyyy HH:mm')}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Total Tasks</p>
                <p className="font-medium">{schedule.items.length}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Total Workers</p>
                <p className="font-medium">{schedule.items.reduce((total, item) => total + item.workers, 0)}</p>
              </div>
            </div>
          </div>
          
          {/* Schedule Tasks */}
          <div className="glass-card p-6 element-transition lg:col-span-2">
            <h2 className="text-xl font-medium mb-4">Tasks</h2>
            
            <div className="space-y-6">
              {schedule.items.map((item, index) => (
                <div key={item.id} className="p-4 border rounded-md bg-gray-50">
                  <h3 className="font-medium text-gray-800">
                    {item.task}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-sm text-gray-500">Workers Required</p>
                      <p className="font-medium">{item.workers}</p>
                    </div>
                    
                    {item.targetMass > 0 && (
                      <div>
                        <p className="text-sm text-gray-500">Target Mass</p>
                        <p className="font-medium">{item.targetMass} kg</p>
                      </div>
                    )}
                    
                    {item.numberOfScales > 0 && (
                      <div>
                        <p className="text-sm text-gray-500">Number of Scales</p>
                        <p className="font-medium">{item.numberOfScales}</p>
                      </div>
                    )}
                    
                    {item.numberOfBales > 0 && (
                      <div>
                        <p className="text-sm text-gray-500">Number of Bales</p>
                        <p className="font-medium">{item.numberOfBales}</p>
                      </div>
                    )}
                    
                    {item.classGrades && item.classGrades.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500">Class Grades</p>
                        <p className="font-medium">{item.classGrades.join(', ')}</p>
                      </div>
                    )}
                    
                    {item.quantity > 0 && item.task.toLowerCase() !== "tickets" && (
                      <div>
                        <p className="text-sm text-gray-500">Quantity</p>
                        <p className="font-medium">{item.quantity}</p>
                      </div>
                    )}
                    
                    {item.task.toLowerCase() === "tickets" && (
                      <div>
                        <p className="text-sm text-gray-500">Quantity</p>
                        <p className="font-medium">N/A</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Assigned Employees</p>
                    <div className="flex flex-wrap gap-2">
                      {item.employeeIds.map(employeeId => {
                        const isLocked = checkIfLocked(item.id, employeeId);
                        return (
                          <div 
                            key={employeeId} 
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isLocked ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {isLocked ? <Lock className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                            {getEmployeeName(employeeId)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Work Entries */}
          <div className="glass-card p-6 element-transition lg:col-span-3">
            <h2 className="text-xl font-medium mb-4">Work Entries</h2>
            
            {scheduleWorkEntries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-3 text-sm font-medium text-gray-600">Employee</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-600">Task</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-600">Quantity/Out Scale Mass</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-600">Remarks</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-600">Recorded At</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {scheduleWorkEntries.map((entry) => {
                      const task = schedule.items.find(item => item.id === entry.scheduleItemId);
                      const isTicketTask = task?.task.toLowerCase() === "tickets";
                      const isStrippingTask = task?.task.toLowerCase() === "stripping";
                      const isLocked = entry.locked === true;
                      
                      return (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-800">
                            {getEmployeeName(entry.employeeId)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {task ? task.task : 'Unknown Task'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {isTicketTask ? 'N/A' : isStrippingTask ? `${entry.quantity} kg (Out Scale)` : `${entry.quantity}`}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {entry.remarks || 'None'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {format(new Date(entry.recordedAt), 'MMM dd, yyyy HH:mm')}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {isLocked ? (
                              user?.role === 'admin' ? (
                                <button
                                  onClick={() => handleUnlockEntry(entry)}
                                  disabled={isUnlocking}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                                >
                                  <Lock className="h-3 w-3 mr-1" />
                                  Locked (Click to Unlock)
                                </button>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  <Lock className="h-3 w-3 mr-1" />
                                  Locked
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <FileText className="h-3 w-3 mr-1" />
                                Active
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500">No work entries recorded for this schedule yet.</p>
              </div>
            )}
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => navigate(`/work-entry?scheduleId=${id}`)}
                className="btn-primary"
              >
                Record Work Entry
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ViewSchedulePage;
