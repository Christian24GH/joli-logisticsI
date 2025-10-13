<?php
use App\Http\Controllers\{
    EquipmentManagementController,
    EquipmentIssueController,
    PSMController,
    ProjectLogisticTrackerController,
    AssetLifecycleMaintenanceController,
    DTRSController
};
use Illuminate\Support\Facades\Route;

Route::get('/test', fn()=> "LOG 1 API is working");

// ===========================
// Smart Warehousing System (SWS)
// ===========================

// ----------------- Equipment -----------------
Route::get('/equipment', [EquipmentManagementController::class, 'index']);
Route::get('/equipment/{id}', [EquipmentManagementController::class, 'show']);
Route::post('/equipment/add', [EquipmentManagementController::class, 'storeEquipment']);
Route::put('/equipment/change/{id}', [EquipmentManagementController::class, 'updateEquipment']);
Route::put('/equipment/archive/{id}', [EquipmentManagementController::class, 'archiveEquipment']);
Route::put('/equipment/activate/{id}', [EquipmentManagementController::class, 'activateEquipment']);
Route::get('/equipment/search', [EquipmentManagementController::class, 'searchEquipment']);
Route::put('/equipment/{id}/update-stock', [EquipmentManagementController::class, 'updateStock']);

// Equipment Category Routes
Route::get('/equipment-category', [EquipmentManagementController::class, 'indexCategory']);
Route::get('/equipment-category/{id}', [EquipmentManagementController::class, 'showCategory']);
Route::post('/equipment-category/add', [EquipmentManagementController::class, 'storeCategory']);
Route::put('/equipment-category/change/{id}', [EquipmentManagementController::class, 'updateCategory']);
Route::put('/equipment-category/archive/{id}', [EquipmentManagementController::class, 'archiveCategory']);
Route::get('/equipment-category/search', [EquipmentManagementController::class, 'searchCategory']);

// Storage Location Routes
Route::get('/storage-location', [EquipmentManagementController::class, 'indexStorage']);
Route::get('/storage-location/{id}', [EquipmentManagementController::class, 'showStorage']); 
Route::post('/storage-location/add', [EquipmentManagementController::class, 'storeStorage']);
Route::put('/storage-location/change/{id}', [EquipmentManagementController::class, 'updateStorage']);
Route::put('/storage-location/archive/{id}', [EquipmentManagementController::class, 'archiveStorage']);
Route::get('/storage-location/search', [EquipmentManagementController::class, 'searchStorage']); 

// Additional Equipment Routes (Frontend Sync)
Route::get('/low-stock-alert', [EquipmentManagementController::class, 'lowStockAlert']);
Route::get('/overstock-alert', [EquipmentManagementController::class, 'overstockAlert']);
Route::put('/equipment/{equipmentId}/categorize/{categoryId}', [EquipmentManagementController::class, 'categorizeEquipment']);

// Equipment Issues (problem / broke reports)
Route::get('/equipment-issues', [EquipmentIssueController::class, 'index']);
Route::post('/equipment-issues', [EquipmentIssueController::class, 'store']);
Route::put('/equipment-issues/{id}', [EquipmentIssueController::class, 'update']);
Route::delete('/equipment-issues/{id}', [EquipmentIssueController::class, 'destroy']);

// Low Stock Request Routes
Route::get('/lowstock-requests', [EquipmentManagementController::class, 'getLowStockRequests']);
Route::post('/lowstock-requests', [EquipmentManagementController::class, 'addLowStockRequest']);
Route::put('/lowstock-requests/{id}', [EquipmentManagementController::class, 'updateLowStockRequest']);
Route::delete('/lowstock-requests/{id}', [EquipmentManagementController::class, 'archiveLowStockRequest']);


