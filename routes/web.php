<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\AttendanceController;



Route::get('/get-employees', [EmployeeController::class, 'getEmployees']);
Route::get('/', function () {
    return view('welcome');
});
Route::get('/api/today-attendance', [AttendanceController::class, 'todayAttendance']);
Route::post('/api/mark-attendance', [AttendanceController::class, 'store']);
Route::get('/api/check-status/{emp_id}', [AttendanceController::class, 'checkStatus']);
Route::get('/reset-sheet', [AttendanceController::class, 'resetSheet']);

