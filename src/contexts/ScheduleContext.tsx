
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "sonner";
import { supabase } from '@/lib/supabase';
import { Employee } from '@/types/employee';

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

  useEffect(() => {
    // Fetch schedules and work entries from Supabase when component mounts
    fetchSchedules();
    fetchWorkEntries();
  }, []);

  const fetchSchedules = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Convert date strings back to Date objects
        const formattedSchedules = data.map(schedule => ({
          ...schedule,
          createdAt: new Date(schedule.createdAt)
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
      const { data, error } = await supabase
        .from('work_entries')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Convert date strings back to Date objects
        const formattedEntries = data.map(entry => ({
          ...entry,
          recordedAt: new Date(entry.recordedAt)
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

  const addSchedule = async (date: string, items: Omit<ScheduleItem, 'id'>[]) => {
    setIsLoading(true);
    
    try {
      // Map items and add ID
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
      
      console.log('Creating schedule with data:', JSON.stringify(newSchedule, null, 2));
      
      // Store the schedule in Supabase
      const { error } = await supabase
        .from('schedules')
        .insert([{
          ...newSchedule,
          createdAt: newSchedule.createdAt.toISOString() // Convert Date to string for Postgres
        }]);
      
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
      const newEntry = {
        ...entry,
        id: generateId('WORK'),
        recordedAt: new Date()
      };
      
      // Store the work entry in Supabase
      const { error } = await supabase
        .from('work_entries')
        .insert([{
          ...newEntry,
          recordedAt: newEntry.recordedAt.toISOString() // Convert Date to string for Postgres
        }]);
      
      if (error) {
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
      
      // Update the schedule in Supabase
      const { error } = await supabase
        .from('schedules')
        .update({
          ...updatedSchedule,
          createdAt: updatedSchedule.createdAt.toISOString() // Convert Date to string for Postgres
        })
        .eq('id', scheduleId);
      
      if (error) {
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
      const { error: entriesError } = await supabase
        .from('work_entries')
        .delete()
        .eq('scheduleId', scheduleId);
      
      if (entriesError) {
        throw entriesError;
      }
      
      // Then delete the schedule
      const { error: scheduleError } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId);
      
      if (scheduleError) {
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
