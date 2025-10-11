<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EquipmentIssueController extends Controller
{
    // List all issues (optionally filter by status)
    public function index(Request $request)
    {
        try {
            // join with equipment and lookup tables to provide helpful display fields to the frontend
            $query = DB::table('equipment_issues as ei')
                ->leftJoin('equipment as e', 'ei.equipment_id', 'e.equipment_id')
                ->leftJoin('equipment_category as ec', 'e.category_id', 'ec.category_id')
                ->leftJoin('storage_location as sl', 'e.storage_location_id', 'sl.storage_location_id')
                ->select('ei.*', 'e.name as equipment_name', 'ec.category_name', 'sl.location_name', 'e.stock_quantity')
                ->orderBy('ei.created_at', 'desc');

            if ($request->filled('status')) {
                $query->where('ei.status', $request->status);
            }

            if ($request->filled('equipment_id')) {
                $query->where('ei.equipment_id', $request->equipment_id);
            }

            // Optional pagination: return { data, total, meta } when per_page is provided
            if ($request->filled('per_page')) {
                $perPage = max(1, (int)$request->per_page);
                $page = max(1, (int)$request->get('page', 1));

                // build a separate count query that mirrors filters on the main query (avoid joins for efficiency)
                $countQuery = DB::table('equipment_issues as ei_count');
                if ($request->filled('status')) $countQuery->where('ei_count.status', $request->status);
                if ($request->filled('equipment_id')) $countQuery->where('ei_count.equipment_id', $request->equipment_id);
                $total = $countQuery->count();

                $data = $query->offset(($page - 1) * $perPage)->limit($perPage)->get();

                return response()->json([
                    'data' => $data,
                    'total' => $total,
                    'meta' => [
                        'per_page' => $perPage,
                        'page' => $page
                    ]
                ]);
            }

            $results = $query->get();
            return response()->json($results);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch equipment issues', 'error' => $e->getMessage()], 500);
        }
    }

    // Create a new issue
    public function store(Request $request)
    {
        $data = $request->validate([
            'equipment_id' => 'nullable|integer|exists:equipment,equipment_id',
            'item_name' => 'nullable|string|max:150',
            'description' => 'nullable|string',
            'reported_by' => 'nullable|string|max:120',
            'status' => 'nullable|in:open,in_progress,resolved'
        ]);
        try {
            // If reported_by not provided, take from authenticated user when available
            if (empty($data['reported_by']) && auth()->check()) {
                $user = auth()->user();
                $data['reported_by'] = $user->name ?? $user->email ?? 'User';
            }

            $data['status'] = $data['status'] ?? 'open';
            $data['created_at'] = now();
            $data['updated_at'] = now();
            $id = DB::table('equipment_issues')->insertGetId($data);

            if (!$id) {
                return response()->json(['message' => 'Failed to create equipment issue'], 500);
            }

            $record = DB::table('equipment_issues as ei')
                ->leftJoin('equipment as e', 'ei.equipment_id', 'e.equipment_id')
                ->leftJoin('equipment_category as ec', 'e.category_id', 'ec.category_id')
                ->leftJoin('storage_location as sl', 'e.storage_location_id', 'sl.storage_location_id')
                ->select('ei.*', 'e.name as equipment_name', 'ec.category_name', 'sl.location_name', 'e.stock_quantity')
                ->where('ei.id', $id)
                ->first();

            // Ensure we always return a consistent object
            if (!$record) {
                // If join failed to locate equipment, fall back to reading the raw issue
                $raw = DB::table('equipment_issues')->where('id', $id)->first();
                return response()->json($raw, 201);
            }

            return response()->json($record, 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create equipment issue', 'error' => $e->getMessage()], 500);
        }
    }

    // Update issue
    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'item_name' => 'nullable|string|max:150',
            'description' => 'nullable|string',
            'reported_by' => 'nullable|string|max:120',
            'status' => 'nullable|in:open,in_progress,resolved'
        ]);
        try {
            $data['updated_at'] = now();
            $updated = DB::table('equipment_issues')->where('id', $id)->update($data);

            if (!$updated) {
                return response()->json(['message' => 'Equipment issue not found or no changes provided'], 404);
            }

            $record = DB::table('equipment_issues as ei')
                ->leftJoin('equipment as e', 'ei.equipment_id', 'e.equipment_id')
                ->leftJoin('equipment_category as ec', 'e.category_id', 'ec.category_id')
                ->leftJoin('storage_location as sl', 'e.storage_location_id', 'sl.storage_location_id')
                ->select('ei.*', 'e.name as equipment_name', 'ec.category_name', 'sl.location_name', 'e.stock_quantity')
                ->where('ei.id', $id)
                ->first();

            return response()->json($record ?: DB::table('equipment_issues')->where('id', $id)->first());
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to update equipment issue', 'error' => $e->getMessage()], 500);
        }
    }

    // Delete (archive) issue
    public function destroy($id)
    {
        try {
            $deleted = DB::table('equipment_issues')->where('id', $id)->delete();
            if (!$deleted) {
                return response()->json(['message' => 'Equipment issue not found'], 404);
            }
            return response()->json(['message' => 'Issue deleted']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete issue', 'error' => $e->getMessage()], 500);
        }
    }
}
