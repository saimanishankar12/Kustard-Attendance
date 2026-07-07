<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\GoogleSheetService;
use App\Models\Attendance;
use App\Models\Employees;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    protected GoogleSheetService $sheetService;

    public function __construct(GoogleSheetService $sheetService)
    {
        $this->sheetService = $sheetService;
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'emp_id'   => 'required|string',
            'type'     => 'required|in:IN,OUT',
            'location' => 'required|string'
        ]);

        $today = Carbon::today()->toDateString();
        $empId = $data['emp_id'];

        // ✅ DB try-catch: handles connection drops like the PDOException this morning
        try {
            $employee = Employees::where('emp_id', $empId)->first();
        } catch (\Throwable $e) {
            Log::error('DB connection failed in store()', [
                'emp_id' => $empId,
                'error'  => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Server error, please try again.'
            ], 500);
        }

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found'
            ], 404);
        }

        /*
        ===================================================
        CHECK-IN
        ===================================================
        */
        if ($data['type'] === 'IN') {

            try {
                $exists = Attendance::where('emp_id', $empId)
                    ->where('attendance_date', $today)
                    ->exists();
            } catch (\Throwable $e) {
                Log::error('DB connection failed checking existing attendance', [
                    'emp_id' => $empId,
                    'error'  => $e->getMessage(),
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Server error, please try again.'
                ], 500);
            }

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Already checked in today'
                ], 409);
            }

            try {
                $attendance = Attendance::create([
                    'emp_id'             => $empId,
                    'emp_name'           => $employee->name,
                    'in_time'            => now()->format('H:i:s'),
                    'out_time'           => null,
                    'check_in_location'  => $data['location'] ?? null,
                    'attendance_date'    => $today,
                ]);
            } catch (\Throwable $e) {
                Log::error('DB connection failed creating attendance record', [
                    'emp_id' => $empId,
                    'error'  => $e->getMessage(),
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Server error, please try again.'
                ], 500);
            }

            try {
                $rowNumber = $this->sheetService->append([
                    $attendance->emp_id,
                    $attendance->emp_name,
                    Carbon::parse($attendance->in_time)->format('h:i A'),
                    $attendance->check_in_location ?? '',
                    '',
                    '',
                    Carbon::parse($attendance->attendance_date)->format('d-m-Y')
                ]);

                Log::info('Sheet row number returned: ' . $rowNumber);
                $attendance->update(['sheet_row' => $rowNumber]);

            } catch (\Throwable $e) {
                Log::error('Google Sheet Error (Check-IN)', [
                    'emp_id'  => $empId,
                    'message' => $e->getMessage(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Check-IN recorded successfully!'
            ]);
        }

        /*
        ===================================================
        CHECK-OUT
        ===================================================
        */

        try {
            $record = Attendance::where('emp_id', $empId)
                ->where('attendance_date', $today)
                ->whereNull('out_time')
                ->first();
        } catch (\Throwable $e) {
            Log::error('DB connection failed fetching check-out record', [
                'emp_id' => $empId,
                'error'  => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Server error, please try again.'
            ], 500);
        }

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'No check-in found for today'
            ], 404);
        }

        try {
            $record->update([
                'out_time'           => now()->format('H:i:s'),
                'check_out_location' => $data['location'] ?? null,
            ]);
        } catch (\Throwable $e) {
            Log::error('DB connection failed updating check-out', [
                'emp_id' => $empId,
                'error'  => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Server error, please try again.'
            ], 500);
        }

        $remainingData = $this->calculateRemainingTime($record->in_time);
        $message = "Check-OUT recorded successfully!";

        if ($remainingData['worked_seconds'] < $remainingData['required_seconds']) {
            $message = $remainingData['message'];
        }

        $record->refresh();

        try {
            if ($record->sheet_row) {
                $this->sheetService->update(
                    "E{$record->sheet_row}",
                    Carbon::parse($record->out_time)->format('h:i A')
                );

                $this->sheetService->update(
                    "F{$record->sheet_row}",
                    $record->check_out_location ?? ''
                );
            }
        } catch (\Throwable $e) {
            Log::error('Google Sheet Error (Check-OUT)', [
                'emp_id'  => $empId,
                'message' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => $message
        ]);
    }


    public function todayAttendance()
    {
        // ✅ DB try-catch: prevents crash if DB drops during dashboard load
        try {
            $today = Carbon::today()->toDateString();
            return Attendance::where('attendance_date', $today)
                ->select('emp_id', 'in_time', 'out_time', 'check_in_location', 'check_out_location')
                ->get();
        } catch (\Throwable $e) {
            Log::error('DB failed in todayAttendance()', [
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Server error, please try again.'
            ], 500);
        }
    }

    public function resetSheet()
    {
        $this->sheetService->clearSheet();
        Attendance::query()->update(['sheet_row' => null]);

        return response()->json([
            'success' => true,
            'message' => 'Sheet cleared and DB reset!'
        ]);
    }

    public function checkStatus($empId)
    {
        $today = Carbon::today()->toDateString();

        try {
            $record = Attendance::where('emp_id', $empId)
                ->where('attendance_date', $today)
                ->whereNull('out_time')
                ->first();
        } catch (\Throwable $e) {
            Log::error('DB failed in checkStatus()', [
                'emp_id' => $empId,
                'error'  => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Server error, please try again.'
            ], 500);
        }

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'No active check-in found for today'
            ], 404);
        }

        $remainingData = $this->calculateRemainingTime($record->in_time);

        return response()->json([
            'success'            => true,
            'message'            => $remainingData['message'],
            'worked_seconds'     => $remainingData['worked_seconds'],
            'remaining_seconds'  => max(0, $remainingData['required_seconds'] - $remainingData['worked_seconds'])
        ]);
    }

    private function calculateRemainingTime($inTime)
    {
        $checkInTime = Carbon::parse($inTime);
        $now = Carbon::now();

        $workedSeconds   = $checkInTime->diffInSeconds($now);
        $requiredSeconds = 9 * 60 * 60;
        $remainingSeconds = $requiredSeconds - $workedSeconds;

        $message = "😃 You have completed your working hours. You can check out now!";
        if ($remainingSeconds > 59) {
            $hours   = floor($remainingSeconds / 3600);
            $minutes = floor(($remainingSeconds % 3600) / 60);
            $message = "😐 You still have {$hours} hrs {$minutes} mins remaining. Please complete your working hours before checkout.";
        }

        return [
            'worked_seconds'   => $workedSeconds,
            'required_seconds' => $requiredSeconds,
            'message'          => $message
        ];
    }
}