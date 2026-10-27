<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('status')->default('utang')->change();
        });

        // Update existing records
        DB::table('invoices')->where('status', 'Draft')->update(['status' => 'utang']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('status')->default('Draft')->change();
        });

        // Revert existing records
        DB::table('invoices')->where('status', 'utang')->update(['status' => 'Draft']);
    }
};
