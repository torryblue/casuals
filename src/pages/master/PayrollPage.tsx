
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Search, Download, ArrowLeft } from "lucide-react";
import { useEmployees } from "@/contexts/EmployeeContext";
import { useSchedules } from "@/contexts/ScheduleContext";
import AppLayout from "@/components/AppLayout";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface PayRate {
  task: string;
  rate: number;
  target?: number;
}

interface EmployeePayrollSummary {
  employeeId: string;
  name: string;
  totalEarnings: number;
  taskBreakdown: {
    [taskName: string]: {
      quantity: number;
      earnings: number;
    };
  };
}

const DEFAULT_PAY_RATES: PayRate[] = [
  { task: "Stripping", rate: 0.15, target: 0 },
  { task: "Bailing Lamina", rate: 0.20, target: 0 },
  { task: "Machine", rate: 0.25, target: 0 },
  { task: "Bailing Sticks", rate: 0.18, target: 0 },
  { task: "Grading", rate: 0.20, target: 0 },
  { task: "Ticket Based Work", rate: 5.00 }
];

const PayrollPage = () => {
  const navigate = useNavigate();
  const { employees } = useEmployees();
  const { schedules, workEntries } = useSchedules();
  
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [payRates, setPayRates] = useState<PayRate[]>([]);
  const [payrollData, setPayrollData] = useState<EmployeePayrollSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Load pay rates from localStorage or use defaults
    const savedRates = localStorage.getItem("payRates");
    if (savedRates) {
      setPayRates(JSON.parse(savedRates));
    } else {
      setPayRates(DEFAULT_PAY_RATES);
    }
    
    // Set default date range to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split("T")[0]);
    setEndDate(lastDay.toISOString().split("T")[0]);
  }, []);
  
  // Save pay rates when they change
  useEffect(() => {
    if (payRates.length > 0) {
      localStorage.setItem("payRates", JSON.stringify(payRates));
    }
  }, [payRates]);
  
  const handleRateChange = (index: number, value: number) => {
    const newRates = [...payRates];
    newRates[index].rate = value;
    setPayRates(newRates);
  };
  
  const calculatePayroll = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select start and end dates");
      return;
    }
    
    setIsLoading(true);
    try {
      // Fetch all work entries within the date range
      const { data: workEntryData, error } = await supabase
        .from('work_entries')
        .select('*')
        .gte('recordedat', `${startDate}T00:00:00`)
        .lte('recordedat', `${endDate}T23:59:59`);
      
      if (error) {
        throw error;
      }
      
      if (!workEntryData || workEntryData.length === 0) {
        toast.info("No work entries found for the selected date range");
        setPayrollData([]);
        setIsLoading(false);
        return;
      }
      
      // Group work entries by employee
      const employeeWorkEntries: Record<string, any[]> = {};
      
      for (const entry of workEntryData) {
        if (!employeeWorkEntries[entry.employeeid]) {
          employeeWorkEntries[entry.employeeid] = [];
        }
        employeeWorkEntries[entry.employeeid].push(entry);
      }
      
      // Calculate payroll for each employee
      const payrollSummary: EmployeePayrollSummary[] = [];
      
      for (const employeeId in employeeWorkEntries) {
        const employee = employees.find(e => e.id === employeeId);
        if (!employee) continue;
        
        const employeeName = `${employee.name || ''} ${employee.surname || ''}`.trim();
        let totalEarnings = 0;
        const taskBreakdown: Record<string, { quantity: number; earnings: number }> = {};
        
        // Process each work entry for the employee
        for (const entry of employeeWorkEntries[employeeId]) {
          // Find the corresponding schedule item to get task type and target
          const schedule = schedules.find(s => s.id === entry.scheduleid);
          const scheduleItem = schedule?.items.find(item => item.id === entry.scheduleitemid);
          
          if (!scheduleItem) continue;
          
          const task = scheduleItem.task;
          const payRateObj = payRates.find(rate => rate.task === task) || 
                             payRates.find(rate => task.includes(rate.task));
          
          if (!payRateObj) continue;
          
          const payRate = payRateObj.rate;
          
          // Initialize task in breakdown if not exists
          if (!taskBreakdown[task]) {
            taskBreakdown[task] = { quantity: 0, earnings: 0 };
          }
          
          let earnings = 0;
          
          // Calculate earnings based on task type
          if (task === "Stripping") {
            const targetMass = scheduleItem.targetMass || 0;
            
            // Handle scale entries if available
            if (entry.scaleentries && Array.isArray(entry.scaleentries)) {
              const totalInValue = entry.scaleentries.reduce((sum: number, scale: any) => 
                sum + (scale.inValue || 0), 0);
              
              // If below target, calculate proportional pay
              if (targetMass > 0 && totalInValue < targetMass) {
                earnings = (totalInValue / targetMass) * payRate;
              } else {
                earnings = payRate;
              }
              
              taskBreakdown[task].quantity += totalInValue;
            }
          } else if (task === "Bailing Lamina" || task === "Bailing Sticks") {
            // Pay based on output mass
            const outputMass = entry.outputmass || 0;
            earnings = outputMass * payRate;
            taskBreakdown[task].quantity += outputMass;
          } else if (task === "Machine") {
            // Divide output mass by number of employees and multiply by rate
            const outputMass = entry.outputmass || 0;
            const numEmployees = scheduleItem.employeeIds?.length || 1;
            earnings = (outputMass / numEmployees) * payRate;
            taskBreakdown[task].quantity += outputMass / numEmployees;
          } else if (task.includes("Ticket")) {
            // Fixed rate for ticket-based work
            earnings = payRate;
            taskBreakdown[task].quantity += 1;
          } else {
            // Default calculation for other tasks
            const quantity = entry.quantity || 0;
            earnings = quantity * payRate;
            taskBreakdown[task].quantity += quantity;
          }
          
          // Update task earnings
          taskBreakdown[task].earnings += earnings;
          totalEarnings += earnings;
        }
        
        payrollSummary.push({
          employeeId,
          name: employeeName,
          totalEarnings,
          taskBreakdown
        });
      }
      
      // Sort by total earnings (highest first)
      payrollSummary.sort((a, b) => b.totalEarnings - a.totalEarnings);
      
      setPayrollData(payrollSummary);
    } catch (error) {
      console.error("Error calculating payroll:", error);
      toast.error("Failed to calculate payroll");
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatCurrency = (amount: number) => {
    return amount.toFixed(2);
  };
  
  const exportToCSV = () => {
    if (payrollData.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    // Create CSV header
    let csv = "Employee ID,Employee Name,Total Earnings\n";
    
    // Add data rows
    payrollData.forEach(employee => {
      csv += `${employee.employeeId},${employee.name},${formatCurrency(employee.totalEarnings)}\n`;
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `payroll-${startDate}-to-${endDate}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const filteredPayrollData = payrollData.filter(employee => 
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
          <h1 className="text-2xl font-medium text-gray-800">Payroll Management</h1>
        </div>
        
        <div className="glass-card p-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex flex-col md:flex-row gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="mt-auto">
                  <Button
                    onClick={calculatePayroll}
                    disabled={isLoading}
                    className="bg-torryblue-accent text-white hover:bg-torryblue-accent/90"
                  >
                    {isLoading ? "Calculating..." : "Calculate Payroll"}
                  </Button>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-4 md:mt-auto">
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  {showSettings ? "Hide Rates" : "Configure Pay Rates"}
                </Button>
                
                {payrollData.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={exportToCSV}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                )}
              </div>
            </div>
            
            {showSettings && (
              <div className="mt-4 p-4 border rounded-md">
                <h2 className="text-lg font-medium mb-4">Pay Rate Configuration</h2>
                <div className="space-y-4">
                  {payRates.map((rate, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {rate.task}
                        </label>
                      </div>
                      <div>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={rate.rate}
                          onChange={(e) => handleRateChange(index, parseFloat(e.target.value) || 0)}
                          className="w-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {payrollData.length > 0 && (
              <div className="mt-6">
                <div className="flex mb-4">
                  <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>Payroll period: {startDate} to {endDate}</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        {payRates.map((rate, index) => (
                          <TableHead key={index}>{rate.task}</TableHead>
                        ))}
                        <TableHead className="text-right">Total Earnings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayrollData.map((employee) => (
                        <TableRow key={employee.employeeId}>
                          <TableCell className="font-medium">
                            <button
                              onClick={() => navigate(`/master/employees/${employee.employeeId}`)}
                              className="text-torryblue-accent hover:underline"
                            >
                              {employee.name} ({employee.employeeId})
                            </button>
                          </TableCell>
                          
                          {payRates.map((rate, index) => {
                            const taskData = employee.taskBreakdown[rate.task];
                            return (
                              <TableCell key={index}>
                                {taskData ? (
                                  <>
                                    <div>{formatCurrency(taskData.earnings)}</div>
                                    <div className="text-xs text-gray-500">
                                      ({taskData.quantity.toFixed(1)} {rate.task === "Ticket Based Work" ? "tickets" : "kg"})
                                    </div>
                                  </>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                            );
                          })}
                          
                          <TableCell className="text-right font-bold">
                            {formatCurrency(employee.totalEarnings)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            
            {payrollData.length === 0 && !isLoading && (
              <div className="text-center p-8 border rounded-md mt-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No payroll data available</h3>
                <p className="mt-1 text-gray-500">
                  Select a date range and click "Calculate Payroll" to generate payroll data.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default PayrollPage;
