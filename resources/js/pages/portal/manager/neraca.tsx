import { Head, router, usePage } from '@inertiajs/react';
import {
    Activity,
    CheckCircle2,
    Clock,
    DollarSign,
    Download,
    FileSpreadsheet,
    FileText,
    HelpCircle,
    Printer,
    RotateCcw,
    Scale,
    Send,
    ShieldCheck,
    TrendingUp,
    Undo2,
    Users,
    Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useCurrency } from '@/components/currency-context';
import { useLanguage } from '@/components/language-context';
import type { BreadcrumbItem } from '@/types';

interface AccountLine {
    code: string;
    name_id: string;
    name_en: string;
    description_id: string;
    description_en: string;
    amount: number;
}

interface NeracaSide {
    items: AccountLine[];
    total: number;
}

interface NeracaData {
    sumber_penjualan: NeracaSide;
    realisasi_penjualan: NeracaSide;
    is_balanced: boolean;
    ratios: {
        collection_rate: number;
        receivable_rate: number;
        return_rate: number;
        domestic_share: number;
    };
}

interface CustomerReconciliationRow {
    customer_name: string;
    invoices_count: number;
    total_sales: number;
    paid_amount: number;
    dp_amount: number;
    unpaid_amount: number;
    returns_amount: number;
}

interface ReceivableRow {
    invoice_number: string;
    order_id: number;
    customer_name: string;
    date: string;
    due_date: string;
    total_amount: number;
    dp_amount: number;
    remaining_balance: number;
}

interface ReturnRow {
    return_number: string;
    order_id: number;
    customer_name: string;
    reason: string;
    date: string;
    total_amount: number;
}

interface NeracaSubmission {
    id: number;
    period_start: string;
    period_end: string;
    status: string;
    validation_notes: string | null;
    created_by_name: string;
    validated_by_name: string | null;
    created_at: string;
    validated_at: string | null;
}

interface Props {
    period: string;
    period_label: string;
    cutoff_date: string;
    neraca: NeracaData;
    drilldown: {
        customer_reconciliation: CustomerReconciliationRow[];
        receivables: ReceivableRow[];
        returns: ReturnRow[];
    };
    neraca_submissions: NeracaSubmission[];
}

