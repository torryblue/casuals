
import React, { useState } from "react";
import { X } from "lucide-react";
import { useEmployees } from "@/contexts/EmployeeContext";
import EmployeeSearch from "./EmployeeSearch";

type StrippingScheduleFormProps = {
  employeeIds: string[];
  targetMass?: number;
  numberOfScales?: number;
  onChange: (data: {
    employeeIds: string[];
    targetMass: number;
    numberOfScales: number;
  }) => void;
};

const StrippingScheduleForm = ({ employeeIds, targetMass = 0, numberOfScales = 1, onChange }: StrippingScheduleFormProps) => {
  const { employees } = useEmployees();
  const [localTargetMass, setLocalTargetMass] = useState<number>(targetMass);
  const [localNumberOfScales, setLocalNumberOfScales] = useState<number>(numberOfScales);
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
      targetMass: localTargetMass,
      numberOfScales: localNumberOfScales
    });
  };

  // Handle target mass change
  const handleTargetMassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Ensure whole number
    const value = Math.round(parseFloat(e.target.value) || 0);
    setLocalTargetMass(value);
    
    onChange({
      employeeIds: selectedEmployeeIds,
      targetMass: value,
      numberOfScales: localNumberOfScales
    });
  };

  // Handle number of scales change
  const handleNumberOfScalesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Ensure whole number
    const value = Math.round(parseInt(e.target.value) || 1);
    setLocalNumberOfScales(value);
    
    onChange({
      employeeIds: selectedEmployeeIds,
      targetMass: localTargetMass,
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
          step="1"
          className="input-field w-full appearance-none"
          value={localTargetMass}
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
          step="1"
          className="input-field w-full appearance-none"
          value={localNumberOfScales}
          onChange={handleNumberOfScalesChange}
          placeholder="Enter number of scales"
        />
      </div>
      
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-600">
          Assign Workers
        </label>
        <EmployeeSearch 
          selectedEmployees={selectedEmployeeIds}
          onEmployeeSelect={handleEmployeeSelection}
        />
      </div>
    </div>
  );
};

export default StrippingScheduleForm;
