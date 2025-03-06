
import React, { useState } from "react";
import { useSchedules, WorkEntry } from "@/contexts/ScheduleContext";
import { useEmployees } from "@/contexts/EmployeeContext";
import { toast } from "sonner";

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
  const { addWorkEntry, isLoading } = useSchedules();
  const { employees } = useEmployees();
  const [scaleEntries, setScaleEntries] = useState<{ scaleNumber: number; inValue: number; outValue?: number }[]>(
    Array.from({ length: numberOfScales }, (_, i) => ({
      scaleNumber: i + 1,
      inValue: 0,
      outValue: undefined,
    }))
  );
  const [remarks, setRemarks] = useState("");

  // Find employee details
  const employee = employees.find(emp => emp.id === employeeId);

  // Calculate totals with whole numbers
  const totalInScale = Math.round(scaleEntries.reduce((sum, entry) => sum + (entry.inValue || 0), 0));
  const totalOutScale = Math.round(scaleEntries.reduce((sum, entry) => sum + (entry.outValue || 0), 0));
  const finalMass = isNaN(totalOutScale) ? 0 : totalOutScale;

  // Handle scale value change
  const handleScaleValueChange = (scaleIndex: number, field: 'inValue' | 'outValue', value: number) => {
    // Round to whole number
    const roundedValue = Math.round(value);
    
    const updatedEntries = [...scaleEntries];
    updatedEntries[scaleIndex][field] = roundedValue;
    setScaleEntries(updatedEntries);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addWorkEntry({
      scheduleId,
      scheduleItemId,
      employeeId,
      quantity: finalMass, // Total output as the quantity (whole number)
      remarks,
      scaleEntries
    });
    
    // Reset form after submission
    setScaleEntries(
      Array.from({ length: numberOfScales }, (_, i) => ({
        scaleNumber: i + 1,
        inValue: 0,
        outValue: undefined,
      }))
    );
    setRemarks("");
    
    // Notify parent component
    onEntryAdded();
  };

  return (
    <div className="mt-4">
      <div className="glass-card p-4">
        <h3 className="text-md font-medium mb-4">Stripping Work Entry for {employee?.name} {employee?.surname}</h3>
        
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
                        step="1" // Changed from 0.01 to 1 for whole numbers
                        min="0"
                        className="input-field w-full"
                        value={entry.inValue || ""}
                        onChange={(e) => handleScaleValueChange(index, 'inValue', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        step="1" // Changed from 0.01 to 1 for whole numbers
                        min="0"
                        className="input-field w-full"
                        value={entry.outValue || ""}
                        onChange={(e) => handleScaleValueChange(index, 'outValue', parseFloat(e.target.value) || 0)}
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
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="p-3 bg-blue-50 rounded-md">
                <span className="block text-xs text-gray-600">Target Mass:</span>
                <span className="font-medium">{targetMass} kg</span>
              </div>
            </div>
            <div>
              <div className="p-3 bg-green-50 rounded-md">
                <span className="block text-xs text-gray-600">Final Mass:</span>
                <span className="font-medium">{finalMass} kg</span>
              </div>
            </div>
            <div>
              <div className="p-3 bg-orange-50 rounded-md">
                <span className="block text-xs text-gray-600">Variance:</span>
                <span className={`font-medium ${finalMass >= targetMass ? 'text-green-600' : 'text-red-600'}`}>
                  {(finalMass - targetMass)} kg
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
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
          
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? 'Saving...' : 'Record Entry'}
            </button>
          </div>
        </form>

        {/* Display existing entries if any */}
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
                      Final Mass
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
