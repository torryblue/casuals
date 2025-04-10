import React, { useState } from 'react';
import { Plus, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OutputEntry } from '@/contexts/ScheduleContext';

interface MultiOutputEntryFormProps {
  isLocked: boolean;
  onChange: (entries: OutputEntry[]) => void;
  initialEntries?: OutputEntry[];
}

const MultiOutputEntryForm: React.FC<MultiOutputEntryFormProps> = ({
  isLocked,
  onChange,
  initialEntries = []
}) => {
  const [entries, setEntries] = useState<OutputEntry[]>(initialEntries);

  const addEntry = (type: 'output' | 'sticks' | 'f8' | 'dust') => {
    const newEntry: OutputEntry = {
      id: Date.now().toString(),
      type,
      mass: 0
    };
    const updatedEntries = [...entries, newEntry];
    setEntries(updatedEntries);
    onChange(updatedEntries);
  };

  const removeEntry = (id: string) => {
    const updatedEntries = entries.filter(entry => entry.id !== id);
    setEntries(updatedEntries);
    onChange(updatedEntries);
  };

  const updateEntryMass = (id: string, mass: number) => {
    const updatedEntries = entries.map(entry => 
      entry.id === id ? { ...entry, mass } : entry
    );
    setEntries(updatedEntries);
    onChange(updatedEntries);
  };

  const getEntriesByType = (type: 'output' | 'sticks' | 'f8' | 'dust') => {
    return entries.filter(entry => entry.type === type);
  };

  const getTotalMassByType = (type: 'output' | 'sticks' | 'f8' | 'dust'): number => {
    return getEntriesByType(type).reduce((sum, entry) => sum + (entry.mass || 0), 0);
  };

  const renderEntrySet = (type: 'output' | 'sticks' | 'f8' | 'dust', label: string) => {
    const typeEntries = getEntriesByType(type);
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{label}</Label>
          
          {!isLocked && (
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => addEntry(type)}
              className="h-8 px-2 text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add {label}
            </Button>
          )}
        </div>
        
        {typeEntries.length > 0 ? (
          <div className="space-y-2">
            {typeEntries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-2">
                <div className="flex-grow space-y-1">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={entry.mass || ''}
                    onChange={(e) => updateEntryMass(entry.id, parseFloat(e.target.value) || 0)}
                    disabled={isLocked}
                    className="h-9"
                  />
                </div>
                {!isLocked && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEntry(entry.id)}
                    className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            {typeEntries.length > 1 && (
              <div className="p-2 bg-gray-50 rounded text-sm">
                Total {label}: <span className="font-medium">{getTotalMassByType(type).toFixed(2)} kg</span>
              </div>
            )}
          </div>
        ) : (
          <div className="py-2 px-3 bg-gray-50 text-gray-500 rounded text-sm">
            No {label.toLowerCase()} entries added yet
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderEntrySet('output', 'Output Mass (kg)')}
      {renderEntrySet('sticks', 'Sticks Mass (kg)')}
      {renderEntrySet('f8', 'F8 Mass (kg)')}
      {renderEntrySet('dust', 'Dust Mass (kg)')}
    </div>
  );
};

export default MultiOutputEntryForm;
