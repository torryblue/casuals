
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from "sonner";
import { Employee } from './EmployeeContext';

export type ScheduleItem = {
  id: string;
  task: string;
  workers: number;
  employeeIds: string[];
  // Additional fields for Stripping task
  targetMass?: number;
  numberOfScales?: number;
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
  // Fields for Stripping task
  scaleEntries?: {
    scaleNumber: number;
    inValue: number;
    outValue?: number;
  }[];
};

type ScheduleContextType = {
  schedules: Schedule[];
  workEntries: WorkEntry[];
  addSchedule: (date: string, items: Omit<ScheduleItem, 'id'>[]) => void;
  getScheduleById: (id: string) => Schedule | undefined;
  addWorkEntry: (entry: Omit<WorkEntry, 'id' | 'recordedAt'>) => void;
  getWorkEntriesForEmployee: (scheduleId: string, employeeId: string) => WorkEntry[];
  isLoading: boolean;
};

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate a unique ID with prefix
  const generateId = (prefix: string) => {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  };

  const addSchedule = (date: string, items: Omit<ScheduleItem, 'id'>[]) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const scheduleItems = items.map(item => ({
        ...item,
        id: generateId('ITEM')
      }));
      
      const newSchedule = {
        id: generateId('SCH'),
        date,
        items: scheduleItems,
        createdAt: new Date()
      };
      
      setSchedules(prev => [...prev, newSchedule]);
      setIsLoading(false);
      toast.success(`Schedule for ${date} created successfully`);
    }, 1000);
  };

  const getScheduleById = (id: string) => {
    return schedules.find(schedule => schedule.id === id);
  };

  const addWorkEntry = (entry: Omit<WorkEntry, 'id' | 'recordedAt'>) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const newEntry = {
        ...entry,
        id: generateId('WORK'),
        recordedAt: new Date()
      };
      
      setWorkEntries(prev => [...prev, newEntry]);
      setIsLoading(false);
      toast.success(`Work entry recorded successfully`);
    }, 1000);
  };

  const getWorkEntriesForEmployee = (scheduleId: string, employeeId: string) => {
    return workEntries.filter(
      entry => entry.scheduleId === scheduleId && entry.employeeId === employeeId
    );
  };

  return (
    <ScheduleContext.Provider value={{
      schedules,
      workEntries,
      addSchedule,
      getScheduleById,
      addWorkEntry,
      getWorkEntriesForEmployee,
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
