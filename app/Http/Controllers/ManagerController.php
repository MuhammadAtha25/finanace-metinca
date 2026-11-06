<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\ManagerReport;
use App\Models\ReturnNote;
use App\Services\NotificationService;
use App\Support\UserRole;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ManagerController extends Controller
{
    public function inbox()
    {
        $reports = ManagerReport::with(['creator', 'validator'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function (ManagerReport $r) {
                $metrics = $r->metrics_data ?? [];
                if (! isset($metrics['invoices_detail'])) {
                    $metrics = array_merge(
                        AccountingController::buildDetailedReportPayload(
                            Carbon::parse($r->period_start)->startOfDay(),
                            Carbon::parse($r->period_end)->endOfDay()
                        ),
                        $metrics
                    );
                }

                return [
                    'id' => $r->id,
                    'type' => $r->type,
                    'period_start' => $r->period_start->format('M d, Y'),
                    'period_end' => $r->period_end->format('M d, Y'),
                    'metrics_data' => $metrics,
                    'status' => $r->status,
                    'validation_notes' => $r->validation_notes,
                    'created_by_name' => $r->creator->name ?? 'Staff Accounting',
                    'validated_by_name' => $r->validator->name ?? null,
                    'created_at' => $r->created_at->format('M d, Y H:i'),
                    'validated_at' => $r->validated_at ? $r->validated_at->format('M d, Y H:i') : null,
                ];
            });

        return Inertia::render('portal/manager/reports', [
            'reports' => $reports,
        ]);
    }

    public function validateReport(Request $request, $id)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        $report = ManagerReport::where('status', 'submitted')->findOrFail($id);

        $report->update([
            'status' => 'validated',
            'validated_at' => now(),
            'validated_by' => Auth::id(),
            'validation_notes' => $validated['notes'] ?? null,
        ]);

        $senderName = $request->user()?->name ?? 'Manager Accounting';
        $periodLabel = $report->period_start->format('d M Y') . ' - ' . $report->period_end->format('d M Y');
        $typeLabel = $report->type === 'monthly' ? 'Bulanan' : ($report->type === 'neraca' ? 'Neraca' : 'Tahunan');

        if ($report->created_by) {
            NotificationService::notifyUser(
                $report->created_by,
                'Laporan ' . $typeLabel . ' Disetujui Manager',
                $senderName . ' telah memvalidasi dan menyetujui Laporan ' . $typeLabel . ' periode ' . $periodLabel . '.' . (! empty($validated['notes']) ? ' Catatan: "' . $validated['notes'] . '"' : ''),
                '/accounting/inbox',
                'report_validated',
                Auth::id()
            );
        } else {
            NotificationService::notifyRole(
                UserRole::ACCOUNTING,
                'Laporan ' . $typeLabel . ' Disetujui Manager',
                $senderName . ' telah memvalidasi dan menyetujui Laporan ' . $typeLabel . ' periode ' . $periodLabel . '.',
                '/accounting/inbox',
                'report_validated',
                Auth::id()
            );
        }

        return redirect()->route('manager.reports')->with('success', 'Laporan berhasil divalidasi oleh Manager Accounting.');
    }

    public function rejectReport(Request $request, $id)
    {
        $validated = $request->validate([
            'notes' => 'required|string|max:1000',
        ]);

        $report = ManagerReport::where('status', 'submitted')->findOrFail($id);

        $report->update([
            'status' => 'rejected',
            'validated_at' => now(),
            'validated_by' => Auth::id(),
            'validation_notes' => $validated['notes'],
        ]);

        $senderName = $request->user()?->name ?? 'Manager Accounting';
        $periodLabel = $report->period_start->format('d M Y') . ' - ' . $report->period_end->format('d M Y');
        $typeLabel = $report->type === 'monthly' ? 'Bulanan' : ($report->type === 'neraca' ? 'Neraca' : 'Tahunan');

        if ($report->created_by) {
            NotificationService::notifyUser(
                $report->created_by,
                'Laporan ' . $typeLabel . ' Ditolak / Perlu Revisi',
                $senderName . ' menolak Laporan ' . $typeLabel . ' periode ' . $periodLabel . '. Catatan Revisi: "' . $validated['notes'] . '"',
                '/accounting/inbox',
                'report_rejected',
                Auth::id()
            );
        } else {
            NotificationService::notifyRole(
                UserRole::ACCOUNTING,
                'Laporan ' . $typeLabel . ' Ditolak / Perlu Revisi',
                $senderName . ' menolak Laporan ' . $typeLabel . ' periode ' . $periodLabel . '. Catatan Revisi: "' . $validated['notes'] . '"',
                '/accounting/inbox',
                'report_rejected',
                Auth::id()
            );
        }

        return redirect()->route('manager.reports')->with('success', 'Laporan ditolak dan dikembalikan ke Staff Accounting untuk direvisi.');
    }

    public function neraca(Request $request)
    {
        $periodInput = $request->input('period', now()->format('Y-m'));
        try {
            $cutoffDate = Carbon::parse($periodInput . '-01')->endOfMonth();
            $periodStart = Carbon::parse($periodInput . '-01')->startOfMonth();
        } catch (\Throwable) {
            $cutoffDate = now()->endOfMonth();
            $periodStart = now()->startOfMonth();
            $periodInput = now()->format('Y-m');
        }

        // All validated invoices (utang & lunas) for the period, fallback to all if empty
        $invoices = Invoice::with(['order.customer', 'order.items.product'])
            ->whereIn('status', ['utang', 'lunas'])
            ->where(function ($q) use ($periodStart, $cutoffDate) {
                $q->whereBetween('validated_at', [$periodStart, $cutoffDate])
                  ->orWhere(function ($q2) use ($periodStart, $cutoffDate) {
                      $q2->whereNull('validated_at')
                         ->whereBetween('created_at', [$periodStart, $cutoffDate]);
                  });
            })
            ->orderBy('created_at', 'desc')
            ->get();

        if ($invoices->isEmpty()) {
            $invoices = Invoice::with(['order.customer', 'order.items.product'])
                ->whereIn('status', ['utang', 'lunas'])
                ->orderBy('created_at', 'desc')
                ->get();
        }

        // Approved returns
        $approvedReturns = ReturnNote::with(['order.customer'])
            ->where('status', 'Approved')
            ->get();

        // ── SISI 1: NILAI PENJUALAN DITERBITKAN (SALES ISSUED) ────────────────
        $domesticSubtotal = (float) $invoices->where('invoice_type', 'domestik')->sum('subtotal');
        $internationalSubtotal = (float) $invoices->where('invoice_type', 'international')->sum('subtotal');
        $taxTotal = (float) $invoices->sum('tax_amount');
        $totalSalesIssued = (float) $invoices->sum('total_amount');

        // ── SISI 2: REALISASI & STATUS PEMBAYARAN PENJUALAN (SETTLEMENT) ───────
        $paidInvoices = $invoices->where('status', 'lunas');
        $unpaidInvoices = $invoices->where('status', 'utang');

        $paidSales = (float) $paidInvoices->sum('total_amount');
        $dpCollected = (float) $unpaidInvoices->sum('dp_amount');
        $returnsTotal = (float) $approvedReturns->sum('total_amount');

        // Sisa piutang penjualan (setelah dikurangi DP yang masuk dan kompensasi retur)
        $remainingReceivables = max(0.0, ((float) $unpaidInvoices->sum('total_amount') - $dpCollected - $returnsTotal));

        // Total realisasi penjualan: Kas Lunas + DP + Sisa Piutang + Potongan Retur
        $totalSettlement = $paidSales + $dpCollected + $remainingReceivables + $returnsTotal;
        $isBalanced = abs($totalSalesIssued - $totalSettlement) < 1;

        // Indikator Rasio Kinerja Penjualan
        $collectionRate = $totalSalesIssued > 0
            ? round((($paidSales + $dpCollected) / $totalSalesIssued) * 100, 1)
            : 0.0;
        $receivableRate = $totalSalesIssued > 0
            ? round(($remainingReceivables / $totalSalesIssued) * 100, 1)
            : 0.0;
        $returnRate = $totalSalesIssued > 0
            ? round(($returnsTotal / $totalSalesIssued) * 100, 1)
            : 0.0;
        $domesticShare = $totalSalesIssued > 0
            ? round((($domesticSubtotal + $taxTotal) / $totalSalesIssued) * 100, 1)
            : 0.0;

        // Customer Reconciliation breakdown for drilldown
        $customerSummary = [];
        foreach ($invoices as $inv) {
            $cName = $inv->order?->customer?->name ?? 'Customer Umum';
            if (! isset($customerSummary[$cName])) {
                $customerSummary[$cName] = [
                    'customer_name' => $cName,
                    'invoices_count' => 0,
                    'total_sales' => 0.0,
                    'paid_amount' => 0.0,
                    'dp_amount' => 0.0,
                    'unpaid_amount' => 0.0,
                    'returns_amount' => 0.0,
                ];
            }
            $customerSummary[$cName]['invoices_count']++;
            $customerSummary[$cName]['total_sales'] += (float) $inv->total_amount;
            if ($inv->status === 'lunas') {
                $customerSummary[$cName]['paid_amount'] += (float) $inv->total_amount;
            } else {
                $customerSummary[$cName]['dp_amount'] += (float) $inv->dp_amount;
                $customerSummary[$cName]['unpaid_amount'] += max(0.0, ((float) $inv->total_amount - (float) $inv->dp_amount));
            }
        }
        foreach ($approvedReturns as $rtn) {
            $cName = $rtn->order?->customer?->name ?? 'Customer Umum';
            if (isset($customerSummary[$cName])) {
                $customerSummary[$cName]['returns_amount'] += (float) $rtn->total_amount;
                $customerSummary[$cName]['unpaid_amount'] = max(0.0, $customerSummary[$cName]['unpaid_amount'] - (float) $rtn->total_amount);
            }
        }
        $customerReconciliation = collect($customerSummary)->sortByDesc('total_sales')->values()->all();

        // Receivables Drilldown (daftar invoice utang)
        $receivablesList = $unpaidInvoices->map(fn (Invoice $inv) => [
            'invoice_number' => 'INV-' . str_pad((string) $inv->id, 5, '0', STR_PAD_LEFT),
            'order_id' => $inv->order_id,
            'customer_name' => $inv->order?->customer?->name ?? 'Customer',
            'date' => $inv->created_at ? $inv->created_at->format('d M Y') : '-',
            'due_date' => $inv->due_date ? Carbon::parse($inv->due_date)->format('d M Y') : '-',
            'total_amount' => (float) $inv->total_amount,
            'dp_amount' => (float) $inv->dp_amount,
            'remaining_balance' => max(0.0, ((float) $inv->total_amount - (float) $inv->dp_amount)),
        ])->values()->all();

        // Returns Drilldown
        $returnsList = $approvedReturns->map(fn (ReturnNote $rtn) => [
            'return_number' => 'RTN-' . str_pad((string) $rtn->id, 4, '0', STR_PAD_LEFT),
            'order_id' => $rtn->order_id,
            'customer_name' => $rtn->order?->customer?->name ?? '-',
            'reason' => $rtn->reason ?? '-',
            'date' => $rtn->created_at ? $rtn->created_at->format('d M Y') : '-',
            'total_amount' => (float) $rtn->total_amount,
        ])->values()->all();

        // Latest Neraca verification status
        $neracaReports = ManagerReport::with(['creator', 'validator'])
            ->where('type', 'neraca')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn (ManagerReport $r) => [
                'id' => $r->id,
                'period_start' => $r->period_start->format('d M Y'),
                'period_end' => $r->period_end->format('d M Y'),
                'status' => $r->status,
                'validation_notes' => $r->validation_notes,
                'created_by_name' => $r->creator?->name ?? 'Staff Accounting',
                'validated_by_name' => $r->validator?->name ?? null,
                'created_at' => $r->created_at->format('d M Y H:i'),
                'validated_at' => $r->validated_at ? $r->validated_at->format('d M Y H:i') : null,
            ]);

        return Inertia::render('portal/manager/neraca', [
            'period' => $periodInput,
            'period_label' => $cutoffDate->translatedFormat('F Y'),
            'cutoff_date' => $cutoffDate->format('d M Y'),
            'neraca' => [
                'sumber_penjualan' => [
                    'items' => [
                        [
                            'code' => '4101',
                            'name_id' => 'Penjualan Barang Domestik (DPP)',
                            'name_en' => 'Domestic Product Sales (Tax Base)',
                            'description_id' => 'Nilai dasar pengenaan pajak atas faktur penjualan dalam negeri',
                            'description_en' => 'Subtotal value of domestic commercial sales invoices',
                            'amount' => $domesticSubtotal,
                        ],
                        [
                            'code' => '4102',
                            'name_id' => 'Penjualan Ekspor / Internasional',
                            'name_en' => 'Export / International Sales',
                            'description_id' => 'Nilai faktur penjualan ekspor luar negeri (tarif PPN 0%)',
                            'description_en' => 'Subtotal value of foreign export sales invoices (0% VAT)',
                            'amount' => $internationalSubtotal,
                        ],
                        [
                            'code' => '2101',
                            'name_id' => 'Pajak PPN Keluaran (11%)',
                            'name_en' => 'VAT Output (11%)',
                            'description_id' => 'Akumulasi PPN 11% yang tercantum pada faktur penjualan domestik',
                            'description_en' => 'Accumulated 11% VAT on domestic commercial invoices',
                            'amount' => $taxTotal,
                        ],
                    ],
                    'total' => $totalSalesIssued,
                ],
                'realisasi_penjualan' => [
                    'items' => [
                        [
                            'code' => '1101',
                            'name_id' => 'Penjualan Telah Lunas (Kas Masuk)',
                            'name_en' => 'Fully Paid Sales (Cash Inflow)',
                            'description_id' => 'Pembayaran lunas 100% yang telah diterima dari faktur berstatus Lunas',
                            'description_en' => '100% full payments received for cleared invoices',
                            'amount' => $paidSales,
                        ],
                        [
                            'code' => '1102',
                            'name_id' => 'Uang Muka Diterima (DP Faktur Berjalan)',
                            'name_en' => 'Down Payment Received (Active Invoices)',
                            'description_id' => 'Uang muka pembayaran (DP) yang telah masuk dari faktur yang masih berjalan',
                            'description_en' => 'Advance customer down payments collected for active orders',
                            'amount' => $dpCollected,
                        ],
                        [
                            'code' => '1103',
                            'name_id' => 'Sisa Piutang Penjualan (Utang Customer)',
                            'name_en' => 'Outstanding Sales Receivables',
                            'description_id' => 'Sisa tagihan penjualan yang masih harus ditagihkan kepada pelanggan',
                            'description_en' => 'Net outstanding balance remaining to be collected from customers',
                            'amount' => $remainingReceivables,
                        ],
                        [
                            'code' => '4201',
                            'name_id' => 'Potongan Retur Barang Disetujui',
                            'name_en' => 'Approved Sales Returns & Allowances',
                            'description_id' => 'Pengurang nilai penjualan akibat barang reject/rusak yang telah disetujui',
                            'description_en' => 'Sales deductions from approved returned / defective items',
                            'amount' => $returnsTotal,
                        ],
                    ],
                    'total' => $totalSettlement,
                ],
                'is_balanced' => $isBalanced,
                'ratios' => [
                    'collection_rate' => $collectionRate,
                    'receivable_rate' => $receivableRate,
                    'return_rate' => $returnRate,
                    'domestic_share' => $domesticShare,
                ],
            ],
            'drilldown' => [
                'customer_reconciliation' => $customerReconciliation,
                'receivables' => $receivablesList,
                'returns' => $returnsList,
            ],
            'neraca_submissions' => $neracaReports,
        ]);
    }

    public function submitNeraca(Request $request)
    {
        $periodInput = $request->input('period', now()->format('Y-m'));
        $start = Carbon::parse($periodInput . '-01')->startOfMonth();
        $end = Carbon::parse($periodInput . '-01')->endOfMonth();

        $detailedMetrics = AccountingController::buildDetailedReportPayload($start, $end);

        ManagerReport::create([
            'type' => 'neraca',
            'period_start' => $start,
            'period_end' => $end,
            'metrics_data' => $detailedMetrics,
            'status' => 'submitted',
            'created_by' => Auth::id(),
        ]);

        $senderName = $request->user()?->name ?? 'Staff Accounting';
        NotificationService::notifyRole(
            UserRole::MANAGER,
            'Laporan Neraca Diajukan untuk Validasi',
            $senderName . ' mengirimkan Laporan Neraca posisi ' . $end->format('d M Y') . ' untuk diperiksa dan disahkan oleh Manager Accounting.',
            '/manager/neraca',
            'neraca_submitted',
            Auth::id()
        );

        return redirect()->back()->with('success', 'Laporan Neraca berhasil dikirim ke Manager Accounting untuk divalidasi.');
    }

    public function validateNeraca(Request $request, $id)
    {
        $report = ManagerReport::findOrFail($id);
        $report->update([
            'status' => 'validated',
            'validated_at' => now(),
            'validated_by' => Auth::id(),
            'validation_notes' => $request->input('notes', 'Neraca telah diperiksa dan disahkan oleh Manager Accounting.'),
        ]);

        $senderName = $request->user()?->name ?? 'Manager Accounting';
        if ($report->created_by) {
            NotificationService::notifyUser(
                $report->created_by,
                'Laporan Neraca Disahkan Manager',
                $senderName . ' telah mengesahkan Laporan Neraca periode ' . $report->period_end->format('M Y') . '.',
                '/manager/neraca',
                'neraca_validated',
                Auth::id()
            );
        }

        NotificationService::notifyRole(
            UserRole::ACCOUNTING,
            'Laporan Neraca Disahkan Manager',
            $senderName . ' telah mengesahkan Laporan Neraca periode ' . $report->period_end->format('M Y') . '.',
            '/manager/neraca',
            'neraca_validated',
            Auth::id()
        );

        return redirect()->back()->with('success', 'Laporan Neraca berhasil divalidasi dan disahkan.');
    }
}
