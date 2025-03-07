
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useEmployees } from "@/contexts/EmployeeContext";
import { useSchedules } from "@/contexts/ScheduleContext";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const ViewEmployeePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { employees } = useEmployees();
  const { getAllSchedulesByEmployeeId } = useSchedules();
  
  const [employee, setEmployee] = useState<any>(null);
  const [employeeSchedules, setEmployeeSchedules] = useState<any[]>([]);
  
  useEffect(() => {
    if (id) {
      const foundEmployee = employees.find(emp => emp.id === id);
      if (foundEmployee) {
        setEmployee(foundEmployee);
        const schedules = getAllSchedulesByEmployeeId(id);
        setEmployeeSchedules(schedules);
      } else {
        toast.error("Employee not found");
        navigate('/master/employees');
      }
    }
  }, [id, employees, getAllSchedulesByEmployeeId, navigate]);

  if (!employee) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse">Loading employee information...</div>
        </div>
      </AppLayout>
    );
  }

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
          <h1 className="text-2xl font-medium text-gray-800">Employee Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee Information Card */}
          <div className="glass-card p-6 element-transition lg:col-span-1">
            <div className="flex justify-center mb-6">
              <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-12 w-12 text-gray-500" />
              </div>
            </div>
            
            <h2 className="text-xl font-medium text-center mb-4">
              {employee.name} {employee.surname}
            </h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">ID Number</p>
                <p className="font-medium">{employee.idNo}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Contact</p>
                <p className="font-medium">{employee.contact}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{employee.address}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-medium">{employee.gender}</p>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500">Next of Kin</p>
                <p className="font-medium">{employee.nextOfKinName}</p>
                <p className="text-sm text-gray-500 mt-1">Contact</p>
                <p className="font-medium">{employee.nextOfKinContact}</p>
              </div>
            </div>
          </div>
          
          {/* Employee Schedule History */}
          <div className="glass-card p-6 element-transition lg:col-span-2">
            <h2 className="text-xl font-medium mb-4">Schedule History</h2>
            
            {employeeSchedules.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-3 text-sm font-medium text-gray-600">Date</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-600">Task</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-600">Duty</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employeeSchedules.map((schedule) => (
                      schedule.items.filter(item => item.employeeIds.includes(id)).map((item) => (
                        <tr key={`${schedule.id}-${item.id}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-800">{schedule.date}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.task}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.dutyName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <button
                              onClick={() => navigate(`/work-entry?scheduleId=${schedule.id}`)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              View Work Entries
                            </button>
                          </td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">No schedule history found for this employee.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ViewEmployeePage;
