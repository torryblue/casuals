import React, { useState, useEffect } from 'react';
import { X, Save, Lock, ArrowDownToLine, ArrowUpFromLine, Ticket } from 'lucide-react';
import { useSchedules, WorkEntry } from '../contexts/ScheduleContext';
import { toast } from 'sonner';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TicketWorkEntryFormProps {
  scheduleId: string;
  scheduleItemId: string;
  employeeId: string;
  onEntryAdded: () => void;
  existingEntries: WorkEntry[];
}

const TicketWorkEntryForm = ({
  scheduleId,
  scheduleItemId,
  employeeId,
  onEntryAdded,
  existingEntries
}: TicketWorkEntryFormProps) => {
  const { addWorkEntry, isEmployeeEntryLocked, lockEmployeeEntry } = useSchedules();
  const [dutyName, setDutyName] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [savedProgress, setSavedProgress] = useState<any>(null);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);

  // Check if the employee is locked for this task
  const isLocked = isEmployeeEntryLocked(scheduleId, scheduleItemId, employeeId);

  // Load saved progress from localStorage on component mount
  useEffect(() => {
    const savedProgressKey = `ticket-progress-${scheduleId}-${scheduleItemId}-${employeeId}`;
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

  // Save progress to localStorage
  const saveProgress = () => {
    const progressData = {
      dutyName,
      remarks,
      savedAt: new Date().toISOString()
    };
    
    const savedProgressKey = `ticket-progress-${scheduleId}-${scheduleItemId}-${employeeId}`;
    localStorage.setItem(savedProgressKey, JSON.stringify(progressData));
    
    toast.success("Progress saved successfully");
    setHasSavedProgress(true);
    setSavedProgress(progressData);
  };

  // Load saved progress
  const loadProgress = () => {
    if (savedProgress) {
      setDutyName(savedProgress.dutyName);
      setRemarks(savedProgress.remarks);
      toast.success("Progress loaded successfully");
    }
  };

  // Clear saved progress
  const clearSavedProgress = () => {
    const savedProgressKey = `ticket-progress-${scheduleId}-${scheduleItemId}-${employeeId}`;
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
      quantity: 1, // Default quantity for ticket-based work
      remarks,
      entryType: ''
    });
    
    // Reset form
    setDutyName('');
    setRemarks('');
    
    // Clear saved progress
    clearSavedProgress();
    
    onEntryAdded();
    toast.success('Ticket work entry recorded successfully');
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
      quantity: 1, // Default quantity for ticket-based work
      remarks: `Duty: ${dutyName}\n\nRemarks: ${remarks}`,
      entryType: ''
    });
    
    // Lock the employee entries
    lockEmployeeEntry(scheduleId, scheduleItemId, employeeId);
    
    // Reset form and clear saved progress
    setDutyName('');
    setRemarks('');
    clearSavedProgress();
    
    onEntryAdded();
    toast.success('Entries locked successfully');
  };

  const handleCancel = () => {
    setDutyName('');
    setRemarks('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Progress management buttons */}
      {!isLocked && (
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            className="px-3 py-1.5 flex items-center text-sm"
            variant="secondary"
            onClick={saveProgress}
          >
            <ArrowDownToLine className="h-3.5 w-3.5 mr-1.5" />
            Save Progress
          </Button>
          
          {hasSavedProgress && (
            <>
              <Button
                type="button"
                className="px-3 py-1.5 flex items-center text-sm"
                variant="outline"
                onClick={loadProgress}
              >
                <ArrowUpFromLine className="h-3.5 w-3.5 mr-1.5" />
                Load Saved
              </Button>
              <Button
                type="button"
                className="px-3 py-1.5 flex items-center text-sm"
                variant="destructive"
                onClick={clearSavedProgress}
              >
                Clear Saved
              </Button>
            </>
          )}
        </div>
      )}
      
      {hasSavedProgress && (
        <div className="bg-blue-50 p-2 rounded-md text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-100">
          Last saved: {new Date(savedProgress.savedAt).toLocaleString()}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="dutyName" className="text-sm font-medium">
          Work Duty
        </Label>
        <div className="relative">
          <Input
            id="dutyName"
            type="text"
            placeholder="Specify the work being done under ticket"
            value={dutyName}
            onChange={(e) => setDutyName(e.target.value)}
            disabled={isLocked}
            required
            className="pr-10"
          />
          <Ticket className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="remarks" className="text-sm font-medium">
          Remarks
        </Label>
        <Textarea
          id="remarks"
          placeholder="Add any comments or notes about this work"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          disabled={isLocked}
          rows={4}
          className="resize-none"
        />
      </div>

      {!isLocked && (
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            onClick={handleCancel}
            variant="outline"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button
            type="button"
            onClick={handleLock}
            variant="destructive"
          >
            <Lock className="h-4 w-4 mr-2" />
            Save & Lock
          </Button>
        </div>
      )}

      {existingEntries.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Previous Ticket Entries</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Work Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {existingEntries.map((entry) => {
                  // Parse duty from remarks if available
                  let dutyDisplay = "Not specified";
                  if (entry.remarks && entry.remarks.includes("Duty:")) {
                    const dutyMatch = entry.remarks.match(/Duty: (.*?)(?:\n|$)/);
                    if (dutyMatch && dutyMatch[1]) {
                      dutyDisplay = dutyMatch[1];
                    }
                  }
                  
                  return (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {new Date(entry.recordedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        <div className="font-medium">{dutyDisplay}</div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs mt-1 max-w-xs break-words">
                          {entry.remarks && entry.remarks.includes("Remarks:") 
                            ? entry.remarks.split("Remarks:")[1].trim() 
                            : entry.remarks}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {entry.locked ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">Locked</span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100">Active</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </form>
  );
};

export default TicketWorkEntryForm;
