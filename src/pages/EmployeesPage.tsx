
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useEmployees } from "@/contexts/EmployeeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Plus, User } from "lucide-react";

const EmployeesPage = () => {
  const { employees } = useEmployees();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  
  const isAdmin = user?.role === 'admin';
  
  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee => 
    (employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (employee.surname?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (employee.idno?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-medium text-gray-800">Employees</h1>
        </div>

        <div className="glass-card p-4 element-transition">
          <div className="flex flex-col md:flex-row justify-between gap-4 pb-4">
            {/* Search box */}
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search"
                className="input-field pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Add employee button */}
            {isAdmin && (
              <button
                onClick={() => navigate('/employees/create')}
                className="btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </button>
            )}
          </div>

          {/* Employee listing */}
          <div className="overflow-x-auto">
            {employees.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">ID</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Contact</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Address</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Gender</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Next of Kin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{employee.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {employee.name} {employee.surname}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{employee.contact}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{employee.address}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{employee.gender}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{employee.nextofkinname}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-16 text-center">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No employees found.</p>
                <p className="text-gray-400 text-sm mt-1">Add your first employee to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default EmployeesPage;
