<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('casiers', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('barcode')->unique();
            $table->foreignId('armoir_id')->constrained('armoirs')->cascadeOnDelete();
            $table->foreignId('casier_type_id')->nullable()->constrained('casier_types')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('casiers');
    }
};
