<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
  
class PSMController extends Controller
{ 
    // ================================ 
    // Supplier Management 
    // ================================

    // 2.1.1 Add/Edit Supplier Profile
    public function addOrEditSupplier(Request $request)
    {
        // Validate incoming request data
        $validated = $request->validate([
            'supplier_id' => 'sometimes|exists:supplier,supplier_id', // optional for edits
            'supplier_name' => 'required|string|max:100',
            'item_name' => 'nullable|string|max:100',
            'price' => 'nullable|numeric|min:0',
            'email' => 'nullable|email|max:150',
            'phone' => 'nullable|string|max:64',
            'address' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'rating' => 'nullable|integer|min:1|max:5',
            'comments' => 'nullable|string',
        ]);

        // If supplier_id provided, treat as update; otherwise create new
        $existing = null;
        if (! empty($validated['supplier_id'] ?? null)) {
            $existing = DB::table('supplier')->where('supplier_id', $validated['supplier_id'])->first();
        }

        if ($existing) {
            DB::table('supplier')->where('supplier_id', $existing->supplier_id)->update([
                'supplier_name' => $validated['supplier_name'],
                'item_name' => $validated['item_name'] ?? null,
                'price' => $validated['price'] ?? null,
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'website' => $validated['website'] ?? null,
                'rating' => $validated['rating'] ?? null,
                'comments' => $validated['comments'] ?? null,
                'updated_at' => now(),
            ]);

            $supplier = DB::table('supplier')->where('supplier_id', $existing->supplier_id)->first();
            $message = 'Supplier updated successfully';
        } else {
            $id = DB::table('supplier')->insertGetId([
                'supplier_name' => $validated['supplier_name'],
                'item_name' => $validated['item_name'] ?? null,
                'price' => $validated['price'] ?? null,
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'website' => $validated['website'] ?? null,
                'rating' => $validated['rating'] ?? null,
                'comments' => $validated['comments'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $supplier = DB::table('supplier')->where('supplier_id', $id)->first();
            $message = 'Supplier created successfully';
        }

        return response()->json(['message' => $message, 'supplier' => $supplier], 200);
    }


    // 2.1.4 Get All Supplier Requests
    public function getSupplierRequests()
    {
        $supplierRequests = DB::table('supplier_request')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($supplierRequests);
    }

    // 2.1.5 Create Supplier Request
    public function createSupplierRequest(Request $request)
    {
        // Validate incoming request data
        $validated = $request->validate([
            'name' => 'required|string|max:100',
        ]);

         // Create the supplier request
        $id = DB::table('supplier_request')->insertGetId([
            'name' => $validated['name'],
            'status' => 'pending', // Default status
            'created_at' => now(),
            'updated_at' => now(), 
        ]);

        $supplierRequest = DB::table('supplier_request')->where('supplier_request_id', $id)->first();

        return response()->json(['message' => 'Supplier request created successfully', 'supplier_request' => $supplierRequest], 201);
    }



    // 2.1.2 Track Contact Details -> now updates explicit contact fields
    public function trackSupplierContact(Request $request, $supplierId)
    {
        $validated = $request->validate([
            'email' => 'nullable|email|max:150',
            'phone' => 'nullable|string|max:64',
            'address' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
        ]);

        $supplier = DB::table('supplier')->where('supplier_id', $supplierId)->first();
        if (! $supplier) {
            return response()->json(['error' => 'Supplier not found'], 404);
        }

        DB::table('supplier')->where('supplier_id', $supplierId)->update(array_merge($validated, ['updated_at' => now()]));

        return response()->json(['message' => 'Contact details updated successfully']);
    }

    // 2.1.3 Rate Supplier Performance
    public function rateSupplierPerformance(Request $request, $supplierId)
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',  // Performance rating between 1 and 5
        ]);

        $supplier = DB::table('supplier')->where('supplier_id', $supplierId)->first();
        if (! $supplier) {
            return response()->json(['error' => 'Supplier not found'], 404);
        }

        DB::table('supplier')->where('supplier_id', $supplierId)->update(['rating' => $validated['rating'], 'updated_at' => now()]);

        return response()->json(['message' => 'Supplier performance rated successfully']);
    }

    // ================================
    // Purchase Processing
    // ================================