// ============================
// Procurement & Sourcing Management 
// ============================
// ================================
// Supplier Management Routes
// ================================
// 2.1.1 Add/Edit Supplier Profile
Route::post('/suppliers', [PSMController::class, 'addOrEditSupplier']);  // Add or Edit Supplier Profile
// 2.1.2 Track Contact Details
Route::post('/suppliers/{supplierId}/contact', [PSMController::class, 'trackSupplierContact']);  // Track Supplier Contact Details
// 2.1.3 Rate Supplier Performance
Route::post('/suppliers/{supplierId}/rate', [PSMController::class, 'rateSupplierPerformance']);  // Rate Supplier Performance

// Additional Supplier Routes (Frontend Sync)
Route::get('/suppliers', [PSMController::class, 'getSuppliers']);  // Get all suppliers
Route::put('/suppliers/{id}', [PSMController::class, 'updateSupplier']);  // Update supplier
Route::put('/suppliers/{id}/archive', [PSMController::class, 'archiveSupplier']);  // Archive supplier
Route::put('/suppliers/{id}/activate', [PSMController::class, 'activateSupplier']); // Activate supplier

// Core2 Suppliers Routes
Route::get('/core2-suppliers', [PSMController::class, 'getCore2Suppliers']);  // Get all core2 suppliers
Route::post('/core2-suppliers', [PSMController::class, 'createCore2Supplier']);  // Create core2 supplier
Route::put('/core2-suppliers/{id}', [PSMController::class, 'updateCore2Supplier']);  // Update core2 supplier
Route::delete('/core2-suppliers/{id}', [PSMController::class, 'deleteCore2Supplier']);  // Delete core2 supplier
Route::post('/core2-suppliers/{id}/add', [PSMController::class, 'addSupplier']);  // Add supplier from core2

// Supplier Request Routes
Route::get('/supplier-requests', [PSMController::class, 'getSupplierRequests']);  // Get all supplier requests
Route::post('/supplier-requests', [PSMController::class, 'createSupplierRequest']);  // Create supplier request
 
// ================================
// Purchase Processing Routes 
// ================================

// 2.2.1 Create Purchase Request
Route::post('/purchase-requests', [PSMController::class, 'createPurchaseRequest']);  // Create Purchase Request
// 2.2.2 Approval Workflow
Route::put('/purchase-requests/{requestId}/approve', [PSMController::class, 'approvePurchaseRequest']);  // Approve Purchase Request
// 2.2.3 Issue Purchase Order
Route::post('/purchase-orders/{requestId}', [PSMController::class, 'issuePurchaseOrder']);  // Issue Purchase Order

// Additional Purchase Processing Routes (Frontend Sync)
Route::get('/purchase-requests', [PSMController::class, 'getPurchaseRequests']);  // Get all purchase requests
Route::put('/purchase-requests/{id}', [PSMController::class, 'updatePurchaseRequest']);  // Update purchase request
Route::get('/purchase-orders', [PSMController::class, 'getPurchaseOrders']);  // Get all purchase orders
Route::put('/purchase-orders/{id}', [PSMController::class, 'updatePurchaseOrder']);  // Update purchase order

// ================================
// Order Items Routes
// ================================
Route::get('/order-items', [PSMController::class, 'getOrderItems']);  // Get all order items
Route::post('/order-items', [PSMController::class, 'createOrderItem']);  // Create order item
Route::put('/order-items/{id}', [PSMController::class, 'updateOrderItem']);  // Update order item
Route::delete('/order-items/{id}', [PSMController::class, 'deleteOrderItem']);  // Delete order item

// ================================
// Order Reports Routes
// ================================
Route::post('/order-reports', [PSMController::class, 'addOrderReport']);  // Add order report
Route::put('/order-reports/{id}', [PSMController::class, 'updateOrderReport']);  // Update order report
Route::get('/order-reports', [PSMController::class, 'getAllOrderReports']);  // Get all order reports
Route::put('/order-reports/{id}/archive', [PSMController::class, 'archiveOrderReport']);  // Archive order report

// ================================
// Received Orders Routes
// ================================
Route::post('/received-orders', [PSMController::class, 'addReceivedOrder']);  // Add received order
Route::put('/received-orders/{id}', [PSMController::class, 'updateReceivedOrder']);  // Update received order
Route::get('/received-orders', [PSMController::class, 'getAllReceivedOrders']);  // Get all received orders
Route::put('/received-orders/{id}/archive', [PSMController::class, 'archiveReceivedOrder']);  // Archive received order



