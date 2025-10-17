<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('received_orders', function (Blueprint $table) {
            $table->boolean('report_issue')->default(false)->after('received_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('received_orders', function (Blueprint $table) {
            $table->dropColumn('report_issue');
        });
    }
};
