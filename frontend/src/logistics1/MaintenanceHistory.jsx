// src/logistics1/MaintenanceHistory.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { logisticsI } from '@/api/logisticsI';
import { AppSidebar } from "@/components/app-sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MaintenanceHistory() {
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add"); // add or edit
  const [formData, setFormData] = useState({
    asset_id: '',
    maintenance_type: '',
    date: '',
    technician: '',
    status: '',
    cost: '',
    repair_details: ''
  });

  useEffect(() => {
    fetchMaintenance();
  }, []);

  // Fetch function
  async function fetchMaintenance() {
    setLoading(true);
    try {
      const response = await axios.get(logisticsI.backend.api.maintenance);
      setMaintenance(response.data);
    } catch (error) {
      console.error("Failed to fetch maintenance history", error);
    } finally {
      setLoading(false);
    }
  }

  // Filtered data
  const filteredMaintenance = maintenance.filter((item) =>
    item.asset_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Dialog handlers
  function openAddDialog() {
    setDialogMode("add");  
    setFormData({});
    setDialogOpen(true);
  }

  function openEditDialog(data) {
    setDialogMode("edit");
    setFormData(data);
    setDialogOpen(true);
  }

  // Form change
  function handleFormChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  // Submit
  async function handleSubmit() {
    try {
      if (dialogMode === "add") {
        await axios.post(logisticsI.backend.api.maintenanceAdd, formData);
      } else {
        await axios.put(
          `${logisticsI.backend.api.maintenanceUpdate}/${formData.id}`,
          formData
        );
      }
      fetchMaintenance();
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to save maintenance", error);
    }
  }

  // Archive
  async function handleArchive(id) {
    try {
      await axios.put(`${logisticsI.backend.api.maintenanceArchive}/${id}`);
      fetchMaintenance();
    } catch (error) {
      console.error("Failed to archive maintenance", error);
    }
  }

  // Generate Report
  function generateReport() {
    const csvContent = [
      ['ID', 'Asset', 'Maintenance Type', 'Date', 'Technician', 'Cost', 'Repair Details', 'Status'],
      ...filteredMaintenance.map(item => [
        item.id,
        item.asset_name,
        item.maintenance_type,
        item.date,
        item.technician,
        item.cost,
        item.repair_details,
        item.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'maintenance_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 grid grid-cols-[16rem_1fr] overflow-hidden">
      <AppSidebar />
      <main className="px-6 py-2 m-0 w-full flex flex-col justify-start items-stretch bg-gray-50">
        <div className="max-w-screen-x1 mx-auto bg-white rounded-lg shadow-lg p-4 flex-grow overflow-auto -ml-6">
          <div className="mb-8 text-center max-w-xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Maintenance History</h1>
            <p className="text-gray-600">Track and manage asset maintenance records, costs, and generate reports.</p>
          </div>
          <div className="rounded-lg shadow-sm border border-gray-200 p-6 mb-6 w-full max-w-full flex flex-col flex-grow">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex-1 max-w-md">
                <Input
                  placeholder="Search by asset name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={generateReport} variant="outline" className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate Report
                </Button>
                <Button onClick={openAddDialog} className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Maintenance
                </Button>
              </div>
            </div>
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Maintenance Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Repair Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9}>Loading...</TableCell>
              </TableRow>
            ) : filteredMaintenance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>No maintenance records found.</TableCell>
              </TableRow>
            ) : (
              filteredMaintenance.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.asset_name}</TableCell>
                  <TableCell>{item.maintenance_type}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.technician}</TableCell>
                  <TableCell>${item.cost}</TableCell>
                  <TableCell>{item.repair_details}</TableCell>
                  <TableCell>{item.status}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(item)}
                      className="mr-2"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleArchive(item.id)}
                    >
                      Archive
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {dialogMode === "add" ? "Add" : "Edit"} Maintenance Record
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2 pb-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                >
                  <div>
                    <Label>Asset ID</Label>
                    <Input
                      name="asset_id"
                      type="number"
                      value={formData.asset_id || ""}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div>
                    <Label>Maintenance Type</Label>
                    <Select value={formData.maintenance_type || ""} onValueChange={(value) => setFormData({...formData, maintenance_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preventive">Preventive</SelectItem>
                        <SelectItem value="corrective">Corrective</SelectItem>
                        <SelectItem value="predictive">Predictive</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input
                      name="date"
                      type="date"
                      value={formData.date || ""}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div>
                    <Label>Technician</Label>
                    <Input
                      name="technician"
                      value={formData.technician || ""}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={formData.status || ""} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cost</Label>
                    <Input
                      name="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost || ""}
                      onChange={handleFormChange}
                      placeholder="Enter repair cost"
                    />
                  </div>
                  <div>
                    <Label>Repair Details</Label>
                    <textarea
                      name="repair_details"
                      value={formData.repair_details || ""}
                      onChange={handleFormChange}
                      placeholder="Describe the repair work done"
                      className="w-full border border-gray-300 rounded px-3 py-2 resize-none"
                      rows={4}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit">{dialogMode === "add" ? "Add" : "Save"}</Button>
                  </DialogFooter>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
