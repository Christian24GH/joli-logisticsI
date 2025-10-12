import { configureEcho } from "@laravel/echo-react";
import Echo from "laravel-echo";

const echoConfig = {
    wsPort: 6061,
    wssPort: 6061,
    broadcaster: "reverb",
    key: "luoioknoyyzonvz8gf6o",
    wsHost: "localhost",
    forceTLS: window.location.protocol === "https:",
    enabledTransports: ["ws", "wss"],
};

const backendUri = import.meta.env.VITE_LOGISTICSI_BACKEND;

export const logisticsI = {
    reverb: {
        ...echoConfig,
        config: () => configureEcho(echoConfig)
    },
 
    backend: { 
        uri: backendUri,
        api: {
            // ============================
            // Smart Warehousing System (SWS)
            // ============================

                        // Equipment Routes
            equipment: `${backendUri}/api/equipment`,
            equipmentSearch: `${backendUri}/api/equipment/search`,
            equipmentAdd: `${backendUri}/api/equipment/add`,
                equipmentUpdate: `${backendUri}/api/equipment/change/{id}`, 
                equipmentArchive: `${backendUri}/api/equipment/archive/{id}`,
                equipmentActivate: `${backendUri}/api/equipment/activate/{id}`,
                equipmentUpdateStock: `${backendUri}/api/equipment/{id}/update-stock`,
                lowStockAlert: `${backendUri}/api/equipment/low-stock-alert`,
                overStockAlert: `${backendUri}/api/equipment/overstock-alert`,
                categorizeEquipment: `${backendUri}/api/equipment/{equipmentId}/categorize/{categoryId}`,
                archiveOldEquipment: `${backendUri}/api/equipment/{id}/archive-old`,
                // Low stock requests (created from frontend)
                lowStockRequests: `${backendUri}/api/lowstock-requests`,
                // Equipment issues (problem / broke reports)
                equipmentIssues: `${backendUri}/api/equipment-issues`,
                // Equipment issue single-item endpoints
                equipmentIssueShow: `${backendUri}/api/equipment-issues/{id}`,
                equipmentIssueUpdate: `${backendUri}/api/equipment-issues/{id}`,
                equipmentIssueDelete: `${backendUri}/api/equipment-issues/{id}`,
            
            // Equipment Category Routes
            equipmentCategory: `${backendUri}/api/equipment-category`,
            equipmentCategoryAdd: `${backendUri}/api/equipment-category/add`,
            equipmentCategoryUpdate: `${backendUri}/api/equipment-category/{id}`,
            equipmentCategoryArchive: `${backendUri}/api/equipment-category/archive/{id}`,
            
            // Storage Location Routes
            storageLocation: `${backendUri}/api/storage-location`,
            storageLocationAdd: `${backendUri}/api/storage-location/add`,
            storageLocationUpdate: `${backendUri}/api/storage-location/{id}`,
            storageLocationArchive: `${backendUri}/api/storage-location/archive/{id}`,

            // ================================
            // Procurement & Sourcing Management (PSM)
            // ================================

            // Supplier Management Routes
            suppliers: `${backendUri}/api/suppliers`,
            supplierAdd: `${backendUri}/api/suppliers/add`,
            supplierUpdate: `${backendUri}/api/suppliers/{id}`,
            supplierContact: `${backendUri}/api/suppliers/{supplierId}/contact`,
            supplierRate: `${backendUri}/api/suppliers/{supplierId}/rate`,
            supplierArchive: `${backendUri}/api/suppliers/{id}/archive`,
            supplierActivate: `${backendUri}/api/suppliers/{id}/activate`,
            supplierRequests: `${backendUri}/api/supplier-requests`,
            core2Suppliers: `${backendUri}/api/core2-suppliers`,
            addSupplier: `${backendUri}/api/core2-suppliers/{id}/add`,
              // Removed accidental duplicates
            // Purchase Request Routes (Procurement)
            purchaseRequests: `${backendUri}/api/purchase-requests`,
            purchaseRequestAdd: `${backendUri}/api/purchase-requests`,
            purchaseRequestUpdate: `${backendUri}/api/purchase-requests/{id}`,
            purchaseRequestApprove: `${backendUri}/api/purchase-requests/{requestId}/approve`,

            // Purchase Order Routes
            purchaseOrders: `${backendUri}/api/purchase-orders`,
            // Issue purchase order: POST /purchase-orders/{requestId}
            purchaseOrderAdd: `${backendUri}/api/purchase-orders/{requestId}`,
            purchaseOrderUpdate: `${backendUri}/api/purchase-orders/{id}`,

            // Order Items Routes
            orderItems: `${backendUri}/api/order-items`,
            orderItemsAdd: `${backendUri}/api/order-items`,

            // Order Reports Routes
            orderReports: `${backendUri}/api/order-reports`,
            orderReportAdd: `${backendUri}/api/order-reports`,
            orderReportUpdate: `${backendUri}/api/order-reports/{id}`,
            orderReportArchive: `${backendUri}/api/order-reports/{id}/archive`,

            // Received Orders Routes
            receivedOrders: `${backendUri}/api/received-orders`,
            receivedOrderAdd: `${backendUri}/api/received-orders`,
            receivedOrderUpdate: `${backendUri}/api/received-orders/{id}`,
            receivedOrderArchive: `${backendUri}/api/received-orders/{id}/archive`,

            // Cancel Orders Routes
            cancelOrders: `${backendUri}/api/cancel-orders`,
            cancelOrderAdd: `${backendUri}/api/cancel-orders`,
            cancelOrderUpdate: `${backendUri}/api/cancel-orders/{id}`,
            cancelOrderArchive: `${backendUri}/api/cancel-orders/{id}/archive`,

            // Expense Records Routes
            expenseRecords: `${backendUri}/api/expenses`,
            expenseRecordAdd: `${backendUri}/api/expenses/add`,
            expenseRecordUpdate: `${backendUri}/api/expenses/{id}`,

            // ================================
            // Project Logistic Tracker (PLT)
            // ================================

            // Equipment Scheduling Routes
            equipmentSchedules: `${backendUri}/api/equipment-schedule`,
            equipmentScheduleAdd: `${backendUri}/api/equipment-schedule`,
            equipmentScheduleUpdate: `${backendUri}/api/equipment-schedule/{id}`,
            equipmentScheduleApprove: `${backendUri}/api/equipment-schedule/{id}/approve`,

            // Delivery & Transport Routes
            deliveries: `${backendUri}/api/delivery`,
            deliveryAdd: `${backendUri}/api/delivery`,
            deliveryUpdate: `${backendUri}/api/delivery/{id}`,
            markDelivered: `${backendUri}/api/delivery/{id}/mark-delivered`,

            // ================================
            // Asset Lifecycle & Maintenance (ALMS)
            // ================================

            // Asset Registration & QR Tagging
            assets: `${backendUri}/api/asset`,
            assetAdd: `${backendUri}/api/asset`,
            assetUpdate: `${backendUri}/api/asset/{id}`,
            assetArchive: `${backendUri}/api/asset/archive/{id}`,
            projects: `${backendUri}/api/projects`,

            // Maintenance Routes
            maintenance: `${backendUri}/api/maintenance`,
            maintenanceAdd: `${backendUri}/api/maintenance`,
            maintenanceUpdate: `${backendUri}/api/maintenance/{id}`,
            maintenanceArchive: `${backendUri}/api/maintenance/archive/{id}`,

            // ================================
            // Document Tracking & Logistics Records (DTRS)
            // ================================

            // Delivery Receipts Routes
            deliveryReceipts: `${backendUri}/api/delivery-receipts`,
            deliveryReceiptAdd: `${backendUri}/api/delivery-receipts`,
            deliveryReceiptUpdate: `${backendUri}/api/delivery-receipts/{id}`,
            deliveryReceiptArchive: `${backendUri}/api/delivery-receipts/archive/{id}`,

            // Equipment Logs Routes
            equipmentLogs: `${backendUri}/api/equipment-logs`,
            equipmentLogAdd: `${backendUri}/api/equipment-logs`,
            equipmentLogUpdate: `${backendUri}/api/equipment-logs/{id}`,
            equipmentLogArchive: `${backendUri}/api/equipment-logs/archive/{id}`,

            // Logistics Reports Routes
            logisticsReports: `${backendUri}/api/logistics-reports`,
            logisticsReportAdd: `${backendUri}/api/logistics-reports`,
            logisticsReportUpdate: `${backendUri}/api/logistics-reports/{id}`,
            logisticsReportArchive: `${backendUri}/api/logistics-reports/archive/{id}`,

            // Fleet Documents Routes
            fleetDocuments: `${backendUri}/api/fleet-documents`,
            fleetDocumentAdd: `${backendUri}/api/fleet-documents`,
            fleetDocumentUpdate: `${backendUri}/api/fleet-documents/{id}`,
            fleetDocumentArchive: `${backendUri}/api/fleet-documents/archive/{id}`,

            // QR Code APIs
            qrAssets: `${backendUri}/api/assets`,
            qrAssetAdd: `${backendUri}/api/assets`,
            qrAssetShow: `${backendUri}/api/assets/{token}`,
        },
    }
};
