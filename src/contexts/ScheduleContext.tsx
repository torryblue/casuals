
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from '@/lib/supabase';

export interface Carton {
  id: number;
  grade: string;
  mass: number;
}

export interface OutputEntry {
  id: string;
  type: 'output' | 'sticks' | 'f8' | 'dust';
  mass: number;
}

export interface WorkEntry {
  id: string;
  scheduleId: string;
  scheduleItemId: string;
  employeeId: string;
  recordedAt: string;
  quantity: number;
  remarks?: string;
  locked?: boolean;
  cartons?: Carton[];
  massInputs?: number[];
  outputMass?: number;
  sticksMass?: number;
  f8Mass?: number;
  dustMass?: number;
  outputEntries?: OutputEntry[];
  scaleEntries?: { scaleNumber: number; inValue: number; outValue?: number; sticks?: number; }[];
  totalSticks?: number;
  fm?: number;
  entryType: string;
}

export type ScheduleItem = {
  id: string;
  task: string;
  employeeIds: string[];
  targetMass?: number;
  numberOfScales?: number;
};

export type Schedule = {
  id: string;
  date: string;
  items: ScheduleItem[];
  createdAt?: string;
};

type ScheduleContextType = {
  schedules: Schedule[];
  workEntries: WorkEntry[];
  addSchedule: (date: string, items: Omit<ScheduleItem, 'id'>[]) => Promise<void>;
  updateSchedule: (id: string, date: string, items: Omit<ScheduleItem, 'id'>[]) => Promise<void>;
  removeSchedule: (id: string) => Promise<void>;
  addWorkEntry: (workEntry: Omit<WorkEntry, 'id' | 'recordedAt' | 'locked'>) => Promise<void>;
  updateWorkEntry: (id: string, updates: Partial<Omit<WorkEntry, 'id' | 'scheduleId' | 'scheduleItemId' | 'employeeId' | 'recordedAt'>>) => Promise<boolean>;
  removeWorkEntry: (id: string) => Promise<void>;
  isEmployeeEntryLocked: (scheduleId: string, scheduleItemId: string, employeeId: string) => boolean;
  lockEmployeeEntry: (scheduleId: string, scheduleItemId: string, employeeId: string) => void;
  unlockEmployeeEntry: (scheduleId: string, scheduleItemId: string, employeeId: string) => void;
  getWorkEntriesForEmployee: (scheduleId: string, employeeId: string) => WorkEntry[];
  getScheduleById: (id: string) => Schedule | undefined;
  isEmployeeAssignedForDate: (employeeId: string, date: string) => boolean;
  getLockedEmployeeEntries: () => WorkEntry[];
  getAllSchedulesByEmployeeId: (employeeId: string) => { schedule: Schedule; items: ScheduleItem[] }[];
  deleteSchedule: (id: string) => Promise<void>;
  isLoading: boolean;
};

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load schedules and work entries from localStorage on component mount
  useEffect(() => {
    const storedSchedules = localStorage.getItem('schedules');
    if (storedSchedules) {
      setSchedules(JSON.parse(storedSchedules));
    }

    const storedWorkEntries = localStorage.getItem('workEntries');
    if (storedWorkEntries) {
      setWorkEntries(JSON.parse(storedWorkEntries));
    }
  }, []);

  // Save schedules and work entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('workEntries', JSON.stringify(workEntries));
  }, [workEntries]);

  // Helper function to generate a unique ID
  const generateId = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  const addSchedule = async (date: string, items: Omit<ScheduleItem, 'id'>[]) => {
    setIsLoading(true);
    try {
      const newSchedule: Schedule = {
        id: generateId(),
        date: date,
        createdAt: new Date().toISOString(),
        items: items.map(item => ({ ...item, id: generateId() }))
      };

      setSchedules(prevSchedules => [...prevSchedules, newSchedule]);
      toast.success('Schedule added successfully');
    } catch (error) {
      console.error("Error adding schedule:", error);
      toast.error('Failed to add schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSchedule = async (id: string, date: string, items: Omit<ScheduleItem, 'id'>[]) => {
    setIsLoading(true);
    try {
      const existingSchedule = schedules.find(schedule => schedule.id === id);
      
      const updatedSchedule: Schedule = {
        id: id,
        date: date,
        createdAt: existingSchedule?.createdAt || new Date().toISOString(),
        items: items.map(item => ({ ...item, id: generateId() }))
      };

      setSchedules(prevSchedules =>
        prevSchedules.map(schedule => (schedule.id === id ? updatedSchedule : schedule))
      );
      toast.success('Schedule updated successfully');
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast.error('Failed to update schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const removeSchedule = async (id: string) => {
    setIsLoading(true);
    try {
      setSchedules(prevSchedules => prevSchedules.filter(schedule => schedule.id !== id));
      // Also remove associated work entries
      setWorkEntries(prevEntries => prevEntries.filter(entry => entry.scheduleId !== id));
      toast.success('Schedule removed successfully');
    } catch (error) {
      console.error("Error removing schedule:", error);
      toast.error('Failed to remove schedule');
    } finally {
      setIsLoading(false);
    }
  };

  // Alias for removeSchedule to maintain compatibility
  const deleteSchedule = async (id: string) => {
    await removeSchedule(id);
  };

  const addWorkEntry = async (workEntry: Omit<WorkEntry, 'id' | 'recordedAt' | 'locked'>) => {
    setIsLoading(true);
    try {
      const newWorkEntry: WorkEntry = {
        id: generateId(),
        recordedAt: new Date().toISOString(),
        locked: false,
        ...workEntry
      };

      setWorkEntries(prevEntries => [...prevEntries, newWorkEntry]);
      toast.success('Work entry added successfully');
    } catch (error) {
      console.error("Error adding work entry:", error);
      toast.error('Failed to add work entry');
    } finally {
      setIsLoading(false);
    }
  };

  const updateWorkEntry = async (id: string, updates: Partial<Omit<WorkEntry, 'id' | 'scheduleId' | 'scheduleItemId' | 'employeeId' | 'recordedAt'>>) => {
    setIsLoading(true);
    try {
      setWorkEntries(prevEntries =>
        prevEntries.map(entry => (entry.id === id ? { ...entry, ...updates } : entry))
      );
      toast.success('Work entry updated successfully');
      return true;
    } catch (error) {
      console.error("Error updating work entry:", error);
      toast.error('Failed to update work entry');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const removeWorkEntry = async (id: string) => {
    setIsLoading(true);
    try {
      setWorkEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
      toast.success('Work entry removed successfully');
    } catch (error) {
      console.error("Error removing work entry:", error);
      toast.error('Failed to remove work entry');
    } finally {
      setIsLoading(false);
    }
  };

  const isEmployeeEntryLocked = (scheduleId: string, scheduleItemId: string, employeeId: string): boolean => {
    return workEntries.some(
      entry => entry.scheduleId === scheduleId && entry.scheduleItemId === scheduleItemId && entry.employeeId === employeeId && entry.locked
    );
  };

  const lockEmployeeEntry = (scheduleId: string, scheduleItemId: string, employeeId: string) => {
    setWorkEntries(prevEntries =>
      prevEntries.map(entry =>
        entry.scheduleId === scheduleId && entry.scheduleItemId === scheduleItemId && entry.employeeId === employeeId
          ? { ...entry, locked: true }
          : entry
      )
    );
  };

  const unlockEmployeeEntry = (scheduleId: string, scheduleItemId: string, employeeId: string) => {
    setWorkEntries(prevEntries =>
      prevEntries.map(entry =>
        entry.scheduleId === scheduleId && entry.scheduleItemId === scheduleItemId && entry.employeeId === employeeId
          ? { ...entry, locked: false }
          : entry
      )
    );
    toast.success('Employee entries unlocked successfully');
  };

  const getWorkEntriesForEmployee = (scheduleId: string, employeeId: string): WorkEntry[] => {
    return workEntries.filter(entry => 
      entry.scheduleId === scheduleId && entry.employeeId === employeeId
    );
  };

  const getScheduleById = (id: string): Schedule | undefined => {
    return schedules.find(schedule => schedule.id === id);
  };

  const isEmployeeAssignedForDate = (employeeId: string, date: string): boolean => {
    const schedulesForDate = schedules.filter(schedule => schedule.date === date);
    
    return schedulesForDate.some(schedule => 
      schedule.items.some(item => 
        item.employeeIds.includes(employeeId)
      )
    );
  };

  const getLockedEmployeeEntries = (): WorkEntry[] => {
    return workEntries.filter(entry => entry.locked);
  };

  const getAllSchedulesByEmployeeId = (employeeId: string) => {
    const result: { schedule: Schedule; items: ScheduleItem[] }[] = [];
    
    schedules.forEach(schedule => {
      const assignedItems = schedule.items.filter(item => 
        item.employeeIds.includes(employeeId)
      );
      
      if (assignedItems.length > 0) {
        result.push({
          schedule,
          items: assignedItems
        });
      }
    });
    
    return result;
  };

  return (
    <ScheduleContext.Provider value={{
      schedules,
      workEntries,
      addSchedule,
      updateSchedule,
      removeSchedule,
      addWorkEntry,
      updateWorkEntry,
      removeWorkEntry,
      isEmployeeEntryLocked,
      lockEmployeeEntry,
      unlockEmployeeEntry,
      getWorkEntriesForEmployee,
      getScheduleById,
      isEmployeeAssignedForDate,
      getLockedEmployeeEntries,
      getAllSchedulesByEmployeeId,
      deleteSchedule,
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
