import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "sonner";
import { supabase } from '../lib/supabase';

// Import Employee type properly
export type Employee = {
  id: string;
  name: string | null;
  surname: string | null;
  idno: string | null;
  contact: string | null;
  address: string | null;
  gender: string | null;
  nextofkinname: string | null;
  nextofkincontact: string | null;
};

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
  // Machine specific fields
  outputMass?: number;
  sticksMass?: number;
  f8Mass?: number;
  dustMass?: number;
  massInputs?: number[];
  // Bailing/Crushing Sticks specific fields
  cartons?: {
    number: number;
    mass: number;
  }[];
};

type ScheduleContextType = {
  schedules: Schedule[];
  workEntries: WorkEntry[];
  addSchedule: (date: string, items: Omit<ScheduleItem, 'id'>[]) => void;
  getScheduleById: (id: string) => Schedule | undefined;
  addWorkEntry: (entry: Omit<WorkEntry, 'id' | 'recordedAt'>) => void;
  updateWorkEntry: (entryId: string, updatedEntry: Partial<WorkEntry>) => Promise<boolean>;
  getWorkEntriesForEmployee: (scheduleId: string, employeeId: string) => WorkEntry[];
  getAllSchedulesByEmployeeId: (employeeId: string) => Schedule[];
  isEmployeeAssignedForDate: (employeeId: string, date: string) => boolean;
  updateSchedule: (scheduleId: string, updatedItems: ScheduleItem[]) => void;
  deleteSchedule: (scheduleId: string) => void;
  lockEmployeeEntry: (scheduleId: string, scheduleItemId: string, employeeId: string) => void;
  unlockEmployeeEntry: (scheduleId: string, scheduleItemId: string, employeeId: string) => Promise<boolean>;
  isEmployeeEntryLocked: (scheduleId: string, scheduleItemId: string, employeeId: string) => boolean;
  getLockedEmployeeEntries: () => { scheduleId: string; scheduleItemId: string; employeeId: string; date: string; task: string; employee: string }[];
  getAssignedEmployeesForDate: (date: string) => string[];
  isLoading: boolean;
};

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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
        const formattedSchedules = data.map(schedule => ({
          ...schedule,
          createdAt: new Date(schedule.createdat)
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
        const formattedEntries = data.map(entry => ({
          id: entry.id,
          scheduleId: entry.scheduleid,
          scheduleItemId: entry.scheduleitemid,
          employeeId: entry.employeeid,
          quantity: entry.quantity,
          remarks: entry.remarks,
          recordedAt: new Date(entry.recordedat),
          scaleEntries: entry.scaleentries,
          totalSticks: entry.totalsticks,
          fm: entry.fm,
          locked: entry.locked,
          outputMass: entry.outputmass,
          sticksMass: entry.sticksmass,
          f8Mass: entry.f8mass,
          dustMass: entry.dustmass,
          massInputs: entry.mass_inputs,
          cartons: entry.cartons
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
      const taskPrefix = task.substring(0, 4).toUpperCase();
      return `${prefix}-${taskPrefix}-${timestamp}-${random}`;
    }
    
    return `${prefix}-${timestamp}-${random}`;
  };

  const getAssignedEmployeesForDate = (date: string) => {
    const assignedEmployees: string[] = [];
    
    schedules.forEach(schedule => {
      if (schedule.date === date) {
        schedule.items.forEach(item => {
          item.employeeIds.forEach(empId => {
            if (!assignedEmployees.includes(empId)) {
              assignedEmployees.push(empId);
            }
          });
        });
      }
    });
    
    return assignedEmployees;
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
      const entriesToLock = workEntries.filter(
        entry => entry.scheduleId === scheduleId && 
                entry.scheduleItemId === scheduleItemId && 
                entry.employeeId === employeeId
      );
      
      if (entriesToLock.length === 0) {
        throw new Error('No entries found to lock');
      }
      
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
      const mainTask = items.length > 0 ? items[0].task : 'GEN';
      
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
      
      const scheduleRecord = {
        id: newSchedule.id,
        date: newSchedule.date,
        items: scheduleItems,
        createdat: newSchedule.createdAt.toISOString()
      };
      
      console.log('Final schedule record to insert:', scheduleRecord);
      
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
      if (isEmployeeEntryLocked(entry.scheduleId, entry.scheduleItemId, entry.employeeId)) {
        toast.error('This worker has been locked for this task');
        return;
      }
      
      let totalSticks = undefined;
      if (entry.scaleEntries && entry.scaleEntries.some(se => se.sticks !== undefined)) {
        totalSticks = entry.scaleEntries.reduce((sum, se) => sum + (se.sticks || 0), 0);
      }
      
      const newEntry = {
        ...entry,
        id: generateId('WORK'),
        recordedAt: new Date(),
        totalSticks: totalSticks || entry.totalSticks
      };
      
      console.log('Adding work entry with data:', newEntry);
      
      // Convert JavaScript camelCase property names to snake_case database column names
      const workEntryRecord = {
        id: newEntry.id,
        scheduleid: newEntry.scheduleId,
        scheduleitemid: newEntry.scheduleItemId,
        employeeid: newEntry.employeeId,
        quantity: newEntry.quantity,
        remarks: newEntry.remarks,
        recordedat: newEntry.recordedAt.toISOString(),
        scaleentries: newEntry.scaleEntries || null,
        totalsticks: newEntry.totalSticks || null,
        fm: newEntry.fm || null,
        locked: newEntry.locked || false,
        outputmass: newEntry.outputMass || null,
        sticksmass: newEntry.sticksMass || null,
        f8mass: newEntry.f8Mass || null,
        dustmass: newEntry.dustMass || null,
        mass_inputs: newEntry.massInputs || null,
        cartons: newEntry.cartons || null
      };
      
      console.log('Final work entry record to insert:', workEntryRecord);
      
      const { data, error } = await supabase
        .from('work_entries')
        .insert([workEntryRecord])
        .select();
      
      if (error) {
        console.error('Supabase error adding work entry:', error);
        throw error;
      }
      
      console.log('Successfully inserted work entry, response:', data);
      
      setWorkEntries(prev => [...prev, newEntry]);
      toast.success(`Work entry recorded successfully`);
    } catch (error) {
      console.error('Error adding work entry:', error);
      toast.error('Failed to record work entry');
    } finally {
      setIsLoading(false);
    }
  };

  const updateWorkEntry = async (entryId: string, updatedEntry: Partial<WorkEntry>): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const originalEntry = workEntries.find(entry => entry.id === entryId);
      
      if (!originalEntry) {
        toast.error('Work entry not found');
        return false;
      }
      
      if (originalEntry.locked) {
        toast.error('Cannot edit a locked entry');
        return false;
      }
      
      let totalSticks = originalEntry.totalSticks;
      if (updatedEntry.scaleEntries) {
        totalSticks = updatedEntry.scaleEntries.reduce((sum, se) => sum + (se.sticks || 0), 0);
      }
      
      const updateData: any = {
        ...updatedEntry,
        totalsticks: totalSticks
      };
      
      if (updatedEntry.outputMass !== undefined) updateData.outputmass = updatedEntry.outputMass;
      if (updatedEntry.sticksMass !== undefined) updateData.sticksmass = updatedEntry.sticksMass;
      if (updatedEntry.f8Mass !== undefined) updateData.f8mass = updatedEntry.f8Mass;
      if (updatedEntry.dustMass !== undefined) updateData.dustmass = updatedEntry.dustMass;
      if (updatedEntry.scaleEntries !== undefined) updateData.scaleentries = updatedEntry.scaleEntries;
      if (updatedEntry.massInputs !== undefined) updateData.mass_inputs = updatedEntry.massInputs;
      if (updatedEntry.cartons !== undefined) updateData.cartons = updatedEntry.cartons;
      
      delete updateData.outputMass;
      delete updateData.sticksMass;
      delete updateData.f8Mass;
      delete updateData.dustMass;
      delete updateData.massInputs;
      
      console.log('Updating work entry:', entryId, 'with data:', updateData);
      
      const { error } = await supabase
        .from('work_entries')
        .update(updateData)
        .eq('id', entryId);
      
      if (error) {
        console.error('Supabase error updating work entry:', error);
        throw error;
      }
      
      setWorkEntries(prev => 
        prev.map(entry => 
          entry.id === entryId
            ? { ...entry, ...updatedEntry, totalSticks }
            : entry
        )
      );
      
      toast.success('Work entry updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating work entry:', error);
      toast.error('Failed to update work entry');
      return false;
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
      
      const scheduleRecord = {
        id: updatedSchedule.id,
        date: updatedSchedule.date,
        items: updatedSchedule.items,
        createdat: updatedSchedule.createdAt.toISOString()
      };
      
      console.log('Updating schedule with data:', scheduleRecord);
      
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
      const { error: entriesError } = await supabase
        .from('work_entries')
        .delete()
        .eq('scheduleid', scheduleId);
      
      if (entriesError) {
        console.error('Supabase error deleting work entries:', entriesError);
        throw entriesError;
      }
      
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

  const unlockEmployeeEntry = async (scheduleId: string, scheduleItemId: string, employeeId: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const entriesToUnlock = workEntries.filter(
        entry => entry.scheduleId === scheduleId && 
                entry.scheduleItemId === scheduleItemId && 
                entry.employeeId === employeeId
      );
      
      if (entriesToUnlock.length === 0) {
        toast.error('No locked entries found');
        return false;
      }
      
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

  const getLockedEmployeeEntries = () => {
    const lockedEntries: { 
      scheduleId: string; 
      scheduleItemId: string; 
      employeeId: string;
      date: string;
      task: string;
      employee: string;
    }[] = [];
    
    workEntries.forEach(entry => {
      if (entry.locked) {
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
              employee: `Employee ID: ${entry.employeeId}`
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
      updateWorkEntry,
      getWorkEntriesForEmployee,
      getAllSchedulesByEmployeeId,
      isEmployeeAssignedForDate,
      updateSchedule,
      deleteSchedule,
      lockEmployeeEntry,
      unlockEmployeeEntry,
      isEmployeeEntryLocked,
      getLockedEmployeeEntries,
      getAssignedEmployeesForDate,
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
