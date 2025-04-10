
import React, { useState } from 'react';
import { useEmployees } from "@/contexts/EmployeeContext";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface BailingLaminaScheduleFormProps {
  employeeIds: string[];
  targetMass: number;
  onChange: (data: { employeeIds: string[], targetMass: number }) => void;
}

const BailingLaminaScheduleForm = ({ 
  employeeIds, 
  targetMass,
  onChange 
}: BailingLaminaScheduleFormProps) => {
  const { employees } = useEmployees();
  const [searchTerm, setSearchTerm] = useState("");

  const handleEmployeeSelection = (employeeId: string, isSelected: boolean) => {
    let newEmployeeIds = [...employeeIds];
    
    if (isSelected) {
      newEmployeeIds.push(employeeId);
    } else {
      newEmployeeIds = newEmployeeIds.filter(id => id !== employeeId);
    }
    
    onChange({ 
      employeeIds: newEmployeeIds,
      targetMass
    });
  };

  const handleTargetMassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTargetMass = parseInt(e.target.value) || 0;
    
    onChange({
      employeeIds,
      targetMass: newTargetMass
    });
  };

  const filteredEmployees = employees.filter(employee => {
    const searchValue = searchTerm.toLowerCase();
    return (
      employee.name.toLowerCase().includes(searchValue) ||
      employee.surname.toLowerCase().includes(searchValue) ||
      employee.id.toLowerCase().includes(searchValue)
    );
  });

  const clearSearch = () => {
    setSearchTerm("");
  };

  // Filter out already selected employees for other tasks
  const availableEmployees = filteredEmployees.filter(
    employee => !employeeIds.includes(employee.id)
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-600">
            Target Mass (kg)
          </label>
          <Input
            type="number"
            min="0"
            required
            placeholder="Enter target mass"
            value={targetMass || ''}
            onChange={handleTargetMassChange}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-600">
          Assign Employees
        </label>
        <div className="relative mb-2">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search employees..."
            className="pl-10 pr-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={clearSearch}
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
          {employees.length > 0 ? (
            <div className="space-y-2">
              {searchTerm && filteredEmployees.length === 0 ? (
                <p className="text-sm text-gray-500 py-2 text-center">
                  No employees found matching "{searchTerm}".
                </p>
              ) : (
                filteredEmployees.map((employee) => {
                  const isSelected = employeeIds.includes(employee.id);
                  return (
                    <div key={employee.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`employee-bailing-lamina-${employee.id}`}
                        checked={isSelected}
                        onChange={(e) => handleEmployeeSelection(employee.id, e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`employee-bailing-lamina-${employee.id}`}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        {employee.name} {employee.surname} ({employee.id})
                      </label>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-2 text-center">
              No employees available. Add employees first.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BailingLaminaScheduleForm;