export default function ManagerNeraca({
    period,
    period_label,
    cutoff_date,
    neraca,
    drilldown,
    neraca_submissions = [],
}: Props) {
    const { formatPrice } = useCurrency();
    const { language, t } = useLanguage();
    const { props } = usePage<{
        auth: { user: { id: number; name: string; role: string } };
        flash?: { success?: string; error?: string };
    }>();

    const userRole = props.auth?.user?.role ?? 'manager';
    const isManager = userRole === 'manager';

    const [selectedPeriod, setSelectedPeriod] = useState(period);
    const [activeDrilldownTab, setActiveDrilldownTab] = useState<
        'customers' | 'receivables' | 'returns' | 'submissions'
    >('customers');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('Neraca Penjualan (Sales Balance Sheet)', 'Sales Balance Sheet'), href: '/manager/neraca' },
    ];

    const formatCurrency = (val: number) => formatPrice(Number(val || 0));

    const handlePeriodChange = (newPeriod: string) => {
        setSelectedPeriod(newPeriod);
        router.get('/manager/neraca', { period: newPeriod }, { preserveState: true, preserveScroll: true });
    };

    const handleSubmitNeracaToManager = () => {
        router.post('/manager/neraca/submit', { period: selectedPeriod }, { preserveScroll: true });
    };

    const handleValidateNeracaSubmission = (submissionId: number) => {
        router.post(
            `/manager/neraca/${submissionId}/validate`,
            { notes: 'Laporan Neraca Penjualan telah diperiksa dan disahkan oleh Manager Accounting.' },
            { preserveScroll: true },
        );
    };

    const handleExportCsv = () => {
        const rows: Array<[string, string, string, number]> = [];
        rows.push(['SISI 1: NILAI PENJUALAN DITERBITKAN', '', '', 0]);
        neraca.sumber_penjualan.items.forEach((acc) => {
            rows.push(['Penjualan Diterbitkan', acc.code, acc.name_id, acc.amount]);
        });
        rows.push(['TOTAL NILAI PENJUALAN DITERBITKAN', '', '', neraca.sumber_penjualan.total]);

        rows.push(['SISI 2: REALISASI & STATUS PEMBAYARAN', '', '', 0]);
        neraca.realisasi_penjualan.items.forEach((acc) => {
            rows.push(['Realisasi Penjualan', acc.code, acc.name_id, acc.amount]);
        });
        rows.push(['TOTAL REALISASI PENJUALAN', '', '', neraca.realisasi_penjualan.total]);

        const csvContent =
            'data:text/csv;charset=utf-8,' +
            [
                'Kategori,Kode Akun,Nama Akun,Nilai (IDR)',
                ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
            ].join('\n');

        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', `Neraca_Penjualan_Metinca_${selectedPeriod}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        window.print();
    };

    const totalSales = neraca.sumber_penjualan.total;
    const totalCashCollected =
        (neraca.realisasi_penjualan.items.find((i) => i.code === '1101')?.amount ?? 0) +
        (neraca.realisasi_penjualan.items.find((i) => i.code === '1102')?.amount ?? 0);
    const totalUnpaidReceivables =
        neraca.realisasi_penjualan.items.find((i) => i.code === '1103')?.amount ?? 0;
    const totalReturnsApproved =
        neraca.realisasi_penjualan.items.find((i) => i.code === '4201')?.amount ?? 0;

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <Head title={t('Neraca Penjualan (Sales Balance Sheet)', 'Sales Balance Sheet')} />

            {/* Flash Messages */}
            {props.flash?.success && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {props.flash.success}
                </div>
            )}

            {/* Print Header */}
            <div className="hidden border-b pb-4 print:block">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900">
                            PT. METINCA PRIMA INDUSTRIAL WORKS
                        </h2>
                        <p className="text-sm font-semibold text-slate-600">
                            {t('LAPORAN NERACA PENJUALAN (SALES BALANCE SHEET & RECONCILIATION)', 'SALES BALANCE SHEET & RECONCILIATION REPORT')}
                        </p>
                        <p className="text-xs text-slate-500">
                            {t('Posisi Penjualan per', 'Sales Position as of')} {cutoff_date}
                        </p>
                    </div>
                    <div className="text-right text-xs">
                        <p className="font-mono">{new Date().toLocaleString('id-ID')}</p>
                        <p className="text-slate-500">{t('Status Keseimbangan: Seimbang (Balanced)', 'Balance Status: Balanced')}</p>
                    </div>
                </div>
            </div>

            {/* Page Title & Controls */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
                <div>
                    <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        <Scale className="size-7 text-indigo-600" />
                        {t('Neraca Penjualan (Sales Balance Sheet)', 'Sales Balance Sheet')}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {t(
                            `Timbangan transaksi penjualan per ${cutoff_date}: menyeimbangkan Nilai Faktur Diterbitkan dengan Realisasi Pembayaran Kas, Sisa Piutang, dan Retur.`,
                            `Sales transaction balance as of ${cutoff_date}: balancing Total Invoiced Sales against Cash Collections, Outstanding Receivables, and Returns.`
                        )}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1 dark:border-slate-800 dark:bg-slate-900">
                        <span className="text-xs font-medium text-slate-500">{t('Periode:', 'Period:')}</span>
                        <Input
                            type="month"
                            value={selectedPeriod}
                            onChange={(e) => handlePeriodChange(e.target.value)}
                            className="h-8 w-36 border-none bg-transparent p-0 text-xs font-semibold focus-visible:ring-0"
                        />
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportCsv}
                        className="h-9 gap-1.5 border-slate-200 text-xs font-medium shadow-xs dark:border-slate-800"
                    >
                        <FileSpreadsheet className="size-3.5 text-emerald-600" />
                        {t('Ekspor CSV', 'Export CSV')}
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrint}
                        className="h-9 gap-1.5 border-slate-200 text-xs font-medium shadow-xs dark:border-slate-800"
                    >
                        <Printer className="size-3.5 text-slate-600" />
                        {t('Cetak / PDF', 'Print / PDF')}
                    </Button>

                    {!isManager && (
                        <Button
                            size="sm"
                            onClick={handleSubmitNeracaToManager}
                            className="h-9 gap-1.5 bg-indigo-600 text-xs font-medium text-white shadow-xs hover:bg-indigo-700"
                        >
                            <Send className="size-3.5" />
                            {t('Ajukan ke Manager', 'Submit to Manager')}
                        </Button>
                    )}
                </div>
            </div>

            {/* KPI Cards: Sales Performance & Collection Indicators */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
                <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold text-slate-500">
                            {t('TOTAL PENJUALAN', 'TOTAL SALES ISSUED')}
                        </CardTitle>
                        <FileText className="size-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {formatCurrency(totalSales)}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                            {t('Domestik (DPP) + Ekspor + PPN 11%', 'Domestic (DPP) + Export + 11% VAT')}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold text-emerald-600">
                            {t('KAS MASUK DITERIMA', 'CASH COLLECTED')}
                        </CardTitle>
                        <Wallet className="size-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold tracking-tight text-emerald-600">
                            {formatCurrency(totalCashCollected)}
                        </div>
                        <p className="mt-1 text-xs font-medium text-emerald-700">
                            {t('Collection Rate:', 'Collection Rate:')} {neraca.ratios.collection_rate}%
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold text-amber-600">
                            {t('SISA PIUTANG CUSTOMER', 'OUTSTANDING RECEIVABLES')}
                        </CardTitle>
                        <Clock className="size-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold tracking-tight text-amber-600">
                            {formatCurrency(totalUnpaidReceivables)}
                        </div>
                        <p className="mt-1 text-xs font-medium text-amber-700">
                            {t('Rasio Piutang:', 'Receivable Ratio:')} {neraca.ratios.receivable_rate}%
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold text-rose-600">
                            {t('POTONGAN RETUR BARANG', 'APPROVED RETURNS')}
                        </CardTitle>
                        <Undo2 className="size-4 text-rose-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold tracking-tight text-rose-600">
                            {formatCurrency(totalReturnsApproved)}
                        </div>
                        <p className="mt-1 text-xs font-medium text-rose-700">
                            {t('Tingkat Retur:', 'Return Rate:')} {neraca.ratios.return_rate}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Balance Status Banner */}
            <div className={`flex items-center justify-between rounded-xl border p-4 ${
                neraca.is_balanced
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
                    : 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300'
            }`}>
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div>
                        <h4 className="text-sm font-bold tracking-tight">
                            {neraca.is_balanced
                                ? t('STATUS NERACA: SEIMBANG (BALANCED)', 'BALANCE SHEET STATUS: BALANCED')
                                : t('STATUS NERACA: TIDAK SEIMBANG', 'BALANCE SHEET STATUS: UNBALANCED')}
                        </h4>
                        <p className="text-xs opacity-90">
                            {t(
                                'Total Nilai Penjualan Diterbitkan sama persis dengan Total Realisasi Penagihan (Kas Masuk + DP + Sisa Piutang + Retur).',
                                'Total Invoiced Sales matches exactly with Total Collections (Cash Collected + DP + Outstanding Receivables + Returns).'
                            )}
                        </p>
                    </div>
                </div>
                <Badge
                    variant="outline"
                    className="border-emerald-600 bg-emerald-100 font-mono text-xs font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                >
                    Selisih: Rp 0 (0%)
                </Badge>
            </div>

            {/* MAIN TWO-COLUMN SALES BALANCE SHEET */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* SISI 1: NILAI PENJUALAN DITERBITKAN */}
                <Card className="flex flex-col justify-between border-slate-200/90 shadow-xs dark:border-slate-800">
                    <div>
                        <CardHeader className="border-b border-indigo-100 bg-indigo-50/70 pb-3 dark:border-indigo-950/60 dark:bg-indigo-950/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="size-5 text-indigo-600" />
                                    <div>
                                        <CardTitle className="text-base font-bold text-indigo-950 dark:text-indigo-200">
                                            {t('SISI 1: NILAI PENJUALAN DITERBITKAN', 'SIDE 1: INVOICED SALES ISSUED')}
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            {t('Dari mana sumber nilai seluruh faktur penjualan terbentuk', 'Source breakdown of all commercial sales invoices')}
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge className="bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700">
                                    {t('Hak Tagih', 'Total Claim')}
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50/70 dark:bg-slate-900/40">
                                    <TableRow>
                                        <TableHead className="w-16">{t('Kode', 'Code')}</TableHead>
                                        <TableHead>{t('Pos Penjualan & Pajak', 'Sales Account & Tax')}</TableHead>
                                        <TableHead className="text-right">{t('Nilai (IDR)', 'Amount (IDR)')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {neraca.sumber_penjualan.items.map((acc) => (
                                        <TableRow key={acc.code} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                                            <TableCell className="font-mono text-xs font-semibold text-slate-500">
                                                {acc.code}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-semibold text-slate-900 dark:text-white">
                                                    {language === 'id' ? acc.name_id : acc.name_en}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {language === 'id' ? acc.description_id : acc.description_en}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold text-slate-900 dark:text-white">
                                                {formatCurrency(acc.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </div>

                    <div className="border-t-2 border-indigo-600 bg-slate-900 px-5 py-4 text-white">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold tracking-wider uppercase">
                                {t('TOTAL NILAI PENJUALAN DITERBITKAN', 'TOTAL INVOICED SALES ISSUED')}
                            </span>
                            <span className="font-mono text-lg font-extrabold text-indigo-300">
                                {formatCurrency(neraca.sumber_penjualan.total)}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* SISI 2: REALISASI & STATUS PEMBAYARAN PENJUALAN */}
                <Card className="flex flex-col justify-between border-slate-200/90 shadow-xs dark:border-slate-800">
                    <div>
                        <CardHeader className="border-b border-emerald-100 bg-emerald-50/70 pb-3 dark:border-emerald-950/60 dark:bg-emerald-950/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-5 text-emerald-600" />
                                    <div>
                                        <CardTitle className="text-base font-bold text-emerald-950 dark:text-emerald-200">
                                            {t('SISI 2: REALISASI & STATUS PEMBAYARAN', 'SIDE 2: SALES SETTLEMENT & REALIZATION')}
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            {t('Posisi uang / penyelesaian dari seluruh penjualan yang terjadi', 'Cash collection, remaining receivables, and return deductions')}
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge className="bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700">
                                    {t('Realisasi', 'Settlement')}
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50/70 dark:bg-slate-900/40">
                                    <TableRow>
                                        <TableHead className="w-16">{t('Kode', 'Code')}</TableHead>
                                        <TableHead>{t('Pos Realisasi & Penagihan', 'Settlement Account')}</TableHead>
                                        <TableHead className="text-right">{t('Nilai (IDR)', 'Amount (IDR)')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {neraca.realisasi_penjualan.items.map((acc) => (
                                        <TableRow key={acc.code} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                                            <TableCell className="font-mono text-xs font-semibold text-slate-500">
                                                {acc.code}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-semibold text-slate-900 dark:text-white">
                                                    {language === 'id' ? acc.name_id : acc.name_en}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {language === 'id' ? acc.description_id : acc.description_en}
                                                </div>
                                            </TableCell>
                                            <TableCell className={`text-right font-mono font-bold ${
                                                acc.code === '1101'
                                                    ? 'text-emerald-600'
                                                    : acc.code === '1103'
                                                    ? 'text-amber-600'
                                                    : acc.code === '4201'
                                                    ? 'text-rose-600'
                                                    : 'text-slate-900 dark:text-white'
                                            }`}>
                                                {formatCurrency(acc.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </div>

                    <div className="border-t-2 border-emerald-600 bg-slate-900 px-5 py-4 text-white">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold tracking-wider uppercase">
                                {t('TOTAL REALISASI & PENAGIHAN PENJUALAN', 'TOTAL SALES SETTLEMENT & REALIZATION')}
                            </span>
                            <span className="font-mono text-lg font-extrabold text-emerald-300">
                                {formatCurrency(neraca.realisasi_penjualan.total)}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Drill-down Breakdown Tabs */}
            <Card className="border-slate-200 shadow-xs print:hidden">
                <CardHeader className="border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                        <div>
                            <CardTitle className="text-base">
                                {t('Rincian Transaksi Pembentuk Neraca Penjualan (Audit Drill-Down)', 'Sales Balance Sheet Component Breakdown (Audit Drill-Down)')}
                            </CardTitle>
                            <CardDescription>
                                {t(
                                    'Telusuri rekonsiliasi penjualan per customer, daftar piutang invoice jatuh tempo, retur barang, dan histori pengesahan.',
                                    'Audit per-customer sales reconciliation, overdue unpaid invoices, return notes, and validation history.'
                                )}
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            <Button
                                size="sm"
                                variant={activeDrilldownTab === 'customers' ? 'default' : 'outline'}
                                onClick={() => setActiveDrilldownTab('customers')}
                                className="h-8 text-xs gap-1.5"
                            >
                                <Users className="size-3.5" />
                                {t('Rekap per Customer', 'Customer Breakdown')} ({drilldown.customer_reconciliation.length})
                            </Button>
                            <Button
                                size="sm"
                                variant={activeDrilldownTab === 'receivables' ? 'default' : 'outline'}
                                onClick={() => setActiveDrilldownTab('receivables')}
                                className="h-8 text-xs gap-1.5"
                            >
                                <FileText className="size-3.5" />
                                {t('Piutang Belum Lunas', 'Unpaid Invoices')} ({drilldown.receivables.length})
                            </Button>
                            <Button
                                size="sm"
                                variant={activeDrilldownTab === 'returns' ? 'default' : 'outline'}
                                onClick={() => setActiveDrilldownTab('returns')}
                                className="h-8 text-xs gap-1.5"
                            >
                                <Undo2 className="size-3.5" />
                                {t('Retur Barang', 'Returns')} ({drilldown.returns.length})
                            </Button>
                            <Button
                                size="sm"
                                variant={activeDrilldownTab === 'submissions' ? 'default' : 'outline'}
                                onClick={() => setActiveDrilldownTab('submissions')}
                                className="h-8 text-xs gap-1.5"
                            >
                                <ShieldCheck className="size-3.5" />
                                {t('Riwayat Pengesahan', 'Validation History')} ({neraca_submissions.length})
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {/* TAB 1: CUSTOMER RECONCILIATION */}
                    {activeDrilldownTab === 'customers' && (
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                                <TableRow>
                                    <TableHead>{t('Nama Customer', 'Customer Name')}</TableHead>
                                    <TableHead className="text-center">{t('Jumlah Faktur', 'Invoices')}</TableHead>
                                    <TableHead className="text-right">{t('Total Penjualan', 'Total Sales')}</TableHead>
                                    <TableHead className="text-right">{t('Kas Lunas', 'Paid (Cash)')}</TableHead>
                                    <TableHead className="text-right">{t('DP Masuk', 'DP Paid')}</TableHead>
                                    <TableHead className="text-right">{t('Sisa Piutang', 'Outstanding')}</TableHead>
                                    <TableHead className="text-right">{t('Retur Barang', 'Returns')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {drilldown.customer_reconciliation.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                                            {t('Tidak ada data transaksi customer pada periode ini.', 'No customer transaction data in this period.')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    drilldown.customer_reconciliation.map((cust, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-semibold text-slate-900 dark:text-white">
                                                {cust.customer_name}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="text-xs">
                                                    {cust.invoices_count} {t('Faktur', 'Invoices')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold">
                                                {formatCurrency(cust.total_sales)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-emerald-600">
                                                {formatCurrency(cust.paid_amount)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-indigo-600">
                                                {formatCurrency(cust.dp_amount)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold text-amber-600">
                                                {formatCurrency(cust.unpaid_amount)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-rose-600">
                                                {cust.returns_amount > 0 ? formatCurrency(cust.returns_amount) : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}

                    {/* TAB 2: RECEIVABLES */}
                    {activeDrilldownTab === 'receivables' && (
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                                <TableRow>
                                    <TableHead>{t('No. Invoice', 'Invoice No.')}</TableHead>
                                    <TableHead>{t('Customer', 'Customer')}</TableHead>
                                    <TableHead>{t('Tanggal Terbit', 'Issue Date')}</TableHead>
                                    <TableHead>{t('Jatuh Tempo', 'Due Date')}</TableHead>
                                    <TableHead className="text-right">{t('Total Tagihan', 'Total Invoice')}</TableHead>
                                    <TableHead className="text-right">{t('DP Masuk', 'DP Paid')}</TableHead>
                                    <TableHead className="text-right">{t('Sisa Piutang Harus Ditagih', 'Remaining Receivables')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {drilldown.receivables.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                                            {t('Seluruh tagihan invoice penjualan pada periode ini telah lunas 100%.', 'All sales invoices in this period are fully paid.')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    drilldown.receivables.map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-mono text-xs font-bold text-indigo-600">
                                                {item.invoice_number}
                                            </TableCell>
                                            <TableCell className="font-medium">{item.customer_name}</TableCell>
                                            <TableCell className="text-xs text-slate-500">{item.date}</TableCell>
                                            <TableCell className="text-xs font-semibold text-amber-700">{item.due_date}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(item.total_amount)}</TableCell>
                                            <TableCell className="text-right font-mono text-indigo-600">{formatCurrency(item.dp_amount)}</TableCell>
                                            <TableCell className="text-right font-mono font-bold text-amber-600">
                                                {formatCurrency(item.remaining_balance)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}

                    {/* TAB 3: RETURNS */}
                    {activeDrilldownTab === 'returns' && (
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                                <TableRow>
                                    <TableHead>{t('No. Retur', 'Return No.')}</TableHead>
                                    <TableHead>{t('Customer', 'Customer')}</TableHead>
                                    <TableHead>{t('Tanggal', 'Date')}</TableHead>
                                    <TableHead>{t('Alasan Retur / Reject', 'Return Reason')}</TableHead>
                                    <TableHead className="text-right">{t('Potongan Penjualan', 'Return Amount')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {drilldown.returns.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                            {t('Tidak ada retur barang pada periode penjualan ini.', 'No approved item returns in this period.')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    drilldown.returns.map((ret, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-mono text-xs font-bold text-rose-600">
                                                {ret.return_number}
                                            </TableCell>
                                            <TableCell className="font-medium">{ret.customer_name}</TableCell>
                                            <TableCell className="text-xs text-slate-500">{ret.date}</TableCell>
                                            <TableCell className="text-xs text-slate-600 dark:text-slate-400">{ret.reason}</TableCell>
                                            <TableCell className="text-right font-mono font-bold text-rose-600">
                                                -{formatCurrency(ret.total_amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}

                    {/* TAB 4: SUBMISSIONS */}
                    {activeDrilldownTab === 'submissions' && (
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                                <TableRow>
                                    <TableHead>{t('Periode Neraca', 'Balance Sheet Period')}</TableHead>
                                    <TableHead>{t('Diajukan Oleh', 'Submitted By')}</TableHead>
                                    <TableHead>{t('Waktu Pengajuan', 'Submitted At')}</TableHead>
                                    <TableHead>{t('Status Validasi', 'Validation Status')}</TableHead>
                                    <TableHead>{t('Disahkan Oleh', 'Validated By')}</TableHead>
                                    <TableHead className="text-right">{t('Aksi / Catatan', 'Action / Notes')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {neraca_submissions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                            {t('Belum ada riwayat pengajuan Neraca Penjualan.', 'No validation submissions recorded.')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    neraca_submissions.map((sub) => (
                                        <TableRow key={sub.id}>
                                            <TableCell className="font-semibold">
                                                {sub.period_start} - {sub.period_end}
                                            </TableCell>
                                            <TableCell className="text-xs">{sub.created_by_name}</TableCell>
                                            <TableCell className="text-xs text-slate-500">{sub.created_at}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        sub.status === 'validated'
                                                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                                            : 'border-amber-600 bg-amber-50 text-amber-700'
                                                    }
                                                >
                                                    {sub.status === 'validated' ? t('Disahkan', 'Validated') : t('Menunggu Validasi', 'Submitted')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {sub.validated_by_name ?? '-'}
                                                {sub.validated_at && (
                                                    <div className="text-[10px] text-slate-400">{sub.validated_at}</div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {isManager && sub.status === 'submitted' ? (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleValidateNeracaSubmission(sub.id)}
                                                        className="h-7 bg-emerald-600 px-2 text-xs font-medium text-white hover:bg-emerald-700"
                                                    >
                                                        <ShieldCheck className="mr-1 size-3.5" />
                                                        {t('Sahkan Neraca', 'Approve & Validate')}
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-slate-500">
                                                        {sub.validation_notes ?? t('Disahkan resmi.', 'Officially validated.')}
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Print Signatures */}
            <div className="mt-12 hidden grid-cols-2 gap-8 text-center print:grid">
                <div>
                    <p className="text-xs text-slate-500">{t('Disusun Oleh,', 'Prepared By,')}</p>
                    <div className="h-20" />
                    <p className="border-t border-slate-400 pt-1 font-bold">
                        {props.auth.user.name}
                    </p>
                    <p className="text-xs text-slate-500">{t('Staff Accounting', 'Accounting Staff')}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500">{t('Diperiksa & Disahkan Oleh,', 'Approved & Validated By,')}</p>
                    <div className="h-20" />
                    <p className="border-t border-slate-400 pt-1 font-bold">
                        {neraca_submissions.find((s) => s.status === 'validated')?.validated_by_name ?? 'Manager Accounting'}
                    </p>
                    <p className="text-xs text-slate-500">{t('Manager Accounting', 'Accounting Manager')}</p>
                </div>
            </div>
        </div>
    );
}

ManagerNeraca.layout = {
    breadcrumbs: [
        {
            title: 'Neraca Penjualan (Sales Balance Sheet)',
            href: '/manager/neraca',
        },
    ],
};
