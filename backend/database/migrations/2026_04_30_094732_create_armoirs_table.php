<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('armoirs', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('barcode')->unique();
            $table->foreignId('labo_id')->constrained('labos')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('armoirs');
    }
};
