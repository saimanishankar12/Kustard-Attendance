<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employees extends Model
{
    protected $table = 'employees';

    protected $fillable = [
        'emp_id',
        'name',
        'email'
    ];

    public $timestamps = false;
}