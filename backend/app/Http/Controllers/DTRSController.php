<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DTRSController extends Controller
{
    // ================================
    // 5.1.1 Upload Delivery Proof
    // ================================
    public function uploadDeliveryProof(Request $request)
    {
        $validated = $request->validate([
            'delivery_id' => 'required|exists:delivery,delivery_id', // Make sure delivery exists
            'document' => 'required|mimes:pdf,jpeg,png,jpg', // Document format
            'tour_project_id' => 'required|exists:tour_project,project_id',
            'reference_code' => 'required|string|max:100|unique:delivery_receipt,reference_code',
        ]);

        // Store the document
        $path = $request->file('document')->store('delivery_receipts');

        // Insert the delivery receipt into the database
        $receiptId = DB::table('delivery_receipt')->insertGetId([
            'delivery_id' => $validated['delivery_id'],
            'document_path' => $path,
            'reference_code' => $validated['reference_code'],
            'tour_project_id' => $validated['tour_project_id'],
            'uploaded_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Delivery proof uploaded successfully', 'receipt_id' => $receiptId], 201);
    }

    // ================================
    // 5.1.2 Search by Tour or Project
    // ================================
    public function searchByTourOrProject(Request $request)
    {
        $validated = $request->validate([
            'tour_project_id' => 'required|exists:tour_project,project_id',
        ]);

        $receipts = DB::table('delivery_receipt')
            ->where('tour_project_id', $validated['tour_project_id'])
            ->get();

        return response()->json(['receipts' => $receipts]);
    }

    // ================================
    // 5.1.3 Validate Document Reference
    // ================================
    public function validateDocumentReference(Request $request)
    {
        $validated = $request->validate([
            'reference_code' => 'required|string|exists:delivery_receipt,reference_code',
        ]);

        $document = DB::table('delivery_receipt')
            ->where('reference_code', $validated['reference_code'])
            ->first();

        if (!$document) {
            return response()->json(['error' => 'Document not found'], 404);
        }

        return response()->json(['message' => 'Document found', 'document' => $document]);
    }

    // ================================
    // 5.2.1 Record Equipment Borrowed
    // ================================
    public function recordEquipmentBorrowed(Request $request)
    {
        $validated = $request->validate([
            'equipment_id' => 'required|exists:equipment,equipment_id',
            'project_id' => 'required|exists:tour_project,project_id',
            'remarks' => 'nullable|string',
        ]);

        $logId = DB::table('equipment_log')->insertGetId([
            'equipment_id' => $validated['equipment_id'],
            'project_id' => $validated['project_id'],
            'action' => 'borrowed',
            'action_date' => now(),
            'remarks' => $validated['remarks'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Equipment borrowed recorded successfully', 'log_id' => $logId], 201);
    }

    // ================================
    // 5.2.2 Mark Returned Equipment
    // ================================
    public function markEquipmentReturned(Request $request, $logId)
    {
        $validated = $request->validate([
            'remarks' => 'nullable|string',
        ]);

        DB::table('equipment_log')
            ->where('log_id', $logId)
            ->update([
                'action' => 'returned',
                'remarks' => $validated['remarks'] ?? 'Returned successfully',
                'action_date' => now(),
                'updated_at' => now(),
            ]);

        return response()->json(['message' => 'Equipment marked as returned']);
    }

    // ================================
    // 5.2.3 Flag Lost/Damaged Items
    // ================================
    public function flagLostOrDamagedItem(Request $request, $logId)
    {
        $validated = $request->validate([
            'status' => 'required|in:lost,damaged',
            'remarks' => 'nullable|string',
        ]);

        DB::table('equipment_log')
            ->where('log_id', $logId)
            ->update([
                'action' => $validated['status'],
                'remarks' => $validated['remarks'] ?? ucfirst($validated['status']),
                'action_date' => now(),
                'updated_at' => now(),
            ]);

        return response()->json(['message' => 'Equipment flagged as ' . $validated['status']]);
    }

    // ================================
    // 5.3.1 Generate Monthly Reports
    // ================================
    public function generateMonthlyReport(Request $request)
    {
        $validated = $request->validate([
            'report_date' => 'required|date_format:Y-m',
        ]);

        // Insert the monthly report into the database
        $reportId = DB::table('logistics_report')->insertGetId([
            'report_type' => 'monthly',
            'report_date' => $validated['report_date'],
            'file_path' => 'path/to/generated/monthly_report.pdf', // Mock file path
            'archived' => 'no',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Monthly report generated', 'report_id' => $reportId]);
    }

    // ================================
    // 5.3.2 Export PDF/Excel Files
    // ================================
    public function exportReport(Request $request, $reportId)
    {
        $report = DB::table('logistics_report')->where('report_id', $reportId)->first();

        if (!$report) {
            return response()->json(['error' => 'Report not found'], 404);
        }

        // Generate PDF or Excel here using Laravel libraries like domPDF or Laravel Excel
        // For now, return the file path
        $filePath = $report->file_path; 

        return response()->download(storage_path('app/' . $filePath));
    }

    // ================================
    // 5.3.3 Archive Old Reports
    // ================================
    public function archiveOldReports(Request $request)
    {
        $validated = $request->validate([
            'report_id' => 'required|exists:logistics_report,report_id',
        ]);

        DB::table('logistics_report')
            ->where('report_id', $validated['report_id'])
            ->update([
                'archived' => 'yes',
                'updated_at' => now(),
            ]);

        return response()->json(['message' => 'Report archived successfully']);
    }

    // ================================
    // Additional Methods for Frontend Sync
    // ================================

    // Get all delivery receipts
    public function getDeliveryReceipts()
    {
        return response()->json(DB::table('delivery_receipt')
            ->join('delivery', 'delivery_receipt.delivery_id', '=', 'delivery.delivery_id')
            ->join('tour_project', 'delivery_receipt.tour_project_id', '=', 'tour_project.project_id')
            ->select('delivery_receipt.*', 'tour_project.name as project_name')
            ->get());
    }

    // Update delivery receipt
    public function updateDeliveryReceipt(Request $request, $id)
    {
        $validated = $request->validate([
            'delivery_id' => 'sometimes|exists:delivery,delivery_id',
            'document_path' => 'nullable|string',
            'reference_code' => 'sometimes|string|max:100|unique:delivery_receipt,reference_code,' . $id,
            'tour_project_id' => 'sometimes|exists:tour_project,project_id',
        ]);

        DB::table('delivery_receipt')
            ->where('id', $id)
            ->update($validated);

        return response()->json(['message' => 'Delivery receipt updated successfully']);
    }

    // Get all equipment logs
    public function getEquipmentLogs()
    {
        return response()->json(DB::table('equipment_log')
            ->join('equipment', 'equipment_log.equipment_id', '=', 'equipment.equipment_id')
            ->join('tour_project', 'equipment_log.project_id', '=', 'tour_project.project_id')
            ->select('equipment_log.*', 'equipment.name as equipment_name', 'tour_project.name as project_name')
            ->get());
    }

    // Update equipment log
    public function updateEquipmentLog(Request $request, $id)
    {
        $validated = $request->validate([
            'equipment_id' => 'sometimes|exists:equipment,equipment_id',
            'project_id' => 'sometimes|exists:tour_project,project_id',
            'action' => 'sometimes|in:borrowed,returned,lost,damaged',
            'action_date' => 'sometimes|date',
            'remarks' => 'nullable|string',
        ]);

        DB::table('equipment_log')
            ->where('log_id', $id)
            ->update($validated);

        return response()->json(['message' => 'Equipment log updated successfully']);
    }

    // Get all logistics reports
    public function getLogisticsReports()
    {
        return response()->json(DB::table('logistics_report')->get());
    }

    // Update logistics report
    public function updateLogisticsReport(Request $request, $id)
    {
        $validated = $request->validate([
            'report_type' => 'sometimes|in:monthly,weekly,daily',
            'report_date' => 'sometimes|date_format:Y-m',
            'file_path' => 'nullable|string',
            'archived' => 'sometimes|in:yes,no',
        ]);

        DB::table('logistics_report')
            ->where('report_id', $id)
            ->update($validated);

        return response()->json(['message' => 'Logistics report updated successfully']);
    }

    // Get all fleet documents
    public function getFleetDocuments()
    {
        // Assuming fleet documents are stored in a separate table or as part of logistics reports
        return response()->json(DB::table('logistics_report')
            ->where('report_type', 'fleet')
            ->get());
    }

    // Update fleet document
    public function updateFleetDocument(Request $request, $id)
    {
        $validated = $request->validate([
            'report_type' => 'sometimes|in:monthly,weekly,daily,fleet',
            'report_date' => 'sometimes|date_format:Y-m',
            'file_path' => 'nullable|string',
            'archived' => 'sometimes|in:yes,no',
        ]);

        DB::table('logistics_report')
            ->where('report_id', $id)
            ->update($validated);

        return response()->json(['message' => 'Fleet document updated successfully']);
    }

    // Get all assets
    public function getAssets()
    {
        return response()->json(DB::table('asset')
            ->join('equipment', 'asset.equipment_id', '=', 'equipment.equipment_id')
            ->select('asset.*', 'equipment.name as equipment_name')
            ->get());
    }

    // Get asset by QR token
    public function getAssetByToken($token)
    {
        $asset = DB::table('asset')
            ->where('qr_token', $token)
            ->first();

        if (!$asset) {
            return response()->json(['error' => 'Asset not found'], 404);
        }

        return response()->json($asset);
    }
}
