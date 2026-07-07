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

            $table->text('check_in_location')
                  ->nullable()
                  ->after('in_time')
                  ->change();

            $table->text('check_out_location')
                  ->nullable()
                  ->after('out_time')
                  ->change();
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
