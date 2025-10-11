import React, { useState, useEffect } from 'react';
import { logisticsI } from '../api/logisticsI.js';
import { toast } from 'sonner';

const SupplierManagement = () => {
    // State management
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showRequestListModal, setShowRequestListModal] = useState(false);
    const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [supplierRequests, setSupplierRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [core2Suppliers, setCore2Suppliers] = useState([]);
    const [loadingCore2Suppliers, setLoadingCore2Suppliers] = useState(false);

    // Form states
    const [supplierForm, setSupplierForm] = useState({
        supplier_name: '',
        item_name: '',
        price: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        comments: ''
    });

    const [contactForm, setContactForm] = useState({
        email: '',
        phone: '',
        address: '',
        website: ''
    });

    const [ratingForm, setRatingForm] = useState({
        rating: 5
    });

    const [requestForm, setRequestForm] = useState({
        name: ''
    });

    const [newSupplierForm, setNewSupplierForm] = useState({
        core2_supplier_id: '',
        supplier_name: '',
        item_name: '',
        price: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        comments: ''
    });

    // Fetch suppliers on component mount
    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const response = await fetch(logisticsI.backend.api.suppliers);
            if (!response.ok) {
                const txt = await response.text();
                let body = txt;
                try { body = JSON.parse(txt); } catch(e) {}
                console.error('Failed to fetch suppliers', response.status, body);
                toast.error('Failed to fetch suppliers');
                setSuppliers([]);
                return;
            }
            const data = await response.json();
            setSuppliers(data || []);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            toast.error('Error fetching suppliers');
        } finally {
            setLoading(false);
        }
    };

    // Filter suppliers based on search and status
    const filteredSuppliers = suppliers.filter(supplier => {
        const matchesSearch = supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            supplier.item_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || supplier.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Handle form inputs
    const handleSupplierFormChange = (e) => {
        setSupplierForm({
            ...supplierForm,
            [e.target.name]: e.target.value
        });
    };

    const handleContactFormChange = (e) => {
        setContactForm({
            ...contactForm,
            [e.target.name]: e.target.value
        });
    };

    const handleRatingChange = (rating) => {
        setRatingForm({ rating });
    };

    const handleRequestFormChange = (e) => {
        setRequestForm({
            ...requestForm,
            [e.target.name]: e.target.value
        });
    };

    const handleNewSupplierFormChange = (e) => {
        setNewSupplierForm({
            ...newSupplierForm,
            [e.target.name]: e.target.value
        });
    };

    // Modal handlers
    const openAddModal = () => {
        setEditingSupplier(null);
        setSupplierForm({
            supplier_name: '',
            item_name: '',
            price: '',
            email: '',
            phone: '',
            address: '',
            website: '',
            comments: ''
        });
        setShowModal(true);
    };

    const openEditModal = (supplier) => {
        setEditingSupplier(supplier);
        setSupplierForm({
            supplier_id: supplier.supplier_id,
            supplier_name: supplier.supplier_name,
            item_name: supplier.item_name || '',
            price: supplier.price || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            website: supplier.website || '',
            comments: supplier.comments || ''
        });
        setShowModal(true);
    };

    const openContactModal = (supplier) => {
        setSelectedSupplier(supplier);
        setContactForm({
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            website: supplier.website || ''
        });
        setShowContactModal(true);
    };

    const openRatingModal = (supplier) => {
        setSelectedSupplier(supplier);
        setRatingForm({
            rating: supplier.rating || 5
        });
        setShowRatingModal(true);
    };

    // API calls
    const handleSupplierSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = editingSupplier
                ? { ...supplierForm }
                : { ...supplierForm };

            let response;
            if (editingSupplier && editingSupplier.supplier_id) {
                // Update existing supplier
                const url = logisticsI.backend.api.supplierUpdate.replace('{id}', editingSupplier.supplier_id);
                response = await fetch(url, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                // Create new supplier
                response = await fetch(logisticsI.backend.api.suppliers, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }

            const result = await response.json();

            if (response.ok) {
                await fetchSuppliers();
                setShowModal(false);
                toast.success(editingSupplier ? 'Supplier updated successfully!' : 'Supplier created successfully!');
            } else {
                toast.error('Error: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving supplier:', error);
            toast.error('Error saving supplier');
        }
    };

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(logisticsI.backend.api.supplierContact.replace('{supplierId}', selectedSupplier.supplier_id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contactForm)
            });

            const result = await (response.headers.get('content-type')?.includes('application/json') ? response.json() : Promise.resolve({}));

            if (response.ok) {
                await fetchSuppliers();
                setShowContactModal(false);
                toast.success('Contact details updated successfully!');
            } else {
                const msg = result?.message || `Failed (${response.status})`;
                toast.error(msg);
            }
        } catch (error) {
            console.error('Error updating contact:', error);
            toast.error('Error updating contact details');
        }
    };

    const handleRatingSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(logisticsI.backend.api.supplierRate.replace('{supplierId}', selectedSupplier.supplier_id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ratingForm)
            });

            const result = await (response.headers.get('content-type')?.includes('application/json') ? response.json() : Promise.resolve({}));

            if (response.ok) {
                await fetchSuppliers();
                setShowRatingModal(false);
                toast.success('Supplier rating updated successfully!');
            } else {
                const msg = result?.message || `Failed (${response.status})`;
                toast.error(msg);
            }
        } catch (error) {
            console.error('Error updating rating:', error);
            toast.error('Error updating supplier rating');
        }
    };

    const handleArchive = async (supplierId) => {
        if (window.confirm('Are you sure you want to archive this supplier?')) {
            try {
                const response = await fetch(logisticsI.backend.api.supplierArchive.replace('{id}', supplierId), {
                    method: 'PUT'
                });

                if (response.ok) {
                    await fetchSuppliers();
                    toast.success('Supplier archived successfully!');
                } else {
                    const txt = await response.text();
                    let json = txt;
                    try { json = JSON.parse(txt); } catch(e) {}
                    toast.error(json?.message || 'Error archiving supplier');
                }
            } catch (error) {
                console.error('Error archiving supplier:', error);
                toast.error('Error archiving supplier');
            }
        }
    };

    const handleActivate = async (supplierId) => {
        try {
            const response = await fetch(logisticsI.backend.api.supplierActivate.replace('{id}', supplierId), {
                method: 'PUT'
            });

            if (response.ok) {
                await fetchSuppliers();
                toast.success('Supplier activated successfully!');
            } else {
                const txt = await response.text();
                let json = txt;
                try { json = JSON.parse(txt); } catch(e) {}
                toast.error(json?.message || 'Error activating supplier');
            }
        } catch (error) {
            console.error('Error activating supplier:', error);
            toast.error('Error activating supplier');
        }
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(logisticsI.backend.api.supplierRequests, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestForm)
            });

            const result = await (response.headers.get('content-type')?.includes('application/json') ? response.json() : Promise.resolve({}));

            if (response.ok) {
                setShowRequestModal(false);
                setRequestForm({
                    name: ''
                });
                toast.success('Supplier request submitted successfully!');
            } else {
                toast.error('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error submitting supplier request:', error);
            toast.error('Error submitting supplier request');
        }
    };

    const fetchSupplierRequests = async () => {
        try {
            setLoadingRequests(true);
            const response = await fetch(logisticsI.backend.api.supplierRequests);
            if (!response.ok) {
                toast.error('Failed to fetch supplier requests');
                setSupplierRequests([]);
                return;
            }
            const data = await response.json();
            setSupplierRequests(data || []);
        } catch (error) {
            console.error('Error fetching supplier requests:', error);
            toast.error('Error fetching supplier requests');
        } finally {
            setLoadingRequests(false);
        }
    };

    const openRequestListModal = () => {
        fetchSupplierRequests();
        setShowRequestListModal(true);
    };

    const fetchCore2Suppliers = async () => {
        try {
            setLoadingCore2Suppliers(true);
            const response = await fetch(logisticsI.backend.api.core2Suppliers);
            if (!response.ok) {
                toast.error('Failed to fetch core2 suppliers');
                setCore2Suppliers([]);
                return;
            }
            const data = await response.json();
            setCore2Suppliers(data || []);
        } catch (error) {
            console.error('Error fetching core2 suppliers:', error);
            toast.error('Error fetching core2 suppliers');
        } finally {
            setLoadingCore2Suppliers(false);
        }
    };

    const openNewSupplierModal = () => {
        fetchCore2Suppliers();
        setShowNewSupplierModal(true);
    };

    const handleAddSupplier = async (supplierId) => {
        try {
            const response = await fetch(logisticsI.backend.api.addSupplier.replace('{id}', supplierId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'add'
                })
            });

            const result = await response.json();

            if (response.ok) {
                await fetchCore2Suppliers(); // Refresh the list
                await fetchSuppliers(); // Refresh the main suppliers list
                toast.success('Supplier Successfully Added!');
            } else {
                toast.error('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error updating supplier status:', error);
            toast.error('Error updating supplier status');
        }
    };



    // Star rating component
    const StarRating = ({ rating, onRatingChange, readonly = false }) => {
        return (
            <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className={`text-2xl ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform ${
                            star <= rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        onClick={() => !readonly && onRatingChange(star)}
                        disabled={readonly}
                    >
                        ★
                    </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Supplier Management</h1>
                    <p className="text-gray-600">Manage supplier profiles, contact details, and performance ratings</p>
                </div>

                {/* Controls */}
                <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Search suppliers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowRequestModal(true)}
                            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Request Supplier
                        </button>
                        <button
                            onClick={openNewSupplierModal}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            New Supplier
                        </button>
                        <button
                            onClick={openRequestListModal}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Request List
                        </button>
                    </div>
                </div>

                {/* Suppliers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSuppliers.map((supplier) => (
                        <div key={supplier.supplier_id} className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">{supplier.supplier_name}</h3>
                                    <p className="text-gray-600">{supplier.item_name}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    supplier.status === 'active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {supplier.status}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-start text-sm text-gray-600">
                                    <span className="font-medium w-20 flex-shrink-0">Email:</span>
                                    <span className="break-all">{supplier.email || 'N/A'}</span>
                                </div>
                                <div className="flex items-start text-sm text-gray-600">
                                    <span className="font-medium w-20 flex-shrink-0">Phone:</span>
                                    <span>{supplier.phone || 'N/A'}</span>
                                </div>
                                <div className="flex items-start text-sm text-gray-600">
                                    <span className="font-medium w-20 flex-shrink-0">Address:</span>
                                    <span className="break-words">{supplier.address || 'N/A'}</span>
                                </div>
                                <div className="flex items-start text-sm text-gray-600">
                                    <span className="font-medium w-20 flex-shrink-0">Website:</span>
                                    <span className="break-all">
                                        {supplier.website ? (
                                            <a
                                                href={supplier.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 underline"
                                            >
                                                {supplier.website}
                                            </a>
                                        ) : (
                                            'N/A'
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-start text-sm text-gray-600">
                                    <span className="font-medium w-20 flex-shrink-0">Price:</span>
                                        <span className="font-semibold text-green-600">
                                        {supplier.price ? `₱${parseFloat(supplier.price).toFixed(2)}` : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <span className="font-medium w-20 flex-shrink-0">Rating:</span>
                                    <StarRating rating={supplier.rating || 0} readonly={true} />
                                </div>
                                {supplier.comments && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-start text-sm text-gray-600">
                                            <span className="font-medium w-20 flex-shrink-0">Notes:</span>
                                            <span className="break-words text-gray-700">{supplier.comments}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {supplier.status === 'active' && (
                                    <>
                                        <button
                                            onClick={() => openEditModal(supplier)}
                                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm hover:bg-blue-200 transition-colors"
                                        >
                                            Edit Profile
                                        </button>
                                        <button
                                            onClick={() => openContactModal(supplier)}
                                            className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm hover:bg-green-200 transition-colors"
                                        >
                                            Update Contact
                                        </button>
                                        <button
                                            onClick={() => openRatingModal(supplier)}
                                            className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm hover:bg-yellow-200 transition-colors"
                                        >
                                            Rate Performance
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {supplier.status === 'active' ? (
                                    <button
                                        onClick={() => handleArchive(supplier.supplier_id)}
                                        className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors flex-1"
                                    >
                                        Archive
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleActivate(supplier.supplier_id)}
                                        className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm hover:bg-green-200 transition-colors flex-1"
                                    >
                                        Activate
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {filteredSuppliers.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No suppliers found</p>
                    </div>
                )}



                {/* Contact Details Modal */}
                {showContactModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-md w-full">
                            <div className="p-6">
                                <h2 className="text-2xl font-bold mb-6">Update Contact Details</h2>
                                <p className="text-gray-600 mb-4">Supplier: {selectedSupplier?.supplier_name}</p>

                                <form onSubmit={handleContactSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={contactForm.email}
                                            onChange={handleContactFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={contactForm.phone}
                                            onChange={handleContactFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Address
                                        </label>
                                        <textarea
                                            name="address"
                                            value={contactForm.address}
                                            onChange={handleContactFormChange}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Website
                                        </label>
                                        <input
                                            type="url"
                                            name="website"
                                            value={contactForm.website}
                                            onChange={handleContactFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="submit"
                                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Update Contact
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowContactModal(false)}
                                            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rating Modal */}
                {showRatingModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-md w-full">
                            <div className="p-6">
                                <h2 className="text-2xl font-bold mb-6">Rate Supplier Performance</h2>
                                <p className="text-gray-600 mb-4">Supplier: {selectedSupplier?.supplier_name}</p>
                                <p className="text-gray-600 mb-6">Current Rating: {selectedSupplier?.rating || 'Not rated'}</p>

                                <form onSubmit={handleRatingSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Performance Rating
                                        </label>
                                        <div className="flex justify-center">
                                            <StarRating
                                                rating={ratingForm.rating}
                                                onRatingChange={handleRatingChange}
                                                readonly={false}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-gray-900 mb-2">Rating Guide:</h4>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <div>⭐⭐⭐⭐⭐ (5) - Excellent performance</div>
                                            <div>⭐⭐⭐⭐ (4) - Good performance</div>
                                            <div>⭐⭐⭐ (3) - Satisfactory performance</div>
                                            <div>⭐⭐ (2) - Needs improvement</div>
                                            <div>⭐ (1) - Poor performance</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="submit"
                                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Submit Rating
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowRatingModal(false)}
                                            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Request Supplier Modal */}
                {showRequestModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-md w-full">
                            <div className="p-6">
                                <h2 className="text-2xl font-bold mb-6">Request New Supplier</h2>
                                <p className="text-gray-600 mb-6">Submit a request for a new supplier to be added to the system</p>

                                <form onSubmit={handleRequestSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Item Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={requestForm.name}
                                            onChange={handleRequestFormChange}
                                            required
                                            maxLength="100"
                                            placeholder="Enter the name of the item you need"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div> 

                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-blue-900 mb-2">Note:</h4>
                                        <p className="text-sm text-blue-800">
                                            Your request will be reviewed by the Core 2 team. You will be notified once the supplier is added to the system.
                                        </p>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="submit"
                                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Submit Request
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowRequestModal(false)}
                                            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Request List Modal */}
                {showRequestListModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold">Supplier Requests</h2>
                                    <button
                                        onClick={() => setShowRequestListModal(false)}
                                        className="text-gray-400 hover:text-gray-600 text-2xl"
                                    >
                                        ×
                                    </button>
                                </div>

                                {loadingRequests ? (
                                    <div className="flex justify-center items-center h-32">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : supplierRequests.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 text-lg">No supplier requests found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {supplierRequests.map((request, index) => (
                                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <p className="text-sm text-gray-600 mb-2">
                                                            Requesting sent for a new supplier for this item
                                                        </p>
                                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                                            {request.name || 'Unnamed Item'}
                                                        </h3>
                                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">Status:</span>
                                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                                    request.status === 'pending'
                                                                        ? 'bg-yellow-100 text-yellow-800'
                                                                        : request.status === 'approved'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {request.status || 'pending'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">Date:</span>
                                                                <span>{request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-end mt-6">
                                    <button
                                        onClick={() => setShowRequestListModal(false)}
                                        className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Profile Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <h2 className="text-2xl font-bold mb-6">
                                    {editingSupplier ? 'Edit Supplier Profile' : 'Add New Supplier'}
                                </h2>
                                <p className="text-gray-600 mb-6">
                                    {editingSupplier ? 'Update supplier information' : 'Enter supplier details'}
                                </p>

                                <form onSubmit={handleSupplierSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Supplier Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="supplier_name"
                                            value={supplierForm.supplier_name}
                                            onChange={handleSupplierFormChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter supplier name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Item Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="item_name"
                                            value={supplierForm.item_name}
                                            onChange={handleSupplierFormChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter item name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Price
                                        </label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={supplierForm.price}
                                            onChange={handleSupplierFormChange}
                                            step="0.01"
                                            min="0"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter price"
                                        />
                                    </div>



                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Comments/Notes
                                        </label>
                                        <textarea
                                            name="comments"
                                            value={supplierForm.comments}
                                            onChange={handleSupplierFormChange}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter any additional notes or comments"
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="submit"
                                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* New Supplier Modal */}
                {showNewSupplierModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold">Core 2 Suppliers</h2>
                                        <p className="text-gray-600">View all suppliers from Core 2 system</p>
                                    </div>
                                    <button
                                        onClick={() => setShowNewSupplierModal(false)}
                                        className="text-gray-400 hover:text-gray-600 text-2xl"
                                    >
                                        ×
                                    </button>
                                </div>

                                {loadingCore2Suppliers ? (
                                    <div className="flex justify-center items-center h-32">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : core2Suppliers.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 text-lg">No Core 2 suppliers found</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {core2Suppliers.filter(supplier => supplier.status === 'pending').map((supplier) => (
                                            <div key={supplier.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                <div className="mb-4">
                                                    <div className="bg-blue-50 p-3 rounded-lg mb-3">
                                                        <h3 className="text-xl font-bold text-gray-900 mb-1">{supplier.supplier_name || supplier.name}</h3>
                                                        <p className="text-blue-700 font-medium">{supplier.item_name}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 text-sm">

                                                    {supplier.email && (
                                                        <div className="flex justify-between">
                                                            <span className="font-medium text-gray-700">Email:</span>
                                                            <span className="text-gray-600 break-all text-right">{supplier.email}</span>
                                                        </div>
                                                    )}

                                                    {supplier.phone && (
                                                        <div className="flex justify-between">
                                                            <span className="font-medium text-gray-700">Phone:</span>
                                                            <span className="text-gray-600">{supplier.phone}</span>
                                                        </div>
                                                    )}

                                                    {supplier.address && (
                                                        <div className="flex justify-between">
                                                            <span className="font-medium text-gray-700">Address:</span>
                                                            <span className="text-gray-600 break-words text-right">{supplier.address}</span>
                                                        </div>
                                                    )}

                                                    {supplier.website && (
                                                        <div className="flex justify-between">
                                                            <span className="font-medium text-gray-700">Website:</span>
                                                            <span className="text-gray-600 break-all text-right">
                                                                <a
                                                                    href={supplier.website}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:text-blue-800 underline"
                                                                >
                                                                    {supplier.website}
                                                                </a>
                                                            </span>
                                                        </div>
                                                    )}

                                                    {supplier.price && (
                                                        <div className="flex justify-between">
                                                            <span className="font-medium text-gray-700">Price:</span>
                                                            <span className="text-green-600 font-semibold">₱{parseFloat(supplier.price).toFixed(2)}</span>
                                                        </div>
                                                    )}

                                                    {supplier.rating && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-medium text-gray-700">Rating:</span>
                                                            <StarRating rating={supplier.rating} readonly={true} />
                                                        </div>
                                                    )}

                                                    {supplier.comments && (
                                                        <div className="mt-3 p-2 bg-white rounded border">
                                                            <span className="font-medium text-gray-700 block mb-1">Notes:</span>
                                                            <span className="text-gray-600 text-xs break-words">{supplier.comments}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-gray-200">
                                                    <div className="flex justify-center mb-3">
                                                        <button
                                                            onClick={() => handleAddSupplier(supplier.id)}
                                                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                                                        >
                                                            Add Supplier
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                                        <span>Created: {supplier.created_at ? new Date(supplier.created_at).toLocaleDateString() : 'N/A'}</span>
                                                        <span>Updated: {supplier.updated_at ? new Date(supplier.updated_at).toLocaleDateString() : 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-end mt-6">
                                    <button
                                        onClick={() => setShowNewSupplierModal(false)}
                                        className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupplierManagement;
