import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "sonner";
import { supabase } from '@/lib/supabase';
import { Employee } from '@/contexts/EmployeeContext';

export type ScheduleItem = {
  id: string;
  task: string;
  workers: number;
  employeeIds: string[];
  targetMass?: number;
  numberOfScales?: number;
  numberOfBales?: number;
  classGrades?: string[];
  quantity?: number;
};

export type Schedule = {
  id: string;
  date: string;
  items: ScheduleItem[];
  createdAt: Date;
};

export type WorkEntry = {
  id: string;
  scheduleId: string;
  scheduleItemId: string;
  employeeId: string;
  quantity: number;
  remarks: string;
  recordedAt: Date;
  scaleEntries?: {
    scaleNumber: number;
    inValue: number;
    outValue?: number;
    sticks?: number;
  }[];
  totalSticks?: number;
  fm?: number;
  locked?: boolean;
};

type ScheduleContextType = {
  schedules: Schedule[];
  workEntries: WorkEntry[];
  addSchedule: (date: string, items: Omit<ScheduleItem, 'id'>[]) => void;
  getScheduleById: (id: string) => Schedule | undefined;
  addWorkEntry: (entry: Omit<WorkEntry, 'id' | 'recordedAt'>) => void;
  getWorkEntriesForEmployee: (scheduleId: string, employeeId: string) => WorkEntry[];
  getAllSchedulesByEmployeeId: (employeeId: string) => Schedule[];
  isEmployeeAssignedForDate: (employeeId: string, date: string) => boolean;
  updateSchedule: (scheduleId: string, updatedItems: ScheduleItem[]) => void;
  deleteSchedule: (scheduleId: string) => void;
  lockEmployeeEntry: (scheduleId: string, scheduleItemId: string, employeeId: string) => void;
  unlockEmployeeEntry: (scheduleId: string, scheduleItemId: string, employeeId: string) => Promise<boolean>;
  isEmployeeEntryLocked: (scheduleId: string, scheduleItemId: string, employeeId: string) => boolean;
  getLockedEmployeeEntries: () => { scheduleId: string; scheduleItemId: string; employeeId: string; date: string; task: string; employee: string }[];
  isLoading: boolean;
};

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch schedules and work entries from Supabase when component mounts
    fetchSchedules();
    fetchWorkEntries();
  }, []);

  const fetchSchedules = async () => {
    setIsLoading(true);
    
    try {
      console.log('Fetching schedules from Supabase');
      const { data, error } = await supabase
        .from('schedules')
        .select('*');
      
      if (error) {
        console.error('Supabase error fetching schedules:', error);
        throw error;
      }
      
      if (data) {
        console.log('Fetched schedules:', data);
        // Convert date strings back to Date objects
        const formattedSchedules = data.map(schedule => ({
          ...schedule,
          createdAt: new Date(schedule.createdat) // Note: lowercase 'createdat' matches DB schema
        }));
        
        setSchedules(formattedSchedules as Schedule[]);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Failed to fetch schedules');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkEntries = async () => {
    setIsLoading(true);
    
    try {
      console.log('Fetching work entries from Supabase');
      const { data, error } = await supabase
        .from('work_entries')
        .select('*');
      
      if (error) {
        console.error('Supabase error fetching work entries:', error);
        throw error;
      }
      
      if (data) {
        console.log('Fetched work entries:', data);
        // Convert date strings back to Date objects and map field names
        const formattedEntries = data.map(entry => ({
          id: entry.id,
          scheduleId: entry.scheduleid, // lowercase to match DB schema
          scheduleItemId: entry.scheduleitemid, // lowercase to match DB schema
          employeeId: entry.employeeid, // lowercase to match DB schema
          quantity: entry.quantity,
          remarks: entry.remarks,
          recordedAt: new Date(entry.recordedat), // lowercase to match DB schema
          scaleEntries: entry.scaleentries, // lowercase to match DB schema
          totalSticks: entry.totalsticks, // lowercase to match DB schema
          fm: entry.fm,
          locked: entry.locked
        }));
        
        setWorkEntries(formattedEntries as WorkEntry[]);
      }
    } catch (error) {
      console.error('Error fetching work entries:', error);
      toast.error('Failed to fetch work entries');
    } finally {
      setIsLoading(false);
    }
  };

  const generateId = (prefix: string, task?: string) => {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    if (task && prefix === 'SCH') {
      // Format: SCH-TASKNAME-TIMESTAMP-RANDOM
      // Take only the first 4 characters of task name to keep it concise
      const taskPrefix = task.substring(0, 4).toUpperCase();
      return `${prefix}-${taskPrefix}-${timestamp}-${random}`;
    }
    
    return `${prefix}-${timestamp}-${random}`;
  };

  const isEmployeeAssignedForDate = (employeeId: string, date: string) => {
    return schedules.some(schedule => 
      schedule.date === date && 
      schedule.items.some(item => 
        item.employeeIds.includes(employeeId)
      )
    );
  };

  const isEmployeeEntryLocked = (scheduleId: string, scheduleItemId: string, employeeId: string) => {
    return workEntries.some(entry => 
      entry.scheduleId === scheduleId && 
      entry.scheduleItemId === scheduleItemId && 
      entry.employeeId === employeeId &&
      entry.locked === true
    );
  };

  const lockEmployeeEntry = async (scheduleId: string, scheduleItemId: string, employeeId: string) => {
    setIsLoading(true);
    
    try {
      // Find all entries for this employee on this schedule item
      const entriesToLock = workEntries.filter(
        entry => entry.scheduleId === scheduleId && 
                entry.scheduleItemId === scheduleItemId && 
                entry.employeeId === employeeId
      );
      
      if (entriesToLock.length === 0) {
        throw new Error('No entries found to lock');
      }
      
      // Update each entry in the database
      for (const entry of entriesToLock) {
        const { error } = await supabase
          .from('work_entries')
          .update({ locked: true })
          .eq('id', entry.id);
        
        if (error) {
          console.error('Error locking entry:', error);
          throw error;
        }
      }
      
      // Update local state
      setWorkEntries(prev => 
        prev.map(entry => 
          (entry.scheduleId === scheduleId && 
           entry.scheduleItemId === scheduleItemId && 
           entry.employeeId === employeeId)
            ? { ...entry, locked: true }
            : entry
        )
      );
      
      toast.success('Worker entries have been locked');
    } catch (error) {
      console.error('Error locking employee entries:', error);
      toast.error('Failed to lock entries');
    } finally {
      setIsLoading(false);
    }
  };

  const addSchedule = async (date: string, items: Omit<ScheduleItem, 'id'>[]) => {
    setIsLoading(true);
    
    try {
      // Find a representative task for the schedule ID
      const mainTask = items.length > 0 ? items[0].task : 'GEN';
      
      // Map items and add ID
      const scheduleItems = items.map(item => ({
        ...item,
        id: generateId('ITEM')
      }));
      
      const newSchedule = {
        id: generateId('SCH', mainTask),
        date,
        items: scheduleItems,
        createdAt: new Date()
      };
      
      console.log('Creating schedule with data:', JSON.stringify(newSchedule, null, 2));
      
      // Format the data to match DB schema column names
      const scheduleRecord = {
        id: newSchedule.id,
        date: newSchedule.date,
        items: scheduleItems, // This will be stored as JSONB
        createdat: newSchedule.createdAt.toISOString() // lowercase to match DB schema
      };
      
      console.log('Final schedule record to insert:', scheduleRecord);
      
      // Store the schedule in Supabase
      const { error } = await supabase
        .from('schedules')
        .insert([scheduleRecord]);
      
      if (error) {
        console.error('Supabase error creating schedule:', error);
        throw error;
      }
      
      setSchedules(prev => [...prev, newSchedule]);
      toast.success(`Schedule for ${date} created successfully`);
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast.error('Failed to create schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const getScheduleById = (id: string) => {
    return schedules.find(schedule => schedule.id === id);
  };

  const addWorkEntry = async (entry: Omit<WorkEntry, 'id' | 'recordedAt'>) => {
    setIsLoading(true);
    
    try {
      // Check if employee is locked for this task
      if (isEmployeeEntryLocked(entry.scheduleId, entry.scheduleItemId, entry.employeeId)) {
        toast.error('This worker has been locked for this task');
        return;
      }
      
      // Calculate total sticks if applicable
      let totalSticks = undefined;
      if (entry.scaleEntries && entry.scaleEntries.some(se => se.sticks !== undefined)) {
        totalSticks = entry.scaleEntries.reduce((sum, se) => sum + (se.sticks || 0), 0);
      }
      
      const newEntry = {
        ...entry,
        id: generateId('WORK'),
        recordedAt: new Date(),
        totalSticks: totalSticks || entry.totalSticks // Use provided totalSticks or calculate it
      };
      
      console.log('Adding work entry with data:', newEntry);
      
      // Format the data to match DB schema column names
      const workEntryRecord = {
        id: newEntry.id,
        scheduleid: newEntry.scheduleId, // lowercase to match DB schema
        scheduleitemid: newEntry.scheduleItemId, // lowercase to match DB schema
        employeeid: newEntry.employeeId, // lowercase to match DB schema
        quantity: newEntry.quantity,
        remarks: newEntry.remarks,
        recordedat: newEntry.recordedAt.toISOString(), // lowercase to match DB schema
        scaleentries: newEntry.scaleEntries, // lowercase to match DB schema
        totalsticks: newEntry.totalSticks, // lowercase to match DB schema
        fm: newEntry.fm,
        locked: newEntry.locked || false
      };
      
      console.log('Final work entry record to insert:', workEntryRecord);
      
      // Store the work entry in Supabase
      const { error } = await supabase
        .from('work_entries')
        .insert([workEntryRecord]);
      
      if (error) {
        console.error('Supabase error adding work entry:', error);
        throw error;
      }
      
      setWorkEntries(prev => [...prev, newEntry]);
      toast.success(`Work entry recorded successfully`);
    } catch (error) {
      console.error('Error adding work entry:', error);
      toast.error('Failed to record work entry');
    } finally {
      setIsLoading(false);
    }
  };

  const getWorkEntriesForEmployee = (scheduleId: string, employeeId: string) => {
    return workEntries.filter(
      entry => entry.scheduleId === scheduleId && entry.employeeId === employeeId
    );
  };

  const getAllSchedulesByEmployeeId = (employeeId: string) => {
    return schedules.filter(schedule => 
      schedule.items.some(item => 
        item.employeeIds.includes(employeeId)
      )
    );
  };

  const updateSchedule = async (scheduleId: string, updatedItems: ScheduleItem[]) => {
    setIsLoading(true);
    
    try {
      const scheduleToUpdate = schedules.find(s => s.id === scheduleId);
      
      if (!scheduleToUpdate) {
        throw new Error('Schedule not found');
      }
      
      const updatedSchedule = {
        ...scheduleToUpdate,
        items: updatedItems
      };
      
      // Format the data to match DB schema column names
      const scheduleRecord = {
        id: updatedSchedule.id,
        date: updatedSchedule.date,
        items: updatedSchedule.items,
        createdat: updatedSchedule.createdAt.toISOString() // lowercase to match DB schema
      };
      
      console.log('Updating schedule with data:', scheduleRecord);
      
      // Update the schedule in Supabase
      const { error } = await supabase
        .from('schedules')
        .update(scheduleRecord)
        .eq('id', scheduleId);
      
      if (error) {
        console.error('Supabase error updating schedule:', error);
        throw error;
      }
      
      setSchedules(prev => 
        prev.map(schedule => 
          schedule.id === scheduleId 
            ? updatedSchedule 
            : schedule
        )
      );
      
      toast.success("Schedule updated successfully");
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Failed to update schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    setIsLoading(true);
    
    try {
      // First delete all related work entries
      console.log(`Deleting work entries for schedule ${scheduleId}`);
      const { error: entriesError } = await supabase
        .from('work_entries')
        .delete()
        .eq('scheduleid', scheduleId); // lowercase to match DB schema
      
      if (entriesError) {
        console.error('Supabase error deleting work entries:', entriesError);
        throw entriesError;
      }
      
      // Then delete the schedule
      console.log(`Deleting schedule ${scheduleId}`);
      const { error: scheduleError } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId);
      
      if (scheduleError) {
        console.error('Supabase error deleting schedule:', scheduleError);
        throw scheduleError;
      }
      
      setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId));
      setWorkEntries(prev => prev.filter(entry => entry.scheduleId !== scheduleId));
      
      toast.success("Schedule deleted successfully");
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    } finally {
      setIsLoading(false);
    }
  };

  // Unlock entries with admin override functionality
  const unlockEmployeeEntry = async (scheduleId: string, scheduleItemId: string, employeeId: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Find all entries for this employee on this schedule item
      const entriesToUnlock = workEntries.filter(
        entry => entry.scheduleId === scheduleId && 
                entry.scheduleItemId === scheduleItemId && 
                entry.employeeId === employeeId
      );
      
      if (entriesToUnlock.length === 0) {
        toast.error('No locked entries found');
        return false;
      }
      
      // Update each entry in the database
      for (const entry of entriesToUnlock) {
        const { error } = await supabase
          .from('work_entries')
          .update({ locked: false })
          .eq('id', entry.id);
        
        if (error) {
          console.error('Error unlocking entry:', error);
          throw error;
        }
      }
      
      // Update local state
      setWorkEntries(prev => 
        prev.map(entry => 
          (entry.scheduleId === scheduleId && 
           entry.scheduleItemId === scheduleItemId && 
           entry.employeeId === employeeId)
            ? { ...entry, locked: false }
            : entry
        )
      );
      
      toast.success('Worker entries have been unlocked');
      return true;
    } catch (error) {
      console.error('Error unlocking employee entries:', error);
      toast.error('Failed to unlock entries');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get all locked employee entries, regardless of date
  const getLockedEmployeeEntries = () => {
    const lockedEntries: { 
      scheduleId: string; 
      scheduleItemId: string; 
      employeeId: string;
      date: string;
      task: string;
      employee: string;
    }[] = [];
    
    // Find all unique locked employee/schedule/item combinations
    workEntries.forEach(entry => {
      if (entry.locked) {
        // Check if this combination is already in the list
        const existingEntry = lockedEntries.find(
          le => le.scheduleId === entry.scheduleId && 
               le.scheduleItemId === entry.scheduleItemId && 
               le.employeeId === entry.employeeId
        );
        
        if (!existingEntry) {
          const schedule = schedules.find(s => s.id === entry.scheduleId);
          const scheduleItem = schedule?.items.find(item => item.id === entry.scheduleItemId);
          
          if (schedule && scheduleItem) {
            lockedEntries.push({
              scheduleId: entry.scheduleId,
              scheduleItemId: entry.scheduleItemId,
              employeeId: entry.employeeId,
              date: schedule.date,
              task: scheduleItem.task,
              employee: `Employee ID: ${entry.employeeId}` // This would be better with employee name, but we don't have that context here
            });
          }
        }
      }
    });
    
    return lockedEntries;
  };

  return (
    <ScheduleContext.Provider value={{
      schedules,
      workEntries,
      addSchedule,
      getScheduleById,
      addWorkEntry,
      getWorkEntriesForEmployee,
      getAllSchedulesByEmployeeId,
      isEmployeeAssignedForDate,
      updateSchedule,
      deleteSchedule,
      lockEmployeeEntry,
      unlockEmployeeEntry,
      isEmployeeEntryLocked,
      getLockedEmployeeEntries,
      isLoading
    }}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedules = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedules must be used within a ScheduleProvider');
  }
  return context;
};