// ================================
// Expense Records Routes
// ================================ 

// 2.3.1 Record Purchase Amounts
Route::post('/expenses/{orderId}/amount', [PSMController::class, 'recordPurchaseAmount']);  // Record Purchase Amount
// 2.3.2 Track Payment Status
Route::put('/expenses/{expenseId}/status', [PSMController::class, 'trackPaymentStatus']);  // Track Payment Status
// 2.3.3 Export Expense Reports
Route::get('/expenses/export', [PSMController::class, 'exportExpenseReports']);  // Export Expense Reports

// Additional Expense Routes (Frontend Sync)
Route::get('/expenses', [PSMController::class, 'getExpenses']);  // Get all expenses
Route::put('/expenses/{id}', [PSMController::class, 'updateExpense']);  // Update expense 


// ============================
// Project Logistic Tracker (PLT) Routes
// ============================

// Equipment Scheduling Routes
Route::post('/assign-equipment-to-tour', [ProjectLogisticTrackerController::class, 'assignEquipmentToTour']);
Route::put('/equipment-schedules/{scheduleId}/set-date-time', [ProjectLogisticTrackerController::class, 'setDateAndTimeOfUse']);
Route::put('/equipment-schedules/{scheduleId}/approve', [ProjectLogisticTrackerController::class, 'approveSchedule']);

// Additional Equipment Scheduling Routes (Frontend Sync)
Route::get('/equipment-schedule', [ProjectLogisticTrackerController::class, 'getEquipmentSchedules']);  // Get all schedules
Route::put('/equipment-schedule/{id}', [ProjectLogisticTrackerController::class, 'updateEquipmentSchedule']);  // Update schedule

// Delivery & Transport Tracking Routes
Route::post('/assign-vehicle-for-delivery', [ProjectLogisticTrackerController::class, 'assignVehicleForDelivery']);
Route::put('/deliveries/{deliveryId}/record-driver-details', [ProjectLogisticTrackerController::class, 'recordDriverDetails']);
Route::put('/deliveries/{deliveryId}/mark-as-delivered', [ProjectLogisticTrackerController::class, 'markAsDelivered']);

// Additional Delivery Routes (Frontend Sync)
Route::get('/delivery', [ProjectLogisticTrackerController::class, 'getDeliveries']);  // Get all deliveries
Route::put('/delivery/{id}', [ProjectLogisticTrackerController::class, 'updateDelivery']);  // Update delivery

// Tour Report Routes
Route::get('/tour-projects/{tourProjectId}/usage-summary', [ProjectLogisticTrackerController::class, 'usageSummaryPerTrip']);
Route::get('/tour-projects/{tourProjectId}/efficiency-report', [ProjectLogisticTrackerController::class, 'transportEfficiencyReport']);
Route::get('/tour-projects/{tourProjectId}/delays-issues-report', [ProjectLogisticTrackerController::class, 'delaysAndIssuesReport']);


//==================================================
// Asset Lifecycle & Maintenance (ALMS)
//==================================================
// Asset Registration & QR Tagging
Route::post('/asset/register', [AssetLifecycleMaintenanceController::class, 'registerAsset']); // Register new asset and generate QR
Route::get('/asset/scan', [AssetLifecycleMaintenanceController::class, 'getAssetByQR']); // Retrieve asset details by QR scan
Route::put('/asset/{assetId}/project', [AssetLifecycleMaintenanceController::class, 'linkToProject']); // Link asset to a project
Route::get('/projects', [AssetLifecycleMaintenanceController::class, 'getProjects']); // Get all projects

// Additional Asset Routes (Frontend Sync)
Route::get('/asset', [AssetLifecycleMaintenanceController::class, 'getAssets']);  // Get all assets
Route::put('/asset/{id}', [AssetLifecycleMaintenanceController::class, 'updateAsset']);  // Update asset

