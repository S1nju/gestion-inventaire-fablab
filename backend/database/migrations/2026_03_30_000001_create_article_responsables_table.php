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
        Schema::create('article_responsables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained('items')->onDelete('cascade');
            $table->foreignId('responsable_id')->constrained('responsables')->onDelete('cascade');
            $table->dateTime('date_affectation')->nullable();
            $table->dateTime('date_retrait')->nullable()->comment('When item was returned/withdrawn');
            $table->foreignId('responsable_id_from')->nullable()->constrained('responsables', 'id')->onDelete('set null')->comment('Who transferred the item FROM');
            $table->integer('quantite_affectee')->default(1);
            $table->text('notes')->nullable();
            $table->timestamps();

            // Indices for quick queries
            $table->index('article_id');
            $table->index('responsable_id');
            $table->index('date_retrait');
            $table->unique(['article_id', 'responsable_id', 'date_affectation']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('article_responsables');
    }
};
