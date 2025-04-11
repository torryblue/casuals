
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useEmployees } from "@/contexts/EmployeeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Plus, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const EmployeesPage = () => {
  const { employees, addEmployee } = useEmployees();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: "", surname: "" });
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
    
    if (!newEmployee.name || !newEmployee.surname) {
      toast.error("Please provide both name and surname");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create a basic employee with just name and surname
      await addEmployee({
        name: newEmployee.name,
        surname: newEmployee.surname,
        idno: null,
        contact: null,
        address: null,
        gender: null,
        nextofkinname: null,
        nextofkincontact: null
      });
      
      // Reset form and close dialog
      setNewEmployee({ name: "", surname: "" });
      setIsAddDialogOpen(false);
      toast.success("Employee added successfully. Admin can update additional details later.");
    } catch (error) {
      console.error("Error adding employee:", error);
      toast.error("Failed to add employee. Please try again.");
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
            
            {/* Add employee buttons - now both admin and regular users can add employees */}
            <div className="flex gap-2">
              {/* Quick add button for regular users */}
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="btn-secondary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Quick Add
              </Button>
              
              {/* Full add button for admins only */}
              {isAdmin && (
                <Button
                  onClick={() => navigate('/employees/create')}
                  className="btn-primary flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              )}
            </div>
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

      {/* Quick Add Employee Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Quick Add Employee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEmployee}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">First Name</Label>
                <Input 
                  id="name" 
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="surname">Last Name</Label>
                <Input 
                  id="surname" 
                  value={newEmployee.surname}
                  onChange={(e) => setNewEmployee({...newEmployee, surname: e.target.value})}
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add Employee"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default EmployeesPage;
