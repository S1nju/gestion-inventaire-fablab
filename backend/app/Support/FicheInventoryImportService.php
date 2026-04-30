<?php

namespace App\Support;

use App\Models\Bereau;
use App\Models\Faculte;
use App\Models\Item;
use App\Models\Service;
use DOMDocument;
use DOMXPath;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;
use ZipArchive;

class FicheInventoryImportService
{
    /**
     * @param callable(string):void $log
     */
    public function import(string $rootPath, array $options, callable $log): array
    {
        $faculteName = trim((string) ($options['faculte'] ?? ''));
        if ($faculteName === '') {
            throw new \InvalidArgumentException('Option --faculte is required.');
        }

        $dryRun = (bool) ($options['dry_run'] ?? false);
        $updateExisting = (bool) ($options['update_existing'] ?? false);
        $fixedService = trim((string) ($options['service'] ?? ''));
        $fixedBureau = trim((string) ($options['bureau'] ?? ''));
        $mapping = is_array($options['mapping'] ?? null) ? $options['mapping'] : [];

        $root = realpath($rootPath);
        if ($root === false || ! is_dir($root)) {
            throw new \InvalidArgumentException("Root path not found: {$rootPath}");
        }

        $docxFiles = $this->scanDocxFiles($root);
        if ($docxFiles === []) {
            return [
                'files' => 0,
                'rows' => 0,
                'items_created' => 0,
                'items_updated' => 0,
                'skipped' => 0,
            ];
        }

        $faculte = null;
        if (! $dryRun) {
            $faculte = Faculte::query()->firstOrCreate(['nom' => $faculteName]);
        }

        $stats = [
            'files' => 0,
            'rows' => 0,
            'items_created' => 0,
            'items_updated' => 0,
            'skipped' => 0,
        ];

        foreach ($docxFiles as $filePath) {
            $stats['files']++;
            $relative = ltrim(str_replace($root, '', $filePath), DIRECTORY_SEPARATOR);

            try {
                $parsed = $this->parseDocx($filePath);
            } catch (\Throwable $e) {
                $stats['skipped']++;
                $log("[SKIP] {$relative} ({$e->getMessage()})");
                continue;
            }

            $resolvedService = $this->resolveServiceName($relative, $parsed['service'] ?? null, $fixedService, $mapping);
            $resolvedBureau = $this->resolveBureauName($relative, $parsed['bureau'] ?? null, $fixedBureau, $mapping);

            if ($resolvedService === '' || $resolvedBureau === '') {
                $stats['skipped']++;
                $log("[SKIP] {$relative} (missing service or bureau name)");
                continue;
            }

            $rows = $parsed['rows'] ?? [];
            if (! is_array($rows) || $rows === []) {
                $stats['skipped']++;
                $log("[SKIP] {$relative} (no inventory table rows detected)");
                continue;
            }

            $service = null;
            $bureau = null;
            if (! $dryRun) {
                $service = Service::query()->firstOrCreate(
                    ['nom' => $resolvedService],
                    ['faculte_id' => $faculte?->id]
                );

                if ($service->faculte_id === null && $faculte) {
                    $service->faculte_id = $faculte->id;
                    $service->save();
                }

                $bureau = Bereau::query()->firstOrCreate(
                    ['nom' => $resolvedBureau, 'service_id' => $service->id],
                    ['localisation' => $resolvedBureau]
                );
            }

            foreach ($rows as $row) {
                $designation = trim((string) Arr::get($row, 'designation', ''));
                if ($designation === '' || $this->isHeaderLikeRow($designation)) {
                    continue;
                }

                $stats['rows']++;

                $quantite = $this->toQuantity((string) Arr::get($row, 'quantite', '1'));
                $nInventaire = $this->normalizeSlashToNull((string) Arr::get($row, 'n_inventaire', ''));
                $observation = $this->normalizeSlashToNull((string) Arr::get($row, 'observation', ''));

                if ($dryRun) {
                    continue;
                }

                $item = $this->findOrMakeItem($designation, $nInventaire, $bureau?->id, $updateExisting);
                $wasExisting = $item->exists;

                $item->nom = $designation;
                $item->designation = $designation;
                $item->quantite = $quantite;
                $item->description = $observation;
                $item->bureau_id = $bureau?->id;
                if ($nInventaire !== null) {
                    $item->n_inventaire = $nInventaire;
                }
                $item->save();

                if ($wasExisting) {
                    $stats['items_updated']++;
                } else {
                    $stats['items_created']++;
                }
            }

            $log("[OK] {$relative} => service='{$resolvedService}', bureau='{$resolvedBureau}', rows=" . count($rows));
        }

        return $stats;
    }

