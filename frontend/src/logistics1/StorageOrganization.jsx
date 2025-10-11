import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { logisticsI } from '../api/logisticsI';

const StorageOrganization = () => {
  // State for equipment, categories, and locations
  const [equipmentList, setEquipmentList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [unassignedFilter, setUnassignedFilter] = useState(false);

  // Bulk operation states
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [bulkLocationId, setBulkLocationId] = useState('');

  // Modal states
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showQuickAssignModal, setShowQuickAssignModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  // New: Add Category / Add Location modal & form states
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationDescription, setNewLocationDescription] = useState('');
  const [adding, setAdding] = useState(false);

  // Notification state
  const [notification, setNotification] = useState('');

  // Organization overview states
  const [orgStats, setOrgStats] = useState({
    totalEquipment: 0,
    assignedLocations: 0,
    assignedCategories: 0,
    unassignedItems: 0
  });

  // New: Manage modal & loading state
  const [showManageModal, setShowManageModal] = useState(false);
  const [managingLoading, setManagingLoading] = useState(false);

  // Fetch all data - simplified approach using backend's built-in all parameter
  const fetchEquipment = async (showAll = false) => {
    setLoading(true);
    try {
      const params = {};
      if (showAll) params.all = 'true';

      const response = await axios.get(logisticsI.backend.api.equipment, { params });
      let equipmentData = [];

      // Handle different response formats (direct array or Laravel paginator)
      if (Array.isArray(response.data)) {
        equipmentData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        equipmentData = response.data.data;
      } else if (response.data && typeof response.data === 'object') {
        equipmentData = response.data.data || [];
      }

      // Sort by creation date (newest first) if items are present
      if (Array.isArray(equipmentData) && equipmentData.length > 0) {
        equipmentData = equipmentData.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateB - dateA;
        });
      }

      setEquipmentList(equipmentData);
      calculateOrgStats(equipmentData);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      setNotification('Error loading equipment data');
      setTimeout(() => setNotification(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(logisticsI.backend.api.equipmentCategory);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await axios.get(logisticsI.backend.api.storageLocation);
      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching storage locations:', error);
    }
  };

  // Calculate organization statistics
  const calculateOrgStats = (equipment) => {
    const total = equipment.length;
    const assignedLocations = equipment.filter(item => item.storage_location_id).length;
    const assignedCategories = equipment.filter(item => item.category_id).length;
    const unassignedItems = equipment.filter(item => !item.storage_location_id || !item.category_id).length;

    setOrgStats({
      totalEquipment: total,
      assignedLocations,
      assignedCategories,
      unassignedItems
    });
  };

  useEffect(() => {
    // Request all records from backend so overview shows every item (not just paginated 10)
    fetchEquipment(true);
    fetchCategories();
    fetchLocations();
  }, []);

  // Filter equipment based on search and filters
  const filteredEquipment = equipmentList.filter(equipment => {
    const matchesSearch = equipment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         equipment.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Compare as strings and guard null/undefined so filter works correctly
    const matchesCategory = !selectedCategory || 
      (equipment.category_id != null && String(equipment.category_id) === String(selectedCategory));
    const matchesLocation = !selectedLocation ||
      (equipment.storage_location_id != null && String(equipment.storage_location_id) === String(selectedLocation));
    const matchesUnassigned = !unassignedFilter ||
                             (!equipment.category_id || !equipment.storage_location_id);

    return matchesSearch && matchesCategory && matchesLocation && matchesUnassigned;
  });

  // derive non-archived filtered items for selection logic
  const nonArchivedFiltered = filteredEquipment.filter(item => item.status !== 'archived');

  // Handle individual equipment assignment
  const handleQuickAssign = async (equipmentId, categoryId, locationId) => {
    try {
      // guard: don't allow updates for archived equipment
      const equipment = equipmentList.find(e => e.equipment_id === equipmentId);
      if (!equipment || equipment.status === 'archived') {
        setNotification('Cannot assign archived equipment');
        setTimeout(() => setNotification(''), 3000);
        return;
      }

      if (categoryId) {
        const url = logisticsI.backend.api.categorizeEquipment
          .replace('{equipmentId}', equipmentId)
          .replace('{categoryId}', categoryId);
        await axios.put(url);
      }

      if (locationId) {
        const updateUrl = logisticsI.backend.api.equipmentUpdate.replace('{id}', equipmentId);
        await axios.put(updateUrl, { storage_location_id: locationId });
      }

      fetchEquipment();
      setShowQuickAssignModal(false);
      setSelectedEquipment(null);
      setNotification('Equipment assignment updated successfully');
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Error updating equipment assignment:', error);
    }
  };

  // Handle bulk assignment
  const handleBulkAssign = async () => {
    if (selectedItems.size === 0) {
      alert('Please select items to assign');
      return;
    }

    try {
      // Only operate on non-archived selected items
      const effectiveIds = Array.from(selectedItems).filter(id => {
        const e = equipmentList.find(it => it.equipment_id === id);
        return e && e.status !== 'archived';
      });

      if (effectiveIds.length === 0) {
        alert('Selected items are archived and cannot be assigned.');
        return;
      }

      const promises = [];

      effectiveIds.forEach(equipmentId => {
        if (bulkCategoryId) {
          const url = logisticsI.backend.api.categorizeEquipment
            .replace('{equipmentId}', equipmentId)
            .replace('{categoryId}', bulkCategoryId);
          promises.push(axios.put(url));
        }

        if (bulkLocationId) {
          const updateUrl = logisticsI.backend.api.equipmentUpdate.replace('{id}', equipmentId);
          promises.push(axios.put(updateUrl, { storage_location_id: bulkLocationId }));
        }
      });

      await Promise.all(promises);
      fetchEquipment();
      setShowBulkModal(false);
      setSelectedItems(new Set());
      setBulkCategoryId('');
      setBulkLocationId('');
      setBulkMode(false);
      setNotification(`Successfully assigned ${effectiveIds.length} items`);
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Error bulk assigning equipment:', error);
    }
  };

  // Handle item selection for bulk operations
  const handleItemSelect = (equipmentId) => {
    // prevent selecting archived items
    const equipment = equipmentList.find(e => e.equipment_id === equipmentId);
    if (!equipment || equipment.status === 'archived') return;

    const newSelected = new Set(selectedItems);
    if (newSelected.has(equipmentId)) {
      newSelected.delete(equipmentId);
    } else {
      newSelected.add(equipmentId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === nonArchivedFiltered.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(nonArchivedFiltered.map(item => item.equipment_id)));
    }
  };

  // Open quick assign modal
  const openQuickAssignModal = (equipment) => {
    // don't open for archived equipment
    if (equipment.status === 'archived') {
      setNotification('Cannot assign archived equipment');
      setTimeout(() => setNotification(''), 3000);
      return;
    }
    setSelectedEquipment(equipment);
    setShowQuickAssignModal(true);
  };

  // New: handlers to add category / location
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setNotification('Category name is required');
      setTimeout(() => setNotification(''), 3000);
      return;
    }
    try {
      setAdding(true);
      await axios.post(logisticsI.backend.api.equipmentCategoryAdd, { category_name: newCategoryName.trim() });
      await fetchCategories();
      setShowAddCategoryModal(false);
      setNewCategoryName('');
      setNotification('Category added successfully');
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Error adding category:', error);
      setNotification('Failed to add category');
      setTimeout(() => setNotification(''), 3000);
    } finally {
      setAdding(false);
    }
  };

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) {
      setNotification('Location name is required');
      setTimeout(() => setNotification(''), 3000);
      return;
    }
    try {
      setAdding(true);
      await axios.post(logisticsI.backend.api.storageLocationAdd, {
        location_name: newLocationName.trim(),
        description: newLocationDescription.trim()
      });
      await fetchLocations();
      setShowAddLocationModal(false);
      setNewLocationName('');
      setNewLocationDescription('');
      setNotification('Location added successfully');
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Error adding location:', error);
      setNotification('Failed to add location');
      setTimeout(() => setNotification(''), 3000);
    } finally {
      setAdding(false);
    }
  };

  // New: helpers to archive category / location — try common endpoint patterns gracefully
  const tryApiRequests = async (candidates, payload) => {
    for (const candidate of candidates) {
      if (!candidate) continue;
      try {
        // candidate may contain placeholder {id}
        if (candidate.includes('{id}')) {
          // PUT with payload (status change) first
          try {
            await axios.put(candidate, payload);
            return true;
          } catch {}
          // then try DELETE
          try {
            await axios.delete(candidate);
            return true;
          } catch {}
        } else {
          // attempt direct URL variations
          try {
            // try PUT first
            await axios.put(candidate, payload);
            return true;
          } catch {}
          try {
            await axios.delete(candidate);
            return true;
          } catch {}
        }
      } catch (err) {
        // continue to next candidate
      }
    }
    return false;
  };

  const archiveCategory = async (category) => {
    if (!category || !category.category_id) return;
    if (!window.confirm(`Archive category "${category.category_name}"? This cannot be undone easily.`)) return;

    setManagingLoading(true);
    try {
      const id = category.category_id;
      const candidates = [
        // explicit archive endpoint if present
        logisticsI?.backend?.api?.equipmentCategoryArchive?.replace('{id}', id),
        // update endpoint patterns
        logisticsI?.backend?.api?.equipmentCategoryUpdate?.replace('{id}', id),
        // base listing endpoint with id appended
        logisticsI?.backend?.api?.equipmentCategory ? `${logisticsI.backend.api.equipmentCategory.replace(/\/$/, '')}/${id}` : null
      ];
      const success = await tryApiRequests(candidates, { status: 'archived' });
      if (success) {
        setNotification(`Category "${category.category_name}" archived`);
        await fetchCategories();
      } else {
        setNotification('Failed to archive category (no compatible endpoint found)');
      }
    } catch (err) {
      console.error('Error archiving category:', err);
      setNotification('Error archiving category');
    } finally {
      setManagingLoading(false);
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const archiveLocation = async (location) => {
    if (!location || !location.storage_location_id) return;
    if (!window.confirm(`Archive location "${location.location_name}"? This cannot be undone easily.`)) return;

    setManagingLoading(true);
    try {
      const id = location.storage_location_id;
      const candidates = [
        logisticsI?.backend?.api?.storageLocationArchive?.replace('{id}', id),
        logisticsI?.backend?.api?.storageLocationUpdate?.replace('{id}', id),
        logisticsI?.backend?.api?.storageLocation ? `${logisticsI.backend.api.storageLocation.replace(/\/$/, '')}/${id}` : null
      ];
      const success = await tryApiRequests(candidates, { status: 'archived' });
      if (success) {
        setNotification(`Location "${location.location_name}" archived`);
        await fetchLocations();
      } else {
        setNotification('Failed to archive location (no compatible endpoint found)');
      }
    } catch (err) {
      console.error('Error archiving location:', err);
      setNotification('Error archiving location');
    } finally {
      setManagingLoading(false);
      setTimeout(() => setNotification(''), 3000);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Storage Organization</h2>

      {/* Organization Overview */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Organization Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{orgStats.totalEquipment}</div>
            <div className="text-sm text-blue-800">Total Equipment</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{orgStats.assignedLocations}</div>
            <div className="text-sm text-green-800">Assigned Locations</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{orgStats.assignedCategories}</div>
            <div className="text-sm text-purple-800">Assigned Categories</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{orgStats.unassignedItems}</div>
            <div className="text-sm text-red-800">Unassigned Items</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center space-x-4 flex-1">
          <input
            type="text"
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full md:w-64"
          />

          {/* Category filter - set same size as Location filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full md:w-48"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              // ensure option value is a string for consistent comparisons
              <option key={cat.category_id} value={String(cat.category_id)}>
                {cat.category_name}
              </option>
            ))}
          </select>

          {/* Location filter - match Category width */}
          <select
            value={selectedLocation}
            onChange={e => setSelectedLocation(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full md:w-48"
          >
            <option value="">All Locations</option>
            {locations.map(loc => (
              // ensure option value is a string for consistent comparisons
              <option key={loc.storage_location_id} value={String(loc.storage_location_id)}>
                {loc.location_name}
              </option>
            ))}
          </select>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={unassignedFilter}
              onChange={e => setUnassignedFilter(e.target.checked)}
              className="mr-2"
            />
            Show Unassigned Only
          </label>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setBulkMode(!bulkMode)}
            className={`px-4 py-2 rounded ${bulkMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            {bulkMode ? 'Exit Bulk Mode' : 'Bulk Assign'}
          </button>
          <button
            onClick={() => {
              setShowBulkModal(true);
              setBulkCategoryId('');
              setBulkLocationId('');
            }}
            disabled={!bulkMode || selectedItems.size === 0}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Assign Selected ({selectedItems.size})
          </button>

          {/* New: Add Category & Add Location buttons */}
          {/* Add Category & Add Location moved into Manage modal */}

          {/* New: Manage button */}
          <button
            onClick={() => setShowManageModal(true)}
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
            title="View and manage all categories and locations"
          >
            Manage Categories & Locations
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading equipment...</p>
      ) : (
        <>
          {bulkMode && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Bulk Assignment Mode</h4>
              <p className="text-sm text-blue-700">
                Select items using checkboxes, then click "Assign Selected" to assign them to categories and locations.
              </p>
            </div>
          )}

          <table className="min-w-full border border-gray-300 rounded overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                {bulkMode && (
                  <th className="text-left px-4 py-2 border-b border-gray-300 w-12">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === nonArchivedFiltered.length && nonArchivedFiltered.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                      aria-label="select all non-archived"
                    />
                  </th>
                )}
                <th className="text-left px-4 py-2 border-b border-gray-300">Equipment</th>
                <th className="text-left px-4 py-2 border-b border-gray-300">Category</th>
                <th className="text-left px-4 py-2 border-b border-gray-300">Storage Location</th>
                <th className="text-left px-4 py-2 border-b border-gray-300">Stock</th>
                <th className="text-left px-4 py-2 border-b border-gray-300">Status</th>
                <th className="text-left px-4 py-2 border-b border-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipment.length === 0 ? (
                <tr>
                  <td colSpan={bulkMode ? "7" : "6"} className="text-center py-4">
                    {searchQuery || selectedCategory || selectedLocation || unassignedFilter
                      ? 'No equipment matches your filters.'
                      : 'No equipment found.'}
                  </td>
                </tr>
              ) : (
                filteredEquipment.map(equipment => (
                  <tr key={equipment.equipment_id} className="hover:bg-gray-50">
                    {bulkMode && (
                      <td className="px-4 py-2 border-b border-gray-300">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(equipment.equipment_id)}
                          onChange={() => handleItemSelect(equipment.equipment_id)}
                          className={`rounded ${equipment.status === 'archived' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={equipment.status === 'archived'}
                          title={equipment.status === 'archived' ? 'Archived items cannot be selected' : 'Select item'}
                        />
                      </td>
                    )}
                    <td className="px-4 py-2 border-b border-gray-300">
                      <div>
                        <div className="font-medium">{equipment.name}</div>
                        {equipment.description && (
                          <div className="text-sm text-gray-600">{equipment.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 border-b border-gray-300">
                      <span className={`px-2 py-1 rounded text-xs ${
                        equipment.category_id
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {equipment.category_name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-4 py-2 border-b border-gray-300">
                      <span className={`px-2 py-1 rounded text-xs ${
                        equipment.storage_location_id
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {equipment.location_name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-4 py-2 border-b border-gray-300">
                      <span className={`px-2 py-1 rounded text-xs ${
                        equipment.stock_quantity <= 3
                          ? 'bg-red-100 text-red-800'
                          : equipment.stock_quantity >= 50
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {equipment.stock_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-2 border-b border-gray-300">
                      <span className={`px-2 py-1 rounded text-xs ${
                        equipment.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {equipment.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 border-b border-gray-300">
                      {!bulkMode ? (
                        <button
                          onClick={() => openQuickAssignModal(equipment)}
                          className={`px-3 py-1 rounded text-sm ${equipment.status === 'archived' ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                          disabled={equipment.status === 'archived'}
                          title={equipment.status === 'archived' ? 'Cannot assign archived equipment' : 'Quick Assign'}
                        >
                          {equipment.status === 'archived' ? 'Archived' : 'Quick Assign'}
                        </button>
                      ) : (
                        <span className="text-sm text-gray-500">Bulk Mode</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}

      {/* Bulk Assignment Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Bulk Assign Equipment</h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Assigning {selectedItems.size} selected items
              </p>
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-medium">Category:</label>
              <select
                value={bulkCategoryId}
                onChange={e => setBulkCategoryId(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">-- No Category Change --</option>
                {categories.map(cat => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-medium">Storage Location:</label>
              <select
                value={bulkLocationId}
                onChange={e => setBulkLocationId(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">-- No Location Change --</option>
                {locations.map(loc => (
                  <option key={loc.storage_location_id} value={loc.storage_location_id}>
                    {loc.location_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleBulkAssign}
                disabled={!bulkCategoryId && !bulkLocationId}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Assign Items
              </button>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkCategoryId('');
                  setBulkLocationId('');
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Assign Modal */}
      {showQuickAssignModal && selectedEquipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Quick Assign Equipment</h3>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Equipment Details:</h4>
              <div className="bg-gray-50 p-3 rounded">
                <p><strong>Name:</strong> {selectedEquipment.name}</p>
                <p><strong>Current Category:</strong> {selectedEquipment.category_name || 'Unassigned'}</p>
                <p><strong>Current Location:</strong> {selectedEquipment.location_name || 'Unassigned'}</p>
                <p><strong>Stock:</strong> {selectedEquipment.stock_quantity}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-medium">Assign Category:</label>
              <select
                value={selectedEquipment ? (selectedEquipment.category_id != null ? String(selectedEquipment.category_id) : '') : ''}
                onChange={e => setSelectedEquipment({...selectedEquipment, category_id: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">-- No Category --</option>
                {categories.map(cat => (
                  <option key={cat.category_id} value={String(cat.category_id)}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-medium">Assign Storage Location:</label>
              <select
                value={selectedEquipment ? (selectedEquipment.storage_location_id != null ? String(selectedEquipment.storage_location_id) : '') : ''}
                onChange={e => setSelectedEquipment({...selectedEquipment, storage_location_id: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">-- No Location --</option>
                {locations.map(loc => (
                  <option key={loc.storage_location_id} value={String(loc.storage_location_id)}>
                    {loc.location_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => handleQuickAssign(
                  selectedEquipment.equipment_id,
                  selectedEquipment.category_id,
                  selectedEquipment.storage_location_id
                )}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Update Assignment
              </button>
              <button
                onClick={() => {
                  setShowQuickAssignModal(false);
                  setSelectedEquipment(null);
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New: Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Add Category</h3>

            <div className="mb-4">
              <label className="block mb-2 font-medium">Category Name:</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter category name"
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleAddCategory}
                disabled={adding}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add Category'}
              </button>
              <button
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setNewCategoryName('');
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New: Add Storage Location Modal */}
      {showAddLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Add Storage Location</h3>

            <div className="mb-4">
              <label className="block mb-2 font-medium">Location Name:</label>
              <input
                type="text"
                value={newLocationName}
                onChange={e => setNewLocationName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter location name"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-medium">Description:</label>
              <textarea
                value={newLocationDescription}
                onChange={e => setNewLocationDescription(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter location description (optional)"
                rows="3"
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleAddLocation}
                disabled={adding}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add Location'}
              </button>
              <button
                onClick={() => {
                  setShowAddLocationModal(false);
                  setNewLocationName('');
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Categories & Locations Modal */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Manage Categories & Locations</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={async () => { setManagingLoading(true); await fetchCategories(); await fetchLocations(); setManagingLoading(false); }}
                  className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                >
                  Refresh
                </button>
                <button
                  onClick={() => setShowManageModal(false)}
                  className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Categories</h4>
                <div className="space-y-3">
                  <div className="mb-3">
                    <button
                      onClick={() => setShowAddCategoryModal(true)}
                      className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                    >
                      Add Category
                    </button>
                  </div>
                  {categories.length === 0 ? <p className="text-sm text-gray-500">No categories found.</p> : null}
                  {categories.map(cat => (
                    <div key={cat.category_id} className="border rounded p-3 flex items-start justify-between">
                      <div>
                        <div className="font-medium">{cat.category_name}</div>
                        {cat.description && <div className="text-sm text-gray-600">{cat.description}</div>}
                        {cat.status && <div className="text-xs text-gray-500 mt-1">Status: {cat.status}</div>}
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        {cat.status === 'archived' ? (
                          <span className="text-sm text-red-600">Archived</span>
                        ) : (
                          <button
                            onClick={() => archiveCategory(cat)}
                            disabled={managingLoading}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            {managingLoading ? 'Working...' : 'Archive'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Storage Locations</h4>
                <div className="space-y-3">
                  <div className="mb-3">
                    <button
                      onClick={() => setShowAddLocationModal(true)}
                      className="bg-teal-600 text-white px-3 py-1 rounded hover:bg-teal-700"
                    >
                      Add Location
                    </button>
                  </div>
                  {locations.length === 0 ? <p className="text-sm text-gray-500">No storage locations found.</p> : null}
                  {locations.map(loc => (
                    <div key={loc.storage_location_id} className="border rounded p-3 flex items-start justify-between">
                      <div>
                        <div className="font-medium">{loc.location_name}</div>
                        {loc.description && <div className="text-sm text-gray-600">{loc.description}</div>}
                        {loc.status && <div className="text-xs text-gray-500 mt-1">Status: {loc.status}</div>}
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        {loc.status === 'archived' ? (
                          <span className="text-sm text-red-600">Archived</span>
                        ) : (
                          <button
                            onClick={() => archiveLocation(loc)}
                            disabled={managingLoading}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            {managingLoading ? 'Working...' : 'Archive'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {notification && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded shadow-lg z-50">
          {notification}
        </div>
      )}
    </div>
  );
};

export default StorageOrganization;