import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface WorkEntry {
  id: string;
  scheduleid: string;
  scheduleitemid: string;
  employeeid: string;
  quantity: number;
  remarks?: string;
  recordedat: string;
  scaleentries?: any;
  totalsticks?: number;
  fm?: number;
  locked?: boolean;
  outputmass?: number;
  sticksmass?: number;
  f8mass?: number;
  dustmass?: number;
  cartons?: any;
  duty_name?: string;
  mass_inputs?: any;
  output_entries?: any;
  entry_type?: string;
  saved_progress?: any;
  employee_name?: string;
  employee_surname?: string;
}

const MasterReports = () => {
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  // Derived states for filters
  const [allEmployees, setAllEmployees] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    const fetchWorkEntries = async () => {
      try {
        setLoading(true);
        
        // Join with employees table to get employee names
        const { data, error } = await supabase
          .from('work_entries')
          .select(`
            *,
            employees:employeeid (
              name,
              surname
            )
          `);
        
        if (error) {
          throw error;
        }
        
        if (data) {
          // Format data to include employee names
          const formattedData = data.map(entry => ({
            ...entry,
            employee_name: entry.employees?.name || 'Unknown',
            employee_surname: entry.employees?.surname || '',
          }));
          
          setWorkEntries(formattedData);
          
          // Extract unique employees for the filter
          const uniqueEmployees = Array.from(
            new Set(formattedData.map(entry => entry.employeeid))
          ).map(id => {
            const entry = formattedData.find(e => e.employeeid === id);
            return {
              id: id as string,
              name: `${entry?.employee_name || ''} ${entry?.employee_surname || ''}`.trim()
            };
          });
          setAllEmployees(uniqueEmployees);
        }
      } catch (err) {
        console.error('Error fetching work entries:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkEntries();
  }, []);

  // Helper function to format cartons data
  const formatCartonsData = (cartons: any) => {
    if (!cartons) return '-';
    
    try {
      // If cartons is already an object, use it directly
      const cartonsObj = typeof cartons === 'string' ? JSON.parse(cartons) : cartons;
      
      // Check if it's an array or object and format accordingly
      if (Array.isArray(cartonsObj)) {
        return cartonsObj.map((carton, index) => (
          <div key={index} className="mb-1 last:mb-0">
            {Object.entries(carton).map(([key, value]) => (
              <div key={key} className="text-xs">
                <span className="font-medium">{key}:</span> {String(value)}
              </div>
            ))}
          </div>
        ));
      } else if (typeof cartonsObj === 'object') {
        return (
          <div>
            {Object.entries(cartonsObj).map(([key, value]) => (
              <div key={key} className="text-xs">
                <span className="font-medium">{key}:</span> {String(value)}
              </div>
            ))}
          </div>
        );
      }
      
      // Fallback for other formats
      return JSON.stringify(cartonsObj);
    } catch (e) {
      console.error('Error parsing cartons data:', e);
      return 'Invalid format';
    }
  };

  // Filter work entries based on selected employee and date range
  const filteredWorkEntries = workEntries.filter(entry => {
    const entryDate = new Date(entry.recordedat);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999); // End of the day
    
    const matchesEmployee = selectedEmployee === "" || entry.employeeid === selectedEmployee;
    const matchesDate = entryDate >= startDate && entryDate <= endDate;
    
    return matchesEmployee && matchesDate;
  });
  
  // Group work entries by employee
  const entriesByEmployee = filteredWorkEntries.reduce<Record<string, typeof filteredWorkEntries>>(
    (acc, entry) => {
      if (!acc[entry.employeeid]) {
        acc[entry.employeeid] = [];
      }
      acc[entry.employeeid].push(entry);
      return acc;
    }, 
    {}
  );

  if (loading) {
    return <div className="flex justify-center items-center min-h-[50vh] text-lg">Loading work entries...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-[50vh] text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => window.history.back()}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-medium text-gray-800">Work Reports</h1>
      </div>
      
      {/* Filters section */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
        <h2 className="text-lg font-medium mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Employee filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">All Employees</option>
              {allEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Date range filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>
      </div>
      
      {filteredWorkEntries.length === 0 ? (
        <p className="text-center text-gray-500 my-10">No work entries found matching the selected filters.</p>
      ) : (
        <div className="rounded-md border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">ID</TableHead>
                  <TableHead className="font-semibold">Employee</TableHead>
                  <TableHead className="font-semibold">Schedule ID</TableHead>
                  <TableHead className="font-semibold">Schedule Item ID</TableHead>
                  <TableHead className="font-semibold">Duty</TableHead>
                  <TableHead className="font-semibold">Quantity</TableHead>
                  <TableHead className="font-semibold">Total Sticks</TableHead>
                  <TableHead className="font-semibold">FM</TableHead>
                  <TableHead className="font-semibold">Output Mass</TableHead>
                  <TableHead className="font-semibold">Sticks Mass</TableHead>
                  <TableHead className="font-semibold">F8 Mass</TableHead>
                  <TableHead className="font-semibold">Dust Mass</TableHead>
                  <TableHead className="font-semibold">Cartons</TableHead>
                  <TableHead className="font-semibold">Entry Type</TableHead>
                  <TableHead className="font-semibold">Recorded At</TableHead>
                  <TableHead className="font-semibold">Locked</TableHead>
                  <TableHead className="font-semibold">Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkEntries.map((entry, index) => (
                  <TableRow 
                    key={entry.id} 
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <TableCell className="font-medium">{entry.id}</TableCell>
                    <TableCell>{entry.employee_name} {entry.employee_surname}</TableCell>
                    <TableCell>{entry.scheduleid}</TableCell>
                    <TableCell>{entry.scheduleitemid}</TableCell>
                    <TableCell>{entry.duty_name}</TableCell>
                    <TableCell>{entry.quantity}</TableCell>
                    <TableCell>{entry.totalsticks}</TableCell>
                    <TableCell>{entry.fm}</TableCell>
                    <TableCell>{entry.outputmass}</TableCell>
                    <TableCell>{entry.sticksmass}</TableCell>
                    <TableCell>{entry.f8mass}</TableCell>
                    <TableCell>{entry.dustmass}</TableCell>
                    <TableCell className="max-w-[200px] whitespace-normal">
                      {formatCartonsData(entry.cartons)}
                    </TableCell>
                    <TableCell>{entry.entry_type}</TableCell>
                    <TableCell>{new Date(entry.recordedat).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${entry.locked ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                        {entry.locked ? 'Yes' : 'No'}
                      </span>
                    </TableCell>
                    <TableCell>{entry.remarks || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterReports;