// Predictive Maintenance (Usage Tracking & Alerts)
Route::post('/asset/{assetId}/usage', [AssetLifecycleMaintenanceController::class, 'recordUsage']); // Record asset usage (hours, mileage)
Route::post('/asset/{assetId}/maintenance-alert', [AssetLifecycleMaintenanceController::class, 'checkForMaintenanceAlerts']); // Create maintenance alert
Route::get('/asset/{assetId}/suggest-replacement', [AssetLifecycleMaintenanceController::class, 'suggestReplacement']); // Suggest replacement based on repair history

// Additional Maintenance Routes (Frontend Sync)
Route::get('/maintenance', [AssetLifecycleMaintenanceController::class, 'getMaintenance']);  // Get all maintenance records
Route::put('/maintenance/{id}', [AssetLifecycleMaintenanceController::class, 'updateMaintenance']);  // Update maintenance record

// Maintenance History & Reporting
Route::post('/asset/{assetId}/maintenance', [AssetLifecycleMaintenanceController::class, 'logRepair']); // Log maintenance details (repair, replacement)
Route::get('/asset/{assetId}/repair-cost', [AssetLifecycleMaintenanceController::class, 'trackRepairCost']); // Track total repair cost
Route::get('/asset/{assetId}/maintenance-report', [AssetLifecycleMaintenanceController::class, 'generateMaintenanceReport']); // Generate maintenance report

// Archive Asset



//==================================================
// Document Tracking & Records System (DTRS)
//==================================================
// Delivery Receipts
Route::post('/dtrs/upload-delivery-proof', [DTRSController::class, 'uploadDeliveryProof']);
Route::get('/dtrs/search-by-tour-project', [DTRSController::class, 'searchByTourOrProject']);
Route::get('/dtrs/validate-reference', [DTRSController::class, 'validateDocumentReference']);

// Additional Delivery Receipt Routes (Frontend Sync)
Route::get('/delivery-receipts', [DTRSController::class, 'getDeliveryReceipts']);  // Get all delivery receipts
Route::put('/delivery-receipts/{id}', [DTRSController::class, 'updateDeliveryReceipt']);  // Update delivery receipt

// Equipment Logs
Route::post('/dtrs/record-equipment-borrowed', [DTRSController::class, 'recordEquipmentBorrowed']);
Route::put('/dtrs/mark-returned-equipment/{logId}', [DTRSController::class, 'markEquipmentReturned']);
Route::put('/dtrs/flag-lost-damaged-item/{logId}', [DTRSController::class, 'flagLostOrDamagedItem']);

// Additional Equipment Log Routes (Frontend Sync)
Route::get('/equipment-logs', [DTRSController::class, 'getEquipmentLogs']);  // Get all equipment logs
Route::put('/equipment-logs/{id}', [DTRSController::class, 'updateEquipmentLog']);  // Update equipment log

// Logistics Reports
Route::post('/dtrs/generate-monthly-report', [DTRSController::class, 'generateMonthlyReport']);
Route::get('/dtrs/export-report/{reportId}', [DTRSController::class, 'exportReport']);
Route::put('/dtrs/archive-report', [DTRSController::class, 'archiveOldReports']);

// Additional Logistics Report Routes (Frontend Sync)
Route::get('/logistics-reports', [DTRSController::class, 'getLogisticsReports']);  // Get all logistics reports
Route::put('/logistics-reports/{id}', [DTRSController::class, 'updateLogisticsReport']);  // Update logistics report

// Fleet Documents Routes (Frontend Sync)
Route::get('/fleet-documents', [DTRSController::class, 'getFleetDocuments']);  // Get all fleet documents
Route::put('/fleet-documents/{id}', [DTRSController::class, 'updateFleetDocument']);  // Update fleet document

// QR Code APIs (Frontend Sync)
Route::get('/assets', [DTRSController::class, 'getAssets']);  // Get all assets
Route::get('/assets/{token}', [DTRSController::class, 'getAssetByToken']);  // Get asset by QR token
 