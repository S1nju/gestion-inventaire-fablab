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
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('designation')->nullable()->comment('Item designation/type');
            $table->string('n_inventaire')->nullable()->unique()->comment('Inventory number');
            $table->string('n_decharge')->nullable()->comment('Discharge/statement number');
            $table->text('description')->nullable();
            $table->integer('quantite')->default(0);
            $table->foreignId('fournisseur_id')->nullable()->constrained('fournisseurs')->onDelete('set null');
            $table->timestamps();
            
            $table->index('fournisseur_id');
            $table->index('n_inventaire');
            $table->index('n_decharge');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
