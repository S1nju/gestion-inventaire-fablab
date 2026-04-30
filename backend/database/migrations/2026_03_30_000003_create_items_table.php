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
            $table->string('n_inventaire')->nullable()->unique()->comment('N° in Excel');
            $table->string('fournisseur_code')->nullable();
            $table->decimal('prix', 10, 2)->nullable();
            $table->string('nom');
            $table->string('type_composant')->nullable();
            
            // Barcode added for scanner searching
            $table->string('barcode')->nullable()->unique();
            
            // Tracking quantities instead of a single quantity
            $table->integer('quantite_en_stock')->default(0);
            $table->integer('quantite_en_projet')->default(0);
            $table->integer('quantite_endommagee')->default(0);
            $table->integer('quantite_perdue')->default(0);
            
            // Physical location
            $table->foreignId('casier_id')->nullable()->constrained('casiers')->nullOnDelete();
            
            $table->text('description')->nullable();
            $table->timestamps();
            
            $table->index('n_inventaire');
            $table->index('barcode');
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
