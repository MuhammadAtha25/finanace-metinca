<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SalesPortalController;
use App\Http\Controllers\InvoiceController;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [SalesPortalController::class, 'dashboard'])->name('dashboard');
    
    // View actions (staff only — self-registered "pending" users must not
    // see orders, customers, or pricing data)
    Route::middleware(['role:staff_sales,staff_accounting'])->group(function () {
        Route::get('orders', [SalesPortalController::class, 'orders'])->name('orders.index');
        Route::get('customers', [SalesPortalController::class, 'customers'])->name('customers.index');
        Route::get('products', [\App\Http\Controllers\ProductController::class, 'index'])->name('products.index');
    });

    Route::middleware(['role:staff_sales,staff_accounting'])->group(function () {
        Route::get('returns', [\App\Http\Controllers\ReturnController::class, 'index'])->name('returns.index');
    });

    // Sales actions (restricted to Sales Reps)
    Route::middleware(['role:staff_sales'])->group(function () {
        // Customers
        Route::get('customers/create', [SalesPortalController::class, 'createCustomer'])->name('customers.create');
        Route::post('customers', [SalesPortalController::class, 'storeCustomer'])->name('customers.store');
        Route::get('customers/{id}/edit', [SalesPortalController::class, 'editCustomer'])->name('customers.edit');
        Route::put('customers/{id}', [SalesPortalController::class, 'updateCustomer'])->name('customers.update');
        Route::delete('customers/{id}', [SalesPortalController::class, 'destroyCustomer'])->name('customers.destroy');

        // Products
        Route::get('products/create', [\App\Http\Controllers\ProductController::class, 'create'])->name('products.create');
        Route::post('products', [\App\Http\Controllers\ProductController::class, 'store'])->name('products.store');
        Route::get('products/{id}/edit', [\App\Http\Controllers\ProductController::class, 'edit'])->name('products.edit');
        Route::put('products/{id}', [\App\Http\Controllers\ProductController::class, 'update'])->name('products.update');
        Route::delete('products/{id}', [\App\Http\Controllers\ProductController::class, 'destroy'])->name('products.destroy');

        // Returns (Barang Reject)
        Route::get('returns/create', [\App\Http\Controllers\ReturnController::class, 'create'])->name('returns.create');
        Route::post('returns', [\App\Http\Controllers\ReturnController::class, 'store'])->name('returns.store');

        Route::get('invoices/create', [\App\Http\Controllers\InvoiceController::class, 'create'])->name('invoices.create');
        Route::post('invoices', [\App\Http\Controllers\InvoiceController::class, 'storeUnified'])->name('invoices.store_unified');

        Route::post('sales/invoices/{id}/submit', [\App\Http\Controllers\InvoiceController::class, 'submit'])->name('sales.invoices.submit');
        Route::post('sales/invoices/{id}/pay', [\App\Http\Controllers\InvoiceController::class, 'markAsLunas'])->name('sales.invoices.pay');
    });

    Route::middleware(['role:staff_sales,staff_accounting,manager'])->group(function () {
        Route::get('sales/invoice-rekap', [\App\Http\Controllers\InvoiceController::class, 'index'])->name('sales.invoice_rekap');
    });

    // Accounting actions (restricted to Accounting Staff)
    Route::middleware(['role:staff_accounting'])->group(function () {
        Route::get('accounting/inbox', [\App\Http\Controllers\AccountingController::class, 'inbox'])->name('accounting.inbox');
        Route::post('accounting/invoices/{id}/validate', [\App\Http\Controllers\AccountingController::class, 'validateInvoice'])->name('accounting.validate');
        Route::post('accounting/invoices/{id}/reject', [\App\Http\Controllers\AccountingController::class, 'rejectInvoice'])->name('accounting.reject');
        
        Route::post('accounting/reports/generate', [\App\Http\Controllers\AccountingController::class, 'generateReport'])->name('accounting.generate_report');

        // Returns approval
        Route::post('accounting/returns/{id}/approve', [\App\Http\Controllers\ReturnController::class, 'approve'])->name('returns.approve');
        Route::post('accounting/returns/{id}/reject', [\App\Http\Controllers\ReturnController::class, 'reject'])->name('returns.reject');
    });

    // Manager actions (restricted to Managers)
    Route::middleware(['role:manager'])->group(function () {
        Route::get('manager/reports', [\App\Http\Controllers\ManagerController::class, 'inbox'])->name('manager.reports');
        Route::post('manager/reports/{id}/validate', [\App\Http\Controllers\ManagerController::class, 'validateReport'])->name('manager.reports.validate');
        Route::post('manager/reports/{id}/reject', [\App\Http\Controllers\ManagerController::class, 'rejectReport'])->name('manager.reports.reject');
        
        Route::get('manager/sales-recap', [\App\Http\Controllers\SalesPortalController::class, 'rekap'])->name('manager.sales_recap');
    });

    // Reports accessible by Accounting
    Route::middleware(['role:staff_accounting'])->group(function () {
        Route::get('reports/customer-recap', [\App\Http\Controllers\ReportController::class, 'customerRecap'])->name('reports.customer_recap');
    });
});

require __DIR__.'/settings.php';

