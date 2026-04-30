<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('titre');
            $table->string('type'); // PFE, Mini projet etc.
            $table->string('annee_enseignement')->nullable();
            $table->foreignId('encadrant_id')->nullable()->constrained('encadrants')->nullOnDelete();
            $table->string('status')->default('actif');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
