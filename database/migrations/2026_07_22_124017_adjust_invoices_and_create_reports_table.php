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
        Schema::table('invoices', function (Blueprint $table) {
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('validated_at')->nullable();
            $table->text('validation_notes')->nullable();
            $table->foreignId('validated_by')->nullable()->constrained('users')->nullOnDelete();
        });

        Schema::create('manager_reports', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // 'monthly' or 'yearly'
            $table->date('period_start');
            $table->date('period_end');
            $table->json('metrics_data'); // summary data
            $table->string('file_path')->nullable(); // attached CSV or PDF
            $table->string('status')->default('submitted'); // submitted, validated, rejected
            $table->text('validation_notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('validated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('validated_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('manager_reports');
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['validated_by']);
            $table->dropColumn(['submitted_at', 'validated_at', 'validation_notes', 'validated_by']);
        });
    }
};
