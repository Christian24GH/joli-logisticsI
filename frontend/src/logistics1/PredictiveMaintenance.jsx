// src/logistics1/PredictiveMaintenance.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { logisticsI } from '@/api/logisticsI';
import { AppSidebar } from "@/components/app-sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PredictiveMaintenance() {
  const [tabValue, setTabValue] = useState("alerts");

  // Alerts state
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsSearch, setAlertsSearch] = useState("");

  // Usage History state
  const [usageHistory, setUsageHistory] = useState([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageForm, setUsageForm] = useState({
    asset_id: "",
    usage_hours: "",
    usage_date: "",
    notes: "",
  });

  // Suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewData, setViewData] = useState({});

  useEffect(() => {
    if (tabValue === "alerts") {
      fetchAlerts();
    } else if (tabValue === "usage") {
      fetchUsageHistory();
    } else if (tabValue === "suggestions") {
      fetchSuggestions();
    }
  }, [tabValue]);

  // Fetch alerts
  async function fetchAlerts() {
    setAlertsLoading(true);
    try {
      const response = await axios.get(logisticsI.backend.api.maintenance);
      setAlerts(response.data.filter(item => item.type === 'predictive' || true));
    } catch (error) {
      console.error("Failed to fetch predictive alerts", error);
    } finally {
      setAlertsLoading(false);
    }
  }

  // Fetch usage history
  async function fetchUsageHistory() {
    setUsageLoading(true);
    try {
      const response = await axios.get(logisticsI.backend.api.equipmentLogs);
      setUsageHistory(response.data);
    } catch (error) {
      console.error("Failed to fetch usage history", error);
    } finally {
      setUsageLoading(false);
    }
  }

  // Fetch suggestions (rule-based)
  async function fetchSuggestions() {
    setSuggestionsLoading(true);
    try {
      // Simple rule-based example: suggest replacement if usage_hours > 1000 or last maintenance > 6 months ago
      // For demo, we simulate suggestions from alerts and usage history
      const alertsResponse = await axios.get(logisticsI.backend.api.maintenance);
      const usageResponse = await axios.get(logisticsI.backend.api.equipmentLogs);

      const alertsData = alertsResponse.data;
      const usageData = usageResponse.data;

      const suggestionsList = [];

      usageData.forEach((usage) => {
        if (usage.usage_hours > 1000) {
          suggestionsList.push({
            id: usage.id,
            asset_name: usage.asset_name,
            suggestion: "Consider replacement due to high usage hours",
            usage_hours: usage.usage_hours,
            last_usage_date: usage.usage_date,
          });
        }
      });

      alertsData.forEach((alert) => {
        if (alert.status !== "resolved") {
          suggestionsList.push({
            id: alert.id,
            asset_name: alert.equipment_name || alert.asset_name,
            suggestion: `Maintenance alert: ${alert.predicted_issue || alert.description}`,
            confidence: alert.confidence,
            date: alert.date,
          });
        }
      });

      setSuggestions(suggestionsList);
    } catch (error) {
      console.error("Failed to fetch suggestions", error);
    } finally {
      setSuggestionsLoading(false);
    }
  }

  // Usage form handlers
  function handleUsageFormChange(e) {
    const { name, value } = e.target;
    setUsageForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleUsageFormSubmit(e) {
    e.preventDefault();
    try {
      await axios.post(logisticsI.backend.api.equipmentLogAdd || logisticsI.backend.api.equipmentLogs, usageForm);
      setUsageForm({
        asset_id: "",
        usage_hours: "",
        usage_date: "",
        notes: "",
      });
      fetchUsageHistory();
      setTabValue("usage");
    } catch (error) {
      console.error("Failed to record usage history", error);
    }
  }

  // Dialog handlers
  function openViewDialog(data) {
    setViewData(data);
    setDialogOpen(true);
  }

  // Mark alert resolved (placeholder)
  async function handleMarkResolved(id) {
    console.log("Marking alert as resolved", id);
    setAlerts(alerts.map(alert => alert.id === id ? { ...alert, status: "resolved" } : alert));
  }

  // Filtered alerts
  const filteredAlerts = alerts.filter((item) =>
    item.equipment_name?.toLowerCase().includes(alertsSearch.toLowerCase())
  );

  return (
    <div className="flex">
      <AppSidebar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Predictive Maintenance</h1>
        <Tabs value={tabValue} onValueChange={setTabValue}>
          <TabsList>
            <TabsTrigger value="usage">Record Usage History</TabsTrigger>
            <TabsTrigger value="alerts">Maintenance Alerts</TabsTrigger>
            <TabsTrigger value="suggestions">Suggest Replacement/Repairs</TabsTrigger>
          </TabsList>

          <TabsContent value="usage">
            <form onSubmit={handleUsageFormSubmit} className="space-y-4 max-w-md">
              <div>
                <Label>Asset ID</Label>
                <Input
                  name="asset_id"
                  type="text"
                  value={usageForm.asset_id}
                  onChange={handleUsageFormChange}
                  required
                />
              </div>
              <div>
                <Label>Usage Hours</Label>
                <Input
                  name="usage_hours"
                  type="number"
                  value={usageForm.usage_hours}
                  onChange={handleUsageFormChange}
                  required
                />
              </div> 
              <div>
                <Label>Usage Date</Label>
                <Input
                  name="usage_date"
                  type="date"
                  value={usageForm.usage_date}
                  onChange={handleUsageFormChange}
                  required
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  name="notes"
                  value={usageForm.notes}
                  onChange={handleUsageFormChange}
                />
              </div>
              <Button type="submit">Record Usage</Button>
            </form>

            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Usage History</h2>
              {usageLoading ? (
                <p>Loading usage history...</p>
              ) : usageHistory.length === 0 ? (
                <p>No usage history found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Asset Name</TableHead>
                      <TableHead>Usage Hours</TableHead>
                      <TableHead>Usage Date</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usageHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>{item.asset_name}</TableCell>
                        <TableCell>{item.usage_hours}</TableCell>
                        <TableCell>{item.usage_date}</TableCell>
                        <TableCell>{item.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="alerts">
            <div className="flex justify-between mb-4">
              <Input
                placeholder="Search Equipment"
                value={alertsSearch}
                onChange={(e) => setAlertsSearch(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Predicted Issue</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7}>Loading...</TableCell>
                  </TableRow>
                ) : filteredAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>No alerts found.</TableCell>
                  </TableRow>
                ) : (
                  filteredAlerts.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.equipment_name || item.asset_name}</TableCell>
                      <TableCell>{item.predicted_issue || item.description}</TableCell>
                      <TableCell>{item.confidence || 'N/A'}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{item.status}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewDialog(item)}
                          className="mr-2"
                        >
                          View Details
                        </Button>
                        {item.status !== 'resolved' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleMarkResolved(item.id)}
                          >
                            Mark Resolved
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="suggestions">
            <h2 className="text-lg font-semibold mb-4">Replacement / Repair Suggestions</h2>
            {suggestionsLoading ? (
              <p>Loading suggestions...</p>
            ) : suggestions.length === 0 ? (
              <p>No suggestions available.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Asset Name</TableHead>
                    <TableHead>Suggestion</TableHead>
                    <TableHead>Usage Hours</TableHead>
                    <TableHead>Last Usage Date</TableHead>
                    <TableHead>Confidence / Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestions.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.asset_name}</TableCell>
                      <TableCell>{item.suggestion}</TableCell>
                      <TableCell>{item.usage_hours || 'N/A'}</TableCell>
                      <TableCell>{item.last_usage_date || 'N/A'}</TableCell>
                      <TableCell>{item.confidence || item.date || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

        </Tabs>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 pb-4">
              <div>
                <Label>Asset Name</Label>
                <p>{viewData.equipment_name || viewData.asset_name}</p>
              </div>
              <div>
                <Label>Description</Label>
                <p>{viewData.predicted_issue || viewData.description || viewData.suggestion || 'N/A'}</p>
              </div>
              <div>
                <Label>Confidence</Label>
                <p>{viewData.confidence || 'N/A'}</p>
              </div>
              <div>
                <Label>Date</Label>
                <p>{viewData.date || viewData.last_usage_date || 'N/A'}</p>
              </div>
              <div>
                <Label>Status</Label>
                <p>{viewData.status || 'N/A'}</p>
              </div>
              <div>
                <Label>Notes / Details</Label>
                <p>{viewData.details || viewData.notes || 'Additional details not available'}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
                    onChange={handleUsageFormChange}
    </div>
  );
}
