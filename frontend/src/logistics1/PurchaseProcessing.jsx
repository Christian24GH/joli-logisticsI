import React, { useState, useEffect } from 'react';
import { logisticsI } from '../api/logisticsI';

const PurchaseProcessing = () => {
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState('');
  const [error, setError] = useState(''); 

  // State for Issue Purchase Order
  const [purchaseOrderForm, setPurchaseOrderForm] = useState({
    request_id: '',
    supplier_id: '',
    total_amount: '',
  });
  const [suppliers, setSuppliers] = useState([]);
  const [lowstockRequests, setLowstockRequests] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [activeSection, setActiveSection] = useState('create'); // 'create', 'approval', 'issue', 'orderList'

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [purchaseForm, setPurchaseForm] = useState({
    supplier_id: '',
    price: '',
    quantity: '',
    total: '',
  });

  // Order modal state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrderRequest, setSelectedOrderRequest] = useState(null);
  const [orderForm, setOrderForm] = useState({
    item_name: '',
    quantity: '',
    price_per_unit: '',
    total_price: '',
    contact_email: '',
    contact_phone: '',
  });

  // Fetch initial data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = () => {
    fetchPurchaseRequests();
    fetchSuppliers();
    fetchLowstockRequests();
    fetchOrderItems();
  };

  const fetchPurchaseRequests = async () => {
    setSuccess('');
    setError('');
    try {
    const response = await fetch(logisticsI.backend.api.purchaseRequests);
      if (!response.ok) throw new Error('Failed to fetch purchase requests');
      const data = await response.json();
      setPurchaseRequests(data || []);
    } catch (err) {
      console.error('Error fetching purchase requests:', err);
      setError('Failed to fetch purchase requests');
    }
  };

  const fetchSuppliers = async () => {
    setSuccess('');
    setError('');
    try {
      const response = await fetch(logisticsI.backend.api.suppliers);
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      const data = await response.json();
      setSuppliers(data || []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Failed to fetch suppliers');
    }
  };

  const fetchLowstockRequests = async () => {
    setSuccess('');
    setError('');
    try {
      const response = await fetch(logisticsI.backend.api.lowStockRequests);
      if (!response.ok) throw new Error('Failed to fetch low stock requests');
      const data = await response.json();
      setLowstockRequests(data || []);
    } catch (err) {
      console.error('Error fetching low stock requests:', err);
      setError('Failed to fetch low stock requests');
    }
  };

  const fetchOrderItems = async () => {
    setSuccess('');
    setError('');
    try {
      const response = await fetch(logisticsI.backend.api.orderItems);
      if (!response.ok) throw new Error('Failed to fetch order items');
      const data = await response.json();
      setOrderItems(data || []);
    } catch (err) {
      console.error('Error fetching order items:', err);
      setError('Failed to fetch order items');
    }
  };

  // Helper to update low stock request status
  const updateLowStockStatus = async (id, status) => {
    try {
      // logisticsI does not have a dedicated lowStockRequestUpdate key, use the collection endpoint and append the id
      const url = `${logisticsI.backend.api.lowStockRequests}/${id}`;
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.error(`Failed to update low stock status for id ${id}:`, err);
      // Non-critical, so we don't set a user-facing error
    }
  };


  // Handle Approve/Reject Purchase Request
  const handleApproval = async (requestId, status) => {
    setLoading(true);
    setError('');
    try {
      // Use the generic purchaseRequestUpdate endpoint which is /api/requests/{id}
      // For approval we have a dedicated approve endpoint
      const approveUrl = logisticsI.backend.api.purchaseRequestApprove.replace('{requestId}', requestId);
      const response = await fetch(approveUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        setSuccess(`Purchase request ${status} successfully.`);
        fetchAllData(); // Refresh list
      } else {
        let txt = await response.text();
        try {
          const err = JSON.parse(txt);
          setError(err.message || err.error || JSON.stringify(err));
        } catch (e) {
          setError(txt || `Failed to update purchase request status (${response.status})`);
        }
      }
    } catch (err) {
      console.error('Error updating purchase request status:', err);
      setError('Error updating purchase request status');
    }
    setLoading(false);
  };

  // Open modal for creating purchase request
  const openPurchaseModal = (request) => {
    setSelectedRequest(request);
    setPurchaseForm({
      supplier_id: '',
      price: '',
      quantity: request.quantity,
      total: '',
    });
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setPurchaseForm({
      supplier_id: '',
      price: '',
      quantity: '',
      total: '',
    });
  };

  // Open order modal
  const openOrderModal = (request) => {
    setSelectedOrderRequest(request);
    setOrderForm({
      item_name: request.item_name,
      quantity: request.quantity,
      price_per_unit: request.price,
      total_price: request.total_price,
      contact_email: '',
      contact_phone: '',
    });
    setShowOrderModal(true);
  };

  // Close order modal
  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrderRequest(null);
    setOrderForm({
      item_name: '',
      quantity: '',
      price_per_unit: '',
      total_price: '',
      contact_email: '',
      contact_phone: '',
    });
  };

  // Handle supplier selection
  const handleSupplierChange = (supplierId) => {
    const selectedSupplier = suppliers.find(s => String(s.supplier_id) === supplierId);
    setPurchaseForm(prev => ({
      ...prev,
      supplier_id: supplierId,
      price: selectedSupplier ? String(selectedSupplier.price || '') : '',
    }));
  };

  // Calculate total
  useEffect(() => {
    const price = parseFloat(purchaseForm.price) || 0;
    const quantity = parseFloat(purchaseForm.quantity) || 0;
    const total = (price * quantity).toFixed(2);
    setPurchaseForm(prev => ({ ...prev, total }));
  }, [purchaseForm.price, purchaseForm.quantity]);

  // Handle reject low stock request
  const handleRejectLowstock = async (requestId) => {
    setLoading(true);
    setError('');
    try {
      // Update lowstock request status via the collection endpoint + id
      const response = await fetch(`${logisticsI.backend.api.lowStockRequests}/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });
      if (response.ok) {
        setSuccess('Low stock request rejected successfully.');
        fetchAllData(); // Refresh list
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to reject low stock request');
      }
    } catch (err) {
      console.error('Error rejecting low stock request:', err);
      setError('Error rejecting low stock request');
    }
    setLoading(false);
  };

  // Handle submit purchase request
  const handleSubmitPurchase = async (e) => {
    e.preventDefault();
    if (!purchaseForm.supplier_id || !purchaseForm.price || !purchaseForm.total) {
      setError('Please fill all fields');
      return;
    } 
    setLoading(true);
    setError('');
    try {
      // Create purchase request: POST to /api/purchase-requests
      const response = await fetch(logisticsI.backend.api.purchaseRequestAdd, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          lowstock_id: selectedRequest.id,
          item_name: selectedRequest.item_name,
          quantity: purchaseForm.quantity,
          supplier_id: purchaseForm.supplier_id,
          price_per_unit: purchaseForm.price,
          total_amount: purchaseForm.total,
          requested_by: selectedRequest.requested_by,
          status: 'pending'
        }),
      });

      if (response.ok) {
        setSuccess('Purchase request created successfully.');
        closeModal();
        // Optionally update lowstock status to submitted
        await updateLowStockStatus(selectedRequest.id, 'submitted');
        fetchAllData(); // Refresh all lists
      } else {
        // Try to get a helpful error message from the backend
        let bodyText = await response.text();
        try {
          const errorJson = JSON.parse(bodyText);
          // Laravel validation errors come back as { message, errors: { field: [msgs] } }
          if (errorJson.errors) {
            const messages = Object.values(errorJson.errors).flat();
            setError(messages.join('; '));
          } else if (errorJson.message) {
            setError(errorJson.message);
          } else if (errorJson.error) {
            setError(errorJson.error);
          } else {
            setError(JSON.stringify(errorJson));
          }
        } catch (parseErr) {
          // Not JSON - use raw text
          setError(bodyText || `Failed to create purchase request (status ${response.status})`);
        }
      }
    } catch (err) {
      console.error('Error creating purchase request:', err);
      setError('Error creating purchase request');
    }
    setLoading(false);
  };

  // Handle Issue Purchase Order
  const handleIssueOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // purchaseOrderAdd is a fixed endpoint (/api/orders/add). Include request_id in the POST body.
      // Issue purchase order: POST to /api/purchase-orders/{requestId}
      const poUrl = logisticsI.backend.api.purchaseOrderAdd.replace('{requestId}', purchaseOrderForm.request_id);
      const response = await fetch(poUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          total_amount: purchaseOrderForm.total_amount,
          supplier_id: purchaseOrderForm.supplier_id,
        }),
      });
      if (response.ok) {
        setSuccess('Purchase order issued successfully.');
        setPurchaseOrderForm({ request_id: '', supplier_id: '', total_amount: '' });
        fetchAllData(); // Refresh list
      } else {
        let body = await response.text();
        try {
          const err = JSON.parse(body);
          if (err.errors) {
            const messages = Object.values(err.errors).flat();
            setError(messages.join('; '));
          } else {
            setError(err.message || err.error || JSON.stringify(err));
          }
        } catch (e) {
          setError(body || `Failed to issue purchase order (${response.status})`);
        }
      }
    } catch (err) {
      console.error('Error issuing purchase order:', err);
      setError('Error issuing purchase order');
    }
    setLoading(false);
  };

  // Handle submit order
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.contact_email || !orderForm.contact_phone) {
      setError('Please fill contact email and phone');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Create order item: POST to /api/order-items
      const response = await fetch(logisticsI.backend.api.orderItemsAdd, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          request_id: selectedOrderRequest.request_id,
          item_name: orderForm.item_name,
          quantity: orderForm.quantity,
          price_per_unit: orderForm.price_per_unit,
          total_price: orderForm.total_price,
          contact_email: orderForm.contact_email,
          contact_phone: orderForm.contact_phone,
        }),
      });

      if (response.ok) {
        setSuccess('Order placed successfully.');
        closeOrderModal();
        fetchAllData(); // Refresh all lists
      } else {
        let bodyText = await response.text();
        try {
          const errorJson = JSON.parse(bodyText);
          if (errorJson.errors) {
            const messages = Object.values(errorJson.errors).flat();
            setError(messages.join('; '));
          } else if (errorJson.message) {
            setError(errorJson.message);
          } else if (errorJson.error) {
            setError(errorJson.error);
          } else {
            setError(JSON.stringify(errorJson));
          }
        } catch (parseErr) {
          setError(bodyText || `Failed to place order (status ${response.status})`);
        }
      }
    } catch (err) {
      console.error('Error placing order:', err);
      setError('Error placing order');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-full mx-auto bg-white rounded-lg shadow-lg p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">Purchase Processing</h1>
        {success && <p className="text-green-600 bg-green-100 p-2 rounded mb-2 text-sm">{success}</p>}
        {error && <p className="text-red-500 bg-red-100 p-2 rounded mb-2 text-sm">{error}</p>}

        {/* Navigation Buttons */}
        <div className="flex justify-center mb-4 space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveSection('create')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition duration-200 whitespace-nowrap ${
              activeSection === 'create'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Create Request
          </button>
          <button
            onClick={() => setActiveSection('approval')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition duration-200 whitespace-nowrap ${
              activeSection === 'approval'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Approval
          </button>
          <button
            onClick={() => setActiveSection('issue')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition duration-200 whitespace-nowrap ${
              activeSection === 'issue'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Issue Order
          </button>
          <button
            onClick={() => setActiveSection('orderList')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition duration-200 whitespace-nowrap ${
              activeSection === 'orderList'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Order List
          </button>
        </div>

        {/* Conditional Sections */}
        {activeSection === 'create' && (
          <section>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Low Stock Requests</h2>
            {lowstockRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300 table-fixed">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-1 px-2 border-b text-base text-center w-40">Item</th>
                      <th className="py-1 px-2 border-b text-base text-center w-12">Quantity</th>
                      <th className="py-1 px-2 border-b text-base text-center w-24">Requested By</th>
                      <th className="py-1 px-2 border-b text-base text-center w-16">Status</th>
                      <th className="py-1 px-2 border-b text-base text-center w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowstockRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="py-1 px-2 border-b text-base text-center truncate overflow-hidden">{request.item_name}</td>
                        <td className="py-1 px-2 border-b text-base text-center">{request.quantity}</td>
                        <td className="py-1 px-2 border-b text-base text-center truncate overflow-hidden">{request.requested_by || 'N/A'}</td>
                        <td className="py-1 px-2 border-b text-center">
                          <span className={`px-2 py-1 rounded text-base inline-block ${
                            request.status === 'approved' ? 'bg-green-100 text-green-800' :
                            request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="py-1 px-2 border-b text-center">
                          {request.status === 'pending' && (
                            <div className="flex flex-row space-x-1 justify-center">
                              <button
                                onClick={() => openPurchaseModal(request)}
                                disabled={loading}
                                className="bg-green-600 text-white px-2 py-1 rounded text-base hover:bg-green-700 disabled:opacity-50 transition duration-200"
                              >
                                App
                              </button>
                              <button
                                onClick={() => handleRejectLowstock(request.id)}
                                disabled={loading}
                                className="bg-red-600 text-white px-2 py-1 rounded text-base hover:bg-red-700 disabled:opacity-50 transition duration-200"
                              >
                                Rej
                              </button>
                            </div>
                          )}
                          {request.status === 'submitted' && (
                            <span className="text-blue-600 font-medium text-base block text-center">Waiting for Approval</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No low stock requests available</p>
            )}
          </section>
        )}

        {activeSection === 'approval' && (
          <section>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Approval Workflow</h2>
            {purchaseRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300 table-fixed">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-1 px-2 border-b text-base text-center w-16">ID</th>
                      <th className="py-1 px-2 border-b text-base text-center w-32">Item</th>
                      <th className="py-1 px-2 border-b text-base text-center w-12">Quantity</th>
                      <th className="py-1 px-2 border-b text-base text-center w-24">Supplier</th>
                      <th className="py-1 px-2 border-b text-base text-center w-16">Price</th>
                      <th className="py-1 px-2 border-b text-base text-center w-16">Total</th>
                      <th className="py-1 px-2 border-b text-base text-center w-24">Requested By</th>
                      <th className="py-1 px-2 border-b text-base text-center w-16">Status</th>
                      <th className="py-1 px-2 border-b text-base text-center w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseRequests.filter(req => req.status !== 'ordered').map((request) => (
                      <tr key={request.request_id} className="hover:bg-gray-50">
                        <td className="py-1 px-2 border-b text-base text-center">{request.request_id}</td>
                        <td className="py-1 px-2 border-b text-base text-center truncate overflow-hidden">{request.item_name}</td>
                        <td className="py-1 px-2 border-b text-base text-center">{request.quantity}</td>
                        <td className="py-1 px-2 border-b text-base text-center truncate overflow-hidden">{request.supplier_name || 'N/A'}</td>
                        <td className="py-1 px-2 border-b text-base text-center">₱{request.price}</td>
                        <td className="py-1 px-2 border-b text-base text-center">₱{request.total_price}</td>
                        <td className="py-1 px-2 border-b text-base text-center truncate overflow-hidden">{request.requested_by || 'N/A'}</td>
                        <td className="py-1 px-2 border-b text-center">
                          <span className={`px-2 py-1 rounded text-base inline-block ${
                            request.status === 'approved' ? 'bg-green-100 text-green-800' :
                            request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="py-1 px-2 border-b text-center">
                          {request.status === 'pending' && (
                            <div className="flex flex-row space-x-1 justify-center">
                              <button
                                onClick={() => handleApproval(request.request_id, 'approved')}
                                disabled={loading}
                                className="bg-green-600 text-white px-2 py-1 rounded text-base hover:bg-green-700 disabled:opacity-50 transition duration-200"
                              >
                                App
                              </button>
                              <button
                                onClick={() => handleApproval(request.request_id, 'rejected')}
                                disabled={loading}
                                className="bg-red-600 text-white px-2 py-1 rounded text-base hover:bg-red-700 disabled:opacity-50 transition duration-200"
                              >
                                Rej
                              </button>
                            </div>
                          )}
                          {request.status === 'approved' && (
                            <button
                              onClick={() => openOrderModal(request)}
                              disabled={loading}
                              className="bg-blue-600 text-white px-2 py-1 rounded text-base hover:bg-blue-700 disabled:opacity-50 transition duration-200"
                            >
                              Order
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No purchase requests available</p>
            )}
          </section>
        )}

        {activeSection === 'issue' && (
          <section>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Issue Purchase Order</h2>
            <form onSubmit={handleIssueOrder} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={purchaseOrderForm.request_id}
                  onChange={(e) => setPurchaseOrderForm({ ...purchaseOrderForm, request_id: e.target.value })}
                  required
                  className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Approved Request</option>
                  {purchaseRequests
                    .filter((req) => req.status === 'approved')
                    .map((req) => (
                      <option key={req.request_id} value={req.request_id}>
                        Request ID: {req.request_id}
                      </option>
                    ))}
                </select>
                <select
                  value={purchaseOrderForm.supplier_id}
                  onChange={(e) => setPurchaseOrderForm({ ...purchaseOrderForm, supplier_id: e.target.value })}
                  required
                  className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.length > 0 ? (
                    suppliers.map((supplier) => (
                      <option key={supplier.supplier_id} value={supplier.supplier_id}>
                        {supplier.supplier_name}
                      </option>
                    ))
                  ) : (
                    <option disabled>No suppliers available</option>
                  )}
                </select>
                <input
                  type="number"
                  placeholder="Total Amount"
                  value={purchaseOrderForm.total_amount}
                  onChange={(e) => setPurchaseOrderForm({ ...purchaseOrderForm, total_amount: e.target.value })}
                  required
                  className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition duration-200"
              >
                {loading ? 'Issuing...' : 'Issue Order'}
              </button>
            </form>
          </section>
        )}

        {activeSection === 'orderList' && (
          <section>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Order Items</h2>
            {orderItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300 table-fixed">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-1 px-2 border-b text-base text-center w-16">ID</th>
                      <th className="py-1 px-2 border-b text-base text-center w-16">Request ID</th>
                      <th className="py-1 px-2 border-b text-base text-center w-32">Item</th>
                      <th className="py-1 px-2 border-b text-base text-center w-12">Quantity</th>
                      <th className="py-1 px-2 border-b text-base text-center w-16">Price/Unit</th>
                      <th className="py-1 px-2 border-b text-base text-center w-16">Total Price</th>
                      <th className="py-1 px-2 border-b text-base text-center w-32">Contact Email</th>
                      <th className="py-1 px-2 border-b text-base text-center w-24">Contact Phone</th>
                      <th className="py-1 px-2 border-b text-base text-center w-24">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="py-1 px-2 border-b text-base text-center">{item.order_item_id}</td>
                        <td className="py-1 px-2 border-b text-base text-center">{item.request_id}</td>
                        <td className="py-1 px-2 border-b text-base text-center truncate overflow-hidden">{item.item_name}</td>
                        <td className="py-1 px-2 border-b text-base text-center">{item.quantity}</td>
                        <td className="py-1 px-2 border-b text-base text-center">₱{item.price_per_unit}</td>
                        <td className="py-1 px-2 border-b text-base text-center">₱{item.total_price}</td>
                        <td className="py-1 px-2 border-b text-base text-center truncate overflow-hidden">{item.contact_email}</td>
                        <td className="py-1 px-2 border-b text-base text-center">{item.contact_phone}</td>
                        <td className="py-1 px-2 border-b text-base text-center">{new Date(item.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No order items available</p>
            )}
          </section>
        )}

        {/* Modal for Purchase Request */}
        {showModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Create Purchase Request</h3>
              <p className="mb-4"><strong>Item Name:</strong> {selectedRequest.item_name}</p>
              <p className="mb-4"><strong>Requested By:</strong> {selectedRequest.requested_by || 'N/A'}</p>
              <form onSubmit={handleSubmitPurchase}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Supplier</label>
                  <select
                    value={purchaseForm.supplier_id}
                    onChange={(e) => handleSupplierChange(e.target.value)}
                    required
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.supplier_id} value={supplier.supplier_id}>
                        {supplier.supplier_name} - {supplier.item_name} - ₱{supplier.price || 'N/A'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Price per Unit</label>
                  <input
                    type="number"
                    step="0.01"
                    value={purchaseForm.price}
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded bg-gray-100"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    value={purchaseForm.quantity}
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded bg-gray-100"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Total Amount</label>
                  <input
                    type="number"
                    value={purchaseForm.total}
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded bg-gray-100"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Order */}
        {showOrderModal && selectedOrderRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Place Order</h3>
              <p className="mb-4"><strong>Item Name:</strong> {selectedOrderRequest.item_name}</p>
              <p className="mb-4"><strong>Quantity:</strong> {selectedOrderRequest.quantity}</p>
              <p className="mb-4"><strong>Total Price:</strong> ₱{selectedOrderRequest.total_price}</p>
              <form onSubmit={handleSubmitOrder}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={orderForm.contact_email}
                    onChange={(e) => setOrderForm({ ...orderForm, contact_email: e.target.value })}
                    required
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={orderForm.contact_phone}
                    onChange={(e) => setOrderForm({ ...orderForm, contact_phone: e.target.value })}
                    required
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={closeOrderModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Placing...' : 'Place Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseProcessing;
