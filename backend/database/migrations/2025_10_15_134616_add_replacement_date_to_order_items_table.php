<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up()
{
    Schema::table('order_items', function (Blueprint $table) {
        $table->timestamp('replacement_date')->nullable();
        $table->string('replaced_by', 100)->nullable(); // optional, but good to have
    });
}

public function down()
{
    Schema::table('order_items', function (Blueprint $table) {
        $table->dropColumn(['replacement_date', 'replaced_by']);
    });
}
};
