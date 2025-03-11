
import React, { useState, useEffect } from "react";
import { useSchedules, WorkEntry } from "@/contexts/ScheduleContext";
import { useEmployees } from "@/contexts/EmployeeContext";
import { toast } from "sonner";
import { Lock, Shield } from "lucide-react";

type StrippingWorkEntryFormProps = {
  scheduleId: string;
  scheduleItemId: string;
  employeeId: string;
  targetMass: number;
  numberOfScales: number;
  onEntryAdded: () => void;
  existingEntries: WorkEntry[];
};

const StrippingWorkEntryForm = ({
  scheduleId,
  scheduleItemId,
  employeeId,
  targetMass,
  numberOfScales,
  onEntryAdded,
  existingEntries,
}: StrippingWorkEntryFormProps) => {
  const { addWorkEntry, isLoading, lockEmployeeEntry, isEmployeeEntryLocked } = useSchedules();
  const { employees } = useEmployees();
  const [scaleEntries, setScaleEntries] = useState<{ 
    scaleNumber: number; 
    inValue: number; 
    outValue?: number;
    sticks?: number;
  }[]>(
    Array.from({ length: numberOfScales }, (_, i) => ({
      scaleNumber: i + 1,
      inValue: 0,
      outValue: undefined,
      sticks: 0,
    }))
  );
  const [remarks, setRemarks] = useState("");
  const [fm, setFm] = useState<number>(0);
  const [formComplete, setFormComplete] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const employee = employees.find(emp => emp.id === employeeId);
  
  const isLocked = isEmployeeEntryLocked(scheduleId, scheduleItemId, employeeId);

  const totalInScale = Math.round(scaleEntries.reduce((sum, entry) => sum + (entry.inValue || 0), 0));
  const totalOutScale = Math.round(scaleEntries.reduce((sum, entry) => sum + (entry.outValue || 0), 0));
  const totalSticks = Math.round(scaleEntries.reduce((sum, entry) => sum + (entry.sticks || 0), 0));
  const outScaleMass = totalOutScale;

  // Auto-save when input changes
  const autoSaveEntry = (updatedScaleEntries: typeof scaleEntries, updatedFm: number) => {
    // Clear any existing timeout to prevent multiple submissions
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    const timeout = setTimeout(() => {
      console.log("Auto-saving stripping entry");
      addWorkEntry({
        scheduleId,
        scheduleItemId,
        employeeId,
        quantity: Math.round(updatedScaleEntries.reduce((sum, entry) => sum + (entry.outValue || 0), 0)),
        remarks,
        scaleEntries: updatedScaleEntries,
        fm: updatedFm,
        totalSticks: Math.round(updatedScaleEntries.reduce((sum, entry) => sum + (entry.sticks || 0), 0))
      });
      
      toast.success("Entry saved automatically");
      onEntryAdded();
    }, 1500); // 1.5 second delay
    
    setAutoSaveTimeout(timeout);
  };

  // Handle scale value change and auto-save
  const handleScaleValueChange = (scaleIndex: number, field: 'inValue' | 'outValue' | 'sticks', value: number) => {
    const roundedValue = Math.round(value);
    
    const updatedEntries = [...scaleEntries];
    updatedEntries[scaleIndex][field] = roundedValue;
    setScaleEntries(updatedEntries);
    
    // Only auto-save if not locked and there's a valid value
    if (!isLocked && roundedValue !== undefined) {
      autoSaveEntry(updatedEntries, fm);
    }
  };

  // Handle FM value change and auto-save
  const handleFmChange = (value: number) => {
    setFm(value);
    
    // Only auto-save if not locked and there's a valid scale entry
    if (!isLocked && scaleEntries.some(entry => entry.outValue !== undefined)) {
      autoSaveEntry(scaleEntries, value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formComplete) {
      toast.error("Please fill all required fields");
      return;
    }
    
    addWorkEntry({
      scheduleId,
      scheduleItemId,
      employeeId,
      quantity: outScaleMass,
      remarks,
      scaleEntries,
      fm,
      totalSticks
    });
    
    setScaleEntries(
      Array.from({ length: numberOfScales }, (_, i) => ({
        scaleNumber: i + 1,
        inValue: 0,
        outValue: undefined,
        sticks: 0,
      }))
    );
    setRemarks("");
    setFm(0);
    
    onEntryAdded();
  };

  const handleLockEntries = () => {
    if (window.confirm("Are you sure you want to lock this worker's entries? This cannot be undone.")) {
      lockEmployeeEntry(scheduleId, scheduleItemId, employeeId);
    }
  };

  return (
    <div className="mt-4">
      <div className="glass-card p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-medium">Stripping Work Entry for {employee?.name} {employee?.surname}</h3>
          
          {!isLocked && existingEntries.length > 0 && (
            <button 
              onClick={handleLockEntries}
              className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-amber-100 text-amber-800 hover:bg-amber-200"
            >
              <Lock className="h-3.5 w-3.5 mr-1.5" />
              Lock Entries
            </button>
          )}
          
          {isLocked && (
            <div className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-800">
              <Shield className="h-3.5 w-3.5 mr-1.5" />
              Worker Locked
            </div>
          )}
        </div>
        
        {isLocked ? (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <p className="text-gray-700">This worker's entries have been locked. No further entries can be recorded.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scale #
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      In Scale (kg)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Out Scale (kg)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sticks
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scaleEntries.map((entry, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Scale {entry.scaleNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          className="input-field w-full appearance-none"
                          value={entry.inValue || ""}
                          onChange={(e) => handleScaleValueChange(index, 'inValue', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          className="input-field w-full appearance-none"
                          value={entry.outValue || ""}
                          onChange={(e) => handleScaleValueChange(index, 'outValue', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          className="input-field w-full appearance-none"
                          value={entry.sticks || ""}
                          onChange={(e) => handleScaleValueChange(index, 'sticks', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Totals
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      {totalInScale} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      {totalOutScale} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      {totalSticks}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="p-3 bg-blue-50 rounded-md">
                  <span className="block text-xs text-gray-600">Target Mass:</span>
                  <span className="font-medium">{targetMass} kg</span>
                </div>
              </div>
              <div>
                <div className="p-3 bg-green-50 rounded-md">
                  <span className="block text-xs text-gray-600">Out Scale Mass:</span>
                  <span className="font-medium">{outScaleMass} kg</span>
                </div>
              </div>
              <div>
                <div className="p-3 bg-orange-50 rounded-md">
                  <span className="block text-xs text-gray-600">Variance:</span>
                  <span className={`font-medium ${outScaleMass >= targetMass ? 'text-green-600' : 'text-red-600'}`}>
                    {(outScaleMass - targetMass)} kg
                  </span>
                </div>
              </div>
              <div>
                <div className="p-3 bg-purple-50 rounded-md">
                  <span className="block text-xs text-gray-600">Total Sticks:</span>
                  <span className="font-medium">{totalSticks}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fm" className="block text-sm font-medium text-gray-700">
                  FM Value
                </label>
                <input
                  type="number"
                  id="fm"
                  step="1"
                  min="0"
                  className="input-field w-full mt-1 appearance-none"
                  value={fm}
                  onChange={(e) => handleFmChange(Number(e.target.value))}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
                  Remarks (optional)
                </label>
                <textarea
                  id="remarks"
                  rows={2}
                  className="input-field w-full mt-1"
                  placeholder="Add any remarks about this entry"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                ></textarea>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <div className="text-sm text-green-600 italic mr-4 flex items-center">
                Entries are saved automatically as you type
              </div>
            </div>
          </form>
        )}

        {existingEntries.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Previous Entries</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Out Scale Mass
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Sticks
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      FM
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
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
                        {entry.totalSticks || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.fm || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.remarks || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StrippingWorkEntryForm;
