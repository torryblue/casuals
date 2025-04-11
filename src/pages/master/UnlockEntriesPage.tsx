
import React, { useState, useEffect } from "react";
import { ArrowLeft, Lock, Unlock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useSchedules } from "@/contexts/ScheduleContext";
import { useEmployees } from "@/contexts/EmployeeContext";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const UnlockEntriesPage = () => {
  const navigate = useNavigate();
  const { getLockedEmployeeEntries, unlockEmployeeEntry, isLoading } = useSchedules();
  const { employees } = useEmployees();
  const { user } = useAuth();
  const [lockedEntries, setLockedEntries] = useState<any[]>([]);
  const [unlocking, setUnlocking] = useState<string | null>(null);

  // Redirect non-admin users
  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      toast.error('You do not have permission to access this page');
    }
  }, [user, navigate]);

  // Load locked entries
  useEffect(() => {
    const entries = getLockedEmployeeEntries();
    
    // Enrich entries with employee names
    const enrichedEntries = entries.map(entry => {
      const employee = employees.find(emp => emp.id === entry.employeeId);
      return {
        ...entry,
        employeeName: employee ? `${employee.name} ${employee.surname}` : entry.employee
      };
    });
    
    setLockedEntries(enrichedEntries);
  }, [getLockedEmployeeEntries, employees]);

  const handleUnlock = async (scheduleId: string, scheduleItemId: string, employeeId: string) => {
    const entryKey = `${scheduleId}-${scheduleItemId}-${employeeId}`;
    setUnlocking(entryKey);
    
    try {
      const success = await unlockEmployeeEntry(scheduleId, scheduleItemId, employeeId);
      
      if (success) {
        toast.success("Entry unlocked successfully");
        // Refresh the list of locked entries
        const updatedEntries = getLockedEmployeeEntries().map(entry => {
          const employee = employees.find(emp => emp.id === entry.employeeId);
          return {
            ...entry,
            employeeName: employee ? `${employee.name} ${employee.surname}` : entry.employee
          };
        });
        setLockedEntries(updatedEntries);
      } else {
        toast.error("Failed to unlock entry");
      }
    } catch (error) {
      console.error("Error unlocking entry:", error);
      toast.error("An error occurred while unlocking the entry");
    } finally {
      setUnlocking(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <h1 className="text-2xl font-medium text-gray-800">Manage Locked Entries</h1>
        </div>

        <div className="glass-card p-6 element-transition">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Locked Employee Entries</h2>
            
            {lockedEntries.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <Lock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No locked entries found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Date</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Schedule ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lockedEntries.map((entry) => {
                      const entryKey = `${entry.scheduleId}-${entry.scheduleItemId}-${entry.employeeId}`;
                      return (
                        <TableRow key={entryKey}>
                          <TableCell className="font-medium">{entry.date}</TableCell>
                          <TableCell>{entry.employeeName}</TableCell>
                          <TableCell>{entry.task}</TableCell>
                          <TableCell className="text-sm text-gray-500">{entry.scheduleId}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center"
                                onClick={() => handleUnlock(entry.scheduleId, entry.scheduleItemId, entry.employeeId)}
                                disabled={unlocking === entryKey || isLoading}
                              >
                                {unlocking === entryKey ? (
                                  <>Unlocking...</>
                                ) : (
                                  <>
                                    <Unlock className="h-4 w-4 mr-2" />
                                    Unlock
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="ml-2 flex items-center"
                                onClick={() => navigate(`/work-entry?scheduleId=${entry.scheduleId}&employeeId=${entry.employeeId}`)}
                              >
                                Edit
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">About Locked Entries</p>
                <p>Locked entries prevent employees from making further edits to their work entries. As an admin, you can unlock these entries to allow modifications, or edit them directly yourself.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default UnlockEntriesPage;
