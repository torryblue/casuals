
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useEmployees } from "@/contexts/EmployeeContext";
import { Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const CreateEmployeePage = () => {
  const navigate = useNavigate();
  const { addEmployee, isLoading } = useEmployees();
  const [submitInProgress, setSubmitInProgress] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    idNo: "",
    contact: "",
    address: "",
    gender: "Male",
    nextOfKinName: "",
    nextOfKinContact: ""
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submissions
    if (submitInProgress || isLoading) return;
    
    setSubmitInProgress(true);
    
    try {
      console.log("Creating employee with data:", formData);
      const success = await addEmployee(formData);
      
      if (success) {
        console.log("Employee created successfully");
        navigate('/employees');
      } else {
        console.error("Failed to create employee");
        // Toast error is already handled inside addEmployee
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error("Something went wrong while creating the employee. Please try again.");
    } finally {
      setSubmitInProgress(false);
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
          <h1 className="text-2xl font-medium text-gray-800">Create New Employee</h1>
        </div>

        <div className="glass-card p-6 element-transition">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="input-field w-full"
                    placeholder="Enter first name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="surname" className="block text-sm font-medium text-gray-700">
                    Surname <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="surname"
                    name="surname"
                    type="text"
                    required
                    className="input-field w-full"
                    placeholder="Enter surname"
                    value={formData.surname}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="idNo" className="block text-sm font-medium text-gray-700">
                    ID Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="idNo"
                    name="idNo"
                    type="text"
                    required
                    className="input-field w-full"
                    placeholder="Enter ID number"
                    value={formData.idNo}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
                    Contact <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contact"
                    name="contact"
                    type="tel"
                    required
                    className="input-field w-full"
                    placeholder="Enter contact number"
                    value={formData.contact}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              {/* Right column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    required
                    className="input-field w-full"
                    placeholder="Enter address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    required
                    className="input-field w-full"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="nextOfKinName" className="block text-sm font-medium text-gray-700">
                    Next of Kin Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="nextOfKinName"
                    name="nextOfKinName"
                    type="text"
                    required
                    className="input-field w-full"
                    placeholder="Enter next of kin name"
                    value={formData.nextOfKinName}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="nextOfKinContact" className="block text-sm font-medium text-gray-700">
                    Next of Kin Contact <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="nextOfKinContact"
                    name="nextOfKinContact"
                    type="tel"
                    required
                    className="input-field w-full"
                    placeholder="Enter next of kin contact"
                    value={formData.nextOfKinContact}
                    onChange={handleChange}
                  />
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
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create Employee
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

export default CreateEmployeePage;
