
import React, { useState } from "react";
import { useEmployees } from "@/contexts/EmployeeContext";
import { X } from "lucide-react";

type StrippingScheduleFormProps = {
  employeeIds: string[];
  onChange: (data: {
    employeeIds: string[];
    targetMass: number;
    numberOfScales: number;
  }) => void;
};

const StrippingScheduleForm = ({ employeeIds, onChange }: StrippingScheduleFormProps) => {
  const { employees } = useEmployees();
  const [targetMass, setTargetMass] = useState<number>(0);
  const [numberOfScales, setNumberOfScales] = useState<number>(1);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>(employeeIds || []);

  // Helper to find employee by ID
  const findEmployee = (id: string) => {
    return employees.find(employee => employee.id === id);
  };

  // Handle employee selection change
  const handleEmployeeSelection = (employeeId: string, isSelected: boolean) => {
    let updatedIds = [...selectedEmployeeIds];
    
    if (isSelected) {
      updatedIds.push(employeeId);
    } else {
      updatedIds = updatedIds.filter(id => id !== employeeId);
    }
    
    setSelectedEmployeeIds(updatedIds);
    
    // Notify parent component of the change
    onChange({
      employeeIds: updatedIds,
      targetMass,
      numberOfScales
    });
  };

  // Handle target mass change
  const handleTargetMassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setTargetMass(value);
    
    onChange({
      employeeIds: selectedEmployeeIds,
      targetMass: value,
      numberOfScales
    });
  };

  // Handle number of scales change
  const handleNumberOfScalesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setNumberOfScales(value);
    
    onChange({
      employeeIds: selectedEmployeeIds,
      targetMass,
      numberOfScales: value
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-600">
          Target Mass (kg)
        </label>
        <input
          type="number"
          min="0"
          step="0.1"
          className="input-field w-full"
          value={targetMass}
          onChange={handleTargetMassChange}
          placeholder="Enter target mass in kg"
        />
      </div>
      
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-600">
          Number of Scales
        </label>
        <input
          type="number"
          min="1"
          className="input-field w-full"
          value={numberOfScales}
          onChange={handleNumberOfScalesChange}
          placeholder="Enter number of scales"
        />
      </div>
      
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-600">
          Assign Workers
        </label>
        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
          {employees.length > 0 ? (
            <div className="space-y-2">
              {employees.map((employee) => (
                <div key={employee.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`employee-stripping-${employee.id}`}
                    checked={selectedEmployeeIds.includes(employee.id)}
                    onChange={(e) => handleEmployeeSelection(employee.id, e.target.checked)}
                    className="h-4 w-4 text-torryblue-accent rounded border-gray-300 focus:ring-torryblue-accent"
                  />
                  <label
                    htmlFor={`employee-stripping-${employee.id}`}
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

      <div className="mt-2">
        <h4 className="text-xs font-medium text-gray-600 mb-2">Selected Workers:</h4>
        <div className="flex flex-wrap gap-2">
          {selectedEmployeeIds.map(id => {
            const employee = findEmployee(id);
            return employee ? (
              <div key={id} className="bg-gray-100 px-2 py-1 rounded-md flex items-center text-sm">
                {employee.name} {employee.surname}
                <button
                  type="button"
                  onClick={() => handleEmployeeSelection(id, false)}
                  className="ml-1 text-gray-500 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            ) : null;
          })}
          {selectedEmployeeIds.length === 0 && (
            <p className="text-sm text-gray-500">No workers selected</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StrippingScheduleForm;
