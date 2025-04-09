
import React, { useState, useEffect } from 'react';
import { X, Save, Lock, ArrowDownToLine, ArrowUpFromLine, Plus, Trash } from 'lucide-react';
import { useSchedules, WorkEntry, OutputEntry } from '../contexts/ScheduleContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import MultiOutputEntryForm from '@/components/MultiOutputEntryForm';

interface MachineWorkEntryFormProps {
  scheduleId: string;
  scheduleItemId: string;
  employeeId: string;
  targetMass: number;
  onEntryAdded: () => void;
  existingEntries: WorkEntry[];
}

const MachineWorkEntryForm: React.FC<MachineWorkEntryFormProps> = ({
  scheduleId,
  scheduleItemId,
  employeeId,
  targetMass,
  onEntryAdded,
  existingEntries
}: MachineWorkEntryFormProps) => {
  const { addWorkEntry, isEmployeeEntryLocked, lockEmployeeEntry } = useSchedules();
  const [massInputs, setMassInputs] = useState<number[]>([0]);
  const [outputEntries, setOutputEntries] = useState<OutputEntry[]>([]);
  const [remarks, setRemarks] = useState<string>('');
  const [savedProgress, setSavedProgress] = useState<any>(null);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);

  // Check if the employee is locked for this task
  const isLocked = isEmployeeEntryLocked(scheduleId, scheduleItemId, employeeId);

  // Load saved progress from localStorage on component mount
  useEffect(() => {
    const savedProgressKey = `machine-progress-${scheduleId}-${scheduleItemId}-${employeeId}`;
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

  const addMassInput = () => {
    setMassInputs([...massInputs, 0]);
  };

  const removeMassInput = (index: number) => {
    if (massInputs.length > 1) {
      const newInputs = [...massInputs];
      newInputs.splice(index, 1);
      setMassInputs(newInputs);
    }
  };

  const handleMassInputChange = (index: number, value: number) => {
    const newInputs = [...massInputs];
    newInputs[index] = value;
    setMassInputs(newInputs);
  };

  const calculateTotalInputMass = (): number => {
    return massInputs.reduce((sum, value) => sum + (value || 0), 0);
  };

  const calculateTotalByType = (type: 'output' | 'sticks' | 'f8' | 'dust'): number => {
    return outputEntries
      .filter(entry => entry.type === type)
      .reduce((sum, entry) => sum + (entry.mass || 0), 0);
  };

  // Save progress to localStorage
  const saveProgress = () => {
    const progressData = {
      massInputs,
      outputEntries,
      remarks,
      savedAt: new Date().toISOString()
    };
    
    const savedProgressKey = `machine-progress-${scheduleId}-${scheduleItemId}-${employeeId}`;
    localStorage.setItem(savedProgressKey, JSON.stringify(progressData));
    
    toast.success("Progress saved successfully");
    setHasSavedProgress(true);
    setSavedProgress(progressData);
  };

  // Load saved progress
  const loadProgress = () => {
    if (savedProgress) {
      setMassInputs(savedProgress.massInputs || [0]);
      setOutputEntries(savedProgress.outputEntries || []);
      setRemarks(savedProgress.remarks || '');
      toast.success("Progress loaded successfully");
    }
  };

  // Clear saved progress
  const clearSavedProgress = () => {
    const savedProgressKey = `machine-progress-${scheduleId}-${scheduleItemId}-${employeeId}`;
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
      outputMass: calculateTotalByType('output'),
      outputEntries,
      massInputs,
      entryType: ''
    });
    
    // Reset form
    setMassInputs([0]);
    setOutputEntries([]);
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
      outputMass: calculateTotalByType('output'),
      outputEntries,
      massInputs,
      entryType: ''
    });
    
    // Lock the employee entries
    lockEmployeeEntry(scheduleId, scheduleItemId, employeeId);
    
    // Reset form and clear saved progress
    setMassInputs([0]);
    setOutputEntries([]);
    setRemarks('');
    clearSavedProgress();
    
    onEntryAdded();
    toast.success('Entries locked successfully');
  };

  const handleCancel = () => {
    setMassInputs([0]);
    setOutputEntries([]);
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
          <Button
            type="button"
            variant="outline"
            className="flex items-center text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={saveProgress}
          >
            <ArrowDownToLine className="h-3.5 w-3.5 mr-1.5" />
            Save Progress
          </Button>
          
          {hasSavedProgress && (
            <>
              <Button
                type="button"
                variant="outline"
                className="flex items-center text-green-600 border-green-200 hover:bg-green-50"
                onClick={loadProgress}
              >
                <ArrowUpFromLine className="h-3.5 w-3.5 mr-1.5" />
                Load Saved
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex items-center text-red-600 border-red-200 hover:bg-red-50"
                onClick={clearSavedProgress}
              >
                Clear Saved
              </Button>
            </>
          )}
        </div>
      )}
      
      {hasSavedProgress && (
        <div className="bg-blue-50 p-2 rounded-md text-sm text-blue-800">
          Last saved: {new Date(savedProgress.savedAt).toLocaleString()}
        </div>
      )}
      
      {/* Multiple mass inputs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Mass Inputs</h4>
          
          {!isLocked && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMassInput}
              className="h-8 px-2 text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Input
            </Button>
          )}
        </div>
        
        {massInputs.map((value, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-grow space-y-1">
              <label className="block text-xs font-medium text-gray-600">
                Mass Input #{index + 1} (kg)
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={value || ''}
                onChange={(e) => handleMassInputChange(index, parseFloat(e.target.value) || 0)}
                disabled={isLocked}
                required={index === 0}
              />
            </div>
            {!isLocked && massInputs.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeMassInput(index)}
                className="mt-6 h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        
        {massInputs.length > 1 && (
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium">
              Total Input Mass: {calculateTotalInputMass().toFixed(2)} kg
            </p>
          </div>
        )}
      </div>

      {/* Multi output entries */}
      <MultiOutputEntryForm 
        isLocked={isLocked} 
        onChange={setOutputEntries} 
        initialEntries={outputEntries}
      />

      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-600">
          Remarks (Optional)
        </label>
        <Textarea
          placeholder="Any additional comments"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          disabled={isLocked}
          rows={2}
        />
      </div>

      {!isLocked && (
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="flex items-center"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleLock}
            className="flex items-center"
          >
            <Lock className="h-4 w-4 mr-2" />
            Save & Lock
          </Button>
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

export default MachineWorkEntryForm;
