
import React from 'react';
import { useEmployees } from "@/contexts/EmployeeContext";
import { Input } from "@/components/ui/input";

interface BailingLaminaScheduleFormProps {
  employeeIds: string[];
  targetMass: number;
  numberOfBales?: number; // Added this property
  onChange: (data: { employeeIds: string[], targetMass: number, numberOfBales?: number }) => void;
}

const BailingLaminaScheduleForm = ({ 
  employeeIds, 
  targetMass,
  numberOfBales = 0, // Added default value
  onChange 
}: BailingLaminaScheduleFormProps) => {
  const { employees } = useEmployees();

  const handleEmployeeSelection = (employeeId: string, isSelected: boolean) => {
    let newEmployeeIds = [...employeeIds];
    
    if (isSelected) {
      newEmployeeIds.push(employeeId);
    } else {
      newEmployeeIds = newEmployeeIds.filter(id => id !== employeeId);
    }
    
    onChange({ 
      employeeIds: newEmployeeIds,
      targetMass,
      numberOfBales // Pass this property
    });
  };

  const handleTargetMassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTargetMass = parseInt(e.target.value) || 0;
    
    onChange({
      employeeIds,
      targetMass: newTargetMass,
      numberOfBales
    });
  };

  const handleNumberOfBalesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumberOfBales = parseInt(e.target.value) || 0;
    
    onChange({
      employeeIds,
      targetMass,
      numberOfBales: newNumberOfBales
    });
  };

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
        
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-600">
            Number of Bales
          </label>
          <Input
            type="number"
            min="0"
            required
            placeholder="Enter number of bales"
            value={numberOfBales || ''}
            onChange={handleNumberOfBalesChange}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-600">
          Assign Employees
        </label>
        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
          {employees.length > 0 ? (
            <div className="space-y-2">
              {employees.map((employee) => (
                <div key={employee.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`employee-bailing-lamina-${employee.id}`}
                    checked={employeeIds.includes(employee.id)}
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
              ))}
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
