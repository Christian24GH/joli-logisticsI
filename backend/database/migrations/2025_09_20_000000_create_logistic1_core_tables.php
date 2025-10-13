<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations. 
     */
    public function up(): void
    { 
        // 1) Reference/lookup tables first
        Schema::create('equipment_category', function (Blueprint $table) {
            $table->bigIncrements('category_id');
            $table->string('category_name', 100);
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
        });

        Schema::create('storage_location', function (Blueprint $table) {
            $table->bigIncrements('storage_location_id');
            $table->string('location_name', 100);
            $table->text('description')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
        });

        Schema::create('tour_project', function (Blueprint $table) {
            $table->bigIncrements('project_id');
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Vehicles referenced from fleet service (minimal schema to satisfy exists rules)
        Schema::create('alms_vehicles', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('plate_number', 32)->nullable();
            $table->string('make', 64)->nullable();
            $table->string('model', 64)->nullable();
            $table->timestamps();
        });
 
        // 2) Core domain tables
        Schema::create('core2_suppliers', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('supplier_name', 100);
            $table->string('item_name', 100);
            $table->decimal('price', 10, 2)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('phone', 64)->nullable();
            $table->string('address', 255)->nullable();
            $table->string('website', 255)->nullable();
            $table->string('status', 50)->default('pending');
            $table->timestamps();
        });

        Schema::create('supplier', function (Blueprint $table) {
            $table->bigIncrements('supplier_id');
            $table->unsignedBigInteger('core2_supplier_id')->nullable();
            $table->string('supplier_name', 100);
            $table->string('item_name', 100)->nullable();
            $table->decimal('price', 10, 2)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('phone', 64)->nullable();
            $table->string('address', 255)->nullable();
            $table->string('website', 255)->nullable();
            $table->unsignedTinyInteger('rating')->nullable();
            $table->enum('status', ['active', 'archived'])->default('active');
            $table->text('comments')->nullable();
            $table->timestamps();

            $table->foreign('core2_supplier_id')->references('id')->on('core2_suppliers')->nullOnDelete()->cascadeOnUpdate();
        });

        Schema::create('equipment', function (Blueprint $table) {
            $table->bigIncrements('equipment_id');
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->unsignedBigInteger('category_id')->nullable();
            $table->integer('stock_quantity')->default(0);
            $table->unsignedBigInteger('storage_location_id')->nullable();
            $table->enum('status', ['active', 'archived'])->default('active');
            $table->timestamps();

            $table->foreign('category_id')->references('category_id')->on('equipment_category')->nullOnDelete()->cascadeOnUpdate();
            $table->foreign('storage_location_id')->references('storage_location_id')->on('storage_location')->nullOnDelete()->cascadeOnUpdate();
        });

        Schema::create('supplier_request', function (Blueprint $table) {
            $table->bigIncrements('supplier_request_id');
            $table->string('name', 100);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamps();
        });

        Schema::create('equipment_schedule', function (Blueprint $table) {
            $table->bigIncrements('schedule_id');
            $table->unsignedBigInteger('equipment_id');
            $table->unsignedBigInteger('project_id');
            $table->date('scheduled_date');
            $table->time('scheduled_time');
            $table->boolean('approved')->default(false);
            $table->timestamps();

            $table->foreign('equipment_id')->references('equipment_id')->on('equipment')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreign('project_id')->references('project_id')->on('tour_project')->cascadeOnUpdate()->restrictOnDelete();
        });

        Schema::create('delivery', function (Blueprint $table) {
            $table->bigIncrements('delivery_id');
            $table->unsignedBigInteger('schedule_id');
            $table->unsignedBigInteger('vehicle_id');
            $table->string('driver_name', 100)->nullable();
            $table->string('license_number', 50)->nullable();
            $table->string('contact_info', 100)->nullable();
            $table->enum('status', ['pending', 'in_transit', 'delivered'])->default('pending');
            $table->timestamp('delivered_at')->nullable();
            $table->text('issues_notes')->nullable();
            $table->timestamps();

            $table->foreign('schedule_id')->references('schedule_id')->on('equipment_schedule')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreign('vehicle_id')->references('id')->on('alms_vehicles')->cascadeOnUpdate()->restrictOnDelete();
        });

        Schema::create('delivery_receipt', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('delivery_id');
            $table->string('document_path', 255);
            $table->string('reference_code', 100)->unique();
            $table->unsignedBigInteger('tour_project_id');
            $table->timestamp('uploaded_at')->nullable();
            $table->timestamps();

            $table->foreign('delivery_id')->references('delivery_id')->on('delivery')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreign('tour_project_id')->references('project_id')->on('tour_project')->cascadeOnUpdate()->restrictOnDelete();
        });

        Schema::create('asset', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('equipment_id');
            $table->string('asset_code')->unique();
            $table->uuid('qr_token')->unique();
            $table->unsignedBigInteger('assigned_project_id')->nullable();
            $table->string('description', 255)->nullable();
            $table->timestamps();

            $table->foreign('equipment_id')->references('equipment_id')->on('equipment')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreign('assigned_project_id')->references('project_id')->on('tour_project')->nullOnDelete()->cascadeOnUpdate();
        });

        Schema::create('asset_usage', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('asset_id');
            $table->decimal('usage_hours', 10, 2);
            $table->decimal('mileage', 10, 2)->default(0);
            $table->date('usage_date');
            $table->timestamps();

            $table->foreign('asset_id')->references('id')->on('asset')->cascadeOnUpdate()->restrictOnDelete();
        });

        Schema::create('maintenance_alert', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('asset_id');
            $table->string('alert_type', 50);
            $table->text('alert_message');
            $table->string('status', 20)->default('pending');
            $table->timestamps();

            $table->foreign('asset_id')->references('id')->on('asset')->cascadeOnUpdate()->restrictOnDelete();
        });

        Schema::create('maintenance', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('asset_id');
            $table->enum('maintenance_type', ['repair', 'replacement', 'checkup']);
            $table->date('maintenance_date');
            $table->decimal('cost', 10, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('asset_id')->references('id')->on('asset')->cascadeOnUpdate()->restrictOnDelete();
        });

        Schema::create('purchase_request', function (Blueprint $table) {
            $table->bigIncrements('request_id');
             $table->string('item_name', 100);
            $table->text('description')->nullable();
            $table->integer('quantity');
            $table->decimal('price', 10, 2)->nullable();
            $table->decimal('total_price', 10, 2)->nullable();
            $table->string('supplier_name', 100)->nullable();
            $table->string('requested_by', 100)->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'ordered'])->default('pending');
            $table->string('supplier_email', 150)->nullable();
            $table->string('supplier_phone', 64)->nullable();
            $table->string('supplier_address', 255)->nullable();
            $table->string('supplier_website', 255)->nullable();
            $table->timestamp('delivery_date')->nullable();
            $table->timestamps();
        });

        Schema::create('purchase_order', function (Blueprint $table) {
            $table->bigIncrements('order_id');
            $table->unsignedBigInteger('request_id');
            $table->unsignedBigInteger('supplier_id');
            $table->decimal('total_amount', 10, 2);
            $table->enum('status', ['issued', 'completed', 'cancelled'])->default('issued');
            $table->date('order_date');
            $table->timestamps();

            $table->foreign('request_id')->references('request_id')->on('purchase_request')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreign('supplier_id')->references('supplier_id')->on('supplier')->cascadeOnUpdate()->restrictOnDelete();
        });

        Schema::create('expense_record', function (Blueprint $table) {
            $table->bigIncrements('expense_id');
            $table->unsignedBigInteger('order_id');
            $table->decimal('amount', 10, 2);
            $table->enum('payment_status', ['unpaid', 'paid', 'partial'])->default('unpaid');
            $table->timestamps();

            $table->foreign('order_id')->references('order_id')->on('purchase_order')->cascadeOnUpdate()->restrictOnDelete();
        });



        Schema::create('order_items', function (Blueprint $table) {
            $table->bigIncrements('order_item_id');
            $table->unsignedBigInteger('request_id');
            $table->string('item_name', 100);
            $table->integer('quantity');
            $table->decimal('price_per_unit', 12, 2);
            $table->decimal('total_price', 12, 2);
            $table->string('supplier_email')->nullable();
            $table->string('supplier_phone')->nullable();
            $table->string('supplier_address')->nullable();
            $table->string('supplier_website')->nullable();
            $table->timestamp('delivery_date')->nullable();
            $table->enum('status', ['received', 'reported', 'ongoing', 'cancel'])->default('ongoing');
            $table->timestamps();

            $table->foreign('request_id')->references('request_id')->on('purchase_request')->cascadeOnUpdate()->restrictOnDelete();
        });

        Schema::create('logistics_report', function (Blueprint $table) {
            $table->bigIncrements('report_id');
            $table->enum('report_type', ['monthly', 'weekly', 'daily', 'fleet']);
            $table->string('report_date', 7)->nullable(); // e.g. 'YYYY-MM'
            $table->string('file_path', 255)->nullable();
            $table->enum('archived', ['yes', 'no'])->default('no');
            $table->timestamps();
        });

        Schema::create('equipment_log', function (Blueprint $table) {
            $table->bigIncrements('log_id');
            $table->unsignedBigInteger('equipment_id');
            $table->unsignedBigInteger('project_id');
            $table->enum('action', ['borrowed', 'returned', 'lost', 'damaged']);
            $table->timestamp('action_date');
            $table->text('remarks')->nullable();
            $table->timestamps(); 

            $table->foreign('equipment_id')->references('equipment_id')->on('equipment')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreign('project_id')->references('project_id')->on('tour_project')->cascadeOnUpdate()->restrictOnDelete();
        });

        Schema::create('lowstock_request', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('item_name', 100);
            $table->integer('quantity');
            $table->string('requested_by', 100)->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'submitted'])->default('pending');
            $table->timestamps();
        });

        Schema::create('equipment_issues', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('equipment_id');
            $table->string('item_name', 150)->nullable();
            $table->text('description')->nullable();
            $table->string('reported_by', 120)->nullable();
            $table->enum('status', ['open', 'in_progress', 'resolved'])->default('open');
            $table->timestamps();
        });

        Schema::create('order_reports', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('order_item_id');
            $table->string('item_name', 100);
            $table->integer('quantity');
            $table->decimal('price_per_unit', 12, 2);
            $table->decimal('total_price', 12, 2);
            $table->string('supplier_website', 255)->nullable();
            $table->string('supplier_address', 255)->nullable();
            $table->string('supplier_phone', 64)->nullable();
            $table->timestamp('delivery_date')->nullable();
            $table->string('supplier_email', 150)->nullable();
            $table->string('status', 50)->default('pending');
            $table->text('report_description')->nullable();
            $table->text('proof_report')->nullable(); // Changed to text to store JSON array of file paths
            $table->string('reported_by', 100)->nullable();
            $table->timestamps();

            $table->foreign('order_item_id')->references('order_item_id')->on('order_items')->cascadeOnUpdate()->restrictOnDelete();
        });

        Schema::create('received_orders', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('order_item_id');
            $table->string('item_name', 100);
            $table->integer('quantity');
            $table->decimal('price_per_unit', 12, 2);
            $table->decimal('total_price', 12, 2);
            $table->string('supplier_website', 255)->nullable();
            $table->string('supplier_address', 255)->nullable();
            $table->string('supplier_phone', 64)->nullable();
            $table->timestamp('delivery_date')->nullable();
            $table->string('supplier_email', 150)->nullable();
            $table->string('status', 50)->default('received');
            $table->string('received_by', 100)->nullable();
            $table->timestamps();

            $table->foreign('order_item_id')->references('order_item_id')->on('order_items')->cascadeOnUpdate()->restrictOnDelete();
        });



        // Insert sample data:
        // Seed core2_suppliers first 
        DB::table('core2_suppliers')->insert([
            [
                'supplier_name' => 'Global Supplies Inc.',
                'item_name' => 'Professional Microphone', 
                'price' => 2500.00,
                'email' => 'hello@globalsupplies.com',
                'phone' => '+63-2-8000-0000',
                'address' => '789 Pasay Road, Manila',
                'website' => 'https://globalsupplies.com',
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'supplier_name' => 'StageGear PH',
                'item_name' => 'LED Stage Light',
                'price' => 1800.00,
                'email' => 'contact@stagegear.ph',
                'phone' => '+63-917-888-1212',
                'address' => '101 Quezon Ave, QC',
                'website' => 'https://stagegear.ph',
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Seed suppliers with reference to core2_suppliers
        $core2Suppliers = DB::table('core2_suppliers')->select('id', 'supplier_name', 'item_name', 'price', 'email', 'phone', 'address', 'website')->get();
        foreach ($core2Suppliers as $core2) {
            DB::table('supplier')->insert([
                'core2_supplier_id' => $core2->id,
                'supplier_name' => $core2->supplier_name,
                'item_name' => $core2->item_name,
                'price' => $core2->price,
                'email' => $core2->email,
                'phone' => $core2->phone,
                'address' => $core2->address,
                'website' => $core2->website,
                'comments' => 'This supplier has been reliable and provides good service.',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // ----------------------
        // Additional sample data (Philippines)
        // ----------------------

        // Equipment categories
        $catAudio = DB::table('equipment_category')->insertGetId(['category_name' => 'Audio & Sound', 'created_at' => now(), 'updated_at' => now()]);
        $catLighting = DB::table('equipment_category')->insertGetId(['category_name' => 'Lighting & Staging', 'created_at' => now(), 'updated_at' => now()]);
        $catCamera = DB::table('equipment_category')->insertGetId(['category_name' => 'Camera & Accessories', 'created_at' => now(), 'updated_at' => now()]);

        // Storage locations
        $locManila = DB::table('storage_location')->insertGetId(['location_name' => 'Main Warehouse - Manila', 'description' => 'Central warehouse located in Pasay, Metro Manila', 'created_at' => now(), 'updated_at' => now()]);
        $locCebu = DB::table('storage_location')->insertGetId(['location_name' => 'Branch Warehouse - Cebu', 'description' => 'Regional warehouse in Cebu City', 'created_at' => now(), 'updated_at' => now()]);
        $locDavao = DB::table('storage_location')->insertGetId(['location_name' => 'Branch Warehouse - Davao', 'description' => 'Regional warehouse in Davao City', 'created_at' => now(), 'updated_at' => now()]);

        // Tour projects
        $projConcert = DB::table('tour_project')->insertGetId(['name' => 'Island Tour 2025 - Manila Leg', 'description' => 'Major concert tour Manila show', 'created_at' => now(), 'updated_at' => now()]);
        $projCorporate = DB::table('tour_project')->insertGetId(['name' => 'Corporate Event - Cebu', 'description' => 'Corporate event logistics in Cebu', 'created_at' => now(), 'updated_at' => now()]);

        // Vehicles (ALMS)
        $veh1 = DB::table('alms_vehicles')->insertGetId(['plate_number' => 'TST-1234', 'make' => 'Toyota', 'model' => 'HiAce', 'created_at' => now(), 'updated_at' => now()]);
        $veh2 = DB::table('alms_vehicles')->insertGetId(['plate_number' => 'CBO-5678', 'make' => 'Mitsubishi', 'model' => 'L300', 'created_at' => now(), 'updated_at' => now()]);

        // Equipment (sample items)
        $eq1 = DB::table('equipment')->insertGetId([
            'name' => 'Shure SM58 Microphone',
            'description' => 'Dynamic vocal microphone',
            'category_id' => $catAudio,
            'stock_quantity' => 12,
            'storage_location_id' => $locManila,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $eq2 = DB::table('equipment')->insertGetId([
            'name' => 'Yamaha 12-channel Mixer',
            'description' => 'Compact mixing console',
            'category_id' => $catAudio,
            'stock_quantity' => 4,
            'storage_location_id' => $locManila,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $eq3 = DB::table('equipment')->insertGetId([
            'name' => 'LED Par Can (RGB)',
            'description' => 'Stage lighting LED par can',
            'category_id' => $catLighting,
            'stock_quantity' => 60,
            'storage_location_id' => $locCebu,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $eq4 = DB::table('equipment')->insertGetId([
            'name' => 'Canon EOS R5 (Camera Body)',
            'description' => 'High-end mirrorless camera for event coverage',
            'category_id' => $catCamera,
            'stock_quantity' => 2,
            'storage_location_id' => $locDavao,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Supplier request
        $supReq = DB::table('supplier_request')->insertGetId(['name' => 'New Supplier Inquiry - Manila', 'status' => 'pending', 'created_at' => now(), 'updated_at' => now()]);

        // Equipment schedule
        $schedule1 = DB::table('equipment_schedule')->insertGetId([
            'equipment_id' => $eq2,
            'project_id' => $projConcert,
            'scheduled_date' => date('Y-m-d', strtotime('+7 days')),
            'scheduled_time' => '18:00:00',
            'approved' => false,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Delivery referencing schedule and vehicle
        $delivery1 = DB::table('delivery')->insertGetId([
            'schedule_id' => $schedule1,
            'vehicle_id' => $veh1,
            'driver_name' => 'Jun dela Cruz',
            'license_number' => 'DL-998877',
            'contact_info' => '+63-917-111-2222',
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Delivery receipt
        $drId = DB::table('delivery_receipt')->insertGetId([
            'delivery_id' => $delivery1,
            'document_path' => '/receipts/manila_delivery_001.pdf',
            'reference_code' => 'DR-MNL-0001',
            'tour_project_id' => $projConcert,
            'uploaded_at' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Asset registration
        $asset1 = DB::table('asset')->insertGetId([
            'equipment_id' => $eq4,
            'asset_code' => 'A-CAM-0001',
            'qr_token' => (string) Str::uuid(),
            'assigned_project_id' => $projConcert,
            'description' => 'Primary camera for concert photography',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Asset usage
        DB::table('asset_usage')->insert([
            'asset_id' => $asset1,
            'usage_hours' => 5.5,
            'mileage' => 0,
            'usage_date' => date('Y-m-d'),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Maintenance alert & record
        $maId = DB::table('maintenance_alert')->insertGetId([
            'asset_id' => $asset1,
            'alert_type' => 'repair',
            'alert_message' => 'Camera shutter requires calibration',
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('maintenance')->insert([
            'asset_id' => $asset1,
            'maintenance_type' => 'repair',
            'maintenance_date' => date('Y-m-d', strtotime('+3 days')),
            'cost' => 2500.00,
            'notes' => 'Send to authorized Canon service center in Metro Manila',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Purchase request and order
        $prId = DB::table('purchase_request')->insertGetId([
            'item_name' => 'Stage LED Strip',
            'quantity' => 10,
            'price' => 1200.00,
            'total_price' => 12000.00,
            'supplier_name' => 'StageGear PH',
            'requested_by' => 'Logistics Team',
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Sample purchase order
        $supplierId = DB::table('supplier')->where('supplier_name', 'StageGear PH')->first()->supplier_id;
        $poId = DB::table('purchase_order')->insertGetId([
            'request_id' => $prId,
            'supplier_id' => $supplierId,
            'total_amount' => 12000.00,
            'status' => 'issued',
            'order_date' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Sample expense record
        DB::table('expense_record')->insert([
            'order_id' => $poId,
            'amount' => 12000.00,
            'payment_status' => 'unpaid',
            'created_at' => now(),
            'updated_at' => now()
        ]);



        // Logistics report sample
        DB::table('logistics_report')->insert([
            'report_type' => 'monthly',
            'report_date' => date('Y-m'),
            'file_path' => '/reports/monthly/manila_report_' . date('Y_m') . '.pdf',
            'archived' => 'no',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Equipment log
        DB::table('equipment_log')->insert([
            'equipment_id' => $eq1,
            'project_id' => $projConcert,
            'action' => 'borrowed',
            'action_date' => date('Y-m-d'),
            'remarks' => 'Borrowed for soundcheck',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Low stock request sample
        DB::table('lowstock_request')->insert([
            'item_name' => 'Yamaha Mixer',
            'quantity' => 2,
            'requested_by' => 'Venue Tech',
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Equipment issues sample
        DB::table('equipment_issues')->insert([
            [
                'equipment_id' => '4',
                'item_name' => 'Canon EOS R5 (Camera Body)',
                'description' => 'Reported broken during transit — shutter error observed.',
                'reported_by' => 'Warehouse Manila',
                'status' => 'open',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'equipment_id' => '3',
                'item_name' => 'LED Par Can (RGB)',
                'description' => 'Lens cracked and led flickering intermittently.',
                'reported_by' => 'Cebu Branch',
                'status' => 'open',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'equipment_id' => '2',
                'item_name' => 'Yamaha 12-channel Mixer',
                'description' => 'Power supply fault, unit will not power on.',
                'reported_by' => 'Davao Branch',
                'status' => 'open',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'equipment_id' => '1',
                'item_name' => 'Shure SM58 Microphone',
                'description' => 'Intermittent dropouts on channel; likely cable or connector issue.',
                'reported_by' => 'Manila Sound Crew',
                'status' => 'open',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cancel_orders');
        Schema::dropIfExists('received_orders');
        Schema::dropIfExists('order_reports');
        Schema::dropIfExists('equipment_issues');
        Schema::dropIfExists('lowstock_request');
        Schema::dropIfExists('equipment_log');
        Schema::dropIfExists('logistics_report');
        Schema::dropIfExists('expense_record');
        Schema::dropIfExists('purchase_order');
        Schema::dropIfExists('purchase_request');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('maintenance');
        Schema::dropIfExists('maintenance_alert');
        Schema::dropIfExists('asset_usage');
        Schema::dropIfExists('asset');
        Schema::dropIfExists('delivery_receipt');
        Schema::dropIfExists('delivery');
        Schema::dropIfExists('equipment_schedule');
        Schema::dropIfExists('equipment');
        Schema::dropIfExists('supplier');
        Schema::dropIfExists('core2_suppliers');
        Schema::dropIfExists('alms_vehicles');
        Schema::dropIfExists('supplier_request');
        Schema::dropIfExists('tour_project');
        Schema::dropIfExists('storage_location');
        Schema::dropIfExists('equipment_category');
    }
};