import React, { useState, useEffect, useRef } from 'react';
import { logisticsI } from '../api/logisticsI';

const StockMonitoring = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [equipment, setEquipment] = useState([]);
    const [equipmentIssues, setEquipmentIssues] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [overstockItems, setOverstockItems] = useState([]);
    const [equipmentTotal, setEquipmentTotal] = useState(0);
    const [lowStockTotal, setLowStockTotal] = useState(0);
    const [overstockTotal, setOverstockTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // --- new modal states ---
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [archiveType, setArchiveType] = useState(null); // 'category' | 'location'
    const [archiveItem, setArchiveItem] = useState(null);
    const [archiving, setArchiving] = useState(false);

    // Request stock modal states
    const [showRequestStockModal, setShowRequestStockModal] = useState(false);
    const [requestingStock, setRequestingStock] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);

    // Quantity input modal states
    const [showQuantityModal, setShowQuantityModal] = useState(false);
    const [quantities, setQuantities] = useState({});
    const [submittingRequests, setSubmittingRequests] = useState(false);
    const [quantityErrors, setQuantityErrors] = useState({});
    // Report broken items modal
    const [showReportBrokenModal, setShowReportBrokenModal] = useState(false);
    const [brokenItemsToReport, setBrokenItemsToReport] = useState([]);
    const [reportingBroken, setReportingBroken] = useState(false);
    const [showIssueListModal, setShowIssueListModal] = useState(false);
    // Description modal for reported items table
    const [showDescriptionModal, setShowDescriptionModal] = useState(false);
    const [selectedIssueForDescription, setSelectedIssueForDescription] = useState(null);

    // new refs and toast state
    const modalConfirmRef = useRef(null);
    const modalPanelRef = useRef(null);
    // toast now supports a type and title, and will auto-hide
    const [toast, setToast] = useState({ show: false, message: '', type: 'success', title: '' });
    // Issue reporting (report-on-submit modal states kept below)

    // helper to normalize paginated or plain responses
    const normalizeResponse = (resData) => {
        // If response is an array -> items are the array, total is length
        if (Array.isArray(resData)) {
            return { items: resData, total: resData.length };
        }
        // If response has .data as array -> common paginated shape
        if (resData && Array.isArray(resData.data)) {
            // Try multiple common places for total count
            const total =
                resData.total ??
                (resData.meta && (resData.meta.total || resData.meta.pagination?.total)) ??
                (resData.meta && (resData.meta.total_count || resData.meta.totalCount)) ??
                resData.data.length;
            return { items: resData.data, total };
        }
        // Fallback: if object contains items property
        if (resData && Array.isArray(resData.items)) {
            return { items: resData.items, total: resData.total ?? resData.items.length };
        }
        // Unknown shape: return empty
        return { items: [], total: 0 };
    };

    // Fetch all data
    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Try to request a large page size (if backend supports per_page/perPage)
            const perPageParam = '?per_page=10000';

            // Fetch equipment and alerts but don't fail entirely if one endpoint is down.
            const fetchPromises = await Promise.allSettled([
                fetch(`${logisticsI.backend.uri}/api/equipment${perPageParam}`),
                fetch(`${logisticsI.backend.uri}/api/low-stock-alert${perPageParam}`),
                fetch(`${logisticsI.backend.uri}/api/overstock-alert${perPageParam}`)
            ]);

            // Normalize results: if a fetch failed, treat its data as empty list with total 0
            const equipmentRes = fetchPromises[0].status === 'fulfilled' ? fetchPromises[0].value : null;
            const lowStockRes = fetchPromises[1].status === 'fulfilled' ? fetchPromises[1].value : null;
            const overstockRes = fetchPromises[2].status === 'fulfilled' ? fetchPromises[2].value : null;

            let equipmentData = [];
            let lowStockData = [];
            let overstockData = [];

            try { if (equipmentRes && equipmentRes.ok) equipmentData = await equipmentRes.json(); } catch(e){ console.error('equipment json parse failed', e); }
            try { if (lowStockRes && lowStockRes.ok) lowStockData = await lowStockRes.json(); } catch(e){ console.error('lowStock json parse failed', e); }
            try { if (overstockRes && overstockRes.ok) overstockData = await overstockRes.json(); } catch(e){ console.error('overstock json parse failed', e); }

                // Try to fetch equipment issues from backend (optional endpoint)
                // Normalize to a predictable shape matching the equipment_issues table
                let issues = [];
                    try {
                        // Use explicit backend uri with per_page param for predictable shape
                        const url = `${logisticsI.backend.uri}/api/equipment-issues${perPageParam}`;
                        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
                        if (res && res.ok) {
                            const data = await res.json();
                            const norm = normalizeResponse(data);
                            issues = norm.items.map(issue => ({
                                id: issue.id ?? issue.issue_id ?? null,
                                equipment_id: issue.equipment_id ?? null,
                                item_name: issue.item_name ?? issue.equipment_name ?? issue.name ?? null,
                                equipment_name: issue.equipment_name ?? null,
                                category_name: issue.category_name ?? null,
                                location_name: issue.location_name ?? null,
                                stock_quantity: issue.stock_quantity ?? (issue.stock ?? null),
                                description: issue.description ?? '',
                                reported_by: issue.reported_by ?? issue.reported_by_name ?? 'Unknown',
                                status: issue.status ?? 'open',
                                created_at: issue.created_at ?? issue.createdAt ?? issue.created ?? null,
                                updated_at: issue.updated_at ?? issue.updatedAt ?? issue.updated ?? null
                            }));
                            console.debug('Fetched equipmentIssues via', url, 'count=', issues.length);
                        } else if (res) {
                            const text = await res.text();
                            console.error('equipment-issues request failed', res.status, text);
                        }
                    } catch (e) {
                        console.error('equipment-issues fetch failed', e);
                    }

            const equipNorm = normalizeResponse(equipmentData);
            const lowNorm = normalizeResponse(lowStockData);
            const overNorm = normalizeResponse(overstockData);

            setEquipment(equipNorm.items);
            setEquipmentTotal(equipNorm.total);

            setLowStockItems(lowNorm.items);
            setLowStockTotal(lowNorm.total);

            // equipmentIssues will be an array of normalized objects matching equipment_issues
            setEquipmentIssues(issues);

            setOverstockItems(overNorm.items);
            setOverstockTotal(overNorm.total);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching stock data:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchData();
    }, []);

    // derive problem items: low stock OR explicit status markers like 'broken'/'damaged'
    const problemItems = (() => {
        // Prefer server-backed equipment issues when present
        if (equipmentIssues && equipmentIssues.length > 0) {
            // join with equipment table if equipment_id present; otherwise rely on issue item_name
            return equipmentIssues.map(issue => {
                const equip = equipment.find(e => e.equipment_id === issue.equipment_id);
                return {
                    equipment_id: issue.equipment_id ?? `issue-${issue.id}`,
                    name: equip?.name ?? issue.item_name ?? 'Unknown Item',
                    category_name: equip?.category_name,
                    location_name: equip?.location_name,
                    stock_quantity: equip?.stock_quantity ?? null,
                    status: issue.status || 'open',
                    issue_id: issue.id,
                    issue_description: issue.description,
                    reported_by: issue.reported_by
                };
            });
        }

        const byId = new Map();
        // include low stock items first
        (lowStockItems || []).forEach(i => byId.set(i.equipment_id, i));
        // include items with status broken/damaged
        (equipment || []).forEach(i => {
            const s = (i.status || '').toLowerCase();
            if (s === 'broken' || s === 'damaged' || s === 'problem' ) {
                byId.set(i.equipment_id, i);
            }
        });
        return Array.from(byId.values());
    })();

    // Handle refresh
    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
    };

    const openIssueListModal = () => setShowIssueListModal(true);
    const closeIssueListModal = () => setShowIssueListModal(false);

    const openDescriptionModal = (issue) => {
        setSelectedIssueForDescription(issue);
        setShowDescriptionModal(true);
    };

    const closeDescriptionModal = () => {
        setSelectedIssueForDescription(null);
        setShowDescriptionModal(false);
    };

    // Handle request stock
    const handleRequestStock = () => {
        setSelectedItems([]);
        setShowRequestStockModal(true);
    };

    const toggleItemSelection = (equipmentId) => {
        setSelectedItems(prev => {
            if (prev.includes(equipmentId)) {
                return prev.filter(id => id !== equipmentId);
            } else {
                return [...prev, equipmentId];
            }
        });
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === lowStockItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(lowStockItems.map(item => item.equipment_id));
        }
    };

    const handleSubmitRequest = () => {
        if (selectedItems.length === 0) {
            setToast({
                show: true,
                type: 'error',
                title: 'No Selection',
                message: 'Please select at least one item to request stock.'
            });
            return;
        }

        // Initialize quantities with default values (10 - current stock, minimum 1)
        const initialQuantities = {};
        selectedItems.forEach(equipmentId => {
            const item = lowStockItems.find(item => item.equipment_id === equipmentId);
            if (item) {
                const suggestedQuantity = Math.max(1, 10 - item.stock_quantity);
                initialQuantities[equipmentId] = suggestedQuantity;
            }
        });
        setQuantities(initialQuantities);

        // Close selection modal and open quantity modal
        setShowRequestStockModal(false);
        setShowQuantityModal(true);
    };

    const handleSubmitQuantities = async () => {
        // Ensure each selected item has a valid quantity; fill missing with suggested default
        const errs = {};
        const normalizedQuantities = { ...quantities };
        selectedItems.forEach(equipmentId => {
            const item = lowStockItems.find(i => i.equipment_id === equipmentId);
            const q = Number(normalizedQuantities[equipmentId] || 0);
            if (!q || q < 1) {
                // default suggestion if missing
                const suggested = Math.max(1, 10 - (item?.stock_quantity || 0));
                normalizedQuantities[equipmentId] = suggested;
                errs[equipmentId] = `Qty set to suggested ${suggested}`;
            }
        });

        if (Object.keys(errs).length > 0) {
            setQuantityErrors(errs);
            setQuantities(normalizedQuantities);
            setToast({ show: true, type: 'error', title: 'Quantities Adjusted', message: 'Some quantities were missing and have been set to suggested values.' });
            // allow user to review before final submit
            return;
        }

        // Check for broken/problem items among selected items
        const broken = selectedItems.filter(equipmentId => {
            // search in equipment list first, fallback to lowStockItems
            const eq = equipment.find(e => e.equipment_id === equipmentId) || lowStockItems.find(i => i.equipment_id === equipmentId);
            const s = (eq?.status || '').toLowerCase();
            return s === 'broken' || s === 'damaged' || s === 'problem';
        });

        if (broken.length > 0) {
            // prepare broken items info for modal
            const toReport = broken.map(id => {
                const eq = equipment.find(e => e.equipment_id === id) || lowStockItems.find(i => i.equipment_id === id) || { equipment_id: id, name: 'Unknown' };
                return { equipment_id: id, name: eq.name, current_stock: eq.stock_quantity ?? 0 };
            });
            setBrokenItemsToReport(toReport);
            setShowReportBrokenModal(true);
            // don't continue submission now; wait for user action in modal
            return;
        }

        // No broken items: proceed to submit
        await performSubmitRequests();
    };

    // Extracted submission flow so it can be called after reporting broken items
    const performSubmitRequests = async () => {
        setSubmittingRequests(true);
        try {
            // Prepare requests array
            const requests = selectedItems.map(equipmentId => {
                const item = lowStockItems.find(item => item.equipment_id === equipmentId);
                return {
                    item_name: item.name,
                    quantity: quantities[equipmentId],
                    requested_by: 'requested by SWS'
                };
            });

            // Submit all requests
            const promises = requests.map(request =>
                fetch(logisticsI.backend.api.lowStockRequests, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(request)
                }).then(async (res) => {
                    if (!res.ok) {
                        // try to parse json error
                        let text = await res.text();
                        try { text = JSON.parse(text); } catch(e){}
                        const msg = (text && text.message) ? text.message : `Request failed with status ${res.status}`;
                        throw new Error(msg);
                    }
                    return res.json();
                })
            );

            // Wait for all requests (each will throw on non-ok)
            const responses = await Promise.all(promises);

            console.debug('Low stock request responses:', responses);

            // Success: refresh data so low stock lists update
            await fetchData();

            setToast({
                show: true,
                type: 'success',
                title: 'Stock Requests Submitted',
                message: `Successfully submitted ${requests.length} stock request(s).`
            });

            // Close modal and reset states
            closeQuantityModal();

        } catch (err) {
            console.error('Error submitting requests:', err);
            setToast({
                show: true,
                type: 'error',
                title: 'Submission Failed',
                message: err.message || 'Failed to submit stock requests.'
            });
        } finally {
            setSubmittingRequests(false);
        }
    };

    // Filter equipment based on search term
    const filteredEquipment = equipment.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Stock level indicator component
    const StockIndicator = ({ quantity, type = 'normal' }) => {
        const getStockColor = () => {
            if (type === 'low' || quantity <= 3) return 'bg-red-100 text-red-800 border-red-200';
            if (type === 'over' || quantity >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            if (quantity <= 10) return 'bg-orange-100 text-orange-800 border-orange-200';
            return 'bg-green-100 text-green-800 border-green-200';
        };

        const getStockIcon = () => {
            if (type === 'low' || quantity <= 3) return '⚠️';
            if (type === 'over' || quantity >= 50) return '📦';
            if (quantity <= 10) return '⚡';
            return '✅';
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStockColor()}`}>
                {getStockIcon()} {quantity} units
            </span>
        );
    };

    // Equipment card component
    const EquipmentCard = ({ item }) => (
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        {item.category_name && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">
                            {item.category_name}
                        </span>}
                    </p>
                    {item.location_name && (
                        <p className="text-sm text-gray-600 mt-1">
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                📍 {item.location_name}
                            </span>
                        </p>
                    )}
                </div>
                <StockIndicator quantity={item.stock_quantity} />
            </div>

            {item.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
            )}

            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Status:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                }`}>
                    {item.status}
                </span>
            </div>
        </div>
    );

    // Selectable equipment card for request stock modal
    const SelectableEquipmentCard = ({ item, isSelected, onToggle }) => (
        <div className={`bg-white rounded-lg shadow-md p-4 border ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'} hover:shadow-lg transition-all`}>
            <div className="flex items-start mb-3">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(item.equipment_id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1 flex-shrink-0"
                />
                <div className="flex-1 ml-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                {item.category_name && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">
                                    {item.category_name}
                                </span>}
                            </p>
                            {item.location_name && (
                                <p className="text-sm text-gray-600 mt-1">
                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                        📍 {item.location_name}
                                    </span>
                                </p>
                            )}
                        </div>
                        <StockIndicator quantity={item.stock_quantity} type="low" />
                    </div>

                    {item.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                    )}

                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Status:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}>
                            {item.status}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    // Loading component
    const LoadingSpinner = () => (
        <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading stock data...</span>
        </div>
    );

    // Error component
    const ErrorMessage = ({ message, onRetry }) => (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    <span className="text-red-400">❌</span>
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
                    <p className="text-sm text-red-700 mt-1">{message}</p>
                    <button
                        onClick={onRetry}
                        className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    );

    // --- allow other components to open the archive modal by dispatching:
    // window.dispatchEvent(new CustomEvent('openArchiveModal', { detail: { item, type: 'category' } }))
    useEffect(() => {
        const handler = (e) => {
            const { item, type } = e.detail || {};
            if (!item || !type) return;
            setArchiveItem(item);
            setArchiveType(type);
            setShowArchiveModal(true);
        };
        window.addEventListener('openArchiveModal', handler);
        return () => window.removeEventListener('openArchiveModal', handler);
    }, []);

    // focus & ESC handler when modal opens
    useEffect(() => {
        if (!showArchiveModal) return;

        // focus confirm button for immediate action
        requestAnimationFrame(() => {
            modalConfirmRef.current?.focus();
        });

        const onKey = (ev) => {
            if (ev.key === 'Escape') closeArchiveModal();
            if (ev.key === 'Enter' && document.activeElement !== document.body) {
                // If Enter pressed while modal open, confirm (prevents accidental submits elsewhere)
                // only trigger when focused inside modal panel
                if (modalPanelRef.current?.contains(document.activeElement)) {
                    confirmArchive();
                }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [showArchiveModal]); // eslint-disable-line

    const openArchiveModal = (item, type) => {
        setArchiveItem(item);
        setArchiveType(type);
        setShowArchiveModal(true);
    };

    const closeArchiveModal = () => {
        setShowArchiveModal(false);
        setArchiveItem(null);
        setArchiveType(null);
        setArchiving(false);
    };

    const closeRequestStockModal = () => {
        setShowRequestStockModal(false);
        setRequestingStock(false);
        // clear selection and quantities when completely closing
        setSelectedItems([]);
        setQuantities({});
        setShowQuantityModal(false);
        setSubmittingRequests(false);
    };

    const closeQuantityModal = () => {
        // used when finishing/cancelling quantity flow entirely
        setShowQuantityModal(false);
        setQuantities({});
        setSubmittingRequests(false);
        setSelectedItems([]);
    };

    // Go back to the selection modal without clearing user's selections/quantities
    const backToSelection = () => {
        setShowQuantityModal(false);
        setShowRequestStockModal(true);
    };

    const confirmArchive = async () => {
        if (!archiveItem || !archiveType) return;
        setArchiving(true);
        try {
            const id = archiveItem.category_id ?? archiveItem.storage_location_id;
            let url = '';
            if (archiveType === 'category') {
                url = logisticsI.backend.api.equipmentCategoryArchive.replace('{id}', id);
            } else if (archiveType === 'location') {
                url = logisticsI.backend.api.storageLocationArchive.replace('{id}', id);
            }
            const res = await fetch(url, { method: 'PUT' });
            if (!res.ok) throw new Error('Archive request failed');

            // refresh lists
            await fetchData();

            // show centered toast
            setToast({
                show: true,
                type: 'success',
                title: 'Archived',
                message: `${archiveType === 'category' ? 'Category' : 'Location'} archived successfully`
            });
            // auto-hide handled by effect below

        } catch (err) {
            console.error('Archive error:', err);
            setError(err.message || 'Failed to archive');
            setToast({
                show: true,
                type: 'error',
                title: 'Archive Failed',
                message: err.message || 'Failed to archive item'
            });
        } finally {
            setArchiving(false);
            closeArchiveModal();
        }
    };

    // Auto hide toast and cleanup
    useEffect(() => {
        if (!toast.show) return;
        const t = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3800);
        return () => clearTimeout(t);
    }, [toast.show]);

    // Manual dismiss handler for toast (keeps API same)
    const dismissToast = () => setToast(prev => ({ ...prev, show: false }));

    // (slide-over issue panel removed; reporting-on-submit modal remains)

    // Report broken items to backend and then continue submission
    const reportBrokenItemsAndContinue = async (alsoProceed = true) => {
        if (!brokenItemsToReport || brokenItemsToReport.length === 0) {
            setShowReportBrokenModal(false);
            if (alsoProceed) await performSubmitRequests();
            return;
        }

        setReportingBroken(true);
        try {
            const promises = brokenItemsToReport.map(item => {
                const payload = {
                    equipment_id: item.equipment_id,
                    item_name: item.name,
                    description: `Reported via Stock Request flow. Current stock: ${item.current_stock}`,
                    reported_by: 'Logistics User',
                    status: 'open'
                };
                return fetch(logisticsI.backend.api.equipmentIssues, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(async (res) => {
                    if (!res.ok) {
                        let text = await res.text();
                        try { text = JSON.parse(text); } catch(e) {}
                        throw new Error(text?.message || `Failed to report item ${item.name}`);
                    }
                    return res.json();
                });
            });

            const results = await Promise.all(promises);
            console.debug('Reported broken items:', results);
            setToast({ show: true, type: 'success', title: 'Reported', message: `Reported ${results.length} broken item(s).` });
            // refresh issues list and equipment
            await fetchData();
            setShowReportBrokenModal(false);
            if (alsoProceed) await performSubmitRequests();
        } catch (err) {
            console.error('Error reporting broken items:', err);
            setToast({ show: true, type: 'error', title: 'Report Failed', message: err.message || 'Failed to report broken items.' });
        } finally {
            setReportingBroken(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Stock Monitoring Dashboard</h1>
                            <p className="text-gray-600 mt-1">Monitor inventory levels and stock alerts</p>
                        </div>
                        <div className="flex space-x-4">
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                            >
                                {refreshing ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                ) : (
                                    <span className="mr-2">🔄</span>
                                )}
                                Refresh
                            </button>
                            <button
                                onClick={handleRequestStock}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                            >
                                <span className="mr-2">📦</span>
                                Request Stock
                            </button>
                            {/* Problem Items button removed */}
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-blue-100">
                                <span className="text-2xl">📦</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Items</p>
                                <p className="text-2xl font-bold text-gray-900">{equipmentTotal}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-red-100">
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Low Stock Alerts</p>
                                <p className="text-2xl font-bold text-red-600">{lowStockTotal}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-yellow-100">
                                <span className="text-2xl">📈</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Overstock Alerts</p>
                                <p className="text-2xl font-bold text-yellow-600">{overstockTotal}</p>
                            </div>
                        </div>
                    </div>

                    <div onClick={() => setActiveTab('reported')} className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-all">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-indigo-100">
                                <span className="text-2xl">�</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Reported Items</p>
                                <p className="text-2xl font-bold text-indigo-600">{(equipmentIssues || []).length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            {[
                                { id: 'overview', label: 'Available Units', icon: '📦' },
                                { id: 'low-stock', label: 'Low Stock Alerts', icon: '⚠️' },
                                { id: 'overstock', label: 'Overstock Alerts', icon: '📈' },
                                { id: 'reported', label: 'Reported Items', icon: '🚩' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <span className="mr-2">{tab.icon}</span>
                                    {tab.label}
                                    {tab.id === 'low-stock' && lowStockTotal > 0 && (
                                        <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                                            {lowStockTotal}
                                        </span>
                                    )}
                                    {tab.id === 'overstock' && overstockTotal > 0 && (
                                        <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                                            {overstockTotal}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {/* Search Bar */}
                        <div className="mb-6">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-400">🔍</span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search equipment, categories, or locations..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Units</h2>
                                {filteredEquipment.length === 0 ? (
                                    <div className="text-center py-12">
                                        <span className="text-4xl mb-4 block">📦</span>
                                        <p className="text-gray-500">
                                            {searchTerm ? 'No equipment found matching your search.' : 'No equipment available.'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredEquipment.map((item) => (
                                            <EquipmentCard key={item.equipment_id} item={item} />
                                        ))}
                                    </div>
                                )}
                                <div className="mt-4 text-sm text-gray-500">Showing {filteredEquipment.length} of {equipmentTotal} total items</div>
                            </div>
                        )}

                        {/* Low Stock Tab */}
                        {activeTab === 'low-stock' && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alerts</h2>
                                {lowStockItems.length === 0 ? (
                                    <div className="text-center py-12">
                                        <span className="text-4xl mb-4 block">✅</span>
                                        <p className="text-gray-500">No low stock items found. All items are well stocked!</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {lowStockItems.map((item) => (
                                            <EquipmentCard key={item.equipment_id} item={item} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Overstock Tab */}
                        {activeTab === 'overstock' && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Overstock Alerts</h2>
                                {overstockItems.length === 0 ? (
                                    <div className="text-center py-12">
                                        <span className="text-4xl mb-4 block">✅</span>
                                        <p className="text-gray-500">No overstock items found. Inventory levels are optimal!</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {overstockItems.map((item) => (
                                            <EquipmentCard key={item.equipment_id} item={item} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Reported Items Tab */}
                        {activeTab === 'reported' && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Reported Items</h2>
                                {equipmentIssues.length === 0 ? (
                                    <div className="text-center py-12">
                                        <span className="text-4xl mb-4 block">🚩</span>
                                        <p className="text-gray-500">No reported items found.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto bg-white rounded-lg border border-gray-100">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment ID</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment / Item</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported By</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported At</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {equipmentIssues.map(issue => (
                                                    <tr key={issue.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm text-gray-700">{issue.equipment_id ?? '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{issue.equipment_name ?? issue.item_name ?? 'Unknown'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">{issue.category_name ?? '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">{issue.location_name ?? '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">{issue.status}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">{issue.reported_by ?? '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">
                                                            {issue.description ? (
                                                                <button onClick={() => openDescriptionModal(issue)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">View</button>
                                                            ) : (
                                                                <span className="text-gray-400 text-sm">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">{issue.created_at ? new Date(issue.created_at).toLocaleString() : '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">{issue.updated_at ? new Date(issue.updated_at).toLocaleString() : '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Archive Confirmation Modal (improved center style & animation) --- */}
            {showArchiveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* backdrop */}
                    <div
                        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
                        onClick={closeArchiveModal}
                        aria-hidden="true"
                    />

                    {/* modal panel */}
                    <div
                        ref={modalPanelRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="archive-title"
                        aria-describedby="archive-desc"
                        className="relative w-full max-w-md mx-4 transform rounded-2xl bg-white shadow-2xl border border-gray-100 transition-all duration-200 ease-out"
                        style={{ willChange: 'transform, opacity' }}
                    >
                        {/* top "origin" header like your screenshot */}
                        <div className="rounded-t-2xl bg-gradient-to-r from-gray-50 to-white/80 px-5 py-3 border-b border-gray-100">
                        </div>

                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center ring-1 ring-red-100">
                                        <span className="text-3xl">🗑️</span>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <h3 id="archive-title" className="text-lg font-semibold text-gray-900">
                                        Archive {archiveType === 'category' ? 'Category' : 'Location'} "{archiveItem?.category_name ?? archiveItem?.location_name ?? archiveItem?.name}"
                                    </h3>

                                    <p id="archive-desc" className="mt-2 text-sm text-gray-600">
                                        This cannot be undone easily. Are you sure you want to archive this {archiveType === 'category' ? 'category' : 'location'}?
                                    </p>

                                    { (archiveItem?.description) && (
                                        <div className="mt-4 rounded-md bg-gray-50 p-3 border border-gray-100">
                                            <p className="text-sm text-gray-700 truncate">{archiveItem.description}</p>
                                        </div>
                                    )}

                                    <div className="mt-6 flex items-center justify-end gap-3">
                                        {/* Cancel: light cyan pill (matches screenshot) */}
                                        <button
                                            onClick={closeArchiveModal}
                                            className="px-4 py-2 rounded-full bg-cyan-100 hover:bg-cyan-200 text-cyan-800 text-sm font-medium transition-shadow shadow-sm"
                                            disabled={archiving}
                                        >
                                            Cancel
                                        </button>

                                        {/* Confirm: teal pill with subtle ring */}
                                        <button
                                            ref={modalConfirmRef}
                                            onClick={confirmArchive}
                                            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white transition
                                                ${archiving ? 'bg-teal-300 cursor-wait' : 'bg-teal-600 hover:bg-teal-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-400`}
                                            disabled={archiving}
                                            aria-disabled={archiving}
                                        >
                                            {archiving ? (
                                                // simple inline spinner + text
                                                <span className="inline-flex items-center gap-2">
                                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block" />
                                                    Archiving...
                                                </span>
                                            ) : (
                                                <span>Archive</span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Request Stock Modal --- */}
            {showRequestStockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* backdrop */}
                    <div
                        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
                        onClick={closeRequestStockModal}
                        aria-hidden="true"
                    />

                    {/* modal panel */}
                    <div
                        className="relative w-full max-w-4xl mx-4 transform rounded-2xl bg-white shadow-2xl border border-gray-100 transition-all duration-200 ease-out"
                        style={{ willChange: 'transform, opacity' }}
                    >
                        {/* top "origin" header like your screenshot */}
                        <div className="rounded-t-2xl bg-gradient-to-r from-gray-50 to-white/80 px-5 py-3 border-b border-gray-100">
                        </div>

                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center ring-1 ring-red-100">
                                        <span className="text-3xl">⚠️</span>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Select Items to Restock
                                    </h3>

                                    <p className="mt-2 text-sm text-gray-600">
                                        Choose which low stock items you want to request for restocking. You can select all or individual items.
                                    </p>

                                    <div className="mt-4 max-h-96 overflow-y-auto">
                                        {lowStockItems.length === 0 ? (
                                            <p className="text-gray-500">No low stock items found.</p>
                                        ) : (
                                            <>
                                                <div className="flex items-center mb-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.length === lowStockItems.length && lowStockItems.length > 0}
                                                        onChange={toggleSelectAll}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    />
                                                    <label className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                                                        Select All ({lowStockItems.length} items)
                                                    </label>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {lowStockItems.map((item) => (
                                                        <SelectableEquipmentCard
                                                            key={item.equipment_id}
                                                            item={item}
                                                            isSelected={selectedItems.includes(item.equipment_id)}
                                                            onToggle={toggleItemSelection}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="mt-6 flex items-center justify-end gap-3">
                                        <button
                                            onClick={closeRequestStockModal}
                                            className="px-4 py-2 rounded-full bg-cyan-100 hover:bg-cyan-200 text-cyan-800 text-sm font-medium transition-shadow shadow-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmitRequest}
                                            disabled={selectedItems.length === 0}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-shadow shadow-sm ${
                                                selectedItems.length === 0
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                            }`}
                                        >
                                            Request Stock ({selectedItems.length})
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Quantity Input Modal --- */}
            {showQuantityModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* backdrop */}
                    <div
                        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
                        onClick={closeQuantityModal}
                        aria-hidden="true"
                    />

                    {/* modal panel */}
                    <div
                        className="relative w-full max-w-4xl mx-4 transform rounded-2xl bg-white shadow-2xl border border-gray-100 transition-all duration-200 ease-out"
                        style={{ willChange: 'transform, opacity' }}
                    >
                        {/* top "origin" header like your screenshot */}
                        <div className="rounded-t-2xl bg-gradient-to-r from-gray-50 to-white/80 px-5 py-3 border-b border-gray-100">
                        </div>

                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center ring-1 ring-blue-100">
                                        <span className="text-3xl">📝</span>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Specify Quantities
                                    </h3>

                                    <p className="mt-2 text-sm text-gray-600">
                                        Enter the quantities you want to request for each selected item. Suggested quantities are pre-filled based on current stock levels.
                                    </p>

                                    <div className="mt-4 max-h-96 overflow-y-auto">
                                        {selectedItems.length === 0 ? (
                                            <p className="text-gray-500">No items selected.</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {selectedItems.map((equipmentId) => {
                                                    const item = lowStockItems.find(item => item.equipment_id === equipmentId);
                                                    if (!item) return null;
                                                    return (
                                                        <div key={equipmentId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div>
                                                                    <h4 className="text-md font-semibold text-gray-900">{item.name}</h4>
                                                                    <p className="text-sm text-gray-600 mt-1">
                                                                        {item.category_name && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">
                                                                            {item.category_name}
                                                                        </span>}
                                                                    </p>
                                                                    <p className="text-sm text-gray-600 mt-1">
                                                                        Current Stock: <span className="font-medium">{item.stock_quantity} units</span>
                                                                    </p>
                                                                </div>
                                                                <StockIndicator quantity={item.stock_quantity} type="low" />
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                <label className="text-sm font-medium text-gray-700">
                                                                    Request Quantity:
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={quantities[equipmentId] || ''}
                                                                    onChange={(e) => {
                                                                        const value = parseInt(e.target.value) || 0;
                                                                        setQuantities(prev => ({
                                                                            ...prev,
                                                                            [equipmentId]: value
                                                                        }));
                                                                    }}
                                                                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                                    placeholder="0"
                                                                />
                                                                <span className="text-sm text-gray-500">units</span>
                                                                    {quantityErrors[equipmentId] && (
                                                                        <p className="mt-2 text-xs text-orange-600">{quantityErrors[equipmentId]}</p>
                                                                    )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 flex items-center justify-end gap-3">
                                        <button
                                            onClick={backToSelection}
                                            className="px-4 py-2 rounded-full bg-cyan-100 hover:bg-cyan-200 text-cyan-800 text-sm font-medium transition-shadow shadow-sm"
                                            disabled={submittingRequests}
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handleSubmitQuantities}
                                            disabled={submittingRequests}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-shadow shadow-sm ${
                                                submittingRequests
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                            }`}
                                        >
                                            {submittingRequests ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                                                    Submitting...
                                                </>
                                            ) : (
                                                'Submit Requests'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Report Broken Items Modal --- */}
            {showReportBrokenModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowReportBrokenModal(false)} />
                    <div className="relative w-full max-w-lg mx-4 transform rounded-2xl bg-white shadow-2xl border border-gray-100">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900">Report Broken Items</h3>
                            <p className="text-sm text-gray-600 mt-2">We detected items marked as broken/damaged among your selected items. Would you like to report them before continuing?</p>

                            <div className="mt-4 max-h-64 overflow-y-auto space-y-3">
                                {brokenItemsToReport.map(it => (
                                    <div key={it.equipment_id} className="p-3 border rounded-md bg-gray-50 flex justify-between items-center">
                                        <div>
                                            <div className="font-medium">{it.name}</div>
                                            <div className="text-xs text-gray-500">Current stock: {it.current_stock}</div>
                                        </div>
                                        <div className="text-sm text-gray-600">Report?</div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button onClick={() => { setShowReportBrokenModal(false); performSubmitRequests(); }} className="px-4 py-2 rounded-full bg-cyan-100 text-cyan-800">Skip & Continue</button>
                                <button onClick={() => reportBrokenItemsAndContinue(true)} disabled={reportingBroken} className={`px-4 py-2 rounded-full text-white ${reportingBroken ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}>
                                    {reportingBroken ? 'Reporting...' : 'Report & Continue'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Issue List Modal (opened from Overstock card) --- */}
            {showIssueListModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={closeIssueListModal} />
                    <div className="relative w-full max-w-4xl mx-4 transform rounded-2xl bg-white shadow-2xl border border-gray-100">
                        <div className="p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">Reported Items</h3>
                                    <p className="text-sm text-gray-600 mt-1">List of reported problem/broken items from the equipment_issues table.</p>
                                </div>
                                <div>
                                    <button onClick={closeIssueListModal} className="text-sm text-gray-600">Close</button>
                                </div>
                            </div>

                            <div className="mt-4 max-h-96 overflow-y-auto">
                                {equipmentIssues.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">No reported items found.</div>
                                ) : (
                                    <div className="space-y-3">
                                        {equipmentIssues.map(issue => {
                                            const equip = equipment.find(e => e.equipment_id === issue.equipment_id);
                                            return (
                                                <div key={issue.id} className="p-3 border rounded-md bg-gray-50">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="font-medium">{equip?.name ?? issue.item_name ?? 'Unknown Item'}</div>
                                                            <div className="text-xs text-gray-500">Reported by: {issue.reported_by ?? 'N/A'}</div>
                                                            <div className="text-xs text-gray-500">Status: {issue.status}</div>
                                                            {issue.description && <p className="mt-2 text-sm text-gray-700">{issue.description}</p>}
                                                        </div>
                                                        <div className="text-right text-sm text-gray-600">
                                                            <div>Equipment ID: {issue.equipment_id ?? '-'}</div>
                                                            <div>Reported: {new Date(issue.created_at).toLocaleString()}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Description Modal for Reported Item --- */}
            {showDescriptionModal && selectedIssueForDescription && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={closeDescriptionModal} />
                    <div className="relative w-full max-w-lg mx-4 transform rounded-2xl bg-white shadow-2xl border border-gray-100">
                        <div className="p-6">
                            <div className="flex items-start">
                                <div>
                                    <h3 className="text-lg font-semibold">Reported Item Description</h3>
                                    <p className="text-sm text-gray-600 mt-1">Details for the reported item.</p>
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="font-medium text-gray-900">{selectedIssueForDescription.equipment_name ?? selectedIssueForDescription.item_name ?? 'Unknown'}</div>
                                <div className="text-xs text-gray-500 mt-1">Reported by: {selectedIssueForDescription.reported_by ?? 'N/A'}</div>
                                <div className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{selectedIssueForDescription.description ?? 'No description provided.'}</div>
                                <div className="mt-4 text-xs text-gray-500">Status: {selectedIssueForDescription.status}</div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button onClick={closeDescriptionModal} className="px-4 py-2 rounded-full bg-cyan-100 hover:bg-cyan-200 text-cyan-800 text-sm font-medium">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Centered toast (cool looking, animated) */}
			<div
				aria-live="polite"
				className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
			>
				{/* Render even when hidden to allow smooth entrance (conditionally show content) */}
				<div className="pointer-events-auto max-w-lg w-full px-4">
					<div
						role="status"
						className={`mx-auto transform rounded-xl shadow-2xl border border-gray-100 bg-gradient-to-r from-white/90 to-gray-50/90 backdrop-blur-md px-5 py-3 flex items-center gap-4 transition-all duration-300 ease-out
							${toast.show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'}`}
						style={{ willChange: 'transform, opacity' }}
					>
						{/* Icon based on type */}
						<div className={`h-12 w-12 flex items-center justify-center rounded-full ${
							toast.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
						} text-xl font-bold`}>
							{toast.type === 'success' ? '✅' : '❌'}
						</div>

                            {/* Issue slide-over removed */}

						<div className="flex-1 min-w-0">
							<div className="flex items-start justify-between gap-4">
								<div className="truncate">
									<p className="text-sm font-semibold text-gray-900 truncate">{toast.title || (toast.type === 'success' ? 'Success' : 'Notice')}</p>
									<p className="mt-0.5 text-xs text-gray-500 truncate">{toast.message}</p>
								</div>
								<button
									onClick={dismissToast}
									className="ml-3 inline-flex items-center justify-center rounded-md p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
									aria-label="Dismiss notification"
								>
									✖️
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

        </div>
    );
};

export default StockMonitoring;
