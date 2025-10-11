<?php

namespace App\Http\Controllers;
 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EquipmentManagementController extends Controller
{
    // ================================
    // Equipment Management (CRUD)
    // ================================
     
    public function index(Request $request)
    {
        $query = DB::table('equipment')
            ->leftJoin('equipment_category', function($join) {
                $join->on('equipment.category_id', '=', 'equipment_category.category_id')
                     ->whereNull('equipment_category.archived_at'); // don't join archived categories
            })
            ->leftJoin('storage_location', function($join) {
                $join->on('equipment.storage_location_id', '=', 'storage_location.storage_location_id')
                     ->whereNull('storage_location.archived_at'); // don't join archived locations
            })
            ->select('equipment.*', 'equipment_category.category_name', 'storage_location.location_name');

        if ($request->has('q') && !empty($request->q)) {
            $q = $request->q;
            $query->where(function($qry) use ($q) {
                $qry->where('equipment.name', 'like', "%{$q}%")
                    ->orWhere('equipment.description', 'like', "%{$q}%")
                    ->orWhere('equipment_category.category_name', 'like', "%{$q}%");
            });
        }

        // STATUS FILTERING
        // Accepts: 'active', 'archived', or 'all'. Default is 'active' when not provided.
        $status = $request->input('status', null);
        if ($status === 'all') {
            // no status filter
        } elseif (in_array($status, ['active','archived'], true)) {
            $query->where('equipment.status', $status);
        } else {
            // default to active if no valid status provided
            $query->where('equipment.status', 'active');
        }

        // Check if requesting all data
        // Correctly inspect the query input for "all"
        if ($request->filled('all') && $request->input('all') === 'true') {
            return $query->orderBy('created_at', 'desc')->get();
        }

        // Check if requesting custom per_page
        if ($request->has('per_page')) { 
            $perPage = $request->per_page;
            if ($perPage === 'all') {
                return $query->orderBy('created_at', 'desc')->get();
            }
            $perPage = (int) $perPage;
            if ($perPage > 0) {
                return $query->orderBy('created_at', 'desc')->paginate($perPage);
            }
        }

        return $query->orderBy('created_at', 'desc')->paginate(10);
    }

    public function show($id)
    {
        return DB::table('equipment')
            ->leftJoin('equipment_category', function($join) {
                $join->on('equipment.category_id', '=', 'equipment_category.category_id')
                     ->whereNull('equipment_category.archived_at');
            })
            ->leftJoin('storage_location', function($join) {
                $join->on('equipment.storage_location_id', '=', 'storage_location.storage_location_id')
                     ->whereNull('storage_location.archived_at');
            })
            ->select('equipment.*', 'equipment_category.category_name', 'storage_location.location_name')
            ->where('equipment.equipment_id', $id)
            ->first();
    }

    public function storeEquipment(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:equipment_category,category_id',
            'stock_quantity' => 'integer|min:0',
            'storage_location_id' => 'nullable|exists:storage_location,storage_location_id',
            'status' => 'in:active,archived'
        ]);

        $now = now();
        $data['created_at'] = $now; 
        $data['updated_at'] = $now;

        $id = DB::table('equipment')->insertGetId($data);

        return response()->json(DB::table('equipment')->where('equipment_id', $id)->first());
    }

    public function updateEquipment(Request $request, $id)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:equipment_category,category_id',
            'stock_quantity' => 'sometimes|integer|min:0',
            'storage_location_id' => 'nullable|exists:storage_location,storage_location_id',
            'status' => 'nullable|in:active,archived'
        ]);

        // Add updated_at timestamp
        $data['updated_at'] = now();

        DB::table('equipment')->where('equipment_id', $id)->update($data);

        return response()->json(DB::table('equipment')->where('equipment_id', $id)->first());
    }

    public function archiveEquipment($id)
    {
        DB::table('equipment')->where('equipment_id', $id)->update(['status' => 'archived', 'updated_at' => now()]);
        return response()->json(['message' => 'Equipment archived successfully']);
    }

    public function activateEquipment($id)
    {
        DB::table('equipment')->where('equipment_id', $id)->update(['status' => 'active']);
        return response()->json(['message' => 'Equipment activated successfully']);
    }

    public function searchEquipment(Request $request)
    {
        $query = $request->input('q');
        $status = $request->input('status', null);

        $q = DB::table('equipment')
            ->leftJoin('equipment_category', function($join) {
                $join->on('equipment.category_id', '=', 'equipment_category.category_id')
                     ->whereNull('equipment_category.archived_at');
            })
            ->leftJoin('storage_location', function($join) {
                $join->on('equipment.storage_location_id', '=', 'storage_location.storage_location_id')
                     ->whereNull('storage_location.archived_at');
            })
            ->select('equipment.*', 'equipment_category.category_name', 'storage_location.location_name')
            ->where(function($q) use ($query) {
                $q->where('equipment.name', 'like', "%{$query}%")
                  ->orWhere('equipment.description', 'like', "%{$query}%");
            });

        // Respect optional status param ('active', 'archived', 'all')
        if ($status === 'all') {
            // no status filter
        } elseif (in_array($status, ['active','archived'], true)) {
            $q->where('equipment.status', $status);
        } else {
            // default to active
            $q->where('equipment.status', 'active');
        }

        return $q->get();
    }

    public function lowStockAlert()
    {
        $lowStockItems = DB::table('equipment')
            ->leftJoin('equipment_category', function($join) {
                $join->on('equipment.category_id', '=', 'equipment_category.category_id')
                     ->whereNull('equipment_category.archived_at');
            })
            ->leftJoin('storage_location', function($join) {
                $join->on('equipment.storage_location_id', '=', 'storage_location.storage_location_id')
                     ->whereNull('storage_location.archived_at');
            })
            ->select(
                'equipment.*',
                'equipment_category.category_name',
                'storage_location.location_name'
            )
            ->where('equipment.stock_quantity', '<=', 3)
            ->where('equipment.status', 'active')
            ->get();

        return response()->json($lowStockItems);
    }

    public function overstockAlert()
    {
        $overstockItems = DB::table('equipment')
            ->leftJoin('equipment_category', function($join) {
                $join->on('equipment.category_id', '=', 'equipment_category.category_id')
                     ->whereNull('equipment_category.archived_at');
            })
            ->leftJoin('storage_location', function($join) {
                $join->on('equipment.storage_location_id', '=', 'storage_location.storage_location_id')
                     ->whereNull('storage_location.archived_at');
            })
            ->select(
                'equipment.*',
                'equipment_category.category_name',
                'storage_location.location_name'
            )
            ->where('equipment.stock_quantity', '>=', 50)
            ->where('equipment.status', 'active')
            ->get();

        return response()->json($overstockItems);
    }

    public function categorizeEquipment($equipmentId, $categoryId)
    {
        DB::table('equipment')
            ->where('equipment_id', $equipmentId)
            ->update([
                'category_id' => $categoryId,
                'updated_at' => now()
            ]);

        return response()->json(['message' => 'Equipment categorized successfully']);
    }

    public function updateStock(Request $request, $id)
    {
        $request->validate([
            'stock_quantity' => 'required|integer'
        ]);

        DB::table('equipment')
            ->where('equipment_id', $id)
            ->update([
                'stock_quantity' => $request->stock_quantity,
                'updated_at' => now()
            ]);

        return response()->json(['message' => 'Stock quantity updated successfully']);
    }


    // ================================
    // Equipment Category Management
    // ================================

    public function indexCategory()
    {
        // return only non-archived categories
        return DB::table('equipment_category')->whereNull('archived_at')->get();
    }

    public function showCategory($id)
    {
        return DB::table('equipment_category')->where('category_id', $id)->first();
    }

    public function storeCategory(Request $request)
    {
        $data = $request->validate(['category_name' => 'required|string|max:100']);
        $id = DB::table('equipment_category')->insertGetId($data);
        return response()->json(DB::table('equipment_category')->where('category_id', $id)->first());
    }

    public function updateCategory(Request $request, $id)
    {
        $data = $request->validate(['category_name' => 'sometimes|required|string|max:100']);
        DB::table('equipment_category')->where('category_id', $id)->update($data);
        return response()->json(DB::table('equipment_category')->where('category_id', $id)->first());
    }

    public function archiveCategory($id)
    {
        DB::table('equipment_category')->where('category_id', $id)->update(['archived_at' => now()]);
        return response()->json(['message' => 'Category archived successfully']);
    }

    public function searchCategory(Request $request)
    {
        $q = $request->input('q');
        return DB::table('equipment_category')
            ->where('category_name', 'like', "%{$q}%")
            ->whereNull('archived_at')
            ->get();
    }

    // ================================
    // Storage Location Management
    // ================================

    public function indexStorage()
    {
        // return only non-archived storage locations
        return DB::table('storage_location')->whereNull('archived_at')->get();
    }

    public function showStorage($id)
    {
        return DB::table('storage_location')->where('storage_location_id', $id)->first();
    }

    public function storeStorage(Request $request)
    {
        $data = $request->validate([
            'location_name' => 'required|string|max:100',
            'description' => 'nullable|string'
        ]);
        $id = DB::table('storage_location')->insertGetId($data);
        return response()->json(DB::table('storage_location')->where('storage_location_id', $id)->first());
    }

    public function updateStorage(Request $request, $id)
    {
        $data = $request->validate([
            'location_name' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string'
        ]);
        DB::table('storage_location')->where('storage_location_id', $id)->update($data);
        return response()->json(DB::table('storage_location')->where('storage_location_id', $id)->first());
    }

    public function archiveStorage($id)
    {
        DB::table('storage_location')->where('storage_location_id', $id)->update(['archived_at' => now()]);
        return response()->json(['message' => 'Storage location archived successfully']);
    }

    public function searchStorage(Request $request)
    {
        $q = $request->input('q');
        return DB::table('storage_location')
            ->where(function($qry) use ($q) {
                $qry->where('location_name', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%");
            })
            ->whereNull('archived_at')
            ->get();
    }

    // Low Stock Request endpoints
    public function addLowStockRequest(Request $request)
    {
        $request->validate([
            'item_name' => 'required|string|max:100',
            'quantity' => 'required|integer|min:1',
            'requested_by' => 'required|string|max:255',
        ]);

        $data = [
            'item_name' => $request->item_name,
            'quantity' => $request->quantity,
            'requested_by' => $request->requested_by,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        $id = DB::table('lowstock_request')->insertGetId($data);

        return response()->json(['message' => 'Low stock request added successfully', 'data' => DB::table('lowstock_request')->where('id', $id)->first()], 201);
    }

    public function updateLowStockRequest(Request $request, $id)
    {
        $request->validate([
            'item_name' => 'string|max:100',
            'quantity' => 'integer|min:1',
            'status' => 'in:pending,approved,rejected,submitted',
        ]);

        $data = $request->only(['item_name', 'quantity', 'status']);
        $data['updated_at'] = now();

        DB::table('lowstock_request')->where('id', $id)->update($data);

        return response()->json(['message' => 'Low stock request updated successfully', 'data' => DB::table('lowstock_request')->where('id', $id)->first()]);
    }

    public function archiveLowStockRequest(Request $request, $id)
    {
        DB::table('lowstock_request')->where('id', $id)->delete();

        return response()->json(['message' => 'Low stock request archived successfully']);
    }

    public function getLowStockRequests(Request $request)
    {
        return response()->json(DB::table('lowstock_request')->get());
    }


}
