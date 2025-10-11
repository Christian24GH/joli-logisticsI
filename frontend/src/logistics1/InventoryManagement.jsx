import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { logisticsI } from '../api/logisticsI';

const InventoryManagement = () => {
  const [equipmentList, setEquipmentList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // New: show archived toggle
  const [showArchived, setShowArchived] = useState(false);

  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({
    equipment_id: null,
    name: '', 
    description: '',
    stock_quantity: 0,
    status: 'active',
  });
  const [showForm, setShowForm] = useState(false);
  const [notification, setNotification] = useState('');

  const [stockUpdateId, setStockUpdateId] = useState(null);
  const [stockUpdateQuantity, setStockUpdateQuantity] = useState(0);

  const [archiveId, setArchiveId] = useState(null);
  const [archiveOldId, setArchiveOldId] = useState(null);

  // Stock update modal state
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [quantityToAdd, setQuantityToAdd] = useState(0);

  // Archive modal state
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [equipmentToArchive, setEquipmentToArchive] = useState(null);

  // Activate modal state
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [equipmentToActivate, setEquipmentToActivate] = useState(null);

  // Fetch equipment list with pagination and search
  const fetchEquipment = async (page = 1) => {
    setLoading(true);
    try {
      // build params; include status=archived when showArchived is true
      const params = { page, q: searchQuery };
      if (showArchived) params.status = 'archived';
      const response = await axios.get(logisticsI.backend.api.equipment, { params });

      let equipmentData = response.data.data || response.data;

      // Sort equipment by creation date (newest first)
      if (Array.isArray(equipmentData)) {
        equipmentData = equipmentData.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateB - dateA; // Descending order (newest first)
        });
      }

      setEquipmentList(equipmentData);
      setCurrentPage(response.data.current_page || page);
      setTotalPages(response.data.last_page || 1);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment(currentPage);
  }, [currentPage, searchQuery, showArchived]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Ensure numeric fields are stored as numbers
    if (name === 'stock_quantity') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Submit add or edit equipment
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      // Capture name for notification before clearing the form
      const savedName = formData.name;

      if (formMode === 'add') {
        // Backend now handles created_at automatically
        await axios.post(logisticsI.backend.api.equipmentAdd, formData);
      } else if (formMode === 'edit' && formData.equipment_id) {
        const url = logisticsI.backend.api.equipmentUpdate.replace('{id}', formData.equipment_id);
        await axios.put(url, formData);
      }

      // Reset form
      setFormData({
        equipment_id: null,
        name: '',
        description: '',
        stock_quantity: 0,
        status: 'active',
      });
      setFormMode('add');
      await fetchEquipment(currentPage);
      setShowForm(false);

      setNotification(formMode === 'add'
        ? `Item "${savedName}" successfully added`
        : `Item "${savedName}" successfully updated`
      );
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Error saving equipment:', error);
      // Prefer useful error messages from backend when available
      const message = error?.response?.data?.message || error.message || 'Failed to save equipment';
      setNotification(message);
      setTimeout(() => setNotification(''), 4000);
    }
  };

  // Edit equipment - populate form
  const handleEditClick = (equipment) => {
    setFormData({
      equipment_id: equipment.equipment_id,
      name: equipment.name,
      description: equipment.description || '',
      stock_quantity: equipment.stock_quantity || 0,
      status: equipment.status || 'active',
    });
    setFormMode('edit');
    setShowForm(true);
  };

  // Open stock update modal
  const handleStockUpdateClick = (equipment) => {
    setSelectedEquipment(equipment);
    setQuantityToAdd(0);
    setShowStockModal(true);
  };

  // Update stock quantity by adding to existing stock
  const handleStockUpdate = async () => {
    if (quantityToAdd <= 0) {
      alert('Please enter a positive quantity to add');
      return;
    }
    try {
      const current = Number(selectedEquipment.stock_quantity) || 0;
      const newStockQuantity = current + Number(quantityToAdd);
      const url = logisticsI.backend.api.equipmentUpdateStock.replace('{id}', selectedEquipment.equipment_id);
      await axios.put(url, { stock_quantity: newStockQuantity });

      setShowStockModal(false);
      setSelectedEquipment(null);
      setQuantityToAdd(0);
      fetchEquipment(currentPage);

      // Show success notification
      setNotification(`Stock updated successfully! Added ${quantityToAdd} to ${selectedEquipment.name}`);
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Error updating stock:', error);
      const message = error?.response?.data?.message || error.message || 'Failed to update stock';
      setNotification(message);
      setTimeout(() => setNotification(''), 4000);
    }
  };

  // Show archive modal
  const handleArchiveClick = (equipment) => {
    setEquipmentToArchive(equipment);
    setShowArchiveModal(true);
  };

  // Archive equipment
  const handleArchiveConfirm = async () => {
    if (!equipmentToArchive) return;
    try {
      const url = logisticsI.backend.api.equipmentArchive.replace('{id}', equipmentToArchive.equipment_id);
      await axios.put(url);
      fetchEquipment(currentPage);
      setShowArchiveModal(false);
      setEquipmentToArchive(null);
      setNotification(`Equipment "${equipmentToArchive.name}" archived successfully`);
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Error archiving equipment:', error);
      const message = error?.response?.data?.message || error.message || 'Failed to archive equipment';
      setNotification(message);
      setTimeout(() => setNotification(''), 4000);
    }
  };

  // Show activate modal
  const handleActivateClick = (equipment) => {
    setEquipmentToActivate(equipment);
    setShowActivateModal(true);
  };

  // Activate equipment
  const handleActivateConfirm = async () => {
    if (!equipmentToActivate) return;
    try {
      const url = logisticsI.backend.api.equipmentActivate.replace('{id}', equipmentToActivate.equipment_id);
      await axios.put(url);
      fetchEquipment(currentPage);
      setShowActivateModal(false);
      setEquipmentToActivate(null);
      setNotification(`Equipment "${equipmentToActivate.name}" activated successfully`);
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Error activating equipment:', error);
      const message = error?.response?.data?.message || error.message || 'Failed to activate equipment';
      setNotification(message);
      setTimeout(() => setNotification(''), 4000);
    }
  };

  // Pagination controls
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="bg-white shadow-md rounded-lg border border-gray-100 overflow-hidden">
        <div className="p-6">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Inventory Management</h2>

          {/* Search + Add controls: stacked on small screens, inline on md+ */}
          <div className="mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center flex-1 mb-2 md:mb-0">
              <input
                type="text"
                placeholder="Search equipment..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full bg-gray-50 border border-gray-200 rounded-md px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            {/* New: Show Archived toggle button (between search and Add) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowArchived(s => !s); setCurrentPage(1); }}
                className={`ml-0 md:ml-2 inline-flex items-center px-4 py-2 rounded-md text-sm font-semibold tracking-wide shadow-sm focus:outline-none focus:ring-2 ${showArchived ? 'bg-gray-700 text-white hover:bg-gray-800 focus:ring-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400'}`}
              >
                {showArchived ? 'Showing Archived' : 'Show Archived'}
              </button>

              <button
                onClick={() => {
                  setFormMode('add');
                  setFormData({
                    equipment_id: null,
                    name: '',
                    description: '',
                    stock_quantity: 0,
                    status: 'active',
                  });
                  setShowForm(true);
                }}
                className="ml-0 md:ml-4 inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-semibold tracking-wide shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Add Equipment
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading equipment...</p>
          ) : (
            <>
              {/* Desktop/table view (md and up) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full w-full table-auto divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Description</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Category</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Stock</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Storage</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Created</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Updated</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Archived Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {equipmentList.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center py-8 text-sm text-gray-500">No equipment found.</td>
                      </tr>
                    ) : (
                      equipmentList.map(equipment => (
                        <tr
                          key={equipment.equipment_id}
                          className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{equipment.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{equipment.description || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{equipment.category_name || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-800 font-medium">{equipment.stock_quantity}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{equipment.location_name || '-'}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${equipment.status === 'archived' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                              {equipment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{new Date(equipment.created_at).toLocaleString('en-PH', {timeZone: 'Asia/Manila'})}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{new Date(equipment.updated_at).toLocaleString('en-PH', {timeZone: 'Asia/Manila'})}</td>
                          <td className="px-6 py-4 text-sm">
                            {equipment.status === 'archived' ? (
                              <div className="text-sm text-gray-600">
                                {equipment.updated_at ? new Date(equipment.updated_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) : 'Archived'}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditClick(equipment)}
                                    className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleArchiveClick(equipment)}
                                    className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold"
                                  >
                                    Archive
                                  </button>
                                </div>
                                <div className="flex">
                                  <button
                                    onClick={() => handleStockUpdateClick(equipment)}
                                    className="inline-flex items-center bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold"
                                  >
                                    Update Stock
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile/card view (hidden on md+) */}
              <div className="md:hidden space-y-3">
                {equipmentList.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-500">No equipment found.</div>
                ) : (
                  equipmentList.map(equipment => (
                    <div key={equipment.equipment_id} className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-gray-800 truncate">{equipment.name}</h3>
                            <span className={`text-xs font-medium inline-flex items-center px-2 py-0.5 rounded-full ${equipment.status === 'archived' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                              {equipment.status}
                            </span>
                          </div>

                          <p className="text-xs text-gray-600 mt-1 truncate">{equipment.description || '-'}</p>
                          <div className="mt-2 text-xs text-gray-600 grid grid-cols-2 gap-2">
                            <div><strong>Category:</strong> <span className="ml-1">{equipment.category_name || '-'}</span></div>
                            <div><strong>Stock:</strong> <span className="ml-1 font-medium">{equipment.stock_quantity}</span></div>
                            <div><strong>Storage:</strong> <span className="ml-1">{equipment.location_name || '-'}</span></div>
                            <div><strong>Updated:</strong> <span className="ml-1">{new Date(equipment.updated_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</span></div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-col sm:flex-row gap-2">
                          {equipment.status === 'archived' ? (
                            <div className="w-full text-left text-xs text-gray-600">
                              <div><strong>Archived:</strong> {equipment.updated_at ? new Date(equipment.updated_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) : 'Archived'}</div>
                            </div>
                          ) : (
                            <>
                              <div className="flex gap-2 w-full">
                                <button
                                  onClick={() => handleEditClick(equipment)}
                                  className="flex-1 inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-xs font-semibold"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleArchiveClick(equipment)}
                                  className="flex-1 inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-xs font-semibold"
                                >
                                  Archive
                                </button>
                              </div>
                              <button
                                onClick={() => handleStockUpdateClick(equipment)}
                                className="w-full inline-flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-md text-xs font-semibold"
                              >
                                Update Stock
                              </button>
                            </>
                          )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stock Update Modal */}
      {showStockModal && selectedEquipment && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Update Stock</h3>
              <button
                onClick={() => { setShowStockModal(false); setSelectedEquipment(null); setQuantityToAdd(0); }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <div className="bg-gray-50 p-3 rounded border border-gray-100">
                <p className="text-sm text-gray-700"><strong>Name:</strong> {selectedEquipment.name}</p>
                <p className="text-sm text-gray-700"><strong>Current Stock:</strong> {selectedEquipment.stock_quantity}</p>
                <p className="text-sm text-gray-700"><strong>Category:</strong> {selectedEquipment.category_name || 'N/A'}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">Quantity to Add</label>
              <input
                type="number"
                value={quantityToAdd}
                onChange={e => setQuantityToAdd(parseInt(e.target.value, 10) || 0)}
                min="0"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter quantity to add"
              />
            </div>

            <div className="mb-4 text-sm text-gray-600">
              <strong>New Stock Total:</strong> {selectedEquipment.stock_quantity + quantityToAdd}
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => { setShowStockModal(false); setSelectedEquipment(null); setQuantityToAdd(0); }}
                className="px-4 py-2 rounded-md bg-white border border-gray-200 text-gray-700 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStockUpdate}
                className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-auto mx-4">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{formMode === 'add' ? 'Add New Equipment' : 'Edit Equipment'}</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Name</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    maxLength={100}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Stock Quantity</label>
                  <input
                    name="stock_quantity"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    min="0"
                    required
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-md bg-white border border-gray-200 text-gray-700 text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
                  >
                    {formMode === 'add' ? 'Add Equipment' : 'Update Equipment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Archive Modal */}
      {showArchiveModal && equipmentToArchive && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-red-600">Archive Equipment</h3>
              <button
                onClick={() => { setShowArchiveModal(false); setEquipmentToArchive(null); }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <div className="bg-gray-50 p-3 rounded border border-gray-100">
                <p className="text-sm text-gray-700"><strong>Name:</strong> {equipmentToArchive.name}</p>
                <p className="text-sm text-gray-700"><strong>Description:</strong> {equipmentToArchive.description || 'N/A'}</p>
                <p className="text-sm text-gray-700"><strong>Category:</strong> {equipmentToArchive.category_name || 'N/A'}</p>
                <p className="text-sm text-gray-700"><strong>Current Stock:</strong> {equipmentToArchive.stock_quantity}</p>
                <p className="text-sm text-gray-700"><strong>Status:</strong> {equipmentToArchive.status}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              <strong>Warning:</strong> This action will archive the equipment and mark it as archived. It will no longer be available for regular operations.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowArchiveModal(false); setEquipmentToArchive(null); }}
                className="px-4 py-2 rounded-md bg-white border border-gray-200 text-gray-700 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleArchiveConfirm}
                className="px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activate Modal */}
      {showActivateModal && equipmentToActivate && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-blue-600">Activate Equipment</h3>
              <button
                onClick={() => { setShowActivateModal(false); setEquipmentToActivate(null); }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <div className="bg-gray-50 p-3 rounded border border-gray-100">
                <p className="text-sm text-gray-700"><strong>Name:</strong> {equipmentToActivate.name}</p>
                <p className="text-sm text-gray-700"><strong>Description:</strong> {equipmentToActivate.description || 'N/A'}</p>
                <p className="text-sm text-gray-700"><strong>Category:</strong> {equipmentToActivate.category_name || 'N/A'}</p>
                <p className="text-sm text-gray-700"><strong>Current Stock:</strong> {equipmentToActivate.stock_quantity}</p>
                <p className="text-sm text-gray-700"><strong>Status:</strong> {equipmentToActivate.status}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Activating will make this equipment available again for regular operations.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowActivateModal(false); setEquipmentToActivate(null); }}
                className="px-4 py-2 rounded-md bg-white border border-gray-200 text-gray-700 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleActivateConfirm}
                className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                Activate
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed bottom-6 right-6 bg-gradient-to-r from-green-600 to-green-500 text-white px-5 py-3 rounded-lg shadow-lg z-50">
          <div className="text-sm">{notification}</div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
