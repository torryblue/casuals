import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from "sonner";
import { Employee } from './EmployeeContext';

export type ScheduleItem = {
  id: string;
  task: string;
  dutyName: string;
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
  }[];
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
  isLoading: boolean;
};

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateId = (prefix: string) => {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
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

  const addSchedule = (date: string, items: Omit<ScheduleItem, 'id'>[]) => {
    setIsLoading(true);
    
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

  const getAllSchedulesByEmployeeId = (employeeId: string) => {
    return schedules.filter(schedule => 
      schedule.items.some(item => 
        item.employeeIds.includes(employeeId)
      )
    );
  };

  const updateSchedule = (scheduleId: string, updatedItems: ScheduleItem[]) => {
    setIsLoading(true);
    
    setTimeout(() => {
      setSchedules(prev => 
        prev.map(schedule => 
          schedule.id === scheduleId 
            ? { ...schedule, items: updatedItems } 
            : schedule
        )
      );
      
      setIsLoading(false);
      toast.success("Schedule updated successfully");
    }, 1000);
  };

  const deleteSchedule = (scheduleId: string) => {
    setIsLoading(true);
    
    setTimeout(() => {
      setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId));
      setWorkEntries(prev => prev.filter(entry => entry.scheduleId !== scheduleId));
      
      setIsLoading(false);
      toast.success("Schedule deleted successfully");
    }, 1000);
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
