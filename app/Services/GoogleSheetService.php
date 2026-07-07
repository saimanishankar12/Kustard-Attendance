<?php

namespace App\Services;

use Google\Client;
use Google\Service\Sheets;
use Google\Service\Sheets\ValueRange;
use Illuminate\Support\Facades\Log;

class GoogleSheetService
{
    protected Sheets $service;
    protected Client $client;
    protected string $spreadsheetId;
    protected string $sheetName = 'kustard'; // MUST match tab name exactly

    public function __construct()
    {
        $this->client = new Client();
        $this->client->setApplicationName('Laravel Google Sheets');
        $this->client->setScopes([Sheets::SPREADSHEETS]);
        $this->client->setAuthConfig(base_path('storage/app/kustard.json'));
        $this->client->setAccessType('offline');

        // FIX 1: Token caching + explicit fetch
        $tokenPath = storage_path('app/google_token_cache.json');

        if (file_exists($tokenPath)) {
            $this->client->setAccessToken(json_decode(file_get_contents($tokenPath), true));
        }

        if ($this->client->isAccessTokenExpired()) {
            $this->client->fetchAccessTokenWithAssertion();
            file_put_contents($tokenPath, json_encode($this->client->getAccessToken()));
        }

        $this->service = new Sheets($this->client);

        $this->spreadsheetId = config('services.google.sheet_id');

        Log::info('GoogleSheetService initialized', [
            'spreadsheet_id' => $this->spreadsheetId,
            'sheet_name' => $this->sheetName,
        ]);

        if (empty($this->spreadsheetId)) {
            throw new \Exception('GOOGLE_SHEET_ID is not configured properly');
        }
    }

    public function append(array $row): ?int
    {
        $attempts = 3;
        $delay = 1000;

        for ($i = 0; $i < $attempts; $i++) {
            try {
                $range = $this->sheetName . '!A:G';

                Log::info('Attempting to append to Google Sheet', [
                    'spreadsheet_id' => $this->spreadsheetId,
                    'range' => $range,
                    'row' => $row,
                    'attempt' => $i + 1,
                ]);

                $body = new ValueRange([
                    'values' => [$row],
                ]);

                $params = [
                    'valueInputOption' => 'USER_ENTERED',
                ];

                $response = $this->service->spreadsheets_values->append(
                    $this->spreadsheetId,
                    $range,
                    $body,
                    $params
                );

                $updatedRange = $response->getUpdates()->getUpdatedRange();
                Log::info('Google Sheet append success', [
                    'updatedRange' => $updatedRange,
                ]);

                // Parse row number from e.g. "kustard!A8:G8" → 8
                preg_match('/(\d+)$/', $updatedRange, $matches);
                return isset($matches[1]) ? (int) $matches[1] : null;

            } catch (\Throwable $e) {
                Log::warning('Google Sheet append attempt ' . ($i + 1) . ' failed', [
                    'error' => $e->getMessage(),
                ]);

                if ($i < $attempts - 1) {
                    // FIX 2: Force fresh token before retrying
                    try {
                        $this->client->fetchAccessTokenWithAssertion();
                        $tokenPath = storage_path('app/google_token_cache.json');
                        file_put_contents($tokenPath, json_encode($this->client->getAccessToken()));
                        Log::info('Token refreshed, retrying...');
                    } catch (\Throwable $tokenEx) {
                        Log::error('Token refresh also failed', ['error' => $tokenEx->getMessage()]);
                    }

                    usleep($delay * 1000); // 1s → 2s → 4s
                    $delay *= 2;
                } else {
                    Log::error('Google Sheet append FAILED after ' . $attempts . ' attempts', [
                        'error' => $e->getMessage(),
                        'row' => $row,
                    ]);
                    throw $e;
                }
            }
        }

        return null;
    }

    public function update(string $cell, string $value): void
    {
        try {
            $range = $this->sheetName . '!' . $cell;

            $body = new ValueRange([
                'values' => [[$value]],
            ]);

            $this->service->spreadsheets_values->update(
                $this->spreadsheetId,
                $range,
                $body,
                ['valueInputOption' => 'USER_ENTERED']
            );

            Log::info('Google Sheet update success', ['cell' => $range, 'value' => $value]);

        } catch (\Throwable $e) {
            Log::error('Google Sheet update FAILED', [
                'cell'  => $cell,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function clearSheet(): void
    {
        $this->service->spreadsheets_values->clear(
            $this->spreadsheetId,
            $this->sheetName . '!A2:Z1000',
            new \Google\Service\Sheets\ClearValuesRequest()
        );
    }
}