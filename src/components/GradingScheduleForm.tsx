import React, { useState, useEffect } from "react";
import { useEmployees } from "@/contexts/EmployeeContext";
import { useSchedules } from "@/contexts/ScheduleContext";
import { Input } from "@/components/ui/input";
import { Search, X, Plus } from "lucide-react";

type GradingScheduleFormProps = {
  employeeIds: string[];
  scheduleDate?: string;
  onChange: (data: {
    employeeIds: string[];
    numberOfBales: number;
    classGrades: string[];
  }) => void;
};

const GradingScheduleForm = ({ 
  employeeIds = [], 
  scheduleDate,
  onChange 
}: GradingScheduleFormProps) => {
  const { employees } = useEmployees();
  const { getAssignedEmployeesForDate } = useSchedules();
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>(employeeIds);
  const [numberOfBales, setNumberOfBales] = useState<number>(0);
  const [classGrades, setClassGrades] = useState<string[]>(['']);
  const [searchTerm, setSearchTerm] = useState("");
  const [alreadyAssignedEmployees, setAlreadyAssignedEmployees] = useState<string[]>([]);

  // Get the already assigned employees for this date
  useEffect(() => {
    if (scheduleDate) {
      const assignedEmployees = getAssignedEmployeesForDate(scheduleDate);
      setAlreadyAssignedEmployees(assignedEmployees);
    }
  }, [scheduleDate, getAssignedEmployeesForDate]);

  // Update parent component when values change
  useEffect(() => {
    onChange({
      employeeIds: selectedEmployeeIds,
      numberOfBales,
      classGrades: classGrades.filter(grade => grade.trim() !== '') // Only include non-empty grades
    });
  }, [selectedEmployeeIds, numberOfBales, classGrades, onChange]);

  // Handle employee selection change
  const handleEmployeeSelection = (employeeId: string, isSelected: boolean) => {
    let updatedIds = [...selectedEmployeeIds];
    
    if (isSelected) {
      updatedIds.push(employeeId);
    } else {
      updatedIds = updatedIds.filter(id => id !== employeeId);
    }
    
    setSelectedEmployeeIds(updatedIds);
  };

  // Handle number of bales change
  const handleNumberOfBalesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.round(parseInt(e.target.value) || 0);
    setNumberOfBales(value);
  };

  // Handle class grade changes
  const handleClassGradeChange = (index: number, value: string) => {
    const updatedGrades = [...classGrades];
    updatedGrades[index] = value;
    setClassGrades(updatedGrades);
  };

  // Add another class grade field
  const handleAddClassGrade = () => {
    setClassGrades([...classGrades, '']);
  };

  // Remove a class grade field
  const handleRemoveClassGrade = (index: number) => {
    if (classGrades.length > 1) {
      const updatedGrades = [...classGrades];
      updatedGrades.splice(index, 1);
      setClassGrades(updatedGrades);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  // Filter employees based on search term and availability
  const filteredEmployees = employees.filter(employee => {
    const searchValue = searchTerm.toLowerCase();
    return (
      (employee.name?.toLowerCase().includes(searchValue) ||
      employee.surname?.toLowerCase().includes(searchValue) ||
      employee.id.toLowerCase().includes(searchValue)) &&
      // Do not show employees already assigned to other tasks for this date
      // but keep employees that are already assigned to this current task
      (!alreadyAssignedEmployees.includes(employee.id) || selectedEmployeeIds.includes(employee.id))
    );
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-600">
          Number of Bales
        </label>
        <input
          type="number"
          min="0"
          step="1"
          className="input-field w-full appearance-none"
          value={numberOfBales}
          onChange={handleNumberOfBalesChange}
          placeholder="Enter number of bales"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-gray-600">
            Class Grades
          </label>
          <button
            type="button"
            onClick={handleAddClassGrade}
            className="text-xs text-torryblue-accent flex items-center"
          >
            <Plus size={12} className="mr-1" />
            Add Grade
          </button>
        </div>
        
        {classGrades.map((grade, index) => (
          <div key={index} className="flex items-center space-x-2">
            <input
              type="text"
              className="input-field w-full"
              value={grade}
              onChange={(e) => handleClassGradeChange(index, e.target.value)}
              placeholder="Enter grade class (e.g. A, B, C)"
            />
            {classGrades.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveClassGrade(index)}
                className="text-gray-400 hover:text-red-500"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-600">
          Assign Workers
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
              ) : filteredEmployees.length === 0 ? (
                <p className="text-sm text-gray-500 py-2 text-center">
                  All employees are already assigned to tasks for this date.
                </p>
              ) : (
                filteredEmployees.map((employee) => {
                  const isSelected = selectedEmployeeIds.includes(employee.id);
                  const isAssignedElsewhere = alreadyAssignedEmployees.includes(employee.id) && !selectedEmployeeIds.includes(employee.id);
                  
                  return (
                    <div key={employee.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`employee-grading-${employee.id}`}
                        checked={isSelected}
                        disabled={isAssignedElsewhere}
                        onChange={(e) => handleEmployeeSelection(employee.id, e.target.checked)}
                        className="h-4 w-4 text-torryblue-accent rounded border-gray-300 focus:ring-torryblue-accent"
                      />
                      <label
                        htmlFor={`employee-grading-${employee.id}`}
                        className={`ml-2 block text-sm ${isAssignedElsewhere ? 'text-gray-400' : 'text-gray-700'}`}
                      >
                        {employee.name} {employee.surname} ({employee.id})
                        {isAssignedElsewhere && " (assigned elsewhere)"}
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

      <div className="mt-2">
        <h4 className="text-xs font-medium text-gray-600 mb-2">Selected Workers:</h4>
        <div className="flex flex-wrap gap-2">
          {selectedEmployeeIds.length > 0 ? (
            selectedEmployeeIds.map(id => {
              const employee = employees.find(emp => emp.id === id);
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
            })
          ) : (
            <p className="text-sm text-gray-500">No workers selected</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GradingScheduleForm;
