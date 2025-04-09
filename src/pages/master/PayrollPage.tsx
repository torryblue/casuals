
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useEmployees } from "@/contexts/EmployeeContext";
import { useSchedules, WorkEntry, Schedule, ScheduleItem } from "@/contexts/ScheduleContext";
import { ArrowLeft, DollarSign, Download, Calendar, User, FileText } from "lucide-react";
import { toast } from "sonner";

// Define interfaces for our data structures
interface PayRate {
  task: string;
  rate: number;
}

interface EmployeePayment {
  employeeId: string;
  name: string;
  surname: string;
  totalAmount: number;
  entries: {
    task: string;
    date: string;
    quantity: number;
    amount: number;
  }[];
}

// Default rates for tasks
const DEFAULT_RATES: PayRate[] = [
  { task: "Stripping", rate: 2.50 },
  { task: "Bailing Lamina", rate: 3.00 },
  { task: "Machine", rate: 4.00 },
  { task: "Bailing Sticks", rate: 2.75 },
  { task: "Ticket Based Work", rate: 5.00 },
  { task: "Grading", rate: 3.50 }
];

const PayrollPage = () => {
  const navigate = useNavigate();
  const { employees } = useEmployees();
  const { schedules, workEntries } = useSchedules();
  
  // State
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(1)).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [payRates, setPayRates] = useState<PayRate[]>(DEFAULT_RATES);
  const [payments, setPayments] = useState<EmployeePayment[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showRatesEditor, setShowRatesEditor] = useState(false);
  
  // Load rates from localStorage on component mount
  useEffect(() => {
    const savedRates = localStorage.getItem("payroll-rates");
    if (savedRates) {
      try {
        setPayRates(JSON.parse(savedRates));
      } catch (e) {
        console.error("Error parsing saved rates:", e);
      }
    }
  }, []);
  
  // Save rates to localStorage when they change
  useEffect(() => {
    localStorage.setItem("payroll-rates", JSON.stringify(payRates));
  }, [payRates]);

  // Function to handle pay rate changes
  const handleRateChange = (index: number, value: number) => {
    const updatedRates = [...payRates];
    updatedRates[index].rate = value;
    setPayRates(updatedRates);
  };

  // Function to add a new pay rate
  const handleAddRate = () => {
    setPayRates([...payRates, { task: "", rate: 0 }]);
  };

  // Function to remove a pay rate
  const handleRemoveRate = (index: number) => {
    const updatedRates = [...payRates];
    updatedRates.splice(index, 1);
    setPayRates(updatedRates);
  };

  // Function to calculate payments
  const calculatePayments = () => {
    setIsCalculating(true);
    
    try {
      // Get relevant schedules within date range
      const relevantSchedules = schedules.filter(
        s => s.date >= startDate && s.date <= endDate
      );
      
      // Get relevant entries
      const relevantEntries = workEntries.filter(entry => {
        const schedule = schedules.find(s => s.id === entry.scheduleId);
        return schedule && schedule.date >= startDate && schedule.date <= endDate;
      });
      
      // Group entries by employee
      const employeePayments: { [key: string]: EmployeePayment } = {};
      
      relevantEntries.forEach(entry => {
        // Get the schedule and schedule item for this entry
        const schedule = schedules.find(s => s.id === entry.scheduleId);
        const scheduleItem = schedule?.items.find(item => item.id === entry.scheduleItemId);
        
        if (!schedule || !scheduleItem) return;
        
        const employee = employees.find(e => e.id === entry.employeeId);
        if (!employee) return;
        
        // Find the rate for this task
        const taskRate = payRates.find(r => r.task === scheduleItem.task)?.rate || 0;
        
        // Calculate the amount
        const amount = entry.quantity * taskRate;
        
        // Add to the employee's payments
        if (!employeePayments[employee.id]) {
          employeePayments[employee.id] = {
            employeeId: employee.id,
            name: employee.name || "",
            surname: employee.surname || "",
            totalAmount: 0,
            entries: []
          };
        }
        
        employeePayments[employee.id].entries.push({
          task: scheduleItem.task,
          date: schedule.date,
          quantity: entry.quantity,
          amount: amount
        });
        
        employeePayments[employee.id].totalAmount += amount;
      });
      
      // Convert to array and sort by employee name
      const paymentsArray = Object.values(employeePayments).sort((a, b) => 
        `${a.name} ${a.surname}`.localeCompare(`${b.name} ${b.surname}`)
      );
      
      setPayments(paymentsArray);
      toast.success(`Calculated payments for ${paymentsArray.length} employees`);
    } catch (error) {
      console.error("Error calculating payments:", error);
      toast.error("Failed to calculate payments");
    } finally {
      setIsCalculating(false);
    }
  };

  // Function to export payments as CSV
  const exportPayments = () => {
    if (payments.length === 0) {
      toast.error("No payment data to export");
      return;
    }
    
    try {
      // Create CSV header
      let csv = "Employee ID,Name,Surname,Total Amount\n";
      
      // Add employee rows
      payments.forEach(payment => {
        csv += `${payment.employeeId},"${payment.name}","${payment.surname}",${payment.totalAmount.toFixed(2)}\n`;
      });
      
      // Create download link
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.setAttribute("hidden", "");
      a.setAttribute("href", url);
      a.setAttribute("download", `payroll_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success("Payroll data exported successfully");
    } catch (error) {
      console.error("Error exporting payments:", error);
      toast.error("Failed to export payments");
    }
  };

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rates Card */}
          <div className="glass-card p-6 element-transition lg:col-span-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-800 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-500" />
                Pay Rates
              </h2>
              <button
                onClick={() => setShowRatesEditor(!showRatesEditor)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showRatesEditor ? "Done" : "Edit"}
              </button>
            </div>
            
            <div className="space-y-4">
              {showRatesEditor ? (
                <div className="space-y-3">
                  {payRates.map((rate, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        className="input-field flex-grow"
                        value={rate.task}
                        onChange={(e) => {
                          const updatedRates = [...payRates];
                          updatedRates[index].task = e.target.value;
                          setPayRates(updatedRates);
                        }}
                        placeholder="Task name"
                      />
                      <input
                        type="number"
                        className="input-field w-24"
                        value={rate.rate}
                        min="0"
                        step="0.01"
                        onChange={(e) => handleRateChange(index, parseFloat(e.target.value) || 0)}
                        placeholder="Rate"
                      />
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleRemoveRate(index)}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    className="btn-secondary w-full mt-2"
                    onClick={handleAddRate}
                  >
                    Add Rate
                  </button>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Task</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {payRates.map((rate, index) => (
                      <tr key={index}>
                        <td className="py-2 text-sm text-gray-900">{rate.task || "Unnamed Task"}</td>
                        <td className="py-2 text-sm text-gray-900 text-right">${rate.rate.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          
          {/* Date Range & Calculation Card */}
          <div className="glass-card p-6 element-transition lg:col-span-2">
            <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-500" />
              Calculate Payroll
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  className="input-field w-full"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  className="input-field w-full"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <button
                type="button"
                className="btn-primary flex items-center justify-center"
                onClick={calculatePayments}
                disabled={isCalculating}
              >
                {isCalculating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Calculating...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Calculate Payroll
                  </>
                )}
              </button>
              
              {payments.length > 0 && (
                <button
                  type="button"
                  className="btn-secondary flex items-center justify-center"
                  onClick={exportPayments}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export to CSV
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Results Section */}
        {payments.length > 0 && (
          <div className="glass-card p-6 element-transition">
            <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-gray-500" />
              Payroll Results ({startDate} - {endDate})
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks Completed</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.employeeId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.name} {payment.surname}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.employeeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {payment.entries.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 text-right">
                        ${payment.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100">
                    <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                      Total Payroll:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-right">
                      ${payments.reduce((sum, payment) => sum + payment.totalAmount, 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Detailed Breakdown */}
            <div className="mt-8">
              <h3 className="text-md font-medium text-gray-800 mb-4">Detailed Breakdown</h3>
              
              <div className="space-y-6">
                {payments.map((payment) => (
                  <div key={`detail-${payment.employeeId}`} className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      {payment.name} {payment.surname} ({payment.employeeId})
                    </h4>
                    
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-white">
                        <tr>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                          <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                          <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {payment.entries.map((entry, entryIndex) => {
                          const rate = payRates.find(r => r.task === entry.task)?.rate || 0;
                          return (
                            <tr key={entryIndex} className="hover:bg-gray-50">
                              <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                                {entry.date}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                                {entry.task}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 text-right">
                                {entry.quantity}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 text-right">
                                ${rate.toFixed(2)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 text-right">
                                ${entry.amount.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-gray-100">
                          <td colSpan={4} className="px-4 py-2 whitespace-nowrap text-xs font-bold text-gray-900 text-right">
                            Total:
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs font-bold text-green-600 text-right">
                            ${payment.totalAmount.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default PayrollPage;
