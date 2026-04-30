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
        Schema::create('item_movement_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items')->onDelete('cascade');
            $table->foreignId('article_responsable_id')->nullable()->constrained('article_responsables')->onDelete('set null');
            $table->foreignId('responsible_id')->nullable()->constrained('responsables')->onDelete('set null')->comment('Who item was moved TO');
            $table->foreignId('previous_responsible_id')->nullable()->constrained('responsables', 'id')->onDelete('set null')->comment('Who item was moved FROM');
            $table->string('action_type')->default('assignment')->comment('assignment, transfer, return, damage, loss, etc.');
            $table->integer('quantity')->default(1);
            $table->text('notes')->nullable();
            $table->foreignId('performed_by')->nullable()->constrained('users')->onDelete('set null')->comment('User who performed this action');
            $table->timestamps();

            // Indices for quick queries
            $table->index('item_id');
            $table->index('responsible_id');
            $table->index('action_type');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_movement_history');
    }
};
