
import React, { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useEmployees } from "@/contexts/EmployeeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Edit, Trash, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const MasterEmployeeList = () => {
  const { employees, removeEmployee } = useEmployees();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Check if user is admin, if not, redirect to dashboard
  if (user?.role !== 'admin') {
    navigate('/');
    return null;
  }

  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee => 
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.idNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteEmployee = (id: string) => {
    if (window.confirm("Are you sure you want to delete this employee? This action cannot be undone.")) {
      setIsDeleting(true);
      
      // Call the removeEmployee function from context
      if (removeEmployee) {
        removeEmployee(id);
        toast.success("Employee deleted successfully");
      } else {
        toast.error("Failed to delete employee");
      }
      
      setIsDeleting(false);
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
          <h1 className="text-2xl font-medium text-gray-800">Master Employee List</h1>
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
                placeholder="Search employees..."
                className="input-field pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Employee listing with edit and delete options */}
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
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
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
                      <td className="px-4 py-3 text-sm text-gray-600">{employee.nextOfKinName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex space-x-2">
                          <button 
                            className="p-1 text-blue-500 hover:text-blue-700"
                            onClick={() => toast.info("Edit functionality to be implemented")}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="p-1 text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteEmployee(employee.id)}
                            disabled={isDeleting}
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500">No employees found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default MasterEmployeeList;