    /**
     * @return string[]
     */
    private function scanDocxFiles(string $root): array
    {
        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root));
        $files = [];

        /** @var SplFileInfo $file */
        foreach ($iterator as $file) {
            if (! $file->isFile()) {
                continue;
            }

            $name = $file->getFilename();
            $lower = Str::lower($name);
            if (! Str::endsWith($lower, '.docx')) {
                continue;
            }

            // Skip LibreOffice/lock artifacts.
            if (Str::startsWith($name, '.~lock.') || Str::startsWith($name, '~$')) {
                continue;
            }

            $files[] = $file->getPathname();
        }

        sort($files);

        return $files;
    }

    private function parseDocx(string $filePath): array
    {
        $zip = new ZipArchive();
        if ($zip->open($filePath) !== true) {
            throw new \RuntimeException('unable to open docx');
        }

        $xml = $zip->getFromName('word/document.xml');
        $zip->close();

        if (! is_string($xml) || $xml === '') {
            throw new \RuntimeException('document.xml not found');
        }

        $dom = new DOMDocument();
        $dom->loadXML($xml);
        $xp = new DOMXPath($dom);
        $xp->registerNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main');

        $service = null;
        $bureau = null;

        $paragraphs = $xp->query('//w:p');
        if ($paragraphs !== false) {
            foreach ($paragraphs as $p) {
                $line = $this->normalizeSpaces((string) $xp->evaluate('string(.)', $p));
                if ($line === '') {
                    continue;
                }

                if ($service === null && preg_match('/SERVICE\s*[:：]\s*(.+)$/iu', $line, $m)) {
                    $service = $this->cleanMetadataValue($m[1]);
                }

                if ($bureau === null && preg_match('/BUREAU\s*(?:N[°ºo]|NO|N)\s*[:：]\s*(.+)$/iu', $line, $m)) {
                    $bureau = $this->cleanMetadataValue($m[1]);
                }

                if ($service !== null && $bureau !== null) {
                    break;
                }
            }
        }

        $rows = [];

        $tableRows = $xp->query('//w:tbl//w:tr');
        if ($tableRows !== false) {
            foreach ($tableRows as $tr) {
                $cells = [];
                $tcNodes = $xp->query('./w:tc', $tr);
                if ($tcNodes === false) {
                    continue;
                }

                foreach ($tcNodes as $tc) {
                    $cells[] = $this->normalizeSpaces((string) $xp->evaluate('string(.)', $tc));
                }

                if (count($cells) < 4) {
                    continue;
                }

                $order = $cells[0] ?? '';
                $designation = $cells[1] ?? '';
                $quantite = $cells[2] ?? '1';
                $nInventaire = $cells[3] ?? '';
                $observation = $cells[4] ?? '';

                if ($designation === '') {
                    continue;
                }

                if (! preg_match('/^\d+$/', preg_replace('/\D+/', '', $order) ?? '') && $this->isHeaderLikeRow($designation)) {
                    continue;
                }

                $rows[] = [
                    'designation' => $designation,
                    'quantite' => $quantite,
                    'n_inventaire' => $nInventaire,
                    'observation' => $observation,
                ];
            }
        }

        return [
            'service' => $service,
            'bureau' => $bureau,
            'rows' => $rows,
        ];
    }

    private function normalizeSpaces(string $value): string
    {
        $value = str_replace(["\n", "\r", "\t", "\xC2\xA0"], ' ', $value);
        return trim((string) preg_replace('/\s+/u', ' ', $value));
    }

    private function normalizeSlashToNull(string $value): ?string
    {
        $clean = trim($value);
        if ($clean === '' || $clean === '/' || $clean === '-') {
            return null;
        }

        return $clean;
    }

    private function cleanMetadataValue(string $value): string
    {
        $clean = $this->normalizeSpaces($value);
        $clean = preg_replace("/\\b(?:institut|fiche d['’]inventaire|n[°ºo]|d['’]ordre)\\b.*$/iu", '', $clean) ?? $clean;
        $clean = preg_replace('/\bservice\s+des\s+moyens\s+g[ée]n[ée]raux\b/iu', '', $clean) ?? $clean;
        $clean = trim((string) preg_replace('/\s{2,}/u', ' ', $clean));
        return trim($clean, " -:;,.\t\n\r\0\x0B");
    }

    private function toQuantity(string $value): int
    {
        if (preg_match('/\d+/', $value, $m)) {
            return max(1, (int) $m[0]);
        }

        return 1;
    }

    private function isHeaderLikeRow(string $designation): bool
    {
        $d = Str::lower($designation);
        return Str::contains($d, ['designation', 'désignation', 'n°', 'n inventaire', 'observation']);
    }

    private function resolveServiceName(string $relativePath, ?string $parsedService, string $fixedService, array $mapping): string
    {
        if ($fixedService !== '') {
            return $this->sanitizeEntityName($fixedService, 'service');
        }

        $fromMap = $this->resolveMappedValue($relativePath, $mapping, 'service');
        if ($fromMap !== null && $fromMap !== '') {
            return $this->sanitizeEntityName($fromMap, 'service');
        }

        if ($parsedService !== null && trim($parsedService) !== '') {
            $candidate = $this->sanitizeEntityName($parsedService, 'service');
            if ($candidate !== '') {
                return $candidate;
            }
        }

        return $this->sanitizeEntityName($this->folderFromPath($relativePath), 'service');
    }

    private function resolveBureauName(string $relativePath, ?string $parsedBureau, string $fixedBureau, array $mapping): string
    {
        if ($fixedBureau !== '') {
            return $this->sanitizeEntityName($fixedBureau, 'bureau');
        }

        $fromMap = $this->resolveMappedValue($relativePath, $mapping, 'bureau');
        if ($fromMap !== null && $fromMap !== '') {
            return $this->sanitizeEntityName($fromMap, 'bureau');
        }

        if ($parsedBureau !== null && trim($parsedBureau) !== '') {
            $candidate = $this->sanitizeEntityName($parsedBureau, 'bureau');
            if ($candidate !== '') {
                return $candidate;
            }
        }

        return $this->sanitizeEntityName(pathinfo($relativePath, PATHINFO_FILENAME), 'bureau');
    }

    private function sanitizeEntityName(string $value, string $type): string
    {
        $clean = $this->normalizeSpaces($value);

        // Remove common fiche prefixes that pollute names.
        $clean = preg_replace('/^\s*(?:f\s*iche|fiche|f\s*inventaire|f\s*d\s*inventaire|f\s*invetaire)\b/iu', '', $clean) ?? $clean;
        $clean = preg_replace('/\b(?:institut|universit[ée])\b.*$/iu', '', $clean) ?? $clean;
        $clean = preg_replace('/\s*\(\s*\d+\s*\)\s*$/u', '', $clean) ?? $clean;
        $clean = trim($clean, " -:;,./\\()[]{}\t\n\r\0\x0B");
        $clean = trim((string) preg_replace('/\s{2,}/u', ' ', $clean));

        if ($type === 'service') {
            $lower = Str::lower($clean);
            if ($lower === '' || Str::startsWith($lower, ['fiche', 'inventaire', 'عرض حال', 'قائمة العتاد'])) {
                return '';
            }
        }

        return $clean;
    }

    private function folderFromPath(string $relativePath): string
    {
        $normalized = str_replace('\\', '/', $relativePath);
        $folder = trim(dirname($normalized), '.');
        if ($folder === '' || $folder === '/') {
            return 'غير مصنف';
        }

        $parts = array_values(array_filter(explode('/', $folder), fn ($part) => trim($part) !== ''));
        if ($parts === []) {
            return 'غير مصنف';
        }

        return (string) end($parts);
    }

    private function resolveMappedValue(string $relativePath, array $mapping, string $key): ?string
    {
        $paths = Arr::get($mapping, 'paths', []);
        if (! is_array($paths)) {
            return null;
        }

        foreach ($paths as $pattern => $values) {
            if (! is_array($values)) {
                continue;
            }

            if ($this->matchesGlob($relativePath, (string) $pattern)) {
                $resolved = Arr::get($values, $key);
                return is_string($resolved) ? trim($resolved) : null;
            }
        }

        return null;
    }

    private function matchesGlob(string $relativePath, string $pattern): bool
    {
        $regex = '#^' . str_replace(['\*\*', '\*'], ['.*', '[^/]*'], preg_quote(str_replace('\\', '/', $pattern), '#')) . '$#u';
        return (bool) preg_match($regex, str_replace('\\', '/', $relativePath));
    }

    private function findOrMakeItem(string $designation, ?string $nInventaire, ?int $bureauId, bool $updateExisting): Item
    {
        if ($nInventaire !== null) {
            $existing = Item::query()->where('n_inventaire', $nInventaire)->first();
            if ($existing) {
                return $existing;
            }
        }

        // Only fallback to designation+bureau matching when inventory number is missing.
        if ($updateExisting && $nInventaire === null) {
            $existing = Item::query()
                ->where('designation', $designation)
                ->when($bureauId !== null, fn ($q) => $q->where('bureau_id', $bureauId))
                ->first();

            if ($existing) {
                return $existing;
            }
        }

        return new Item();
    }
}
