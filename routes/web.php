<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SalesPortalController;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [SalesPortalController::class, 'dashboard'])->name('dashboard');
    
    // Sales Portal Routes
    Route::get('orders', [SalesPortalController::class, 'orders'])->name('orders.index');
    Route::get('orders/create', [SalesPortalController::class, 'createOrder'])->name('orders.create');
    Route::post('orders', [SalesPortalController::class, 'storeOrder'])->name('orders.store');
    Route::get('orders/{id}/edit', [SalesPortalController::class, 'editOrder'])->name('orders.edit');
    Route::put('orders/{id}', [SalesPortalController::class, 'updateOrder'])->name('orders.update');
    Route::delete('orders/{id}', [SalesPortalController::class, 'destroyOrder'])->name('orders.destroy');
    
    Route::get('pipeline', [SalesPortalController::class, 'pipeline'])->name('pipeline');
    Route::get('inventory', [SalesPortalController::class, 'inventory'])->name('inventory');
    Route::get('customers', [SalesPortalController::class, 'customers'])->name('customers');
    Route::get('analytics', [SalesPortalController::class, 'analytics'])->name('analytics');
});

require __DIR__.'/settings.php';

