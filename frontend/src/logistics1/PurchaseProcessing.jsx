import React, { useState, useEffect, useContext } from 'react';
import { logisticsI } from '../api/logisticsI';
import AuthContext from '../context/AuthProvider';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PurchaseProcessing = () => {
  const { auth } = useContext(AuthContext);
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
  const [orderReports, setOrderReports] = useState([]);
  const [receivedOrders, setReceivedOrders] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [activeSection, setActiveSection] = useState('create'); // 'create', 'approval', 'issue', 'orderList'
  const [filterType, setFilterType] = useState('order-reports');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderListType, setOrderListType] = useState('ongoing'); // 'ongoing', 'replacement'

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [purchaseForm, setPurchaseForm] = useState({
    supplier_id: '',
    price: '',
    quantity: '',
    total: '',
    description: '',
    supplier_email: '',
    supplier_phone: '',
    supplier_address: '',
    supplier_website: '',
  });

  // Order modal state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrderRequest, setSelectedOrderRequest] = useState(null);

  // Issue Purchase Order modal state
  const [showIssueOrderModal, setShowIssueOrderModal] = useState(false);
  const [selectedIssueRequest, setSelectedIssueRequest] = useState(null);

  // Details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDetailsRequest, setSelectedDetailsRequest] = useState(null);

  // Received details modal state
  const [showReceivedDetailsModal, setShowReceivedDetailsModal] = useState(false);
  const [selectedReceivedOrder, setSelectedReceivedOrder] = useState(null);

  // Cancel details modal state
  const [showCancelDetailsModal, setShowCancelDetailsModal] = useState(false);
  const [selectedCancelOrder, setSelectedCancelOrder] = useState(null);

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportItem, setSelectedReportItem] = useState(null);
  const [reportForm, setReportForm] = useState({
    type: 'report', // 'report' or 'cancel'
    description: '',
    photos: [],
  });

  // Choice modal state
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [selectedItemForChoice, setSelectedItemForChoice] = useState(null);

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelForm, setCancelForm] = useState({
    reason: '',
  });

  // Create Request modal state
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);
  const [createRequestForm, setCreateRequestForm] = useState({
    item_name: '',
    quantity: '',
    requested_by: '',
  });

  // Create Purchase Request modal state
  const [showCreatePurchaseRequestModal, setShowCreatePurchaseRequestModal] = useState(false);
  const [createPurchaseRequestForm, setCreatePurchaseRequestForm] = useState({
    item_name: '',
    quantity: '',
    supplier_id: '',
    price_per_unit: '',
    total_amount: '',
    requested_by: '',
  });

  // Report details modal state
  const [showReportDetailsModal, setShowReportDetailsModal] = useState(false);
  const [selectedReportDetails, setSelectedReportDetails] = useState(null);

  // Zoomed image modal state
  const [showZoomedImage, setShowZoomedImage] = useState(false);
  const [zoomedImageSrc, setZoomedImageSrc] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);

  // Replacement modal state
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [selectedReplacementItem, setSelectedReplacementItem] = useState(null);
  const [replacementForm, setReplacementForm] = useState({
    replacement_date: '',
    replacement_time: '',
  });

  // Open report details modal
  const openReportDetailsModal = (report) => {
    setSelectedReportDetails(report);
    setShowReportDetailsModal(true);
    setZoomLevel(1); // Reset zoom level
  };

  // Close report details modal
  const closeReportDetailsModal = () => {
    setShowReportDetailsModal(false);
    setSelectedReportDetails(null);
  };

  // Handle PDF export
  const handleExportToPDF = async () => {
    if (!selectedReportDetails) return;

    try {
      setLoading(true);
      setError('');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Set font
      pdf.setFont('helvetica', 'normal');

      // Title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Report Details', margin, yPosition);
      yPosition += 15;

      // Line under title
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Report Information Section
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Report Information', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const reportDesc = selectedReportDetails.report_description || 'N/A';
      const deliveryDate = selectedReportDetails.delivery_date
        ? new Date(selectedReportDetails.delivery_date).toLocaleString('en-US', { timeZone: 'Asia/Manila' })
        : 'N/A';

      pdf.text(`Report Description: ${reportDesc}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Delivery Date: ${deliveryDate}`, margin, yPosition);
      yPosition += 15;

      // Supplier Information Section
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Supplier Information', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Email: ${selectedReportDetails.supplier_email || 'N/A'}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Phone: ${selectedReportDetails.supplier_phone || 'N/A'}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Address: ${selectedReportDetails.supplier_address || 'N/A'}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Website: ${selectedReportDetails.supplier_website || 'N/A'}`, margin, yPosition);
      yPosition += 15;

      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }

      // Order Details Section
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Order Details', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Item Name: ${selectedReportDetails.item_name || 'N/A'}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Quantity: ${selectedReportDetails.quantity || 'N/A'}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Price per Unit: ₱${selectedReportDetails.price_per_unit || 'N/A'}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Total Price: ₱${selectedReportDetails.total_price || 'N/A'}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Reported By: ${selectedReportDetails.reported_by || 'N/A'}`, margin, yPosition);
      yPosition += 15;

      // Proof Photos Section (if exists)
      if (selectedReportDetails.proof_report) {
        // Check if we need a new page for photos
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Proof Photos', margin, yPosition);
        yPosition += 15;

        try {
          // Parse the proof_report data
          let photoFiles = [];
          try {
            photoFiles = JSON.parse(selectedReportDetails.proof_report);
            if (!Array.isArray(photoFiles)) {
              photoFiles = [selectedReportDetails.proof_report];
            }
          } catch (e) {
            photoFiles = [selectedReportDetails.proof_report];
          }

          console.log('Processing photo files:', photoFiles);

              // Load images from server and add to PDF
          for (let i = 0; i < photoFiles.length; i++) {
            const filename = photoFiles[i];
            if (!filename) continue;

            try {
              // Try multiple approaches to load the image
              let imageUrl = '';
              let response = null;

              // First try: HTTPS backend URL
              const httpsBaseUrl = logisticsI.backend.uri.startsWith('http://')
                ? logisticsI.backend.uri.replace('http://', 'https://')
                : logisticsI.backend.uri;

              imageUrl = `${httpsBaseUrl}/storage/proof_reports/${filename}`;
              console.log(`Trying HTTPS URL: ${imageUrl}`);

              try {
                response = await fetch(imageUrl, {
                  method: 'GET',
                  mode: 'cors',
                  headers: {
                    'Accept': 'image/*',
                  },
                });
              } catch (httpsError) {
                console.warn(`HTTPS failed, trying HTTP:`, httpsError);

                // Second try: HTTP backend URL
                const httpBaseUrl = logisticsI.backend.uri.startsWith('https://')
                  ? logisticsI.backend.uri.replace('https://', 'http://')
                  : logisticsI.backend.uri;

                imageUrl = `${httpBaseUrl}/storage/proof_reports/${filename}`;
                console.log(`Trying HTTP URL: ${imageUrl}`);

                try {
                  response = await fetch(imageUrl, {
                    method: 'GET',
                    mode: 'cors',
                    headers: {
                      'Accept': 'image/*',
                    },
                  });
                } catch (httpError) {
                  console.warn(`HTTP also failed, trying localhost:`, httpError);

                  // Third try: localhost direct
                  imageUrl = `http://localhost:8000/storage/proof_reports/${filename}`;
                  console.log(`Trying localhost: ${imageUrl}`);

                  response = await fetch(imageUrl, {
                    method: 'GET',
                    mode: 'cors',
                    headers: {
                      'Accept': 'image/*',
                    },
                  });
                }
              }

              if (!response.ok) {
                console.warn(`Failed to fetch image ${filename}: ${response.status} ${response.statusText}`);
                // Try alternative approach - add placeholder text
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'italic');
                pdf.text(`Image: ${filename} (Failed to load)`, margin, yPosition);
                yPosition += 10;
                continue;
              }

              const blob = await response.blob();
              console.log(`Blob size for ${filename}: ${blob.size} bytes, type: ${blob.type}`);

              if (blob.size === 0) {
                console.warn(`Empty blob for image ${filename}`);
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'italic');
                pdf.text(`Image: ${filename} (Empty file)`, margin, yPosition);
                yPosition += 10;
                continue;
              }

              // Convert blob to base64 using a safer approach
              const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                  console.log(`Base64 loaded for ${filename}, length: ${reader.result?.toString().length || 0}`);
                  resolve(reader.result);
                };
                reader.onerror = () => {
                  console.error(`FileReader error for ${filename}`);
                  reject(new Error('FileReader failed'));
                };
                reader.readAsDataURL(blob);
              });

              if (!base64) {
                console.warn(`No base64 data for ${filename}`);
                continue;
              }

              // Check if we need a new page for this image
              if (yPosition > pageHeight - 80) {
                pdf.addPage();
                yPosition = margin;
              }

              // Add image to PDF with error handling
              const imgWidth = 80; // mm
              const imgHeight = 60; // mm

              try {
                console.log(`Adding image ${filename} to PDF at position (${margin}, ${yPosition})`);
                // Use jsPDF's addImage with proper format detection
                const imgFormat = base64.split(';')[0].split('/')[1].toUpperCase();
                pdf.addImage(base64, imgFormat, margin, yPosition, imgWidth, imgHeight);
                yPosition += imgHeight + 10;
              } catch (addImageError) {
                console.error(`Failed to add image ${filename} to PDF:`, addImageError);
                // Add placeholder text instead
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'italic');
                pdf.text(`Image: ${filename} (Failed to embed)`, margin, yPosition);
                yPosition += 10;
              }

            } catch (imgError) {
              console.error(`Failed to load image ${filename}:`, imgError);
              // Add placeholder text for failed images
              if (yPosition > pageHeight - 20) {
                pdf.addPage();
                yPosition = margin;
              }
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'italic');
              pdf.text(`Image: ${filename} (Failed to load)`, margin, yPosition);
              yPosition += 10;
            }
          }

          // Add summary of loaded images
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Processed ${photoFiles.length} image(s) for this report.`, margin, yPosition);
          yPosition += 10;

        } catch (parseError) {
          console.warn('Failed to parse proof_report data:', parseError);
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          pdf.text('Proof photos are attached to this report.', margin, yPosition);
          yPosition += 10;
        }
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `report-details-${selectedReportDetails.order_item_id}-${timestamp}.pdf`;

      pdf.save(filename);
      setSuccess('PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setError(`Failed to export PDF: ${error?.message || error || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const [orderForm, setOrderForm] = useState({
    item_name: '',
    quantity: '',
    price_per_unit: '',
    total_price: '',
    supplier_email: '',
    supplier_phone: '',
    supplier_address: '',
    supplier_website: '',
    delivery_date: '',
  });

  // Open details modal
  const openDetailsModal = (request) => {
    setSelectedDetailsRequest(request);
    setShowDetailsModal(true);
  };

  // Close details modal
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedDetailsRequest(null);
  };

  // Open received details modal
  const openReceivedDetailsModal = (order) => {
    setSelectedReceivedOrder(order);
    setShowReceivedDetailsModal(true);
  };

  // Close received details modal
  const closeReceivedDetailsModal = () => {
    setShowReceivedDetailsModal(false);
    setSelectedReceivedOrder(null);
  };

  // Open cancel details modal
  const openCancelDetailsModal = (order) => {
    setSelectedCancelOrder(order);
    setShowCancelDetailsModal(true);
  };

  // Close cancel details modal
  const closeCancelDetailsModal = () => {
    setShowCancelDetailsModal(false);
    setSelectedCancelOrder(null);
  };

  // Open report modal
  const openReportModal = (item) => {
    setSelectedReportItem(item);
    setReportForm({
      type: 'report',
      description: '',
      photos: [],
    });
    setShowReportModal(true);
  };

  // Close report modal
  const closeReportModal = () => {
    setShowReportModal(false);
    setSelectedReportItem(null);
    setReportForm({
      description: '',
      photos: [],
    });
  };

  // Open choice modal
  const openChoiceModal = (item) => {
    setSelectedItemForChoice(item);
    setShowChoiceModal(true);
  };

  // Close choice modal
  const closeChoiceModal = () => {
    setShowChoiceModal(false);
    setSelectedItemForChoice(null);
  };

  // Open cancel modal
  const openCancelModal = (item) => {
    setSelectedItemForChoice(item);
    setShowCancelModal(true);
  };

  // Close cancel modal
  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancelForm({ reason: '' });
  };

  // Handle cancel order
  const handleCancel = async (e) => {
    e.preventDefault();
    if (!cancelForm.reason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Use the cancel endpoint
      const cancelUrl = logisticsI.backend.api.orderItemCancel.replace('{id}', selectedItemForChoice.order_item_id);
      const response = await fetch(cancelUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: cancelForm.reason,
          cancelled_by: auth?.name || 'Unknown User'
        }),
      });
      if (response.ok) {
        setSuccess('Order cancelled successfully.');
        closeCancelModal();
        fetchAllData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to cancel order');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError('Error cancelling order');
    }
    setLoading(false);
  };

  // Handle submit create request
  const handleSubmitCreateRequest = async (e) => {
    e.preventDefault();
    if (!createRequestForm.item_name.trim() || !createRequestForm.quantity) {
      setError('Please fill all required fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(logisticsI.backend.api.lowStockRequests, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          item_name: createRequestForm.item_name.trim(),
          quantity: createRequestForm.quantity,
          requested_by: createRequestForm.requested_by.trim() || auth?.name || 'Unknown User',
          status: 'pending'
        }),
      });
      if (response.ok) {
        setSuccess('Request created successfully.');
        setCreateRequestForm({ item_name: '', quantity: '', requested_by: '' });
        setShowCreateRequestModal(false);
        fetchAllData();
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
          setError(bodyText || `Failed to create request (status ${response.status})`);
        }
      }
    } catch (err) {
      console.error('Error creating request:', err);
      setError('Error creating request');
    }
    setLoading(false);
  };

  // Handle submit create purchase request
  const handleSubmitCreatePurchaseRequest = async (e) => {
    e.preventDefault();
    if (!createPurchaseRequestForm.item_name.trim() || !createPurchaseRequestForm.quantity || !createPurchaseRequestForm.supplier_id || !createPurchaseRequestForm.price_per_unit) {
      setError('Please fill all required fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(logisticsI.backend.api.purchaseRequestAdd, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          item_name: createPurchaseRequestForm.item_name.trim(),
          description: createPurchaseRequestForm.description,
          quantity: createPurchaseRequestForm.quantity,
          supplier_id: createPurchaseRequestForm.supplier_id,
          price_per_unit: createPurchaseRequestForm.price_per_unit,
          total_amount: createPurchaseRequestForm.total_amount,
          requested_by: createPurchaseRequestForm.requested_by.trim() || auth?.name || 'Unknown User',
          status: 'pending'
        }),
      });
      if (response.ok) {
        setSuccess('Purchase request created successfully.');
        setCreatePurchaseRequestForm({ item_name: '', quantity: '', supplier_id: '', price_per_unit: '', total_amount: '', description: '', requested_by: '' });
        setShowCreatePurchaseRequestModal(false);
        fetchAllData();
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
          setError(bodyText || `Failed to create purchase request (status ${response.status})`);
        }
      }
    } catch (err) {
      console.error('Error creating purchase request:', err);
      setError('Error creating purchase request');
    }
    setLoading(false);
  };



  // Fetch initial data
  useEffect(() => {
    fetchAllData();
  }, []);

  // Prevent background scrolling when any modal is open - optimized version
  useEffect(() => {
    // Use useMemo-style optimization to avoid unnecessary recalculations
    const modalStates = [
      showModal, showOrderModal, showIssueOrderModal, showDetailsModal,
      showReceivedDetailsModal, showCancelDetailsModal, showReportModal,
      showChoiceModal, showCancelModal, showCreateRequestModal,
      showCreatePurchaseRequestModal, showReportDetailsModal,
      showZoomedImage, showReplacementModal
    ];

    const isAnyModalOpen = modalStates.some(Boolean);

    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal, showOrderModal, showIssueOrderModal, showDetailsModal, showReceivedDetailsModal,
      showCancelDetailsModal, showReportModal, showChoiceModal, showCancelModal,
      showCreateRequestModal, showCreatePurchaseRequestModal, showReportDetailsModal,
      showZoomedImage, showReplacementModal]);

  const fetchAllData = () => {
    fetchPurchaseRequests();
    fetchSuppliers();
    fetchLowstockRequests();
    fetchOrderItems();
    fetchOrderReports();
    fetchReceivedOrders();
    fetchPurchaseOrders();
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

  const fetchOrderReports = async () => {
    setSuccess('');
    setError('');
    try {
      const response = await fetch(logisticsI.backend.api.orderReports);
      if (!response.ok) throw new Error('Failed to fetch order reports');
      const data = await response.json();
      setOrderReports(data || []);
    } catch (err) {
      console.error('Error fetching order reports:', err);
      setError('Failed to fetch order reports');
    }
  };

  const fetchReceivedOrders = async () => {
    setSuccess('');
    setError('');
    try {
      const response = await fetch(logisticsI.backend.api.receivedOrders);
      if (!response.ok) throw new Error('Failed to fetch received orders');
      const data = await response.json();
      setReceivedOrders(data || []);
    } catch (err) {
      console.error('Error fetching received orders:', err);
      // Removed error message display for empty received orders
    }
  };

  const fetchPurchaseOrders = async () => {
    setSuccess('');
    setError('');
    try {
      const response = await fetch(logisticsI.backend.api.purchaseOrders);
      if (!response.ok) throw new Error('Failed to fetch purchase orders');
      const data = await response.json();
      setPurchaseOrders(data || []);
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError('Failed to fetch purchase orders');
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
      description: '',
      supplier_email: '',
      supplier_phone: '',
      supplier_address: '',
      supplier_website: '',
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
      description: '',
      supplier_email: '',
      supplier_phone: '',
      supplier_address: '',
      supplier_website: '',
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
      supplier_email: request.supplier_email || '',
      supplier_phone: request.supplier_phone || '',
      supplier_address: request.supplier_address || '',
      supplier_website: request.supplier_website || '',
      delivery_date: '',
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
      supplier_email: '',
      supplier_phone: '',
      supplier_address: '',
      supplier_website: '',
      delivery_date: '',
    });
  };

  // Handle supplier selection
  const handleSupplierChange = (supplierId) => {
    const selectedSupplier = suppliers.find(s => String(s.supplier_id) === supplierId);
    setPurchaseForm(prev => ({
      ...prev,
      supplier_id: supplierId,
      price: selectedSupplier ? String(selectedSupplier.price || '') : '',
      supplier_email: selectedSupplier ? selectedSupplier.supplier_email || '' : '',
      supplier_phone: selectedSupplier ? selectedSupplier.supplier_phone || '' : '',
      supplier_address: selectedSupplier ? selectedSupplier.supplier_address || '' : '',
      supplier_website: selectedSupplier ? selectedSupplier.supplier_website || '' : '',
    }));
  };

  // Handle supplier selection for create purchase request
  const handleSupplierChangeForCreate = (supplierId) => {
    const selectedSupplier = suppliers.find(s => String(s.supplier_id) === supplierId);
    setCreatePurchaseRequestForm(prev => ({
      ...prev,
      supplier_id: supplierId,
      price_per_unit: selectedSupplier ? String(selectedSupplier.price || '') : '',
    }));
  };

  // Calculate total for purchase form
  useEffect(() => {
    const price = parseFloat(purchaseForm.price) || 0;
    const quantity = parseFloat(purchaseForm.quantity) || 0;
    const total = (price * quantity).toFixed(2);
    setPurchaseForm(prev => ({ ...prev, total }));
  }, [purchaseForm.price, purchaseForm.quantity]);

  // Calculate total for create purchase request form
  useEffect(() => {
    const price = parseFloat(createPurchaseRequestForm.price_per_unit) || 0;
    const quantity = parseFloat(createPurchaseRequestForm.quantity) || 0;
    const total = (price * quantity).toFixed(2);
    setCreatePurchaseRequestForm(prev => ({ ...prev, total_amount: total }));
  }, [createPurchaseRequestForm.price_per_unit, createPurchaseRequestForm.quantity]);

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
      setError('Please fill all required fields');
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
          description: purchaseForm.description,
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

    console.log('=== PLACE ORDER FORM SUBMISSION STARTED ===');
    console.log('Event:', e);
    console.log('Form data:', new FormData(e.target));

    // Basic validation
    if (!orderForm.delivery_date) {
      console.log('Validation failed: No delivery date');
      setError('Please select delivery date and time');
      return;
    }

    if (!selectedOrderRequest) {
      console.log('Validation failed: No selected order request');
      setError('No order request selected');
      return;
    }

    if (!auth?.name) {
      console.log('Validation failed: No auth user');
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError('');

    // Prepare the order data
    const orderData = {
      request_id: selectedOrderRequest.request_id,
      item_name: selectedOrderRequest.item_name,
      quantity: parseInt(selectedOrderRequest.quantity),
      price_per_unit: parseFloat(selectedOrderRequest.price),
      total_price: parseFloat(selectedOrderRequest.total_price),
      supplier_name: selectedOrderRequest.supplier_name || '',
      supplier_email: selectedOrderRequest.supplier_email || '',
      supplier_phone: selectedOrderRequest.supplier_phone || '',
      supplier_address: selectedOrderRequest.supplier_address || '',
      supplier_website: selectedOrderRequest.supplier_website || '',
      delivery_date: orderForm.delivery_date,
      status: 'ongoing',
      ordered_by: auth.name
    };

    console.log('Order data prepared:', orderData);
    console.log('API endpoint:', logisticsI.backend.api.orderItemsAdd);

    try {
      console.log('Sending request...');
      const response = await fetch(logisticsI.backend.api.orderItemsAdd, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(orderData),
      });

      console.log('Response received:', response.status, response.statusText);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Success response:', responseData);
        setSuccess('Order placed successfully!');

        // Close modal and refresh data immediately
        closeOrderModal();
        fetchAllData();

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        const errorText = await response.text();
        console.error('Error response:', response.status, errorText);

        let errorMessage = 'Failed to place order';
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.errors) {
            const messages = Object.values(errorJson.errors).flat();
            errorMessage = 'Validation errors: ' + messages.join('; ');
          } else if (errorJson.message) {
            errorMessage = errorJson.message;
          } else if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch (parseErr) {
          errorMessage = errorText || `Server error (${response.status})`;
        }

        setError(errorMessage);
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error: Unable to place order. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle mark as received
  const handleReceived = async (item) => {
    const receiverName = auth?.name || 'System';

    setLoading(true);
    setError('');
    try {
      // Create received order (which now also records the expense in the backend)
      const response = await fetch(logisticsI.backend.api.receivedOrderAdd, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          order_item_id: item.order_item_id,
          item_name: item.item_name,
          quantity: item.quantity,
          price_per_unit: item.price_per_unit,
          total_price: item.total_price,
          supplier_email: item.supplier_email,
          supplier_phone: item.supplier_phone,
          supplier_address: item.supplier_address,
          supplier_website: item.supplier_website,
          delivery_date: item.delivery_date,
          receiver_name: receiverName,
        }),
      });

      if (!response.ok) {
        let bodyText = await response.text();
        try {
          const errorJson = JSON.parse(bodyText);
          if (errorJson.errors) {
            const messages = Object.values(errorJson.errors).flat();
            throw new Error(messages.join('; '));
          } else if (errorJson.message) {
            throw new Error(errorJson.message);
          } else if (errorJson.error) {
            throw new Error(errorJson.error);
          } else {
            throw new Error(JSON.stringify(errorJson));
          }
        } catch (parseErr) {
          throw new Error(bodyText || `Failed to mark as received (status ${response.status})`);
        }
      }

      setSuccess('Order marked as received and expense recorded successfully.');
      fetchAllData();
    } catch (err) {
      console.error('Error marking as received:', err);
      setError(err.message || 'Error marking as received');
    }
    setLoading(false);
  };

  // Handle replace receive (for items with waiting_replacement status)
  const handleReplaceReceive = async (item) => {
    const receiverName = auth?.name || 'System';

    setLoading(true);
    setError('');
    try {
      // Call the new replace-receive endpoint
      const replaceReceiveUrl = logisticsI.backend.api.orderItemReplaceReceive.replace('{id}', item.order_item_id);
      const response = await fetch(replaceReceiveUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          receiver_name: receiverName,
        }),
      });

      if (!response.ok) {
        let bodyText = await response.text();
        try {
          const errorJson = JSON.parse(bodyText);
          if (errorJson.errors) {
            const messages = Object.values(errorJson.errors).flat();
            throw new Error(messages.join('; '));
          } else if (errorJson.message) {
            throw new Error(errorJson.message);
          } else if (errorJson.error) {
            throw new Error(errorJson.error);
          } else {
            throw new Error(JSON.stringify(errorJson));
          }
        } catch (parseErr) {
          throw new Error(bodyText || `Failed to process replacement receive (status ${response.status})`);
        }
      }

      setSuccess('Replacement received successfully, status updated to resolve.');
      fetchAllData();
    } catch (err) {
      console.error('Error processing replacement receive:', err);
      setError(err.message || 'Error processing replacement receive');
    }
    setLoading(false);
  };

  // Handle submit report
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportForm.description.trim()) {
      setError('Please provide a description of the issue');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('order_item_id', selectedReportItem.order_item_id);
      formData.append('item_name', selectedReportItem.item_name);
      formData.append('quantity', selectedReportItem.quantity);
      formData.append('price_per_unit', selectedReportItem.price_per_unit);
      formData.append('total_price', selectedReportItem.total_price);
      formData.append('supplier_name', selectedReportItem.supplier_name || '');
      formData.append('supplier_email', selectedReportItem.supplier_email || '');
      formData.append('supplier_phone', selectedReportItem.supplier_phone || '');
      formData.append('supplier_address', selectedReportItem.supplier_address || '');
      formData.append('supplier_website', selectedReportItem.supplier_website || '');

      // Format delivery_date to match validation (Y-m-d\TH:i)
      let deliveryDate = selectedReportItem.delivery_date;
      if (deliveryDate) {
        const date = new Date(deliveryDate);
        deliveryDate = date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
      }
      formData.append('delivery_date', deliveryDate);

      formData.append('report_description', reportForm.description.trim());
      formData.append('reported_by', auth?.name || 'Anonymous');

      if (reportForm.photos && reportForm.photos.length > 0) {
        reportForm.photos.forEach((photo) => {
          formData.append('proof_report[]', photo);
        });
      }

      const response = await fetch(logisticsI.backend.api.orderReportAdd, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSuccess('Report submitted successfully.');

        // Update the report_issue status for the received order
        // Use the correct ID field from the received order object
        const receivedOrderId = selectedReportItem.id || selectedReportItem.order_item_id;
        const updateReportIssueResponse = await fetch(`${logisticsI.backend.api.receivedOrders}/${receivedOrderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ report_issue: true }),
        });

        closeReportModal();
        fetchAllData(); // Refresh lists
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
          setError(bodyText || `Failed to submit report (status ${response.status})`);
        }
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      setError('Error submitting report');
    }
    setLoading(false);
  };

  const openReplacementModal = (report) => {
    console.log('Opening replacement modal for report:', report);
    setSelectedReplacementItem(report);
    setReplacementForm({ replacement_date: '' });
    setShowReplacementModal(true);
  };

  const closeReplacementModal = () => {
    setShowReplacementModal(false);
    setSelectedReplacementItem(null);
    setReplacementForm({ replacement_date: '', replacement_time: '' });
  };

  const handleSubmitReplacement = async (e) => {
    e.preventDefault();
    if (!replacementForm.replacement_date) {
      setError('Please select a replacement date');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(logisticsI.backend.api.orderItemReplacement.replace('{id}', selectedReplacementItem.order_item_id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replacement_date: replacementForm.replacement_date,
          replaced_by: auth?.name || 'Unknown User'
        }),
      });
      if (response.ok) {
        setSuccess('Replacement scheduled successfully.');
        closeReplacementModal();
        fetchAllData();
      } else {
        let errorData;
        try {
          errorData = await response.json();
          setError(errorData.error || 'Failed to schedule replacement');
        } catch (parseErr) {
          setError(`Failed to schedule replacement (status ${response.status})`);
        }
      }
    } catch (err) {
      console.error('Error scheduling replacement:', err);
      setError('Error scheduling replacement');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-full mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">Purchase Processing</h1>
        {/* Enhanced Success Message */}
        {success && (
          <div className="fixed top-6 right-6 z-50 animate-bounce">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-green-500/30 border border-green-400/50 backdrop-blur-sm">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-white mb-1">Success!</h4>
                  <p className="text-green-100 text-sm font-medium">{success}</p>
                </div>
                <button
                  onClick={() => setSuccess('')}
                  className="flex-shrink-0 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Progress bar animation */}
              <div className="mt-3 w-full bg-green-400/30 rounded-full h-1 overflow-hidden">
                <div className="bg-white/80 h-full rounded-full animate-pulse" style={{width: '100%', transition: 'width 3s ease-out'}}></div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Error Message */}
        {error && (
          <div className="fixed top-6 right-6 z-50 animate-bounce">
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-red-500/30 border border-red-400/50 backdrop-blur-sm">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-white mb-1">Error!</h4>
                  <p className="text-red-100 text-sm font-medium">{error}</p>
                </div>
                <button
                  onClick={() => setError('')}
                  className="flex-shrink-0 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Progress bar animation */}
              <div className="mt-3 w-full bg-red-400/30 rounded-full h-1 overflow-hidden">
                <div className="bg-white/80 h-full rounded-full animate-pulse" style={{width: '100%', transition: 'width 3s ease-out'}}></div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Request Card */}
          <div
            onClick={() => setActiveSection('create')}
            className={`group relative bg-card border rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
              activeSection === 'create'
                ? 'border-sidebar-primary shadow-lg ring-1 ring-sidebar-primary/20'
                : 'border-border hover:border-sidebar-primary/50'
            }`}
          >
            <div className={`w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center transition-all duration-200 ${
              activeSection === 'create'
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'bg-sidebar-accent text-sidebar-accent-foreground group-hover:bg-sidebar-accent/80'
            }`}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>

            <h3 className={`text-xl font-bold mb-2 transition-colors duration-200 ${
              activeSection === 'create' ? 'text-sidebar-primary' : 'text-foreground'
            }`}>
              Request
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Create low stock requests
            </p>

            {activeSection === 'create' && (
              <div className="absolute top-4 right-4 w-3 h-3 bg-sidebar-primary rounded-full animate-pulse"></div>
            )}
          </div>

          {/* Approval Card */}
          <div
            onClick={() => setActiveSection('approval')}
            className={`group relative bg-card border rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
              activeSection === 'approval'
                ? 'border-sidebar-primary shadow-lg ring-1 ring-sidebar-primary/20'
                : 'border-border hover:border-sidebar-primary/50'
            }`}
          >
            <div className={`w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center transition-all duration-200 ${
              activeSection === 'approval'
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'bg-sidebar-accent text-sidebar-accent-foreground group-hover:bg-sidebar-accent/80'
            }`}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h3 className={`text-xl font-bold mb-2 transition-colors duration-200 ${
              activeSection === 'approval' ? 'text-sidebar-primary' : 'text-foreground'
            }`}>
              Approval
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Review purchase requests
            </p>

            {activeSection === 'approval' && (
              <div className="absolute top-4 right-4 w-3 h-3 bg-sidebar-primary rounded-full animate-pulse"></div>
            )}
          </div>

          {/* Order Records Card */}
          <div
            onClick={() => setActiveSection('issue')}
            className={`group relative bg-card border rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
              activeSection === 'issue'
                ? 'border-sidebar-primary shadow-lg ring-1 ring-sidebar-primary/20'
                : 'border-border hover:border-sidebar-primary/50'
            }`}
          >
            <div className={`w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center transition-all duration-200 ${
              activeSection === 'issue'
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'bg-sidebar-accent text-sidebar-accent-foreground group-hover:bg-sidebar-accent/80'
            }`}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>

            <h3 className={`text-xl font-bold mb-2 transition-colors duration-200 ${
              activeSection === 'issue' ? 'text-sidebar-primary' : 'text-foreground'
            }`}>
              Order Records
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              View reports and received orders
            </p>

            {activeSection === 'issue' && (
              <div className="absolute top-4 right-4 w-3 h-3 bg-sidebar-primary rounded-full animate-pulse"></div>
            )}
          </div>

          {/* Order List Card */}
          <div
            onClick={() => setActiveSection('orderList')}
            className={`group relative bg-card border rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
              activeSection === 'orderList'
                ? 'border-sidebar-primary shadow-lg ring-1 ring-sidebar-primary/20'
                : 'border-border hover:border-sidebar-primary/50'
            }`}
          >
            <div className={`w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center transition-all duration-200 ${
              activeSection === 'orderList'
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'bg-sidebar-accent text-sidebar-accent-foreground group-hover:bg-sidebar-accent/80'
            }`}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>

            <h3 className={`text-xl font-bold mb-2 transition-colors duration-200 ${
              activeSection === 'orderList' ? 'text-sidebar-primary' : 'text-foreground'
            }`}>
              Order List
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Manage ongoing orders
            </p>

            {activeSection === 'orderList' && (
              <div className="absolute top-4 right-4 w-3 h-3 bg-sidebar-primary rounded-full animate-pulse"></div>
            )}
          </div>
        </div>

        {/* Conditional Sections */}
        {activeSection === 'create' && (
          <section>
            <div className="flex justify-between items-center mb-8 p-6 bg-gradient-to-r from-sidebar-accent to-sidebar-accent/80 rounded-2xl border border-sidebar-border">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Low Stock Requests</h2>
                <p className="text-white font-medium">Manage and track inventory requests</p>
              </div>
              <button
                onClick={() => setShowCreatePurchaseRequestModal(true)}
                className="group relative bg-gradient-to-r from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-sidebar-primary/30 hover:shadow-xl hover:shadow-sidebar-primary/40 transform hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <div className="relative flex items-center space-x-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Create Request</span>
                </div>
              </button>
            </div>
            {lowstockRequests.length > 0 ? (
              <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-sidebar-accent">
                        <th className="py-4 px-6 text-center text-sm font-bold text-white uppercase tracking-wider">Item</th>
                        <th className="py-4 px-6 text-center text-sm font-bold text-white uppercase tracking-wider">Quantity</th>
                        <th className="py-4 px-6 text-center text-sm font-bold text-white uppercase tracking-wider">Requested By</th>
                        <th className="py-4 px-6 text-center text-sm font-bold text-white uppercase tracking-wider">Status</th>
                        <th className="py-4 px-6 text-center text-sm font-bold text-white uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {lowstockRequests.filter(request => request.status === 'pending').map((request) => (
                        <tr key={request.id || `lowstock-${request.item_name}-${request.quantity}`} className="hover:bg-sidebar-accent/50 transition-all duration-200">
                          <td className="py-4 px-6 text-center text-sm text-foreground font-medium">{request.item_name}</td>
                          <td className="py-4 px-6 text-center text-sm text-foreground font-semibold">
                            <span className="bg-sidebar-accent text-sidebar-accent-foreground px-3 py-1 rounded-full">{request.quantity}</span>
                          </td>
                          <td className="py-4 px-6 text-center text-sm text-muted-foreground truncate max-w-32">{request.requested_by || 'N/A'}</td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-3 py-2 text-xs font-semibold rounded-full shadow-sm ${
                              request.status === 'approved' ? 'bg-green-500 text-white' :
                              request.status === 'rejected' ? 'bg-red-500 text-white' :
                              'bg-yellow-500 text-white'
                            }`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex flex-row space-x-2 justify-center">
                              <button
                                onClick={() => openPurchaseModal(request)}
                                disabled={loading}
                                className="group bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <div className="flex items-center space-x-2">
                                  <svg className="w-4 h-4 group-hover:rotate-3 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span>Approve</span>
                                </div>
                              </button>
                              <button
                                onClick={() => handleRejectLowstock(request.id)}
                                disabled={loading}
                                className="group bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <div className="flex items-center space-x-2">
                                  <svg className="w-4 h-4 group-hover:rotate-3 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  <span>Reject</span>
                                </div>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-12 text-center border border-blue-100">
                <svg className="w-16 h-16 text-blue-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Low Stock Requests</h3>
                <p className="text-blue-600">All inventory levels are currently sufficient</p>
              </div>
            )}
          </section>
        )}

        {activeSection === 'approval' && (
          <section>
            <div className="flex justify-between items-center mb-8 p-6 bg-gradient-to-r from-sidebar-accent to-sidebar-accent/80 rounded-2xl border border-sidebar-border">
              <div>
                <h2 className="text-3xl font-bold text-white dark:text-white mb-2">Approval Workflow</h2>
                <p className="text-indigo-100 dark:text-gray-200 font-medium">Review and approve purchase requests</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 dark:bg-white/30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white dark:text-white">{purchaseRequests.filter(req => req.status !== 'ordered').length}</p>
                  <p className="text-sm text-indigo-100 dark:text-gray-200 font-medium">Pending Requests</p>
                </div>
              </div>
            </div>

            {purchaseRequests.length > 0 ? (
              <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-sidebar-accent">
                        <th className="py-4 px-6 text-center text-sm font-bold text-white uppercase tracking-wider">
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span>ID</span>
                          </div>
                        </th>
                        <th className="py-4 px-6 text-center text-sm font-bold text-white uppercase tracking-wider">
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <span>Item</span>
                          </div>
                        </th>
                        <th className="py-4 px-6 text-center text-sm font-bold text-white uppercase tracking-wider">
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                            <span>Qty</span>
                          </div>
                        </th>
                        <th className="py-4 px-6 text-center text-sm font-bold text-white uppercase tracking-wider">
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>Supplier</span>
                          </div>
                        </th>
                        <th className="py-4 px-6 text-center text-sm font-bold text-white uppercase tracking-wider">
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            <span>Price</span>
                          </div>
                        </th>
                        <th className="py-4 px-6 text-center text-sm font-bold text-white uppercase tracking-wider">
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span>Total</span>
                          </div>
                        </th>
                        <th className="py-4 px-6 text-center text-sm font-bold text-white uppercase tracking-wider">
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Requested By</span>
                          </div>
                        </th>
                        <th className="py-4 px-6 text-center text-sm font-bold text-white uppercase tracking-wider">
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Status</span>
                          </div>
                        </th>
                        <th className="py-4 px-6 text-center text-sm font-bold text-white uppercase tracking-wider">
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Action</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {purchaseRequests.filter(req => req.status !== 'ordered').map((request) => (
                        <tr key={request.request_id || request.id || `pr-${request.item_name}-${request.quantity}`} className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200">
                          <td className="py-4 px-6 text-center">
                            <div className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-full text-sm font-bold">
                              #{request.request_id}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 dark:border-gray-600">
                              {request.item_name}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-full text-sm font-bold">
                              {request.quantity}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 dark:border-gray-600 truncate max-w-32">
                              {request.supplier_name || 'N/A'}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg text-sm font-bold border border-gray-200 dark:border-gray-600">
                              ₱{request.price}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-bold">
                              ₱{request.total_price}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 dark:border-gray-600 truncate max-w-32">
                              {request.requested_by || 'N/A'}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-4 py-2 text-sm font-bold rounded-full ${
                              request.status === 'approved' ? 'bg-green-500 text-white' :
                              request.status === 'rejected' ? 'bg-red-500 text-white' :
                              'bg-yellow-500 text-white'
                            }`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex flex-col space-y-2">
                              {request.status === 'pending' && (
                                <div className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl text-sm font-bold border border-gray-200 dark:border-gray-600">
                                  <div className="flex items-center justify-center space-x-2">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                                    <svg className="w-5 h-5 text-indigo-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{animationDuration: '2s'}}>
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-gray-800 dark:text-gray-200 font-extrabold">Waiting for Approval</span>
                                  </div>
                                  <div className="mt-2 w-full bg-indigo-200 dark:bg-indigo-700 rounded-full h-2 overflow-hidden">
                                    <div className="bg-indigo-500 h-full rounded-full animate-pulse" style={{width: '60%', transition: 'width 2s ease-in-out'}}></div>
                                  </div>
                                </div>
                              )}
                              {request.status === 'approved' && (
                                <button
                                  onClick={() => openOrderModal(request)}
                                  disabled={loading}
                                  className="group bg-indigo-600 dark:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 dark:hover:bg-indigo-600 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 group-hover:rotate-3 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    <span>Order</span>
                                  </div>
                                </button>
                              )}
                              {request.status === 'rejected' && (
                                <button
                                  onClick={() => openDetailsModal(request)}
                                  disabled={loading}
                                  className="group bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-300 dark:hover:bg-gray-500 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 group-hover:rotate-3 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>View Details</span>
                                  </div>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-12 text-center border border-green-100">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Purchase Requests</h3>
                <p className="text-green-600">All requests have been processed</p>
              </div>
            )}
          </section>
        )}

        {activeSection === 'issue' && (
          <section>
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">Order History</h2>

            {/* Search and Filter */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-8 mb-8 border border-blue-100">
              <div className="flex flex-col sm:flex-row gap-6 items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </div>
                  <label className="text-lg font-bold text-gray-700">Filter by:</label>
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="flex-1 p-5 border-2 border-blue-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-gray-700 font-semibold text-lg transition-all duration-200 hover:border-blue-300"
                >
                  <option value="order-reports">Order Reports</option>
                  <option value="received-orders">Received Orders</option>
                  <option value="cancel-orders">Cancelled Orders</option>
                </select>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-80 p-5 border-2 border-blue-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-gray-700 font-semibold text-lg transition-all duration-200 hover:border-blue-300"
                  />
                </div>
              </div>
            </div>

            {/* Filtered Data */}
            <div className="space-y-6">
              {/* Order Reports */}
              {(filterType === 'all' || filterType === 'order-reports') && (
                <div className="bg-card dark:bg-gray-800 rounded-xl shadow-lg border border-border dark:border-gray-600">
                  <div className="p-6">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-sidebar-accent dark:bg-gray-700 rounded-xl flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Order Reports</h3>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">Issue reports and problem documentation</p>
                      </div>
                    </div>

                    {(() => {
                      const filteredOrderReports = orderReports.filter(report =>
                        !searchTerm ||
                        report.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        report.quantity?.toString().includes(searchTerm) ||
                        (report.report_description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        report.reported_by?.toLowerCase().includes(searchTerm.toLowerCase())
                      );

                      return filteredOrderReports.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead>
                              <tr className="bg-sidebar-accent dark:bg-gray-700">
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    <span>Order Item ID</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    <span>Item Name</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                    </svg>
                                    <span>Quantity</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                    <span>Price/Unit</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <span>Total Price</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>Reported By</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Status</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>Actions</span>
                                  </div>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-card dark:bg-gray-800 divide-y divide-border dark:divide-gray-600">
                              {filteredOrderReports.map((report, index) => (
                                <tr key={report.order_item_id || report.id || `report-${report.item_name}-${report.quantity}`} className={`hover:bg-sidebar-accent/50 dark:hover:bg-gray-700 transition-all duration-200 ${index % 2 === 0 ? 'bg-card dark:bg-gray-800' : 'bg-sidebar-accent/30 dark:bg-gray-700/50'}`}>
                                  <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300 font-bold">
                                    <div className="bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-full text-xs font-extrabold shadow-sm">
                                      #{report.order_item_id}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300 font-semibold truncate max-w-48">
                                    <div className="bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-500">
                                      {report.item_name}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300 font-bold">
                                    <div className="bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-full text-sm font-extrabold shadow-sm">
                                      {report.quantity}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300 font-bold">
                                    <div className="bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-extrabold shadow-sm border border-gray-200 dark:border-gray-500">
                                      ₱{report.price_per_unit}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300 font-bold">
                                    <div className="bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-extrabold shadow-sm">
                                      ₱{report.total_price}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300 font-semibold truncate max-w-32">
                                    <div className="bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-500">
                                      {report.reported_by}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-center">
                                    <span className={`px-4 py-2 text-sm font-bold rounded-full shadow-lg transition-all duration-200 ${
                                      report.status === 'reported' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-yellow-200' :
                                      report.status === 'archived' ? 'bg-gradient-to-r from-gray-400 to-gray-600 text-white shadow-gray-200' :
                                      'bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-blue-200'
                                    }`}>
                                      {report.status}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6 text-center">
                                    <div className="flex flex-col space-y-2 justify-center items-center">
                                      <button
                                        onClick={() => openReportDetailsModal(report)}
                                        className="group bg-sidebar-primary dark:bg-gray-600 text-sidebar-primary-foreground dark:text-gray-100 px-6 py-3 rounded-xl text-sm font-bold hover:bg-sidebar-primary/80 dark:hover:bg-gray-500 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                          </svg>
                                          <span>View Details</span>
                                        </div>
                                      </button>
                                      {(report.status === 'reported' || report.status === 'Reported') && (
                                        <button
                                          onClick={() => openReplacementModal(report)}
                                          className="group bg-green-600 dark:bg-green-700 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-green-700 dark:hover:bg-green-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                                        >
                                          <div className="flex items-center space-x-2">
                                            <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            <span>Schedule Replacement</span>
                                          </div>
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <svg className="w-12 h-12 text-sidebar-primary dark:text-sidebar-accent-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-sidebar-primary dark:text-sidebar-accent-foreground text-sm font-medium">
                            {searchTerm ? 'No order reports match your search' : 'No order reports available'}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Received Orders */}
              {(filterType === 'all' || filterType === 'received-orders') && (
                <div className="bg-card dark:bg-gray-800 rounded-xl shadow-lg border border-border dark:border-gray-600">
                  <div className="p-6">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-sidebar-accent dark:bg-gray-700 rounded-xl flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Received Orders</h3>
                        <p className="text-gray-900 dark:text-white font-medium">Successfully delivered orders</p>
                      </div>
                    </div>

                    {(() => {
                      const filteredReceivedOrders = receivedOrders.filter(order =>
                        !searchTerm ||
                        order.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.quantity?.toString().includes(searchTerm) ||
                        order.received_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.price_per_unit?.toString().includes(searchTerm) ||
                        order.total_price?.toString().includes(searchTerm) ||
                        order.delivery_date?.includes(searchTerm) ||
                        order.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.supplier_website?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.supplier_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.supplier_phone?.includes(searchTerm) ||
                        order.supplier_email?.toLowerCase().includes(searchTerm.toLowerCase())
                      );

                      return filteredReceivedOrders.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead>
                              <tr className="bg-sidebar-accent dark:bg-gray-700">
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    <span>Order Item ID</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    <span>Item Name</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                    </svg>
                                    <span>Quantity</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                    <span>Price/Unit</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <span>Total Price</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>Delivery Date</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Status</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>Received By</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <span>Report Issue</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span>Contacts</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>Action</span>
                                  </div>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-card dark:bg-gray-800 divide-y divide-border dark:divide-gray-600">
                              {filteredReceivedOrders.map((order) => (
                                <tr key={order.order_item_id || order.id || `received-${order.item_name}-${order.quantity}`} className="hover:bg-sidebar-accent/50 dark:hover:bg-gray-700 transition-all duration-200">
                                  <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300 font-bold">
                                    <div className="bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-full text-xs font-extrabold shadow-sm">
                                      #{order.order_item_id}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300 font-semibold truncate max-w-48">
                                    <div className="bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-500">
                                      {order.item_name}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300 font-bold">
                                    <div className="bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-full text-sm font-extrabold shadow-sm">
                                      {order.quantity}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300 font-bold">
                                    <div className="bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-extrabold shadow-sm border border-gray-200 dark:border-gray-500">
                                      ₱{order.price_per_unit}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300 font-bold">
                                    <div className="bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-extrabold shadow-sm">
                                      ₱{order.total_price}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300">
                                    {order.delivery_date ? new Date(order.delivery_date).toLocaleString('en-US', { timeZone: 'Asia/Manila' }) : 'N/A'}
                                  </td>
                                  <td className="py-4 px-6 text-center">
                                    <span className={`px-4 py-2 text-sm font-bold rounded-full shadow-lg transition-all duration-200 ${
                                      order.status === 'received' ? 'bg-gradient-to-r from-green-400 to-green-600 text-white shadow-green-200' :
                                      order.status === 'pending' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-yellow-200' :
                                      'bg-gradient-to-r from-gray-400 to-gray-600 text-white shadow-gray-200'
                                    }`}>
                                      {order.status}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300 truncate max-w-32">{order.received_by}</td>
                                  <td className="py-4 px-6 text-center">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${order.report_issue ? 'bg-gradient-to-r from-red-400 to-red-600 text-white' : 'bg-gradient-to-r from-green-400 to-green-600 text-white'}`}>
                                      {order.report_issue ? 'Yes' : 'No'}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6 text-center">
                                    <button
                                      onClick={() => openReceivedDetailsModal(order)}
                                      className="group bg-sidebar-primary dark:bg-gray-600 text-sidebar-primary-foreground dark:text-gray-100 px-6 py-3 rounded-xl text-sm font-bold hover:bg-sidebar-primary/80 dark:hover:bg-gray-500 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <span>Contact</span>
                                      </div>
                                    </button>
                                  </td>
                                  <td className="py-4 px-6 text-center">
                                    {order.report_issue ? (
                                      <span className="bg-gradient-to-r from-gray-400 to-gray-600 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-sm">
                                        Reported
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => openReportModal(order)}
                                        className="group bg-sidebar-primary dark:bg-gray-600 text-sidebar-primary-foreground dark:text-gray-100 px-6 py-3 rounded-xl text-sm font-bold hover:bg-sidebar-primary/80 dark:hover:bg-gray-500 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                          </svg>
                                          <span>Report</span>
                                        </div>
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <svg className="w-12 h-12 text-sidebar-primary dark:text-sidebar-accent-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <p className="text-sidebar-primary dark:text-sidebar-accent-foreground text-sm font-medium">
                            {searchTerm ? 'No received orders match your search' : 'No received orders available'}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Cancel Orders */}
              {(filterType === 'all' || filterType === 'cancel-orders') && (
                <div className="bg-card dark:bg-gray-800 rounded-xl shadow-lg border border-border dark:border-gray-600">
                  <div className="p-6">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-sidebar-accent dark:bg-gray-700 rounded-xl flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Cancelled Orders</h3>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">Orders that have been cancelled</p>
                      </div>
                    </div>

                    {(() => {
                      const filteredCancelOrders = orderItems.filter(order =>
                        order.status === 'cancel' && (
                          !searchTerm ||
                          order.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.quantity?.toString().includes(searchTerm) ||
                          order.price_per_unit?.toString().includes(searchTerm) ||
                          order.total_price?.toString().includes(searchTerm) ||
                          order.delivery_date?.includes(searchTerm) ||
                          (order.cancellation_reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (order.cancelled_by || '').toLowerCase().includes(searchTerm.toLowerCase())
                        )
                      );

                      return filteredCancelOrders.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead>
                              <tr className="bg-sidebar-accent dark:bg-gray-700">
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    <span>Order Item ID</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    <span>Item Name</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                    </svg>
                                    <span>Quantity</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                    <span>Price/Unit</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <span>Total Price</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>Delivery Date</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Status</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>Cancelled By</span>
                                  </div>
                                </th>
                                <th className="py-4 px-6 text-center text-sm font-bold text-white dark:text-white uppercase tracking-wider">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>Action</span>
                                  </div>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-card dark:bg-gray-800 divide-y divide-border dark:divide-gray-600">
                              {filteredCancelOrders.map((order) => (
                                <tr key={order.order_item_id || order.id || `cancel-${order.item_name}-${order.quantity}`} className="hover:bg-sidebar-accent/50 dark:hover:bg-gray-700 transition-all duration-200">
                                  <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300 font-bold">
                                    <div className="bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-full text-xs font-extrabold shadow-sm">
                                      #{order.order_item_id}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300 font-semibold truncate max-w-48">
                                    <div className="bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-500">
                                      {order.item_name}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300 font-bold">
                                    <div className="bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-full text-sm font-extrabold shadow-sm">
                                      {order.quantity}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300 font-bold">
                                    <div className="bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-extrabold shadow-sm border border-gray-200 dark:border-gray-500">
                                      ₱{order.price_per_unit}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300 font-bold">
                                    <div className="bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-extrabold shadow-sm">
                                      ₱{order.total_price}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300">
                                    {order.delivery_date ? new Date(order.delivery_date).toLocaleString('en-US', { timeZone: 'Asia/Manila' }) : 'N/A'}
                                  </td>
                                  <td className="py-4 px-6 text-center">
                                    <span className="px-4 py-2 text-sm font-bold rounded-full shadow-lg transition-all duration-200 bg-gradient-to-r from-red-400 to-red-600 text-white">
                                      {order.status}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300 truncate max-w-32">{order.cancelled_by || 'N/A'}</td>
                                  <td className="py-4 px-6 text-center">
                                    <button
                                      onClick={() => openCancelDetailsModal(order)}
                                      className="group bg-sidebar-primary dark:bg-gray-600 text-sidebar-primary-foreground dark:text-gray-100 px-6 py-3 rounded-xl text-sm font-bold hover:bg-sidebar-primary/80 dark:hover:bg-gray-500 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        <span>View</span>
                                      </div>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <svg className="w-12 h-12 text-sidebar-primary dark:text-sidebar-accent-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <p className="text-sidebar-primary dark:text-sidebar-accent-foreground text-sm font-medium">
                            {searchTerm ? 'No cancelled orders match your search' : 'No cancelled orders available'}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {activeSection === 'orderList' && (
          <section>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Order Management</h2>

            {/* Order Type Toggle */}
            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                <button
                  onClick={() => setOrderListType('ongoing')}
                  className={`px-6 py-3 rounded-md font-medium text-sm transition-all duration-200 flex items-center ${
                    orderListType === 'ongoing'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Ongoing Orders ({orderItems.filter(item => item.status === 'ongoing').length})
                </button>
                <button
                  onClick={() => setOrderListType('replacement')}
                  className={`px-6 py-3 rounded-md font-medium text-sm transition-all duration-200 flex items-center ${
                    orderListType === 'replacement'
                      ? 'bg-orange-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Replacement Orders ({orderItems.filter(item => item.status === 'waiting replacement').length})
                </button>
              </div>
            </div>

            {/* Order Tables */}
            {orderListType === 'ongoing' && (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-sidebar-accent px-6 py-4 text-sidebar-accent-foreground">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">Ongoing Orders</h3>
                        <p className="text-blue-100 text-sm">Orders currently in progress</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{orderItems.filter(item => item.status === 'ongoing').length}</div>
                      <div className="text-sm text-blue-100">Active</div>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  {orderItems.filter(item => item.status === 'ongoing').length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {orderItems.filter(item => item.status === 'ongoing').map((item, idx) => (
                            <tr key={item.order_item_id ?? item.id ?? `ongoing-${idx}`} className="hover:bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                #{item.request_id}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 truncate max-w-32">
                                {item.item_name}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                                {item.quantity}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                ₱{item.price_per_unit}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                ₱{item.total_price}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 truncate max-w-24">
                                {item.supplier_name || 'N/A'}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                <div className="text-xs">
                                  <div>{item.supplier_email}</div>
                                  <div>{item.supplier_phone}</div>
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                {item.delivery_date ? (
                                  <span className="text-blue-600">
                                    {new Date(item.delivery_date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </span>
                                ) : (
                                  'N/A'
                                )}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                                <div className="flex flex-col space-y-1">
                                  <button
                                    onClick={() => handleReceived(item)}
                                    disabled={loading}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Receive
                                  </button>
                                  <button
                                    onClick={() => openCancelModal(item)}
                                    disabled={loading}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No Ongoing Orders</h3>
                      <p className="text-gray-500">All orders have been processed</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {orderListType === 'replacement' && (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-sidebar-accent px-6 py-4 text-sidebar-accent-foreground">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">Replacement Orders</h3>
                        <p className="text-orange-100 text-sm">Orders waiting for replacement</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{orderItems.filter(item => item.status === 'waiting replacement').length}</div>
                      <div className="text-sm text-orange-100">Pending</div>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  {orderItems.filter(item => item.status === 'waiting replacement').length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Replacement Date</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {orderItems.filter(item => item.status === 'waiting replacement').map((item, idx) => (
                            <tr key={item.order_item_id ?? item.id ?? `replacement-${idx}`} className="hover:bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                #{item.request_id}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 truncate max-w-32">
                                {item.item_name}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                                {item.quantity}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                ₱{item.price_per_unit}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                ₱{item.total_price}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 truncate max-w-24">
                                {item.supplier_name || 'N/A'}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                <div className="text-xs">
                                  <div>{item.supplier_email}</div>
                                  <div>{item.supplier_phone}</div>
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                {item.replacement_date ? (
                                  <span className="text-orange-600">
                                    {new Date(item.replacement_date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </span>
                                ) : (
                                  'N/A'
                                )}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleReplaceReceive(item)}
                                  disabled={loading}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Receive
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No Replacement Orders</h3>
                      <p className="text-gray-500">All replacements have been processed</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Modal for Purchase Request */}
        {showModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl shadow-2xl dark:shadow-gray-900/50 border border-blue-100 dark:border-gray-600 w-full max-w-lg transform animate-bounce-in">
              {/* Header - Fixed */}
              <div className="bg-gradient-to-r from-sidebar-accent to-sidebar-accent/80 text-white p-6 rounded-t-3xl">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/25 dark:bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white dark:text-white">Create Purchase Request</h3>
                    <p className="text-purple-100 dark:text-gray-300">Fill in the details to create a new purchase request</p>
                  </div>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-8">
                {/* Item Info */}
                <div className="mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-indigo-200 dark:bg-indigo-800 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-indigo-700 dark:text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Item Name *</label>
                      </div>
                      <p className="text-gray-900 dark:text-gray-100 font-semibold text-base ml-11">{selectedRequest.item_name}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-purple-200 dark:bg-purple-800 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-purple-700 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                        </div>
                        <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Quantity *</label>
                      </div>
                      <p className="text-gray-900 dark:text-gray-100 font-semibold text-base ml-11">{selectedRequest.quantity}</p>
                    </div>
                  </div>
                </div>

                <form id="purchaseForm" onSubmit={handleSubmitPurchase} className="space-y-6">
                  {/* Supplier Selection */}
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-indigo-200 dark:bg-indigo-800 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-indigo-700 dark:text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <label className="text-lg font-semibold text-gray-900 dark:text-gray-100">Supplier *</label>
                    </div>
                    <select
                      value={purchaseForm.supplier_id}
                      onChange={(e) => handleSupplierChange(e.target.value)}
                      required
                      className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 focus:border-indigo-600 dark:focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium transition-all duration-200 hover:border-indigo-400 dark:hover:border-indigo-500"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((supplier, idx) => (
                        <option key={supplier.supplier_id ?? supplier.id ?? `supplier-${idx}`} value={supplier.supplier_id}>
                          {supplier.supplier_name} - {supplier.item_name} - ₱{supplier.price || 'N/A'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price, Quantity, Total Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-green-200 dark:bg-green-800 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-700 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Price per Unit</label>
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-400">₱</span>
                        <input
                          type="number"
                          step="0.01"
                          value={purchaseForm.price}
                          readOnly
                          className="w-full p-4 pl-10 border border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-blue-200 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-700 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                        </div>
                        <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Quantity</label>
                      </div>
                      <input
                        type="number"
                        value={purchaseForm.quantity}
                        readOnly
                        className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold text-center"
                      />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-green-200 dark:bg-green-800 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-700 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Total Amount</label>
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-700 dark:text-green-300">₱</span>
                        <input
                          type="number"
                          value={purchaseForm.total}
                          readOnly
                          className="w-full p-4 pl-10 border border-green-300 dark:border-green-600 rounded-2xl bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-200 font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bottom spacing for scroll */}
                  <div className="pb-8"></div>
                </form>
              </div>

              {/* Action Buttons - Fixed */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded-b-3xl border-t border-gray-300 dark:border-gray-600 p-6 flex-shrink-0">
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="group px-8 py-3 bg-gray-600 dark:bg-gray-600 text-white dark:text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Cancel</span>
                    </div>
                  </button>
                  <button
                    type="submit"
                    form="purchaseForm"
                    disabled={loading}
                    className="group relative bg-indigo-700 dark:bg-indigo-600 text-white dark:text-white px-8 py-3 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <div className="relative flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{loading ? 'Submitting...' : 'Submit Request'}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Order */}
        {showOrderModal && selectedOrderRequest && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl border border-blue-100 w-full max-w-2xl h-[90vh] flex flex-col transform animate-bounce-in">
              {/* Header - Fixed at top */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 rounded-t-3xl flex-shrink-0">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold tracking-wide">Place Order</h3>
                    <p className="text-blue-100 text-base font-medium">Confirm order details and delivery schedule</p>
                  </div>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-8">
                <form
                  id="orderForm"
                  onSubmit={(e) => {
                    console.log('=== FORM ONSUBMIT TRIGGERED ===');
                    console.log('Form onSubmit called');
                    console.log('Form element:', e.target);
                    console.log('Form tagName:', e.target.tagName);
                    handleSubmitOrder(e);
                  }}
                  className="space-y-8"
                  ref={(form) => {
                    if (form) {
                      console.log('=== FORM REF ATTACHED ===');
                      console.log('Form element found:', form);
                      console.log('Form onSubmit property:', form.onsubmit);
                    }
                  }}
                >
                  {/* Order Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                    <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <span>Order Summary</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white rounded-xl p-4 border border-blue-100">
                        <label className="block text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Item Name</label>
                        <p className="text-gray-800 font-bold text-lg">{selectedOrderRequest.item_name}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-blue-100">
                        <label className="block text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Quantity</label>
                        <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-bold text-lg inline-block">{selectedOrderRequest.quantity}</span>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-blue-100">
                        <label className="block text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">Total Price</label>
                        <span className="bg-green-100 text-green-800 px-6 py-3 rounded-xl font-bold text-xl inline-block">₱{selectedOrderRequest.total_price}</span>
                      </div>
                    </div>
                  </div>

                  {/* Supplier Information */}
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <span>Supplier Information</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          <span className="flex items-center space-x-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>Supplier Email</span>
                          </span>
                        </label>
                        <input
                          type="email"
                          value={orderForm.supplier_email}
                          readOnly
                          className="w-full p-4 border-2 border-gray-200 rounded-2xl bg-gray-50 text-gray-700 font-semibold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          <span className="flex items-center space-x-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>Supplier Phone</span>
                          </span>
                        </label>
                        <input
                          type="tel"
                          value={orderForm.supplier_phone}
                          readOnly
                          className="w-full p-4 border-2 border-gray-200 rounded-2xl bg-gray-50 text-gray-700 font-semibold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          <span className="flex items-center space-x-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Supplier Address</span>
                          </span>
                        </label>
                        <input
                          type="text"
                          value={orderForm.supplier_address}
                          readOnly
                          className="w-full p-4 border-2 border-gray-200 rounded-2xl bg-gray-50 text-gray-700 font-semibold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          <span className="flex items-center space-x-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9h.01M12 12v0a.5.5 0 01-.5-.5V9.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v2a.5.5 0 01-.5.5h-2z" />
                            </svg>
                            <span>Supplier Website</span>
                          </span>
                        </label>
                        <input
                          type="url"
                          value={orderForm.supplier_website}
                          readOnly
                          className="w-full p-4 border-2 border-gray-200 rounded-2xl bg-gray-50 text-gray-700 font-semibold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delivery Date */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-4">
                      <span className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-xl font-bold">Delivery Date & Time *</span>
                      </span>
                    </label>
                    <input
                      type="datetime-local"
                      value={orderForm.delivery_date}
                      onChange={(e) => setOrderForm({ ...orderForm, delivery_date: e.target.value })}
                      required
                      className="w-full p-5 border-2 border-blue-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-gray-700 font-semibold transition-all duration-200 hover:border-blue-300 text-lg"
                    />
                  </div>

                  {/* Additional space for scrolling */}
                  <div className="pb-8"></div>

                  {/* Action Buttons - Fixed at bottom */}
                  <div className="bg-white rounded-b-3xl border-t border-gray-200 p-8 flex-shrink-0">
                    <div className="flex justify-end space-x-6">
                      <button
                        type="button"
                        onClick={closeOrderModal}
                        className="group px-10 py-5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl font-bold text-xl shadow-lg shadow-gray-500/30 hover:shadow-xl hover:shadow-gray-500/40 transform hover:scale-105 transition-all duration-300"
                      >
                        <div className="flex items-center space-x-3">
                          <svg className="w-6 h-6 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Cancel</span>
                        </div>
                      </button>
                      <button
                        type="submit"
                        form="orderForm"
                        disabled={loading}
                        className="group relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:scale-105 transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <div className="relative flex items-center space-x-3">
                          <svg className="w-6 h-6 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{loading ? 'Placing Order...' : 'Place Order'}</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Details */}
        {showDetailsModal && selectedDetailsRequest && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg transform animate-bounce-in">
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-6 rounded-t-3xl">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold tracking-wide">Request Details</h3>
                    <p className="text-gray-100 text-sm font-medium">View detailed information</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-8">
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-100">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <span>Request Information</span>
                    </h4>
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Item Name</label>
                        <p className="text-gray-800 font-bold text-lg">{selectedDetailsRequest.item_name}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Description</label>
                        <p className="text-gray-700 text-base leading-relaxed">{selectedDetailsRequest.description || 'No description available'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeDetailsModal}
                    className="group px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-gray-500/30 hover:shadow-xl hover:shadow-gray-500/40 transform hover:scale-105 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Close</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Received Order Details */}
        {showReceivedDetailsModal && selectedReceivedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-white to-green-50 rounded-3xl shadow-2xl border border-green-100 w-full max-w-lg h-[90vh] flex flex-col transform animate-bounce-in">
              {/* Header - Fixed */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 rounded-t-3xl flex-shrink-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold tracking-wide">Supplier Contact</h3>
                    <p className="text-green-100 text-sm font-medium">Contact information for supplier</p>
                  </div>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <span>Contact Information</span>
                    </h4>
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl p-4 border border-green-100">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <label className="text-sm font-semibold text-gray-700">Supplier Email</label>
                        </div>
                        <p className="text-gray-800 font-medium text-base ml-11">{selectedReceivedOrder.supplier_email || 'N/A'}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-green-100">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <label className="text-sm font-semibold text-gray-700">Supplier Phone</label>
                        </div>
                        <p className="text-gray-800 font-medium text-base ml-11">{selectedReceivedOrder.supplier_phone || 'N/A'}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-green-100">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <label className="text-sm font-semibold text-gray-700">Supplier Address</label>
                        </div>
                        <p className="text-gray-800 font-medium text-base ml-11">{selectedReceivedOrder.supplier_address || 'N/A'}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-green-100">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9h.01M12 12v0a.5.5 0 01-.5-.5V9.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v2a.5.5 0 01-.5.5h-2z" />
                            </svg>
                          </div>
                          <label className="text-sm font-semibold text-gray-700">Supplier Website</label>
                        </div>
                        <p className="text-gray-800 font-medium text-base ml-11">{selectedReceivedOrder.supplier_website || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom spacing for scroll */}
                <div className="pb-8"></div>
              </div>

              {/* Action Buttons - Fixed */}
              <div className="bg-white rounded-b-3xl border-t border-gray-200 p-8 flex-shrink-0">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={closeReceivedDetailsModal}
                    className="group px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transform hover:scale-105 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Close</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Cancel Details */}
        {showCancelDetailsModal && selectedCancelOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-white to-red-50 rounded-3xl shadow-2xl border border-red-100 w-full max-w-lg h-[90vh] flex flex-col transform animate-bounce-in">
              {/* Header - Fixed */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-3xl flex-shrink-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold tracking-wide">Cancellation Details</h3>
                    <p className="text-red-100 text-sm font-medium">Order cancellation information</p>
                  </div>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 border border-red-100">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <span>Cancellation Information</span>
                    </h4>
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl p-4 border border-red-100">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <label className="text-sm font-semibold text-gray-700">Supplier Email</label>
                        </div>
                        <p className="text-gray-800 font-medium text-base ml-11">{selectedCancelOrder.supplier_email || 'N/A'}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-red-100">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <label className="text-sm font-semibold text-gray-700">Supplier Phone</label>
                        </div>
                        <p className="text-gray-800 font-medium text-base ml-11">{selectedCancelOrder.supplier_phone || 'N/A'}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-red-100">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <label className="text-sm font-semibold text-gray-700">Supplier Address</label>
                        </div>
                        <p className="text-gray-800 font-medium text-base ml-11">{selectedCancelOrder.supplier_address || 'N/A'}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-red-100">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9h.01M12 12v0a.5.5 0 01-.5-.5V9.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v2a.5.5 0 01-.5.5h-2z" />
                            </svg>
                          </div>
                          <label className="text-sm font-semibold text-gray-700">Supplier Website</label>
                        </div>
                        <p className="text-gray-800 font-medium text-base ml-11">{selectedCancelOrder.supplier_website || 'N/A'}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-red-200">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-red-200 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <label className="text-sm font-semibold text-gray-700">Cancellation Reason</label>
                        </div>
                        <p className="text-gray-800 font-medium text-base ml-11">{selectedCancelOrder.cancellation_reason || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom spacing for scroll */}
                <div className="pb-8"></div>
              </div>

              {/* Action Buttons - Fixed */}
              <div className="bg-white rounded-b-3xl border-t border-gray-200 p-8 flex-shrink-0">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={closeCancelDetailsModal}
                    className="group px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transform hover:scale-105 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Close</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Report */}
        {showReportModal && selectedReportItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-white to-red-50 rounded-3xl shadow-2xl border border-red-100 w-full max-w-lg h-[90vh] flex flex-col transform animate-bounce-in">
              {/* Header - Fixed */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-3xl flex-shrink-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold tracking-wide">Report Issue</h3>
                    <p className="text-red-100 text-sm font-medium">Report a problem with this order</p>
                  </div>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-8">
                {/* Item Info */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 mb-8 border border-red-100">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <span>Item Information</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-red-100">
                      <label className="block text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">Item Name</label>
                      <p className="text-gray-800 font-bold text-lg">{selectedReportItem.item_name}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-red-100">
                      <label className="block text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">Quantity</label>
                      <span className="bg-red-100 text-red-800 px-4 py-2 rounded-full font-bold text-lg inline-block">{selectedReportItem.quantity}</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmitReport} encType="multipart/form-data" className="space-y-8">
                  {/* Description */}
                  <div>
                    <label className="block text-xl font-bold text-gray-700 mb-4">
                      <span className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        </div>
                        <span>Description *</span>
                      </span>
                    </label>
                    <textarea
                      value={reportForm.description}
                      onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                      required
                      className="w-full p-5 border-2 border-red-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm text-gray-700 font-semibold text-lg transition-all duration-200 hover:border-red-300"
                      rows="6"
                      placeholder="Describe the issue with this order item in detail..."
                    />
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-xl font-bold text-gray-700 mb-4">
                      <span className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span>Photo Proof (Optional)</span>
                      </span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setReportForm({ ...reportForm, photos: e.target.files ? Array.from(e.target.files) : [] })}
                      className="w-full p-5 border-2 border-red-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm text-gray-700 font-semibold text-lg file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:text-sm file:font-semibold file:bg-red-100 file:text-red-700 hover:file:bg-red-200 transition-all duration-200"
                    />
                  </div>

                  {/* Bottom spacing for scroll */}
                  <div className="pb-8"></div>

                  {/* Action Buttons - Fixed */}
                  <div className="bg-white rounded-b-3xl border-t border-gray-200 p-8 flex-shrink-0">
                    <div className="flex justify-end space-x-6">
                      <button
                        type="button"
                        onClick={closeReportModal}
                        className="group px-10 py-5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl font-bold text-xl shadow-lg shadow-gray-500/30 hover:shadow-xl hover:shadow-gray-500/40 transform hover:scale-105 transition-all duration-300"
                      >
                        <div className="flex items-center space-x-3">
                          <svg className="w-6 h-6 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Cancel</span>
                        </div>
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="group relative bg-gradient-to-r from-red-600 to-red-700 text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transform hover:scale-105 transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <div className="relative flex items-center space-x-3">
                          <svg className="w-6 h-6 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          <span>{loading ? 'Submitting...' : 'Submit Report'}</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Report Details */}
        {showReportDetailsModal && selectedReportDetails && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-white to-yellow-50 rounded-3xl shadow-2xl border border-yellow-100 w-full max-w-2xl h-[90vh] flex flex-col transform animate-bounce-in">
              {/* Header - Fixed */}
              <div className="bg-gradient-to-r from-yellow-600 to-orange-700 text-white p-6 rounded-t-3xl flex-shrink-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold tracking-wide">Report Details</h3>
                    <p className="text-yellow-100 text-sm font-medium">Issue report information and evidence</p>
                  </div>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-8">
                <div id="report-details-content" className="space-y-8">
                  {/* Report Information */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100">
                    <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <span>Report Information</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-xl p-4 border border-yellow-100">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                          </div>
                          <label className="text-sm font-semibold text-gray-700">Report Description</label>
                        </div>
                        <p className="text-gray-800 font-medium text-base ml-11 leading-relaxed">{selectedReportDetails.report_description}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-yellow-100">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <label className="text-sm font-semibold text-gray-700">Delivery Date</label>
                        </div>
                        <p className="text-gray-800 font-medium text-base ml-11">{new Date(selectedReportDetails.delivery_date).toLocaleString('en-US', { timeZone: 'Asia/Manila' })}</p>
                      </div>
                    </div>
                  </div>

                  {/* Supplier Information */}
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <span>Supplier Information</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <label className="text-sm font-semibold text-gray-700">Supplier Email</label>
                        </div>
                        <p className="text-gray-800 font-medium text-base ml-11">{selectedReportDetails.supplier_email || 'N/A'}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <label className="text-sm font-semibold text-gray-700">Supplier Phone</label>
                        </div>
                        <p className="text-gray-800 font-medium text-base ml-11">{selectedReportDetails.supplier_phone || 'N/A'}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <label className="text-sm font-semibold text-gray-700">Supplier Address</label>
                        </div>
                        <p className="text-gray-800 font-medium text-base ml-11">{selectedReportDetails.supplier_address || 'N/A'}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9h.01M12 12v0a.5.5 0 01-.5-.5V9.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v2a.5.5 0 01-.5.5h-2z" />
                            </svg>
                          </div>
                          <label className="text-sm font-semibold text-gray-700">Supplier Website</label>
                        </div>
                        <p className="text-gray-800 font-medium text-base ml-11">{selectedReportDetails.supplier_website || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Proof Photos */}
                  {selectedReportDetails.proof_report && (
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span>Proof Photos</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(() => {
                          try {
                            const photos = JSON.parse(selectedReportDetails.proof_report);
                            if (Array.isArray(photos)) {
                              return photos.map((filename, index) => (
                                <div key={filename || `proof-${index}`} className="bg-white rounded-xl p-4 border border-gray-100">
                                  <img
                                    src={`${logisticsI.backend.uri}/storage/proof_reports/${filename}`}
                                    alt={`Proof ${index + 1}`}
                                    className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity duration-200"
                                    onClick={() => {
                                      setZoomedImageSrc(`${logisticsI.backend.uri}/storage/proof_reports/${filename}`);
                                      setShowZoomedImage(true);
                                    }}
                                  />
                                  <p className="text-center text-sm text-gray-600 mt-2">Click to zoom</p>
                                </div>
                              ));
                            } else {
                              return (
                                <div className="bg-white rounded-xl p-4 border border-gray-100">
                                  <img
                                    src={`${logisticsI.backend.uri}/storage/proof_reports/${photos}`}
                                    alt="Proof"
                                    className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity duration-200"
                                    onClick={() => {
                                      setZoomedImageSrc(`${logisticsI.backend.uri}/storage/proof_reports/${photos}`);
                                      setShowZoomedImage(true);
                                    }}
                                  />
                                  <p className="text-center text-sm text-gray-600 mt-2">Click to zoom</p>
                                </div>
                              );
                            }
                          } catch (e) {
                            return (
                              <div className="bg-white rounded-xl p-4 border border-red-100">
                                <p className="text-red-600 text-center">Invalid proof data</p>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Bottom spacing for scroll */}
                  <div className="pb-8"></div>
                </div>
              </div>

              {/* Action Buttons - Fixed */}
              <div className="bg-white rounded-b-3xl border-t border-gray-200 p-8 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={handleExportToPDF}
                    disabled={loading}
                    className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{loading ? 'Exporting...' : 'Export to PDF'}</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={closeReportDetailsModal}
                    className="group px-10 py-5 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-2xl font-bold text-xl shadow-lg shadow-yellow-500/30 hover:shadow-xl hover:shadow-yellow-500/40 transform hover:scale-105 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-6 h-6 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Close</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Cancel */}
        {showCancelModal && selectedItemForChoice && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-white to-orange-50 rounded-3xl shadow-2xl border border-orange-100 w-full max-w-lg h-[90vh] flex flex-col transform animate-bounce-in">
              {/* Header - Fixed */}
              <div className="bg-gradient-to-r from-orange-600 to-red-700 text-white p-6 rounded-t-3xl flex-shrink-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold tracking-wide">Cancel Order</h3>
                    <p className="text-orange-100 text-sm font-medium">Provide reason for cancellation</p>
                  </div>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-8">
                {/* Item Info */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 mb-8 border border-orange-100">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <span>Order Information</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-orange-100">
                      <label className="block text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2">Item Name</label>
                      <p className="text-gray-800 font-bold text-lg">{selectedItemForChoice.item_name}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-orange-100">
                      <label className="block text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2">Quantity</label>
                      <span className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full font-bold text-lg inline-block">{selectedItemForChoice.quantity}</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleCancel} className="space-y-8">
                  {/* Cancellation Reason */}
                  <div>
                    <label className="block text-xl font-bold text-gray-700 mb-4">
                      <span className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <span>Cancellation Reason *</span>
                      </span>
                    </label>
                    <textarea
                      value={cancelForm.reason}
                      onChange={(e) => setCancelForm({ reason: e.target.value })}
                      required
                      className="w-full p-5 border-2 border-orange-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm text-gray-700 font-semibold text-lg transition-all duration-200 hover:border-orange-300"
                      rows="6"
                      placeholder="Please provide a detailed reason for cancellation..."
                    />
                  </div>

                  {/* Bottom spacing for scroll */}
                  <div className="pb-8"></div>

                  {/* Action Buttons - Fixed */}
                  <div className="bg-white rounded-b-3xl border-t border-gray-200 p-8 flex-shrink-0">
                    <div className="flex justify-end space-x-6">
                      <button
                        type="button"
                        onClick={closeCancelModal}
                        className="group px-10 py-5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl font-bold text-xl shadow-lg shadow-gray-500/30 hover:shadow-xl hover:shadow-gray-500/40 transform hover:scale-105 transition-all duration-300"
                      >
                        <div className="flex items-center space-x-3">
                          <svg className="w-6 h-6 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Keep Order</span>
                        </div>
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="group relative bg-gradient-to-r from-orange-600 to-red-700 text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transform hover:scale-105 transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <div className="relative flex items-center space-x-3">
                          <svg className="w-6 h-6 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>{loading ? 'Cancelling...' : 'Cancel Order'}</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Zoomed Image */}
        {showZoomedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowZoomedImage(false)}>
            <img
              src={zoomedImageSrc}
              alt="Zoomed Proof"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Modal for Create Low Stock Request */}
        {showCreateRequestModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl shadow-2xl dark:shadow-gray-900/50 border border-blue-100 dark:border-gray-600 w-full max-w-lg transform animate-bounce-in">
              {/* Header */}
              <div className="bg-gradient-to-r from-sidebar-accent to-sidebar-accent/80 text-white p-6 rounded-t-3xl">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold tracking-wide">Create Low Stock Request</h3>
                    <p className="text-sidebar-primary font-medium">Submit a request for low stock items</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-8">
                <form onSubmit={handleSubmitCreateRequest} className="space-y-8">
                  {/* Item Name */}
                  <div>
                    <label className="block text-xl font-bold text-foreground dark:text-gray-200 mb-4">
                      <span className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-sidebar-accent text-sidebar-accent-foreground rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        <span>Item Name *</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={createRequestForm.item_name}
                      onChange={(e) => setCreateRequestForm({ ...createRequestForm, item_name: e.target.value })}
                      required
                      className="w-full p-5 border-2 border-border dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sidebar-primary focus:border-sidebar-primary bg-background dark:bg-gray-700 text-foreground dark:text-gray-200 shadow-sm font-semibold text-lg transition-all duration-200 hover:border-sidebar-primary/50"
                      placeholder="Enter item name"
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-xl font-bold text-foreground dark:text-gray-200 mb-4">
                      <span className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-sidebar-accent text-sidebar-accent-foreground rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                        </div>
                        <span>Quantity *</span>
                      </span>
                    </label>
                    <input
                      type="number"
                      value={createRequestForm.quantity}
                      onChange={(e) => setCreateRequestForm({ ...createRequestForm, quantity: e.target.value })}
                      required
                      min="1"
                      className="w-full p-5 border-2 border-border dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sidebar-primary focus:border-sidebar-primary bg-background dark:bg-gray-700 text-foreground dark:text-gray-200 shadow-sm font-semibold text-lg text-center transition-all duration-200 hover:border-sidebar-primary/50"
                      placeholder="Enter quantity"
                    />
                  </div>

                  {/* Requested By */}
                  <div>
                    <label className="block text-xl font-bold text-foreground dark:text-gray-200 mb-4">
                      <span className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-sidebar-accent text-sidebar-accent-foreground rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span>Requested By (Optional)</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={createRequestForm.requested_by}
                      onChange={(e) => setCreateRequestForm({ ...createRequestForm, requested_by: e.target.value })}
                      className="w-full p-5 border-2 border-border dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sidebar-primary focus:border-sidebar-primary bg-background dark:bg-gray-700 text-foreground dark:text-gray-200 shadow-sm font-semibold text-lg transition-all duration-200 hover:border-sidebar-primary/50"
                      placeholder="Enter your name"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-6 pt-6 border-t border-border dark:border-gray-600">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateRequestModal(false);
                        setCreateRequestForm({ item_name: '', quantity: '', requested_by: '' });
                      }}
                      className="group px-10 py-5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl font-bold text-xl shadow-lg shadow-gray-500/30 hover:shadow-xl hover:shadow-gray-500/40 transform hover:scale-105 transition-all duration-300"
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-6 h-6 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Cancel</span>
                      </div>
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative bg-gradient-to-r from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground px-10 py-5 rounded-2xl font-bold text-xl shadow-lg shadow-sidebar-primary/30 hover:shadow-xl hover:shadow-sidebar-primary/40 transform hover:scale-105 transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      <div className="relative flex items-center space-x-3">
                        <svg className="w-6 h-6 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>{loading ? 'Creating...' : 'Create Request'}</span>
                      </div>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Create Purchase Request */}
        {showCreatePurchaseRequestModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-16 overflow-y-auto">
            <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl shadow-2xl dark:shadow-gray-900/50 border border-blue-100 dark:border-gray-600 w-full max-w-lg transform animate-slide-down">
              {/* Header */}
              <div className="bg-gradient-to-r from-sidebar-accent to-sidebar-accent/80 text-white p-6 rounded-t-3xl">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold tracking-wide text-white">Create Purchase Request</h3>
                    <p className="text-white font-medium">Fill in the details to create a new purchase request</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-8">
                <form onSubmit={handleSubmitCreatePurchaseRequest} className="space-y-6">
                  {/* Item Name and Quantity Row */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-foreground dark:text-gray-200 mb-3">
                        <span className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-sidebar-accent text-sidebar-accent-foreground rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                          <span>Item Name *</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        value={createPurchaseRequestForm.item_name}
                        onChange={(e) => setCreatePurchaseRequestForm({ ...createPurchaseRequestForm, item_name: e.target.value })}
                        required
                        className="w-full p-4 border-2 border-border dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sidebar-primary focus:border-sidebar-primary bg-background dark:bg-gray-700 text-foreground dark:text-gray-200 shadow-sm font-medium transition-all duration-200 hover:border-sidebar-primary/50"
                        placeholder="Enter item name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-foreground dark:text-gray-200 mb-3">
                        <span className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-sidebar-accent text-sidebar-accent-foreground rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                          </div>
                          <span>Quantity *</span>
                        </span>
                      </label>
                      <input
                        type="number"
                        value={createPurchaseRequestForm.quantity}
                        onChange={(e) => setCreatePurchaseRequestForm({ ...createPurchaseRequestForm, quantity: e.target.value })}
                        required
                        min="1"
                        className="w-full p-4 border-2 border-border dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sidebar-primary focus:border-sidebar-primary bg-background dark:bg-gray-700 text-foreground dark:text-gray-200 shadow-sm font-medium text-center transition-all duration-200 hover:border-sidebar-primary/50"
                        placeholder="Enter quantity"
                      />
                    </div>
                  </div>

                  {/* Supplier Selection */}
                  <div>
                    <label className="block text-sm font-bold text-foreground dark:text-gray-200 mb-3">
                      <span className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-sidebar-accent text-sidebar-accent-foreground rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <span>Supplier *</span>
                      </span>
                    </label>
                    <select
                      value={createPurchaseRequestForm.supplier_id}
                      onChange={(e) => handleSupplierChangeForCreate(e.target.value)}
                      required
                      className="w-full p-4 border-2 border-border dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sidebar-primary focus:border-sidebar-primary bg-background dark:bg-gray-700 text-foreground dark:text-gray-200 shadow-sm font-medium transition-all duration-200 hover:border-sidebar-primary/50"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((supplier, idx) => (
                        <option key={supplier.supplier_id ?? supplier.id ?? `supplier-${idx}`} value={supplier.supplier_id}>
                          {supplier.supplier_name} - {supplier.item_name} - ₱{supplier.price || 'N/A'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price, Total Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-foreground dark:text-gray-200 mb-3">
                        <span className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-sidebar-accent text-sidebar-accent-foreground rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                          <span>Price per Unit</span>
                        </span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground font-semibold">₱</span>
                        <input
                          type="number"
                          step="0.01"
                          value={createPurchaseRequestForm.price_per_unit}
                          readOnly
                          className="w-full p-4 pl-10 border-2 border-border dark:border-gray-600 rounded-2xl bg-muted dark:bg-gray-600 text-foreground dark:text-gray-200 font-semibold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-foreground dark:text-gray-200 mb-3">
                        <span className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-sidebar-accent text-sidebar-accent-foreground rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span>Total Amount</span>
                        </span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-600 font-bold">₱</span>
                        <input
                          type="number"
                          step="0.01"
                          value={createPurchaseRequestForm.total_amount}
                          readOnly
                          className="w-full p-4 pl-10 border-2 border-green-200 rounded-2xl bg-green-50 text-green-700 font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Requested By */}
                  <div>
                    <label className="block text-sm font-bold text-foreground dark:text-gray-200 mb-3">
                      <span className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-sidebar-accent text-sidebar-accent-foreground rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span>Requested By (Optional)</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={createPurchaseRequestForm.requested_by}
                      onChange={(e) => setCreatePurchaseRequestForm({ ...createPurchaseRequestForm, requested_by: e.target.value })}
                      className="w-full p-4 border-2 border-border dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sidebar-primary focus:border-sidebar-primary bg-background dark:bg-gray-700 text-foreground dark:text-gray-200 shadow-sm font-medium transition-all duration-200 hover:border-sidebar-primary/50"
                      placeholder="Enter your name"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-border dark:border-gray-600">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreatePurchaseRequestModal(false);
                        setCreatePurchaseRequestForm({ item_name: '', quantity: '', supplier_id: '', price_per_unit: '', total_amount: '', description: '', requested_by: '' });
                      }}
                      className="group px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-gray-500/30 hover:shadow-xl hover:shadow-gray-500/40 transform hover:scale-105 transition-all duration-300"
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Cancel</span>
                      </div>
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative bg-gradient-to-r from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-sidebar-primary/30 hover:shadow-xl hover:shadow-sidebar-primary/40 transform hover:scale-105 transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      <div className="relative flex items-center space-x-3">
                        <svg className="w-5 h-5 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>{loading ? 'Creating...' : 'Create Request'}</span>
                      </div>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Replacement */}
        {showReplacementModal && selectedReplacementItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-white to-green-50 rounded-3xl shadow-2xl border border-green-100 w-full max-w-lg h-[90vh] flex flex-col transform animate-bounce-in">
              {/* Header - Fixed */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 rounded-t-3xl flex-shrink-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold tracking-wide">Schedule Replacement</h3>
                    <p className="text-green-100 text-sm font-medium">Set replacement date and time</p>
                  </div>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-8">
                {/* Item Info */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-8 border border-green-100">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <span>Replacement Information</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-green-100">
                      <label className="block text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">Item Name</label>
                      <p className="text-gray-800 font-bold text-lg">{selectedReplacementItem.item_name}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-green-100">
                      <label className="block text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">Quantity</label>
                      <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold text-lg inline-block">{selectedReplacementItem.quantity}</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmitReplacement} className="space-y-8">
                  {/* Replacement Date */}
                  <div>
                    <label className="block text-xl font-bold text-gray-700 mb-4">
                      <span className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span>Replacement Date *</span>
                      </span>
                    </label>
                    <input
                      type="date"
                      value={replacementForm.replacement_date}
                      onChange={(e) => setReplacementForm({ ...replacementForm, replacement_date: e.target.value })}
                      required
                      className="w-full p-5 border-2 border-green-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm text-gray-700 font-semibold text-lg transition-all duration-200 hover:border-green-300"
                    />
                  </div>

                  {/* Replacement Time */}
                  <div>
                    <label className="block text-xl font-bold text-gray-700 mb-4">
                      <span className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span>Replacement Time (Optional)</span>
                      </span>
                    </label>
                    <input
                      type="time"
                      value={replacementForm.replacement_time}
                      onChange={(e) => setReplacementForm({ ...replacementForm, replacement_time: e.target.value })}
                      className="w-full p-5 border-2 border-green-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm text-gray-700 font-semibold text-lg transition-all duration-200 hover:border-green-300"
                    />
                  </div>

                  {/* Bottom spacing for scroll */}
                  <div className="pb-8"></div>

                  {/* Action Buttons - Fixed */}
                  <div className="bg-white rounded-b-3xl border-t border-gray-200 p-8 flex-shrink-0">
                    <div className="flex justify-end space-x-6">
                      <button
                        type="button"
                        onClick={closeReplacementModal}
                        className="group px-10 py-5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl font-bold text-xl shadow-lg shadow-gray-500/30 hover:shadow-xl hover:shadow-gray-500/40 transform hover:scale-105 transition-all duration-300"
                      >
                        <div className="flex items-center space-x-3">
                          <svg className="w-6 h-6 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Cancel</span>
                        </div>
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="group relative bg-gradient-to-r from-green-600 to-emerald-700 text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transform hover:scale-105 transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <div className="relative flex items-center space-x-3">
                          <svg className="w-6 h-6 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>{loading ? 'Scheduling...' : 'Schedule Replacement'}</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PurchaseProcessing;
