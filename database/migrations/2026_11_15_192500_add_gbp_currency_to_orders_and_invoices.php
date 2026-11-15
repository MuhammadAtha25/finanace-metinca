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
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('currency', ['IDR', 'EUR', 'USD', 'GBP'])->default('IDR')->change();
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->enum('currency', ['IDR', 'EUR', 'USD', 'GBP'])->default('IDR')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('currency', ['IDR', 'EUR', 'USD'])->default('IDR')->change();
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->enum('currency', ['IDR', 'EUR', 'USD'])->default('IDR')->change();
        });
    }
};
