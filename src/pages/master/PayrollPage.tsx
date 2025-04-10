
import React, { useState, useEffect } from "react";
import { ArrowLeft, Download, Calendar, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { useEmployees } from "@/contexts/EmployeeContext";
import { Input } from "@/components/ui/input";
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

interface PayRate {
  task: string;
  rate: number;
  target?: number;
}

interface EmployeePayroll {
  id: string;
  name: string;
  surname: string;
  strippingPay: number;
  ticketBasedPay: number;
  bailingSticksPay: number;
  bailingLaminaPay: number;
  machinePay: number;
  totalPay: number;
  details: {
    stripping?: {
      totalInscaleMass: number;
      targetMass: number;
      rate: number;
    };
    ticketBased?: {
      totalEntries: number;
      rate: number;
    };
    bailingSticks?: {
      totalOutputMass: number;
      rate: number;
    };
    bailingLamina?: {
      totalOutputMass: number;
      rate: number;
    };
    machine?: {
      totalOutputMass: number;
      employeeCount: number;
      rate: number;
    };
  };
}

const DEFAULT_PAY_RATES: PayRate[] = [
  { task: "Stripping", rate: 0.1, target: 1000 },
  { task: "Ticket Based Work", rate: 5 },
  { task: "Bailing Sticks", rate: 0.2 },
  { task: "Bailing Lamina", rate: 0.15 },
  { task: "Machine", rate: 0.12 },
];

const PayrollPage = () => {
  const navigate = useNavigate();
  const { employees } = useEmployees();
  
  const [payRates, setPayRates] = useState<PayRate[]>(DEFAULT_PAY_RATES);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [employeePayrolls, setEmployeePayrolls] = useState<EmployeePayroll[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingRates, setEditingRates] = useState(false);

  useEffect(() => {
    // Set default dates (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split("T")[0]);
    setEndDate(lastDay.toISOString().split("T")[0]);
    
    // Try to load saved pay rates from localStorage
    const savedRates = localStorage.getItem("payRates");
    if (savedRates) {
      try {
        setPayRates(JSON.parse(savedRates));
      } catch (e) {
        console.error("Error loading saved pay rates:", e);
      }
    }
  }, []);

  const savePayRates = () => {
    localStorage.setItem("payRates", JSON.stringify(payRates));
    setEditingRates(false);
    toast.success("Pay rates saved successfully");
  };

  const handlePayRateChange = (index: number, field: "rate" | "target", value: string) => {
    const newRates = [...payRates];
    if (field === "rate") {
      newRates[index].rate = parseFloat(value) || 0;
    } else if (field === "target" && newRates[index].target !== undefined) {
      newRates[index].target = parseFloat(value) || 0;
    }
    setPayRates(newRates);
  };

  const calculatePayroll = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select a date range");
      return;
    }

    setIsLoading(true);

    try {
      // Get all work entries within the date range
      const { data: workEntries, error } = await supabase
        .from("work_entries")
        .select(`
          id,
          employeeid,
          quantity,
          duty_name,
          outputmass,
          scaleentries,
          recordedat,
          scheduleitemid,
          scheduleid
        `)
        .gte("recordedat", `${startDate}T00:00:00`)
        .lte("recordedat", `${endDate}T23:59:59`);

      if (error) {
        throw error;
      }

      // Get schedule items to determine how many employees were assigned to each machine task
      const { data: scheduleItems, error: scheduleItemsError } = await supabase
        .from("schedule_items")
        .select("id, task, employeeIds, targetMass");

      if (scheduleItemsError) {
        throw scheduleItemsError;
      }

      // Map for quick lookup of schedule items
      const scheduleItemsMap: Record<string, any> = {};
      if (scheduleItems) {
        scheduleItems.forEach((item: any) => {
          scheduleItemsMap[item.id] = item;
        });
      }

      // Group work entries by employee
      const entriesByEmployee: Record<string, any[]> = {};
      
      if (workEntries) {
        workEntries.forEach(entry => {
          if (!entriesByEmployee[entry.employeeid]) {
            entriesByEmployee[entry.employeeid] = [];
          }
          entriesByEmployee[entry.employeeid].push(entry);
        });
      }

      // Calculate payroll for each employee
      const payrollResults: EmployeePayroll[] = [];

      for (const employeeId in entriesByEmployee) {
        const employee = employees.find(e => e.id === employeeId);
        if (!employee) continue;

        const entries = entriesByEmployee[employeeId];
        
        // Initialize pay categories
        let strippingPay = 0;
        let ticketBasedPay = 0;
        let bailingSticksPay = 0;
        let bailingLaminaPay = 0;
        let machinePay = 0;
        
        // Initialize details for breakdown
        const details: EmployeePayroll['details'] = {};

        // Group entries by task type
        const strippingEntries = entries.filter(e => e.duty_name === "Stripping");
        const ticketBasedEntries = entries.filter(e => e.duty_name?.toLowerCase().includes("ticket"));
        const bailingSticksEntries = entries.filter(e => e.duty_name === "Bailing Sticks");
        const bailingLaminaEntries = entries.filter(e => e.duty_name === "Bailing Lamina");
        const machineEntries = entries.filter(e => e.duty_name === "Machine");

        if (strippingEntries.length > 0) {
          let totalInscaleMass = 0;
          
          // Calculate total inscale mass from scale entries
          strippingEntries.forEach(entry => {
            if (entry.scaleentries) {
              let scaleData;
              try {
                scaleData = typeof entry.scaleentries === 'string' 
                  ? JSON.parse(entry.scaleentries) 
                  : entry.scaleentries;
                
                if (Array.isArray(scaleData)) {
                  scaleData.forEach(scaleEntry => {
                    if (scaleEntry.mass) {
                      totalInscaleMass += parseFloat(scaleEntry.mass) || 0;
                    }
                  });
                } else if (scaleData && typeof scaleData === 'object') {
                  Object.values(scaleData).forEach((value: any) => {
                    if (value && value.mass) {
                      totalInscaleMass += parseFloat(value.mass) || 0;
                    }
                  });
                }
              } catch (e) {
                console.error("Error parsing scale entries:", e);
              }
            }
          });

          // Find the stripping rate and target
          const strippingRate = payRates.find(r => r.task === "Stripping");
          if (strippingRate) {
            // If target mass isn't met, calculate pay proportionally
            const targetMass = strippingRate.target || 0;
            if (totalInscaleMass >= targetMass) {
              strippingPay = strippingRate.rate * targetMass;
            } else {
              strippingPay = (totalInscaleMass / targetMass) * strippingRate.rate * targetMass;
            }
            
            // Store details for breakdown
            details.stripping = {
              totalInscaleMass,
              targetMass,
              rate: strippingRate.rate
            };
          }
        }

        if (ticketBasedEntries.length > 0) {
          // Ticket based work is paid at a constant rate per ticket
          const ticketRate = payRates.find(r => r.task === "Ticket Based Work");
          if (ticketRate) {
            ticketBasedPay = ticketBasedEntries.length * ticketRate.rate;
            
            // Store details for breakdown
            details.ticketBased = {
              totalEntries: ticketBasedEntries.length,
              rate: ticketRate.rate
            };
          }
        }

        if (bailingSticksEntries.length > 0) {
          let totalOutputMass = 0;
          
          // Calculate total output mass
          bailingSticksEntries.forEach(entry => {
            if (entry.outputmass) {
              totalOutputMass += parseFloat(entry.outputmass) || 0;
            }
          });
          
          // Find the bailing sticks rate
          const bailingSticksRate = payRates.find(r => r.task === "Bailing Sticks");
          if (bailingSticksRate) {
            bailingSticksPay = totalOutputMass * bailingSticksRate.rate;
            
            // Store details for breakdown
            details.bailingSticks = {
              totalOutputMass,
              rate: bailingSticksRate.rate
            };
          }
        }

        if (bailingLaminaEntries.length > 0) {
          let totalOutputMass = 0;
          
          // Calculate total output mass
          bailingLaminaEntries.forEach(entry => {
            if (entry.outputmass) {
              totalOutputMass += parseFloat(entry.outputmass) || 0;
            }
          });
          
          // Find the bailing lamina rate
          const bailingLaminaRate = payRates.find(r => r.task === "Bailing Lamina");
          if (bailingLaminaRate) {
            bailingLaminaPay = totalOutputMass * bailingLaminaRate.rate;
            
            // Store details for breakdown
            details.bailingLamina = {
              totalOutputMass,
              rate: bailingLaminaRate.rate
            };
          }
        }

        if (machineEntries.length > 0) {
          let totalOutputMass = 0;
          const processedScheduleItems = new Set();
          
          // Calculate total output mass
          machineEntries.forEach(entry => {
            if (entry.outputmass) {
              totalOutputMass += parseFloat(entry.outputmass) || 0;
            }
            
            // Track unique schedule items
            if (entry.scheduleitemid) {
              processedScheduleItems.add(entry.scheduleitemid);
            }
          });
          
          // For each unique schedule item, divide the output by number of employees
          let adjustedOutputMass = 0;
          let totalEmployeeCount = 0;
          
          processedScheduleItems.forEach(itemId => {
            const item = scheduleItemsMap[itemId as string];
            if (item && item.task === "Machine") {
              const employeeCount = Array.isArray(item.employeeIds) ? item.employeeIds.length : 0;
              if (employeeCount > 0) {
                // Find matching entries for this schedule item
                const itemEntries = machineEntries.filter(e => e.scheduleitemid === itemId);
                const itemOutputMass = itemEntries.reduce((sum, entry) => {
                  return sum + (parseFloat(entry.outputmass) || 0);
                }, 0);
                
                // Divide output mass by employee count
                adjustedOutputMass += itemOutputMass / employeeCount;
                totalEmployeeCount += employeeCount;
              }
            }
          });
          
          // If we couldn't get employee counts per schedule item, use a fallback calculation
          if (adjustedOutputMass === 0 && machineEntries.length > 0) {
            adjustedOutputMass = totalOutputMass;
            totalEmployeeCount = 1; // Assume one employee as fallback
          }
          
          // Find the machine rate
          const machineRate = payRates.find(r => r.task === "Machine");
          if (machineRate) {
            machinePay = adjustedOutputMass * machineRate.rate;
            
            // Store details for breakdown
            details.machine = {
              totalOutputMass: adjustedOutputMass,
              employeeCount: totalEmployeeCount,
              rate: machineRate.rate
            };
          }
        }

        // Calculate total pay
        const totalPay = strippingPay + ticketBasedPay + bailingSticksPay + bailingLaminaPay + machinePay;

        payrollResults.push({
          id: employeeId,
          name: employee.name || '',
          surname: employee.surname || '',
          strippingPay,
          ticketBasedPay,
          bailingSticksPay,
          bailingLaminaPay,
          machinePay,
          totalPay,
          details
        });
      }

      setEmployeePayrolls(payrollResults);
      
      if (payrollResults.length === 0) {
        toast.info("No payroll data found for the selected date range");
      }
    } catch (error) {
      console.error("Error calculating payroll:", error);
      toast.error("Error calculating payroll");
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCsv = () => {
    if (employeePayrolls.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Create CSV content
    const headers = [
      "ID", 
      "Name and Surname", 
      "Total pay Stripping", 
      "Total pay Ticket based work", 
      "Total pay Bailing sticks", 
      "Total pay Bailing lamina", 
      "Total pay Machine", 
      "Total Pay"
    ];

    const rows = employeePayrolls.map(employee => [
      employee.id,
      `${employee.name} ${employee.surname}`,
      employee.strippingPay.toFixed(2),
      employee.ticketBasedPay.toFixed(2),
      employee.bailingSticksPay.toFixed(2),
      employee.bailingLaminaPay.toFixed(2),
      employee.machinePay.toFixed(2),
      employee.totalPay.toFixed(2)
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payroll-${startDate}-to-${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPayrolls = employeePayrolls.filter(employee => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      employee.id.toLowerCase().includes(searchTermLower) ||
      employee.name.toLowerCase().includes(searchTermLower) ||
      employee.surname.toLowerCase().includes(searchTermLower)
    );
  });

  const handleViewEmployeeDetails = (employeeId: string) => {
    navigate(`/master/employees/view/${employeeId}`);
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <h1 className="text-2xl font-medium text-gray-800">Payroll Management</h1>
        </div>

        <div className="mb-8 p-6 bg-white rounded-lg shadow border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Pay Rates</h2>
            <div className="space-x-2">
              {editingRates ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingRates(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={savePayRates}
                  >
                    Save Rates
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => setEditingRates(true)}
                >
                  Edit Rates
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Rate ($/unit)</TableHead>
                  <TableHead>Target (if applicable)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payRates.map((rate, index) => (
                  <TableRow key={rate.task}>
                    <TableCell>{rate.task}</TableCell>
                    <TableCell>
                      {editingRates ? (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={rate.rate}
                          onChange={(e) => handlePayRateChange(index, "rate", e.target.value)}
                          className="w-24"
                        />
                      ) : (
                        `$${rate.rate.toFixed(2)}`
                      )}
                    </TableCell>
                    <TableCell>
                      {rate.task === "Stripping" ? (
                        editingRates ? (
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            value={rate.target}
                            onChange={(e) => handlePayRateChange(index, "target", e.target.value)}
                            className="w-24"
                          />
                        ) : (
                          `${rate.target} kg`
                        )
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="mb-8 p-6 bg-white rounded-lg shadow border">
          <h2 className="text-lg font-medium mb-4">Payroll Calculation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={calculatePayroll}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Calculating..." : "Calculate Payroll"}
              </Button>
            </div>
          </div>
        </div>

        {employeePayrolls.length > 0 && (
          <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b">
              <h2 className="text-lg font-medium">Payroll Results</h2>
              
              <div className="flex space-x-2">
                <div className="relative w-64">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search employees..."
                    className="pl-10 pr-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                      onClick={() => setSearchTerm("")}
                    >
                      <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={exportToCsv}
                  className="flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-semibold">ID</TableHead>
                    <TableHead className="font-semibold">Name and Surname</TableHead>
                    <TableHead className="font-semibold text-right">Total pay Stripping</TableHead>
                    <TableHead className="font-semibold text-right">Total pay Ticket based work</TableHead>
                    <TableHead className="font-semibold text-right">Total pay Bailing sticks</TableHead>
                    <TableHead className="font-semibold text-right">Total pay Bailing lamina</TableHead>
                    <TableHead className="font-semibold text-right">Total pay Machine</TableHead>
                    <TableHead className="font-semibold text-right">Total Pay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayrolls.map((employee, index) => (
                    <TableRow key={employee.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <TableCell>{employee.id}</TableCell>
                      <TableCell>
                        <button 
                          onClick={() => handleViewEmployeeDetails(employee.id)}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {employee.name} {employee.surname}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">${employee.strippingPay.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${employee.ticketBasedPay.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${employee.bailingSticksPay.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${employee.bailingLaminaPay.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${employee.machinePay.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold">${employee.totalPay.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default PayrollPage;
