<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('services') && ! Schema::hasColumn('services', 'faculte_id')) {
            Schema::table('services', function (Blueprint $table) {
                $table->foreignId('faculte_id')->nullable()->after('responsable_principal')->constrained('facultes')->nullOnDelete();
                $table->index('faculte_id');
            });
        }

        if (Schema::hasTable('bureaus') && ! Schema::hasColumn('bureaus', 'service_id')) {
            Schema::table('bureaus', function (Blueprint $table) {
                $table->foreignId('service_id')->nullable()->after('localisation')->constrained('services')->nullOnDelete();
                $table->index('service_id');
            });
        }

        // Best-effort data alignment: map bureau.faculte_id to a service of the same faculty if available.
        if (Schema::hasTable('bureaus') && Schema::hasColumn('bureaus', 'faculte_id') && Schema::hasColumn('bureaus', 'service_id') && Schema::hasTable('services') && Schema::hasColumn('services', 'faculte_id')) {
            $servicesByFaculty = DB::table('services')
                ->select('id', 'faculte_id')
                ->whereNotNull('faculte_id')
                ->orderBy('id')
                ->get()
                ->groupBy('faculte_id');

            $bureaus = DB::table('bureaus')
                ->select('id', 'faculte_id', 'service_id')
                ->whereNull('service_id')
                ->whereNotNull('faculte_id')
                ->get();

            foreach ($bureaus as $bureau) {
                $candidate = $servicesByFaculty->get($bureau->faculte_id)?->first();
                if ($candidate) {
                    DB::table('bureaus')->where('id', $bureau->id)->update(['service_id' => $candidate->id]);
                }
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('bureaus') && Schema::hasColumn('bureaus', 'service_id')) {
            Schema::table('bureaus', function (Blueprint $table) {
                $table->dropConstrainedForeignId('service_id');
            });
        }

        if (Schema::hasTable('services') && Schema::hasColumn('services', 'faculte_id')) {
            Schema::table('services', function (Blueprint $table) {
                $table->dropConstrainedForeignId('faculte_id');
            });
        }
    }
};
