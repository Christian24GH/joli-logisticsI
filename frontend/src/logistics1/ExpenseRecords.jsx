import React, { useState, useEffect } from 'react';
import { logisticsI } from '../api/logisticsI.js';
import * as XLSX from 'xlsx';

const ExpenseRecords = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState('');
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [requestedBy, setRequestedBy] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [status, setStatus] = useState('');

  // Calculated values
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalPaidExpenses, setTotalPaidExpenses] = useState(0);
  const [paidExpensesCount, setPaidExpensesCount] = useState(0);

  // Filter and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'paid', 'unpaid'

  const backendUri = logisticsI.backend.uri;

  // Fetch all expenses
  const fetchExpenses = async () => {
    try {
      const response = await fetch(`${backendUri}/api/expenses`);
      if (!response.ok) throw new Error('Failed to fetch expenses');
      const data = await response.json();
      setExpenses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Filter expenses based on search term and status filter
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = searchTerm === '' ||
      expense.order_item_id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.item_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'paid' && expense.payment_status === 'paid') ||
      (statusFilter === 'unpaid' && (!expense.payment_status || expense.payment_status !== 'paid'));

    return matchesSearch && matchesStatus;
  });

  // Calculate totals for ALL expenses (cards show overall totals)
  useEffect(() => {
    const total = expenses.length;
    const paidExpenses = expenses.filter(expense => expense.payment_status === 'paid');
    const paidCount = paidExpenses.length;
    const paidTotal = paidExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);

    setTotalExpenses(total);
    setPaidExpensesCount(paidCount);
    setTotalPaidExpenses(paidTotal);
  }, [expenses]);

  // Add state for filtered results info
  const [filteredCount, setFilteredCount] = useState(0);

  // Update filtered count when filteredExpenses changes
  useEffect(() => {
    setFilteredCount(filteredExpenses.length);
  }, [filteredExpenses]);

  // Record purchase amount
  const handleRecordAmount = async (e) => {
    e.preventDefault();
    if (!orderId || !amount) return alert('Please fill in order ID and amount');
    try {
      const response = await fetch(`${backendUri}/api/expenses/${orderId}/amount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          item_name: itemName,
          price: price ? parseFloat(price) : null,
          requested_by: requestedBy,
          delivery_date: deliveryDate,
          status: status,
        }),
      });
      if (!response.ok) throw new Error('Failed to record amount');
      alert('Amount recorded successfully');
      setOrderId('');
      setAmount('');
      setItemName('');
      setPrice('');
      setRequestedBy('');
      setDeliveryDate('');
      setStatus('');
      fetchExpenses(); // Refresh list
    } catch (err) {
      alert(err.message);
    }
  };

  // Update payment status
  const handleStatusChange = async (expenseId, newStatus) => {
    try {
      const response = await fetch(`${backendUri}/api/expenses/${expenseId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      alert('Status updated successfully');
      fetchExpenses(); // Refresh list
    } catch (err) {
      alert(err.message);
    }
  };

  // Export expense reports to Excel
  const handleExport = async () => {
    try {
      // Use filtered expenses if there are active filters, otherwise use all expenses
      const exportData = (searchTerm || statusFilter !== 'all') ? filteredExpenses : expenses;

      if (exportData.length === 0) {
        alert('No expense records to export');
        return;
      }

      // Create Excel workbook
      const workbook = XLSX.utils.book_new();

      // Summary data
      const summaryData = [
        ['EXPENSE RECORDS REPORT'],
        [''],
        ['SUMMARY'],
        ['Total Expenses', totalExpenses],
        ['Paid Expenses', paidExpensesCount],
        ['Total Paid Amount', `₱${totalPaidExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
        ['']
      ];

      if (searchTerm || statusFilter !== 'all') {
        summaryData.push(
          ['FILTER INFORMATION'],
          ['Filtered Results', filteredCount],
          ...(searchTerm ? [['Search Term', `"${searchTerm}"`]] : []),
          ...(statusFilter !== 'all' ? [['Status Filter', statusFilter === 'paid' ? 'Paid Only' : 'Unpaid Only']] : []),
          ['']
        );
      }

      summaryData.push(
        ['DETAILED RECORDS'],
        ['']
      );

      // Add summary sheet
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

      // Set column widths for summary
      summarySheet['!cols'] = [
        { width: 20 }, // Title column
        { width: 15 }  // Value column
      ];

      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Prepare expense data for Excel
      const expenseHeaders = [
        'Order Item ID',
        'Item Name',
        'Amount (₱)',
        'Quantity',
        'Price (₱)',
        'Payment Status',
        'Delivery Date',
        'Status'
      ];

      const expenseRows = exportData.map(expense => [
        expense.order_item_id || 'N/A',
        expense.item_name || 'N/A',
        expense.amount || '0',
        expense.quantity || 'N/A',
        expense.price || '0',
        expense.payment_status || 'N/A',
        expense.delivery_date ? new Date(expense.delivery_date).toLocaleDateString('en-US', { timeZone: 'Asia/Manila' }) : 'N/A',
        expense.status || 'N/A'
      ]);

      // Create expense data array with headers
      const expenseData = [expenseHeaders, ...expenseRows];

      // Create expense sheet
      const expenseSheet = XLSX.utils.aoa_to_sheet(expenseData);

      // Set column widths for expense data
      expenseSheet['!cols'] = [
        { width: 12 }, // Order Item ID
        { width: 25 }, // Item Name
        { width: 15 }, // Amount
        { width: 10 }, // Quantity
        { width: 15 }, // Price
        { width: 15 }, // Payment Status
        { width: 15 }, // Delivery Date
        { width: 12 }, // Status
        { width: 20 }  // Requested By
      ];

      // Style the header row
      const headerStyle = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '366092' } },
        alignment: { horizontal: 'center' }
      };

      // Apply header styling
      for (let i = 0; i < expenseHeaders.length; i++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: i });
        if (!expenseSheet[cellAddress]) continue;
        expenseSheet[cellAddress].s = headerStyle;
      }

      XLSX.utils.book_append_sheet(workbook, expenseSheet, 'Expense Records');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const filename = `expense-records-${timestamp}.xlsx`;

      // Write and save the file
      XLSX.writeFile(workbook, filename);
      alert('Excel file exported successfully!');

    } catch (err) {
      console.error('Error exporting Excel:', err);
      alert(`Failed to export Excel file: ${err.message}`);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-full mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">Expense Records</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Expenses Card */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-100">Total Expenses</h3>
                <p className="text-3xl font-bold">{totalExpenses}</p>
                <p className="text-blue-200 text-sm">Records</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Paid Expenses Count Card */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-100">Paid Expenses</h3>
                <p className="text-3xl font-bold">{paidExpensesCount}</p>
                <p className="text-green-200 text-sm">Records</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Paid Amount Card */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-purple-100">Total Paid Amount</h3>
                <p className="text-3xl font-bold">₱{totalPaidExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-purple-200 text-sm">Philippine Pesos</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-600">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <label className="text-lg font-bold text-gray-700 dark:text-gray-300">Search:</label>
            </div>
            <input
              type="text"
              placeholder="Search by Order ID or Item Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 p-4 border-2 border-blue-200 dark:border-blue-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-lg transition-all duration-200 hover:border-blue-300"
            />
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <label className="text-lg font-bold text-gray-700 dark:text-gray-300">Filter by Status:</label>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-4 border-2 border-green-200 dark:border-green-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-lg transition-all duration-200 hover:border-green-300"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>

        {/* Filter Results Info */}
        {(searchTerm || statusFilter !== 'all') && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-blue-800 dark:text-blue-200 font-semibold">
                    Showing {filteredCount} of {totalExpenses} expenses
                  </p>
                  <p className="text-blue-600 dark:text-blue-300 text-sm">
                    {searchTerm && `Search: "${searchTerm}" | `}
                    {statusFilter !== 'all' && `Filter: ${statusFilter === 'paid' ? 'Paid Only' : 'Unpaid Only'}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-semibold underline"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Export Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleExport}
            className="group relative bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transform hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <div className="relative flex items-center space-x-3">
              <svg className="w-6 h-6 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export Expense Reports</span>
            </div>
          </button>
        </div>

        {/* Expenses List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="py-4 px-6 text-center text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Order Item ID</th>
                  <th className="py-4 px-6 text-center text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Item Name</th>
                  <th className="py-4 px-6 text-center text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="py-4 px-6 text-center text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
                  <th className="py-4 px-6 text-center text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Price</th>
                  <th className="py-4 px-6 text-center text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Payment Status</th>
                  <th className="py-4 px-6 text-center text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Delivery Date</th>
                  <th className="py-4 px-6 text-center text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-center text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                {filteredExpenses.length > 0 ? filteredExpenses.map((expense) => (
                  <tr key={expense.expense_id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">
                    <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300 font-medium">{expense.order_item_id}</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300 font-semibold">{expense.item_name}</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300 font-bold">₱{expense.amount}</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300">{expense.quantity}</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300">₱{expense.price}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-3 py-2 text-xs font-semibold rounded-full shadow-sm ${
                        expense.payment_status === 'paid' ? 'bg-green-500 text-white' :
                        expense.payment_status === 'pending' ? 'bg-yellow-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {expense.payment_status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300">
                      {expense.delivery_date ? new Date(expense.delivery_date).toLocaleDateString('en-US', { timeZone: 'Asia/Manila' }) : 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-3 py-2 text-xs font-semibold rounded-full shadow-sm ${
                        expense.status === 'received' ? 'bg-blue-500 text-white' :
                        expense.status === 'pending' ? 'bg-yellow-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {expense.status === 'received' && (
                        <button
                          onClick={() => handleStatusChange(expense.expense_id, 'paid')}
                          disabled={expense.payment_status === 'paid'}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transform transition-all duration-200 shadow-md ${
                            expense.payment_status === 'paid'
                              ? 'bg-green-500 text-white cursor-not-allowed opacity-75'
                              : 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-105 hover:shadow-lg group'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {expense.payment_status === 'paid' ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 group-hover:rotate-3 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            <span>{expense.payment_status === 'paid' ? 'Paid' : 'Mark as Paid'}</span>
                          </div>
                        </button>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="9" className="py-8 px-6 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-.881-5.75-2.291A7.962 7.962 0 0112 10c2.34 0 4.29.881 5.75 2.291M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No expenses found</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filter criteria' : 'No expense records available'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseRecords;
