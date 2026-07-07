<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    protected $table='attendance_data';
 protected $fillable = [
    'emp_id',
    'emp_name',
    'in_time',
    'out_time',
    'check_in_location',   // ← is this here?
    'check_out_location',  // ← and this?
    'attendance_date',
    'sheet_row',
];
 



}