    // 2.2.1 Create Purchase Request
    public function createPurchaseRequest(Request $request)
    {
        // Validate incoming data
        $validated = $request->validate([
            'lowstock_id' => 'required|exists:lowstock_request,id',
            'item_name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'quantity' => 'required|integer|min:1',
            'supplier_id' => 'required|exists:supplier,supplier_id',
            'price_per_unit' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'requested_by' => 'nullable|string|max:100',
            'status' => 'required|in:pending,approved,rejected',
        ]);

        // Fetch supplier name
        $supplier = DB::table('supplier')->where('supplier_id', $validated['supplier_id'])->first();
        if (!$supplier) {
            return response()->json(['error' => 'Supplier not found'], 404);
        }

        // Create the purchase request
        $id = DB::table('purchase_request')->insertGetId([
            'item_name' => $validated['item_name'],
            'description' => $validated['description'] ?? null,
            'quantity' => $validated['quantity'],
            'price' => $validated['price_per_unit'],
            'total_price' => $validated['total_amount'],
            'supplier_name' => $supplier->supplier_name,
            'supplier_email' => $supplier->email,
            'supplier_phone' => $supplier->phone,
            'supplier_address' => $supplier->address,
            'supplier_website' => $supplier->website,
            'requested_by' => $validated['requested_by'],
            'status' => $validated['status'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $purchaseRequest = DB::table('purchase_request')->where('request_id', $id)->first();

        return response()->json(['message' => 'Purchase request created successfully', 'purchase_request' => $purchaseRequest], 201);
    }

    // 2.2.2 Approval Workflow
    public function approvePurchaseRequest(Request $request, $requestId)
    {
        // Validate the status change
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        $existing = DB::table('purchase_request')->where('request_id', $requestId)->first();
        if (! $existing) {
            return response()->json(['error' => 'Purchase request not found'], 404);
        }

        DB::table('purchase_request')->where('request_id', $requestId)->update([
            'status' => $validated['status'],
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Purchase request status updated successfully']);
    }

    // 2.2.3 Issue Purchase Order
    public function issuePurchaseOrder(Request $request, $requestId)
    {
        // Validate incoming data
        $validated = $request->validate([
            'supplier_id' => 'required|exists:supplier,supplier_id',
            'total_amount' => 'required|numeric|min:0',
        ]);

        $purchaseRequest = DB::table('purchase_request')->where('request_id', $requestId)->first();
        if (! $purchaseRequest) {
            return response()->json(['error' => 'Purchase request not found'], 404);
        }

        if ($purchaseRequest->status !== 'approved') {
            return response()->json(['error' => 'Purchase request must be approved first'], 400);
        }

        $orderId = DB::table('purchase_order')->insertGetId([
            'request_id' => $requestId,
            'supplier_id' => $validated['supplier_id'],
            'total_amount' => $validated['total_amount'],
            'status' => 'issued',  // Default status is 'issued'
            'order_date' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $purchaseOrder = DB::table('purchase_order')->where('order_id', $orderId)->first();

        return response()->json(['message' => 'Purchase order issued successfully', 'purchase_order' => $purchaseOrder], 201);
    }

    // ================================
    // Expense Records
    // ================================

    // 2.3.1 Record Purchase Amounts
    public function recordPurchaseAmount(Request $request, $orderId)
    {
        // Validate incoming data
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
        ]);

        $existingOrder = DB::table('purchase_order')->where('order_id', $orderId)->first();
        if (! $existingOrder) {
            return response()->json(['error' => 'Purchase order not found'], 404);
        }

        $id = DB::table('expense_record')->insertGetId([
            'order_id' => $orderId,
            'amount' => $validated['amount'],
            'payment_status' => 'unpaid',  // Default status is unpaid
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $expenseRecord = DB::table('expense_record')->where('expense_id', $id)->first();

        return response()->json(['message' => 'Purchase amount recorded successfully', 'expense_record' => $expenseRecord], 201);
    }

    // 2.3.2 Track Payment Status
    public function trackPaymentStatus(Request $request, $expenseId)
    {
        // Validate incoming data
        $validated = $request->validate([
            'payment_status' => 'required|in:unpaid,paid,partial',
        ]);

        $existing = DB::table('expense_record')->where('expense_id', $expenseId)->first();
        if (! $existing) {
            return response()->json(['error' => 'Expense record not found'], 404);
        }

        DB::table('expense_record')->where('expense_id', $expenseId)->update([
            'payment_status' => $validated['payment_status'],
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Payment status updated successfully']);
    }

    // 2.3.3 Export Expense Reports
    public function exportExpenseReports(Request $request)
    {
        // Get all expense records
        $expenseRecords = DB::table('expense_record')->get();

        // Export logic here - You can export to CSV, Excel, PDF, etc.
        // For simplicity, let's return the expense records as JSON
        return response()->json(['expense_reports' => $expenseRecords]);
    }

    // ================================
    // Additional Methods for Frontend Sync
    // ================================

    // Get all suppliers
    public function getSuppliers()
    {
        return response()->json(DB::table('supplier')->get());
    }

    // Update supplier
    public function updateSupplier(Request $request, $id)
    {
        $supplier = DB::table('supplier')->where('supplier_id', $id)->first();
        if (! $supplier) {
            return response()->json(['error' => 'Supplier not found'], 404);
        }

        $validated = $request->validate([
            'supplier_name' => 'sometimes|required|string|max:100',
            'item_name' => 'nullable|string|max:100',
            'price' => 'nullable|numeric|min:0',
            'email' => 'nullable|email|max:150',
            'phone' => 'nullable|string|max:64',
            'address' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'rating' => 'nullable|integer|min:1|max:5',
            'comments' => 'nullable|string',
        ]);

        DB::table('supplier')->where('supplier_id', $id)->update(array_merge($validated, ['updated_at' => now()]));

        $supplier = DB::table('supplier')->where('supplier_id', $id)->first();

        return response()->json([
            'message' => 'Supplier updated successfully',
            'supplier' => $supplier
        ]);
    }

    // Archive supplier
    public function archiveSupplier($id)
    {
        $existing = DB::table('supplier')->where('supplier_id', $id)->first();
        if (! $existing) {
            return response()->json(['error' => 'Supplier not found'], 404);
        }

        // soft archive: set status to 'archived'
        DB::table('supplier')->where('supplier_id', $id)->update(['status' => 'archived', 'updated_at' => now()]);

        return response()->json(['message' => 'Supplier archived successfully']);
    }

    // NEW: Activate supplier (clear archive status)
    public function activateSupplier($id)
    {
        $existing = DB::table('supplier')->where('supplier_id', $id)->first();
        if (! $existing) {
            return response()->json(['error' => 'Supplier not found'], 404);
        }

        // set status explicitly to 'active'
        DB::table('supplier')->where('supplier_id', $id)->update(['status' => 'active', 'updated_at' => now()]);

        return response()->json(['message' => 'Supplier activated successfully']);
    }

    // Get all purchase requests
    public function getPurchaseRequests()
    {
        return response()->json(DB::table('purchase_request')->get());
    }

    // Update purchase request
    public function updatePurchaseRequest(Request $request, $id)
    {
        $existing = DB::table('purchase_request')->where('request_id', $id)->first();
        if (! $existing) {
            return response()->json(['error' => 'Purchase request not found'], 404);
        }

        $validated = $request->validate([
            'equipment_id' => 'sometimes|required|exists:equipment,equipment_id',
            'quantity' => 'sometimes|integer|min:1',
            'requested_by' => 'nullable|string|max:100',
            'status' => 'sometimes|in:pending,approved,rejected',
        ]);

        DB::table('purchase_request')->where('request_id', $id)->update(array_merge($validated, ['updated_at' => now()]));

        $purchaseRequest = DB::table('purchase_request')->where('request_id', $id)->first();

        return response()->json(['message' => 'Purchase request updated successfully', 'purchase_request' => $purchaseRequest]);
    }

    // Get all purchase orders
    public function getPurchaseOrders()
    {
        return response()->json(DB::table('purchase_order')->get());
    }

    // Update purchase order
    public function updatePurchaseOrder(Request $request, $id)
    {
        $existing = DB::table('purchase_order')->where('order_id', $id)->first();
        if (! $existing) {
            return response()->json(['error' => 'Purchase order not found'], 404);
        }

        $validated = $request->validate([
            'supplier_id' => 'sometimes|exists:supplier,supplier_id',
            'total_amount' => 'sometimes|numeric|min:0',
            'status' => 'sometimes|in:issued,completed,cancelled',
        ]);

        DB::table('purchase_order')->where('order_id', $id)->update(array_merge($validated, ['updated_at' => now()]));

        $purchaseOrder = DB::table('purchase_order')->where('order_id', $id)->first();

        return response()->json(['message' => 'Purchase order updated successfully', 'purchase_order' => $purchaseOrder]);
    }

    // Get all expenses
    public function getExpenses()
    {
        return response()->json(DB::table('expense_record')->get());
    }

    // Update expense
    public function updateExpense(Request $request, $id)
    {
        $existing = DB::table('expense_record')->where('expense_id', $id)->first();
        if (! $existing) {
            return response()->json(['error' => 'Expense record not found'], 404);
        }

        $validated = $request->validate([
            'amount' => 'sometimes|numeric|min:0',
            'payment_status' => 'sometimes|in:unpaid,paid,partial',
        ]);

        DB::table('expense_record')->where('expense_id', $id)->update(array_merge($validated, ['updated_at' => now()]));

        $expenseRecord = DB::table('expense_record')->where('expense_id', $id)->first();

        return response()->json(['message' => 'Expense updated successfully', 'expense_record' => $expenseRecord]);
    }

    // ================================
    // Core2 Suppliers Management
    // ================================

    // Get all core2 suppliers
    public function getCore2Suppliers()
    {
        return response()->json(DB::table('core2_suppliers')->get());
    }

    // Create core2 supplier
    public function createCore2Supplier(Request $request)
    {
        $validated = $request->validate([
            'supplier_name' => 'required|string|max:100',
            'item_name' => 'required|string|max:100',
            'price' => 'nullable|numeric|min:0',
            'email' => 'nullable|email|max:150',
            'phone' => 'nullable|string|max:64',
            'address' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'status' => 'required|in:pending,add',
        ]);

        $id = DB::table('core2_suppliers')->insertGetId(array_merge($validated, [
            'created_at' => now(),
            'updated_at' => now(),
        ]));

        $core2Supplier = DB::table('core2_suppliers')->where('id', $id)->first();

        return response()->json(['message' => 'Core2 supplier created successfully', 'core2_supplier' => $core2Supplier], 201);
    }

    // Update core2 supplier
    public function updateCore2Supplier(Request $request, $id)
    {
        $existing = DB::table('core2_suppliers')->where('id', $id)->first();
        if (! $existing) {
            return response()->json(['error' => 'Core2 supplier not found'], 404);
        }

        $validated = $request->validate([
            'supplier_name' => 'sometimes|required|string|max:100',
            'item_name' => 'sometimes|required|string|max:100',
            'price' => 'nullable|numeric|min:0',
            'email' => 'nullable|email|max:150',
            'phone' => 'nullable|string|max:64',
            'address' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'status' => 'sometimes|required|in:pending,add',
        ]);

        DB::table('core2_suppliers')->where('id', $id)->update(array_merge($validated, ['updated_at' => now()]));

        $core2Supplier = DB::table('core2_suppliers')->where('id', $id)->first();

        return response()->json(['message' => 'Core2 supplier updated successfully', 'core2_supplier' => $core2Supplier]);
    }

    // Delete core2 supplier
    public function deleteCore2Supplier($id)
    {
        $existing = DB::table('core2_suppliers')->where('id', $id)->first();
        if (! $existing) {
            return response()->json(['error' => 'Core2 supplier not found'], 404);
        }

        DB::table('core2_suppliers')->where('id', $id)->delete();

        return response()->json(['message' => 'Core2 supplier deleted successfully']);
    }

    // Add supplier from core2 (insert into supplier table and set status to active)
    public function addSupplier(Request $request, $id)
    {
        $core2Supplier = DB::table('core2_suppliers')->where('id', $id)->first();
        if (! $core2Supplier) {
            return response()->json(['error' => 'Core2 supplier not found'], 404);
        }

        $validated = $request->validate([
            'status' => 'required|string|in:add',
        ]);

        // Insert into supplier table
        $supplierId = DB::table('supplier')->insertGetId([
            'core2_supplier_id' => $core2Supplier->id,
            'supplier_name' => $core2Supplier->supplier_name,
            'item_name' => $core2Supplier->item_name,
            'price' => $core2Supplier->price,
            'email' => $core2Supplier->email,
            'phone' => $core2Supplier->phone,
            'address' => $core2Supplier->address,
            'website' => $core2Supplier->website,
            'status' => 'active',
            'comments' => 'Added from Core2',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Update core2_supplier status
        DB::table('core2_suppliers')->where('id', $id)->update([
            'status' => $validated['status'],
            'updated_at' => now(),
        ]);

        $supplier = DB::table('supplier')->where('supplier_id', $supplierId)->first();

        return response()->json([
            'message' => 'Supplier added successfully and set to active',
            'supplier' => $supplier
        ]);
    }

    // ================================
    // Order Items Management
    // ================================

    // Get all order items
    public function getOrderItems()
    {
        $orderItems = DB::table('order_items')
            ->select('order_items.order_item_id', 'order_items.request_id', 'order_items.item_name', 'order_items.quantity', 'order_items.price_per_unit', 'order_items.total_price', 'order_items.supplier_email', 'order_items.supplier_phone', 'order_items.supplier_address', 'order_items.supplier_website', 'order_items.created_at', 'order_items.delivery_date', 'order_items.status', 'order_items.updated_at')
            ->where('status', 'ongoing')
            ->orderBy('delivery_date', 'desc')
            ->get();
        return response()->json($orderItems);
    }

    // Create a new order item
    public function createOrderItem(Request $request)
    {
        $validated = $request->validate([
            'request_id' => 'required|exists:purchase_request,request_id',
            'item_name' => 'required|string|max:100',
            'quantity' => 'required|integer|min:1',
            'price_per_unit' => 'required|numeric|min:0',
            'total_price' => 'required|numeric|min:0',
            'supplier_email' => 'nullable|email|max:150',
            'supplier_phone' => 'nullable|string|max:64',
            'supplier_address' => 'nullable|string|max:255',
            'supplier_website' => 'nullable|url|max:255',
            'delivery_date' => 'nullable|date_format:Y-m-d\TH:i',
            'status' => 'sometimes|in:received,reported,ongoing,cancel',
        ]);

        $id = DB::table('order_items')->insertGetId([
            'request_id' => $validated['request_id'],
            'item_name' => $validated['item_name'],
            'quantity' => $validated['quantity'],
            'price_per_unit' => $validated['price_per_unit'],
            'total_price' => $validated['total_price'],
            'supplier_email' => $validated['supplier_email'] ?? null,
            'supplier_phone' => $validated['supplier_phone'] ?? null,
            'supplier_address' => $validated['supplier_address'] ?? null,
            'supplier_website' => $validated['supplier_website'] ?? null,
            'delivery_date' => $validated['delivery_date'] ?? null,
            'status' => $validated['status'] ?? 'ongoing',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $orderItem = DB::table('order_items')->where('order_item_id', $id)->first();

        // Update the purchase request status to 'ordered' and set delivery_date
        DB::table('purchase_request')->where('request_id', $validated['request_id'])->update([
            'status' => 'ordered',
            'delivery_date' => $validated['delivery_date'] ?? null,
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Order item created successfully', 'order_item' => $orderItem], 201);
    }

    // Update order item
    public function updateOrderItem(Request $request, $id)
    {
        $existing = DB::table('order_items')->where('order_item_id', $id)->first();
        if (! $existing) {
            return response()->json(['error' => 'Order item not found'], 404);
        }

        $validated = $request->validate([
            'item_name' => 'sometimes|required|string|max:100',
            'quantity' => 'sometimes|integer|min:1',
            'price_per_unit' => 'sometimes|numeric|min:0',
            'total_price' => 'sometimes|numeric|min:0',
            'supplier_email' => 'nullable|email|max:150',
            'supplier_phone' => 'nullable|string|max:64',
            'supplier_address' => 'nullable|string|max:255',
            'supplier_website' => 'nullable|url|max:255',
            'status' => 'sometimes|in:received,reported,ongoing,cancel',
        ]);

        DB::table('order_items')->where('order_item_id', $id)->update(array_merge($validated, ['updated_at' => now()]));

        $orderItem = DB::table('order_items')->where('order_item_id', $id)->first();

        return response()->json(['message' => 'Order item updated successfully', 'order_item' => $orderItem]);
    }

    // Delete order item
    public function deleteOrderItem($id)
    {
        $existing = DB::table('order_items')->where('order_item_id', $id)->first();
        if (! $existing) {
            return response()->json(['error' => 'Order item not found'], 404);
        }

        DB::table('order_items')->where('order_item_id', $id)->delete();

        return response()->json(['message' => 'Order item deleted successfully']);
    }

    // ================================
    // Order Reports Management
    // ================================

    // Add order report
    public function addOrderReport(Request $request)
    {
        $validated = $request->validate([
            'order_item_id' => 'required|exists:order_items,order_item_id',
            'item_name' => 'required|string|max:100',
            'quantity' => 'required|integer|min:1',
            'price_per_unit' => 'required|numeric|min:0',
            'total_price' => 'required|numeric|min:0',
            'supplier_website' => 'nullable|url|max:255',
            'supplier_address' => 'nullable|string|max:255',
            'supplier_phone' => 'nullable|string|max:64',
            'delivery_date' => 'nullable|date_format:Y-m-d\TH:i',
            'supplier_email' => 'nullable|email|max:150',
            'status' => 'sometimes|in:reported,archived',
            'report_description' => 'nullable|string',
            'reported_by' => 'nullable|string|max:100',
            'proof_report' => 'nullable|array|max:4',
            'proof_report.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $proofReportPaths = [];
        if ($request->file('proof_report')) {
            foreach ($request->file('proof_report') as $file) {
                $filename = time() . '_' . uniqid() . '_' . $file->getClientOriginalName();
                $file->storeAs('proof_reports', $filename, 'public');
                $proofReportPaths[] = $filename;
            }
        }
        $proofReportJson = !empty($proofReportPaths) ? json_encode($proofReportPaths) : null;

        $id = DB::table('order_reports')->insertGetId([
            'order_item_id' => $validated['order_item_id'],
            'item_name' => $validated['item_name'],
            'quantity' => $validated['quantity'],
            'price_per_unit' => $validated['price_per_unit'],
            'total_price' => $validated['total_price'],
            'supplier_website' => $validated['supplier_website'] ?? null,
            'supplier_address' => $validated['supplier_address'] ?? null,
            'supplier_phone' => $validated['supplier_phone'] ?? null,
            'delivery_date' => $validated['delivery_date'] ?? null,
            'supplier_email' => $validated['supplier_email'] ?? null,
            'status' => $validated['status'] ?? 'reported',
            'report_description' => $validated['report_description'] ?? null,
            'reported_by' => $validated['reported_by'] ?? null,
            'proof_report' => $proofReportJson,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $orderReport = DB::table('order_reports')->where('id', $id)->first();

        // Update the order item status to 'reported'
        DB::table('order_items')
            ->where('order_item_id', $validated['order_item_id'])
            ->update(['status' => 'reported']);

        return response()->json(['message' => 'Order report added successfully', 'order_report' => $orderReport], 201);
    }

    // Update order report
    public function updateOrderReport(Request $request, $id)
    {
        $existing = DB::table('order_reports')->where('id', $id)->first();
        if (! $existing) {
            return response()->json(['error' => 'Order report not found'], 404);
        }

        $validated = $request->validate([
            'item_name' => 'sometimes|required|string|max:100',
            'quantity' => 'sometimes|integer|min:1',
            'price_per_unit' => 'sometimes|numeric|min:0',
            'total_price' => 'sometimes|numeric|min:0',
            'supplier_website' => 'nullable|url|max:255',
            'supplier_address' => 'nullable|string|max:255',
            'supplier_phone' => 'nullable|string|max:64',
            'delivery_date' => 'nullable|date_format:Y-m-d\TH:i',
            'supplier_email' => 'nullable|email|max:150',
            'status' => 'sometimes|in:reported,archived',
            'report_description' => 'nullable|string',
        ]);

        DB::table('order_reports')->where('id', $id)->update(array_merge($validated, ['updated_at' => now()]));

        $orderReport = DB::table('order_reports')->where('id', $id)->first();

        return response()->json(['message' => 'Order report updated successfully', 'order_report' => $orderReport]);
    }

    // Get all order reports
    public function getAllOrderReports()
    {
        $orderReports = DB::table('order_reports')->get();
        return response()->json($orderReports);
    }

    // Archive order report
    public function archiveOrderReport($id)
    {
        $existing = DB::table('order_reports')->where('id', $id)->first();
        if (! $existing) {
            return response()->json(['error' => 'Order report not found'], 404);
        }

        DB::table('order_reports')->where('id', $id)->update(['status' => 'archived', 'updated_at' => now()]);

        return response()->json(['message' => 'Order report archived successfully']);
    }

    // ================================
    // Received Orders Management
    // ================================

    // Add received order
    public function addReceivedOrder(Request $request)
    {
        $validated = $request->validate([
            'order_item_id' => 'required|exists:order_items,order_item_id',
            'item_name' => 'required|string|max:100',
            'quantity' => 'required|integer|min:1',
            'price_per_unit' => 'required|numeric|min:0',
            'total_price' => 'required|numeric|min:0',
            'supplier_website' => 'nullable|url|max:255',
            'supplier_address' => 'nullable|string|max:255',
            'supplier_phone' => 'nullable|string|max:64',
            'delivery_date' => 'nullable|date',
            'supplier_email' => 'nullable|email|max:150',
            'status' => 'sometimes|in:received,archived',
            'receiver_name' => 'required|string|max:100',
            'picture' => 'nullable|file|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $data = [
            'order_item_id' => $validated['order_item_id'],
            'item_name' => $validated['item_name'],
            'quantity' => $validated['quantity'],
            'price_per_unit' => $validated['price_per_unit'],
            'total_price' => $validated['total_price'],
            'supplier_website' => $validated['supplier_website'] ?? null,
            'supplier_address' => $validated['supplier_address'] ?? null,
            'supplier_phone' => $validated['supplier_phone'] ?? null,
            'delivery_date' => $validated['delivery_date'] ?? null,
            'supplier_email' => $validated['supplier_email'] ?? null,
            'status' => $validated['status'] ?? 'received',
            'received_by' => $validated['receiver_name'],
            'created_at' => now(),
            'updated_at' => now(),
        ];

        if ($request->hasFile('picture')) {
            $path = $request->file('picture')->store('pictures', 'public');
            $data['picture'] = $path;
        }

        $id = DB::table('received_orders')->insertGetId($data);

        // Update the order_items status to 'received'
        DB::table('order_items')->where('order_item_id', $validated['order_item_id'])->update([
            'status' => 'received',
            'updated_at' => now(),
        ]);

        $receivedOrder = DB::table('received_orders')->where('id', $id)->first();

        return response()->json(['message' => 'Received order added successfully', 'received_order' => $receivedOrder], 201);
    }

    // Update received order
    public function updateReceivedOrder(Request $request, $id)
    {
        $existing = DB::table('received_orders')->where('id', $id)->first();
        if (! $existing) {
            return response()->json(['error' => 'Received order not found'], 404);
        }

        $validated = $request->validate([
            'item_name' => 'sometimes|required|string|max:100',
            'quantity' => 'sometimes|integer|min:1',
            'price_per_unit' => 'sometimes|numeric|min:0',
            'total_price' => 'sometimes|numeric|min:0',
            'supplier_website' => 'nullable|url|max:255',
            'supplier_address' => 'nullable|string|max:255',
            'supplier_phone' => 'nullable|string|max:64',
            'delivery_date' => 'nullable|date_format:Y-m-d\TH:i',
            'supplier_email' => 'nullable|email|max:150',
            'status' => 'sometimes|in:received,archived',
        ]);

        DB::table('received_orders')->where('id', $id)->update(array_merge($validated, ['updated_at' => now()]));

        $receivedOrder = DB::table('received_orders')->where('id', $id)->first();

        return response()->json(['message' => 'Received order updated successfully', 'received_order' => $receivedOrder]);
    }

    // Get all received orders
    public function getAllReceivedOrders()
    {
        $receivedOrders = DB::table('received_orders')->get();
        return response()->json($receivedOrders);
    }

    // Archive received order
    public function archiveReceivedOrder($id)
    {
        $existing = DB::table('received_orders')->where('id', $id)->first();
        if (! $existing) {
            return response()->json(['error' => 'Received order not found'], 404);
        }

        DB::table('received_orders')->where('id', $id)->update(['status' => 'archived', 'updated_at' => now()]);

        return response()->json(['message' => 'Received order archived successfully']);
    }


}
