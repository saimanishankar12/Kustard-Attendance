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
        Schema::table('attendance_data', function (Blueprint $table) {
              // Rename existing location column
            $table->renameColumn('location', 'check_in_location');

            // Add checkout location after out_time
            $table->text('check_out_location')
                  ->nullable()
                  ->after('out_time');
       
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_data', function (Blueprint $table) {
            //
        });
    }
};
