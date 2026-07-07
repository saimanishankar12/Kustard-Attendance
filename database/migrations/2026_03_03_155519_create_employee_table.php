<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB; // Essential for DB::table to work

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create the table structure
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('emp_id')->unique();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamps();
        });

        // 2. Insert the data directly
        $employees = [
            ['emp_id' => 'K002', 'name' => 'Madhu Kiran G', 'email' => 'ceo@kustard.in'],
            ['emp_id' => 'K004', 'name' => 'Peddi Anisha', 'email' => 'hr@kustard.in'],
            ['emp_id' => 'K007', 'name' => 'Surada Raju', 'email' => 'raju.surada@kustard.in'],
            ['emp_id' => 'K008', 'name' => 'Saimanishankar Nalam', 'email' => 'saimanishankar.nalam@kustard.in'],
            ['emp_id' => 'K010', 'name' => 'Kulla Lakshmi Ratna sree', 'email' => 'lakshmiratnasree.kulla@kustard.in'],
            ['emp_id' => 'K011', 'name' => 'Gurram Naveen kumar', 'email' => 'naveen.gurram@kustard.in'],
            ['emp_id' => 'K012', 'name' => 'Polepaka Kiran Kumar', 'email' => 'kirankumar.polepaka@kustard.in'],
            ['emp_id' => 'K013', 'name' => 'Sirasala Lalith Venkat', 'email' => 'lalithvenkat.sirasala@kustard.in'],
            ['emp_id' => 'K014', 'name' => 'Gummuluru Raviteja', 'email' => 'raviteja.gummuluru@kustard.in'],
            ['emp_id' => 'K015', 'name' => 'Vemula Rakesh', 'email' => 'rakesh.vemula@kustard.in'],
            ['emp_id' => 'K016', 'name' => 'Ramu', 'email' => 'lovelyramrmr@gmail.com'],
            ['emp_id' => 'K017', 'name' => 'Benjamin Emanuel', 'email' => 'benjamin.emanuel@kustard.in'],
            ['emp_id' => 'K018', 'name' => 'Kuntla Abhinay Kumar', 'email' => 'abhinay.kuntla@kustard.in'],
            ['emp_id' => 'K021', 'name' => 'Durga Mohan Prasad . YAKA', 'email' => 'durgamohan.yaka@kustard.in'],
            ['emp_id' => 'K023', 'name' => 'Pratyush Kumar Chaturvedi', 'email' => 'pratyushkumar.chaturvedi@kustard.in'],
            ['emp_id' => 'K025', 'name' => 'Adurthi Jyothi Bhavani', 'email' => 'jyothi.adurthi@kustard.in'],
            ['emp_id' => 'K027', 'name' => 'Kesavan', 'email' => 'kesav@kustard.in'],
            ['emp_id' => 'K028', 'name' => 'Nitin Shriram Chavan', 'email' => 'nitinshriram.chavan@kustard.in'],
            ['emp_id' => 'K029', 'name' => 'Aleti sriharshini', 'email' => 'sriharshini.aleti@kustard.in'],
            ['emp_id' => 'K030', 'name' => 'Pedamallu Meghana Lakshmi Prasanna', 'email' => 'meghanalakshmi.pedamallu@kustard.in'],
            ['emp_id' => 'K031', 'name' => 'Dheekonda Ramya', 'email' => 'ramya.dheekonda@kustard.in'],
            ['emp_id' => 'K032', 'name' => 'Kondepudi Sai Nihar', 'email' => 'nihar.kondepudi@kustard.in'],
            ['emp_id' => 'K033', 'name' => 'Ganti Srikari Srija', 'email' => 'srikarisrija.g@kustard.in'],
        ];

        DB::table('employees')->insert($employees);
    } // Closed the up() function here

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};