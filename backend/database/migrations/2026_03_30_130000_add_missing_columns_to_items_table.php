<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('items')) {
            return;
        }

        Schema::table('items', function (Blueprint $table) {
            if (! Schema::hasColumn('items', 'designation')) {
                $table->string('designation')->nullable()->after('nom');
            }

            if (! Schema::hasColumn('items', 'n_inventaire')) {
                $table->string('n_inventaire')->nullable()->unique()->after('designation');
            }

            if (! Schema::hasColumn('items', 'n_decharge')) {
                $table->string('n_decharge')->nullable()->after('n_inventaire');
            }

            if (! Schema::hasColumn('items', 'description')) {
                $table->text('description')->nullable()->after('n_decharge');
            }

            if (! Schema::hasColumn('items', 'quantite')) {
                $table->integer('quantite')->default(0)->after('description');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('items')) {
            return;
        }

        Schema::table('items', function (Blueprint $table) {
            if (Schema::hasColumn('items', 'designation')) {
                $table->dropColumn('designation');
            }

            if (Schema::hasColumn('items', 'n_inventaire')) {
                $table->dropUnique(['n_inventaire']);
                $table->dropColumn('n_inventaire');
            }

            if (Schema::hasColumn('items', 'n_decharge')) {
                $table->dropColumn('n_decharge');
            }

            if (Schema::hasColumn('items', 'description')) {
                $table->dropColumn('description');
            }

            if (Schema::hasColumn('items', 'quantite')) {
                $table->dropColumn('quantite');
            }
        });
    }
};
