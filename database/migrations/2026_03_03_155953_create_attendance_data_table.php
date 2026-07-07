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
        Schema::create('attendance_data', function (Blueprint $table) {
            $table->id();
              $table->string('emp_id'); 
             $table->string('emp_name'); 
            $table->time('in_time')->nullable();
            $table->time('out_time')->nullable();
            $table->string('location')->nullable();
            $table->date('attendance_date');
            $table->timestamps();
            $table->unique(['emp_id', 'attendance_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_data');
    }
};
