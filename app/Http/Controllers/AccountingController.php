<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\ManagerReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AccountingController extends Controller
{
    public function inbox()
    {
        $invoices = Invoice::with(['order.customer', 'order.items.product'])
            ->where('status', 'submitted')
            ->orderBy('submitted_at', 'asc')
            ->get()
            ->map(fn ($inv) => [
                'id' => $inv->id,
                'invoice_number' => 'INV-' . str_pad($inv->id, 5, '0', STR_PAD_LEFT),
                'date_raised' => $inv->created_at->format('M d, Y'),
                'submitted_at' => $inv->submitted_at ? $inv->submitted_at->format('M d, Y H:i') : null,
                'file_path' => $inv->file_path ? asset('storage/' . $inv->file_path) : null,
                'customer_name' => $inv->order->customer->name,
                'sales_rep' => $inv->order->sales_rep,
                'status' => $inv->status,
                'total_amount' => (double) $inv->total_amount,
                'currency' => $inv->currency,
                'exchange_rate' => (float) $inv->exchange_rate,
                'items' => $inv->order->items->map(fn ($item) => [
                    'product_name' => $item->product->name,
                    'quantity' => $item->quantity,
                    'price' => $item->price,
                ]),
            ]);

        // Also fetch reports created by accounting
        $reports = ManagerReport::where('created_by', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($rep) => [
                'id' => $rep->id,
                'type' => $rep->type,
                'period_start' => $rep->period_start->format('M d, Y'),
                'period_end' => $rep->period_end->format('M d, Y'),
                'status' => $rep->status,
                'created_at' => $rep->created_at->format('M d, Y H:i'),
                'validation_notes' => $rep->validation_notes,
            ]);

        return Inertia::render('portal/accounting/inbox', [
            'invoices' => $invoices,
            'reports' => $reports,
        ]);
    }

    public function validateInvoice(Request $request, $id)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        $invoice = Invoice::where('status', 'submitted')->findOrFail($id);

        $invoice->update([
            'status' => 'utang',
            'validated_at' => now(),
            'validated_by' => Auth::id(),
            'validation_notes' => $validated['notes'] ?? null,
        ]);

        if ($invoice->order) {
            $invoice->order->update([
                'status' => 'utang',
                'validated_at' => now(),
                'validated_by' => Auth::id(),
                'validation_notes' => $validated['notes'] ?? null,
            ]);
        }

        return redirect()->route('accounting.inbox')->with('success', 'Invoice validated successfully.');
    }

    public function rejectInvoice(Request $request, $id)
    {
        $validated = $request->validate([
            'notes' => 'required|string|max:1000',
        ]);

        $invoice = Invoice::where('status', 'submitted')->findOrFail($id);

        $invoice->update([
            'status' => 'rejected',
            'validation_notes' => $validated['notes'],
            'submitted_at' => null, // reset submission
        ]);

        if ($invoice->order) {
            $invoice->order->update([
                'status' => 'Rejected',
                'validation_notes' => $validated['notes'],
                'submitted_at' => null, // reset submission
            ]);
        }

        return redirect()->route('accounting.inbox')->with('success', 'Invoice rejected and sent back to Sales.');
    }

    public function generateReport(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:monthly,yearly',
            'period' => 'required|date',
        ]);

        $type = $validated['type'];
        $date = Carbon::parse($validated['period']);
        
        if ($type === 'monthly') {
            $start = $date->copy()->startOfMonth();
            $end = $date->copy()->endOfMonth();
        } else {
            $start = $date->copy()->startOfYear();
            $end = $date->copy()->endOfYear();
        }

        // Calculate summary metrics for the period based on validated invoices (utang/lunas)
        $invoices = Invoice::whereIn('status', ['utang', 'lunas'])
            ->whereBetween('validated_at', [$start, $end])
            ->get();

        $metrics = [
            'total_sales' => $invoices->sum('total_amount'),
            'total_invoices' => $invoices->count(),
            'paid_invoices' => $invoices->where('status', 'lunas')->count(),
            'unpaid_invoices' => $invoices->where('status', 'utang')->count(),
            'paid_sales' => $invoices->where('status', 'lunas')->sum('total_amount'),
            'unpaid_sales' => $invoices->where('status', 'utang')->sum('total_amount'),
        ];

        ManagerReport::create([
            'type' => $type,
            'period_start' => $start,
            'period_end' => $end,
            'metrics_data' => $metrics,
            'status' => 'submitted',
            'created_by' => Auth::id(),
        ]);

        return redirect()->route('accounting.inbox')->with('success', 'Report generated and submitted to Manager successfully.');
    }
}
