<?php

// namespace App\Http\Controllers;
// use App\Models\Employees;
// use Illuminate\Http\Request;

// class EmployeeController extends Controller
// {
//      public function getEmployees()
//     {
//       $employees = Employees::select('id','emp_id','name','email')->get();

//         return response()->json($employees);
//     }
// }


namespace App\Http\Controllers;

use App\Models\Employees;

class EmployeeController extends Controller
{
    public function getEmployees()
    {
        $employees = Employees::select('emp_id','name','email')->get();

        return response()->json($employees);
    }
}
