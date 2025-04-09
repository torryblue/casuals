
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useEmployees } from "@/contexts/EmployeeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Plus, User, Save } from "lucide-react";
import { toast } from "sonner";

const EmployeesPage = () => {
  const { employees, addEmployee } = useEmployees();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeeSurname, setNewEmployeeSurname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isAdmin = user?.role === 'admin';
  
  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee => 
    (employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (employee.surname?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (employee.idno?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmployeeName.trim() || !newEmployeeSurname.trim()) {
      toast.error("Please enter both name and surname");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await addEmployee({
        name: newEmployeeName.trim(),
        surname: newEmployeeSurname.trim(),
        idno: null,
        contact: null,
        address: null,
        gender: null,
        nextofkinname: null,
        nextofkincontact: null
      });
      
      // Reset form
      setNewEmployeeName("");
      setNewEmployeeSurname("");
      setShowAddForm(false);
      toast.success("Employee added successfully. Complete their details in the admin panel.");
    } catch (error) {
      console.error("Error adding employee:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Basic Employee
            </button>
          </div>

          {/* Quick Add Employee Form */}
          {showAddForm && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-md font-medium mb-3">Add New Employee</h3>
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      className="input-field w-full"
                      value={newEmployeeName}
                      onChange={(e) => setNewEmployeeName(e.target.value)}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label htmlFor="surname" className="block text-sm font-medium text-gray-700 mb-1">
                      Surname <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="surname"
                      type="text"
                      required
                      className="input-field w-full"
                      value={newEmployeeSurname}
                      onChange={(e) => setNewEmployeeSurname(e.target.value)}
                      placeholder="Enter surname"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="btn-secondary mr-2"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex items-center"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
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
                        Save Employee
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

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
