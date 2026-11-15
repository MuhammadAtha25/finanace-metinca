<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\ReturnNote;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function customerRecap(Request $request)
    {
        $customerId = $request->input('customer_id', 'all');
        $statusFilter = $request->input('status', 'all');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $customers = Customer::orderBy('name')->get(['id', 'name', 'email']);

        $approvedReturnsByOrder = ReturnNote::where('status', 'Approved')
            ->get()
            ->groupBy('order_id');

        $query = Invoice::with(['order.customer', 'order.items.product'])
            ->whereHas('order')
            ->orderBy('created_at', 'desc');

        if ($customerId && $customerId !== 'all') {
            $query->whereHas('order', function ($q) use ($customerId) {
                $q->where('customer_id', $customerId);
            });
        }

        if ($statusFilter && $statusFilter !== 'all') {
            $query->where('status', $statusFilter);
        }

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $today = Carbon::today();

        $invoices = $query->get()->map(function (Invoice $inv) use ($today, $approvedReturnsByOrder) {
            $deadlineDate = $inv->invoice_type === 'domestik' && $inv->delivery_date
                ? Carbon::parse($inv->delivery_date)
                : ($inv->due_date ? Carbon::parse($inv->due_date) : null);

            $isPaidStatus = in_array(strtolower((string) $inv->status), ['paid', 'lunas'], true);
            $isNonPayableStatus = in_array(strtolower((string) $inv->status), ['paid', 'lunas', 'draft', 'rejected'], true);

            $daysLate = 0;
            $penaltyAmount = 0.0;

            if ($deadlineDate && $deadlineDate->copy()->startOfDay()->lt($today) && ! $isNonPayableStatus) {
                $daysLate = (int) $deadlineDate->copy()->startOfDay()->diffInDays($today, true);
                // Penalty: 0.1% per day late
                $penaltyAmount = (float) $inv->total_amount * 0.001 * $daysLate;
            }

            $orderReturns = $approvedReturnsByOrder->get($inv->order_id, collect());
            $returnAmount = (float) $orderReturns->sum('total_amount');

            $totalAmount = (float) $inv->total_amount;
            $dpAmount = (float) ($inv->dp_amount ?? 0);
            $paidAmount = $isPaidStatus ? $totalAmount : $dpAmount;
            $remainingBalance = $isPaidStatus ? 0.0 : max(0.0, $totalAmount - $dpAmount - $returnAmount);

            $items = ($inv->order && $inv->order->items)
                ? $inv->order->items->map(fn ($item) => [
                    'product_code' => $item->product?->code ?? '-',
                    'product_name' => $item->product?->name ?? 'Produk',
                    'unit' => $item->product?->unit ?? 'Unit',
                    'quantity' => (int) $item->quantity,
                    'price' => (float) $item->price,
                    'subtotal' => (float) ($item->quantity * $item->price),
                ])->values()->all()
                : [];

            $returns = $orderReturns->map(fn (ReturnNote $rtn) => [
                'return_number' => 'RTN-' . str_pad((string) $rtn->id, 4, '0', STR_PAD_LEFT),
                'date' => $rtn->date ? Carbon::parse($rtn->date)->format('d M Y') : ($rtn->created_at ? $rtn->created_at->format('d M Y') : '-'),
                'type' => $rtn->type,
                'reason' => $rtn->reason ?? '-',
                'total_amount' => (float) $rtn->total_amount,
            ])->values()->all();

            return [
                'id' => $inv->id,
                'invoice_number' => 'INV-' . str_pad((string) $inv->id, 5, '0', STR_PAD_LEFT),
                'order_id' => $inv->order_id,
                'customer_id' => $inv->order?->customer_id,
                'customer_name' => $inv->order?->customer?->name ?? '-',
                'customer_email' => $inv->order?->customer?->email ?? '-',
                'sales_rep' => $inv->order?->sales_rep ?? '-',
                'invoice_type' => $inv->invoice_type ?? 'domestik',
                'currency' => $inv->currency ?? 'IDR',
                'exchange_rate' => (float) ($inv->exchange_rate ?? 1),
                'transaction_date' => $inv->order?->date_raised
                    ? Carbon::parse($inv->order->date_raised)->format('d M Y')
                    : ($inv->created_at ? $inv->created_at->format('d M Y') : '-'),
                'validated_at' => $inv->validated_at ? Carbon::parse($inv->validated_at)->format('d M Y H:i') : null,
                'due_date' => $inv->due_date ? Carbon::parse($inv->due_date)->format('d M Y') : null,
                'delivery_date' => $inv->delivery_date ? Carbon::parse($inv->delivery_date)->format('d M Y') : null,
                'deadline_date' => $deadlineDate ? $deadlineDate->format('d M Y') : null,
                'subtotal' => (float) $inv->subtotal,
                'tax_percent' => (float) ($inv->tax_percent ?? 0),
                'tax_amount' => (float) ($inv->tax_amount ?? 0),
                'total_amount' => $totalAmount,
                'dp_amount' => $dpAmount,
                'paid_amount' => $paidAmount,
                'return_amount' => $returnAmount,
                'remaining_balance' => $remainingBalance,
                'days_late' => (int) $daysLate,
                'penalty_amount' => round($penaltyAmount, 2),
                'status' => $inv->status,
                'items' => $items,
                'returns' => $returns,
            ];
        })->values()->all();

        // Aggregate summary per customer (based on filtered invoices)
        $customerSummaryMap = [];
        foreach ($invoices as $row) {
            $cId = (string) ($row['customer_id'] ?? '0');
            if (! isset($customerSummaryMap[$cId])) {
                $customerSummaryMap[$cId] = [
                    'customer_id' => $row['customer_id'],
                    'customer_name' => $row['customer_name'],
                    'customer_email' => $row['customer_email'],
                    'invoices_count' => 0,
                    'total_sales' => 0.0,
                    'paid_amount' => 0.0,
                    'remaining_balance' => 0.0,
                    'return_amount' => 0.0,
                    'penalty_amount' => 0.0,
                ];
            }
            $customerSummaryMap[$cId]['invoices_count']++;
            $customerSummaryMap[$cId]['total_sales'] += $row['total_amount'];
            $customerSummaryMap[$cId]['paid_amount'] += $row['paid_amount'];
            $customerSummaryMap[$cId]['remaining_balance'] += $row['remaining_balance'];
            $customerSummaryMap[$cId]['return_amount'] += $row['return_amount'];
            $customerSummaryMap[$cId]['penalty_amount'] += $row['penalty_amount'];
        }
        $customerSummaries = collect($customerSummaryMap)->sortByDesc('total_sales')->values()->all();

        return Inertia::render('portal/reports/customer-recap', [
            'customers' => $customers,
            'selectedCustomerId' => (string) ($customerId ?: 'all'),
            'filters' => [
                'customer_id' => (string) ($customerId ?: 'all'),
                'status' => (string) ($statusFilter ?: 'all'),
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'invoices' => $invoices,
            'customerSummaries' => $customerSummaries,
        ]);
    }
}
