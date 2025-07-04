import React, { useState, useEffect } from 'react';
import { X, Save, Lock, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { useSchedules, WorkEntry, Carton } from '../contexts/ScheduleContext';
import { toast } from 'sonner';

interface BailingLaminaWorkEntryFormProps {
  scheduleId: string;
  scheduleItemId: string;
  employeeId: string;
  targetMass: number;
  onEntryAdded: () => void;
  existingEntries: WorkEntry[];
}

const BailingLaminaWorkEntryForm = ({
  scheduleId,
  scheduleItemId,
  employeeId,
  targetMass,
  onEntryAdded,
  existingEntries
}: BailingLaminaWorkEntryFormProps) => {
  const { addWorkEntry, isEmployeeEntryLocked, lockEmployeeEntry } = useSchedules();
  const [cartons, setCartons] = useState<Carton[]>([{ id: 1, grade: '', mass: 0 }]);
  const [massInputs, setMassInputs] = useState<number[]>([0]);
  const [remarks, setRemarks] = useState<string>('');
  const [savedProgress, setSavedProgress] = useState<any>(null);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);

  // Check if the employee is locked for this task
  const isLocked = isEmployeeEntryLocked(scheduleId, scheduleItemId, employeeId);

  // Load saved progress from localStorage on component mount
  useEffect(() => {
    const savedProgressKey = `bailing-progress-${scheduleId}-${scheduleItemId}-${employeeId}`;
    const savedData = localStorage.getItem(savedProgressKey);
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setHasSavedProgress(true);
        setSavedProgress(parsedData);
      } catch (error) {
        console.error("Error parsing saved progress:", error);
      }
    }
  }, [scheduleId, scheduleItemId, employeeId]);

  const addCarton = () => {
    const newCarton = { id: cartons.length + 1, grade: '', mass: 0 };
    setCartons([...cartons, newCarton]);
  };

  const removeCarton = (index: number) => {
    if (cartons.length > 1) {
      const newCartons = [...cartons];
      newCartons.splice(index, 1);
      setCartons(newCartons);
    }
  };

  const handleCartonChange = (index: number, field: 'grade' | 'mass', value: string | number) => {
    const newCartons = [...cartons];
    if (field === 'grade') {
      newCartons[index].grade = value as string;
    } else {
      newCartons[index].mass = value as number;
    }
    setCartons(newCartons);
  };

  const addMassInput = () => {
    setMassInputs([...massInputs, 0]);
  };

  const removeMassInput = (index: number) => {
    if (massInputs.length > 1) {
      const newMassInputs = [...massInputs];
      newMassInputs.splice(index, 1);
      setMassInputs(newMassInputs);
    }
  };

  const handleMassInputChange = (index: number, value: number) => {
    const newMassInputs = [...massInputs];
    newMassInputs[index] = value;
    setMassInputs(newMassInputs);
  };

  const calculateTotalInputMass = (): number => {
    return massInputs.reduce((sum, mass) => sum + (mass || 0), 0);
  };

  const calculateTotalOutputMass = (): number => {
    return cartons.reduce((sum, carton) => sum + (carton.mass || 0), 0);
  };

  // Save progress to localStorage
  const saveProgress = () => {
    const progressData = {
      cartons,
      massInputs,
      remarks,
      savedAt: new Date().toISOString()
    };
    
    const savedProgressKey = `bailing-progress-${scheduleId}-${scheduleItemId}-${employeeId}`;
    localStorage.setItem(savedProgressKey, JSON.stringify(progressData));
    
    toast.success("Progress saved successfully");
    setHasSavedProgress(true);
    setSavedProgress(progressData);
  };

  // Load saved progress
  const loadProgress = () => {
    if (savedProgress) {
      setCartons(savedProgress.cartons);
      setMassInputs(savedProgress.massInputs);
      setRemarks(savedProgress.remarks);
      toast.success("Progress loaded successfully");
    }
  };

  // Clear saved progress
  const clearSavedProgress = () => {
    const savedProgressKey = `bailing-progress-${scheduleId}-${scheduleItemId}-${employeeId}`;
    localStorage.removeItem(savedProgressKey);
    setHasSavedProgress(false);
    setSavedProgress(null);
    toast.success("Saved progress cleared");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      toast.error('This worker has been locked for this task');
      return;
    }
    
    addWorkEntry({
      scheduleId,
      scheduleItemId,
      employeeId,
      quantity: calculateTotalInputMass(),
      remarks,
      outputMass: calculateTotalOutputMass(),
      massInputs,
      cartons,
      entryType: ''
    });
    
    // Reset form
    setCartons([{ id: 1, grade: '', mass: 0 }]);
    setMassInputs([0]);
    setRemarks('');
    
    // Clear saved progress
    clearSavedProgress();
    
    onEntryAdded();
    toast.success('Work entry recorded successfully');
  };

  const handleLock = () => {
    if (isLocked) {
      return;
    }
    
    // Submit the form first
    addWorkEntry({
      scheduleId,
      scheduleItemId,
      employeeId,
      quantity: calculateTotalInputMass(),
      remarks,
      outputMass: calculateTotalOutputMass(),
      massInputs,
      cartons,
      entryType: ''
    });
    
    // Lock the employee entries
    lockEmployeeEntry(scheduleId, scheduleItemId, employeeId);
    
    // Reset form and clear saved progress
    setCartons([{ id: 1, grade: '', mass: 0 }]);
    setMassInputs([0]);
    setRemarks('');
    clearSavedProgress();
    
    onEntryAdded();
    toast.success('Entries locked successfully');
  };

  const handleCancel = () => {
    setCartons([{ id: 1, grade: '', mass: 0 }]);
    setMassInputs([0]);
    setRemarks('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-700">
          <strong>Target Mass:</strong> {targetMass} kg
        </p>
      </div>
      
      {/* Progress management buttons */}
      {!isLocked && (
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            className="px-3 py-1.5 flex items-center text-sm rounded-md text-white bg-blue-500 hover:bg-blue-600"
            onClick={saveProgress}
          >
            <ArrowDownToLine className="h-3.5 w-3.5 mr-1.5" />
            Save Progress
          </button>
          
          {hasSavedProgress && (
            <>
              <button
                type="button"
                className="px-3 py-1.5 flex items-center text-sm rounded-md text-white bg-green-500 hover:bg-green-600"
                onClick={loadProgress}
              >
                <ArrowUpFromLine className="h-3.5 w-3.5 mr-1.5" />
                Load Saved
              </button>
              <button
                type="button"
                className="px-3 py-1.5 flex items-center text-sm rounded-md text-white bg-red-500 hover:bg-red-600"
                onClick={clearSavedProgress}
              >
                Clear Saved
              </button>
            </>
          )}
        </div>
      )}
      
      {hasSavedProgress && (
        <div className="bg-blue-50 p-2 rounded-md text-sm text-blue-800">
          Last saved: {new Date(savedProgress.savedAt).toLocaleString()}
        </div>
      )}

      {/* Mass Inputs (multiple) */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Input Mass Entries</h3>
        {massInputs.map((mass, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-grow">
              <label className="block text-xs font-medium text-gray-600">
                Input Mass #{index + 1} (kg)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-field w-full p-2 border border-gray-300 rounded-md"
                placeholder="0.00"
                value={mass || ''}
                onChange={(e) => handleMassInputChange(index, parseFloat(e.target.value) || 0)}
                disabled={isLocked}
                required
              />
            </div>
            {!isLocked && massInputs.length > 1 && (
              <button
                type="button"
                className="mt-6 p-1 text-red-500 hover:bg-red-50 rounded-full"
                onClick={() => removeMassInput(index)}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        ))}
        
        {!isLocked && (
          <button
            type="button"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            onClick={addMassInput}
          >
            + Add Another Mass Input
          </button>
        )}
        
        {massInputs.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium">
              Total Input Mass: {calculateTotalInputMass()} kg
            </p>
          </div>
        )}
      </div>
      
      {/* Carton outputs */}
      <div className="space-y-4 mt-6">
        <h3 className="text-sm font-semibold text-gray-700">Output Cartons</h3>
        {cartons.map((carton, index) => (
          <div key={carton.id} className="flex items-center gap-2">
            <div className="flex-grow grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Carton #{carton.id} Grade
                </label>
                <input
                  type="text"
                  className="input-field w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Grade"
                  value={carton.grade}
                  onChange={(e) => handleCartonChange(index, 'grade', e.target.value)}
                  disabled={isLocked}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Carton #{carton.id} Mass (kg)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Mass (kg)"
                  value={carton.mass || ''}
                  onChange={(e) => handleCartonChange(index, 'mass', parseFloat(e.target.value) || 0)}
                  disabled={isLocked}
                  required
                />
              </div>
            </div>
            {!isLocked && cartons.length > 1 && (
              <button
                type="button"
                className="mt-6 p-1 text-red-500 hover:bg-red-50 rounded-full"
                onClick={() => removeCarton(index)}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        ))}
        
        {!isLocked && (
          <button
            type="button"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            onClick={addCarton}
          >
            + Add Another Carton
          </button>
        )}
        
        {cartons.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium">
              Total Output Mass: {calculateTotalOutputMass()} kg
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-600">
          Remarks (Optional)
        </label>
        <textarea
          className="input-field w-full p-2 border border-gray-300 rounded-md"
          placeholder="Any additional comments"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          disabled={isLocked}
          rows={2}
        />
      </div>

      {!isLocked && (
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 flex items-center"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </button>
          <button
            type="button"
            onClick={handleLock}
            className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 flex items-center"
          >
            <Lock className="h-4 w-4 mr-2" />
            Save & Lock
          </button>
        </div>
      )}

      {existingEntries.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Previous Entries</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Input Mass</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Output Mass</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cartons</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {existingEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.recordedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.quantity} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.outputMass || 'N/A'} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.cartons ? entry.cartons.length : 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {entry.locked ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Locked</span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </form>
  );
};

export default BailingLaminaWorkEntryForm;
