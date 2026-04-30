<?php

use App\Support\FicheInventoryImportService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command(
    'inventory:import-fiches
    {root : Path to folder containing fiche .docx files}
    {--faculte= : Faculty name (required)}
    {--service= : Force one service name for all files}
    {--bureau= : Force one bureau name for all files}
    {--map= : JSON mapping file path}
    {--dry-run : Parse and preview without writing database}
    {--update-existing : Try to match existing items by designation+bureau when inventory number is missing}',
    function (FicheInventoryImportService $service) {
        $root = (string) $this->argument('root');
        $faculte = trim((string) $this->option('faculte'));
        $serviceName = trim((string) $this->option('service'));
        $bureauName = trim((string) $this->option('bureau'));
        $mapPath = $this->option('map');
        $dryRun = (bool) $this->option('dry-run');
        $updateExisting = (bool) $this->option('update-existing');

        if ($faculte === '') {
            $this->error('Option --faculte is required.');
            return self::FAILURE;
        }

        $mapping = [];
        if (is_string($mapPath) && trim($mapPath) !== '') {
            if (! file_exists($mapPath)) {
                $this->error("Mapping file not found: {$mapPath}");
                return self::FAILURE;
            }

            $decoded = json_decode((string) file_get_contents($mapPath), true);
            if (! is_array($decoded)) {
                $this->error('Mapping file must contain valid JSON object.');
                return self::FAILURE;
            }

            $mapping = $decoded;
        }

        $this->line('Starting inventory fiche import...');
        $this->line("root={$root}");
        $this->line("faculte={$faculte}");
        if ($dryRun) {
            $this->warn('Dry-run enabled: no database writes will happen.');
        }

        try {
            $stats = $service->import($root, [
                'faculte' => $faculte,
                'service' => $serviceName,
                'bureau' => $bureauName,
                'mapping' => $mapping,
                'dry_run' => $dryRun,
                'update_existing' => $updateExisting,
            ], function (string $message): void {
                $this->line($message);
            });
        } catch (\Throwable $e) {
            $this->error($e->getMessage());
            return self::FAILURE;
        }

        $this->newLine();
        $this->info('Import finished.');
        $this->table(['Metric', 'Value'], [
            ['Files parsed', (string) ($stats['files'] ?? 0)],
            ['Rows detected', (string) ($stats['rows'] ?? 0)],
            ['Items created', (string) ($stats['items_created'] ?? 0)],
            ['Items updated', (string) ($stats['items_updated'] ?? 0)],
            ['Files skipped', (string) ($stats['skipped'] ?? 0)],
        ]);

        return self::SUCCESS;
    }
)->purpose('Import inventory items from Word fiche (.docx) files into faculte/service/bureau/items');
