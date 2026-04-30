<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('items') || Schema::hasColumn('items', 'bureau_id')) {
            return;
        }

        Schema::table('items', function (Blueprint $table) {
            $table->foreignId('bureau_id')->nullable()->after('quantite')->constrained('bureaus')->nullOnDelete();
            $table->index('bureau_id');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('items') || ! Schema::hasColumn('items', 'bureau_id')) {
            return;
        }

        Schema::table('items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('bureau_id');
        });
    }
};
