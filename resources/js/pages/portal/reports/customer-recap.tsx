import { Head, router } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    Clock,
    DollarSign,
    FileSpreadsheet,
    FileText,
    Package,
    Printer,
    RotateCcw,
    Search,
    Undo2,
    Users,
    Wallet,
} from 'lucide-react';
import * as React from 'react';
import { useCurrency } from '@/components/currency-context';
import { useLanguage } from '@/components/language-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Customer {
    id: number;
    name: string;
    email: string | null;
}

interface InvoiceLineItem {
    product_code: string;
    product_name: string;
    unit: string;
    quantity: number;
    price: number;
    subtotal: number;
}

interface InvoiceReturnNote {
    return_number: string;
    date: string;
    type: string;
    reason: string;
    total_amount: number;
}

interface InvoiceDetail {
    id: number;
    invoice_number: string;
    order_id: string;
    customer_id: number | null;
    customer_name: string;
    customer_email: string;
    sales_rep: string;
    invoice_type: string;
    currency: string;
    exchange_rate: number;
    transaction_date: string;
    validated_at: string | null;
    due_date: string | null;
    delivery_date: string | null;
    deadline_date: string | null;
    subtotal: number;
    tax_percent: number;
    tax_amount: number;
    total_amount: number;
    dp_amount: number;
    paid_amount: number;
    return_amount: number;
    remaining_balance: number;
    days_late: number;
    penalty_amount: number;
    status: string;
    items: InvoiceLineItem[];
    returns: InvoiceReturnNote[];
}

interface CustomerSummaryRow {
    customer_id: number | null;
    customer_name: string;
    customer_email: string;
    invoices_count: number;
    total_sales: number;
    paid_amount: number;
    remaining_balance: number;
    return_amount: number;
    penalty_amount: number;
}

interface CustomerRecapProps {
    customers: Customer[];
    selectedCustomerId: string;
    filters: {
        customer_id: string;
        status: string;
        date_from: string | null;
        date_to: string | null;
    };
    invoices: InvoiceDetail[];
    customerSummaries: CustomerSummaryRow[];
}

export default function CustomerRecap({
    customers,
    selectedCustomerId,
    filters,
    invoices,
    customerSummaries,
}: CustomerRecapProps) {
    const { formatPrice } = useCurrency();
    const { t } = useLanguage();

    const [expandedIds, setExpandedIds] = React.useState<Record<number, boolean>>({});
    const [dateFrom, setDateFrom] = React.useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = React.useState(filters.date_to ?? '');

    const applyFilter = (overrides: Record<string, string>) => {
        const params: Record<string, string> = {
            customer_id: overrides.customer_id ?? filters.customer_id ?? 'all',
            status: overrides.status ?? filters.status ?? 'all',
            date_from: overrides.date_from !== undefined ? overrides.date_from : dateFrom,
            date_to: overrides.date_to !== undefined ? overrides.date_to : dateTo,
        };
        router.get('/reports/customer-recap', params, { preserveState: true, preserveScroll: true });
    };

    const handleResetFilters = () => {
        setDateFrom('');
        setDateTo('');
        router.get('/reports/customer-recap', { customer_id: 'all', status: 'all' }, { preserveState: true });
    };

    const toggleExpand = (id: number) => {
        setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const selectedCustomer = customers.find((c) => String(c.id) === String(selectedCustomerId));

    const totals = React.useMemo(() => {
        return invoices.reduce(
            (acc, item) => ({
                totalSales: acc.totalSales + Number(item.total_amount || 0),
                totalPaid: acc.totalPaid + Number(item.paid_amount || 0),
                totalRemaining: acc.totalRemaining + Number(item.remaining_balance || 0),
                totalReturns: acc.totalReturns + Number(item.return_amount || 0),
                totalPenalty: acc.totalPenalty + Number(item.penalty_amount || 0),
            }),
            { totalSales: 0, totalPaid: 0, totalRemaining: 0, totalReturns: 0, totalPenalty: 0 },
        );
    }, [invoices]);

    const handleExportCsv = () => {
        const headers = [
            'No. Invoice',
            'No. Order',
            'Tanggal Transaksi',
            'Tgl Validasi',
            'Customer',
            'Sales Rep',
            'Tipe',
            'Mata Uang',
            'Subtotal (DPP)',
            'PPN',
            'Total Tagihan',
            'Sudah Dibayar / DP',
            'Potongan Retur',
            'Sisa Piutang',
            'Batas Bayar',
            'Telat (Hari)',
            'Denda',
            'Status',
            'Rincian Produk',
        ];

        const csvRows = invoices.map((inv) => {
            const productSummary = inv.items
                .map((it) => `${it.product_name} (${it.quantity} ${it.unit})`)
                .join('; ');
            return [
                inv.invoice_number,
                inv.order_id,
                inv.transaction_date,
                inv.validated_at || '-',
                inv.customer_name,
                inv.sales_rep,
                inv.invoice_type,
                inv.currency,
                inv.subtotal,
                inv.tax_amount,
                inv.total_amount,
                inv.paid_amount,
                inv.return_amount,
                inv.remaining_balance,
                inv.deadline_date || '-',
                inv.days_late,
                inv.penalty_amount,
                inv.status,
                productSummary || '-',
            ]
                .map((val) => `"${String(val).replace(/"/g, '""')}"`)
                .join(',');
        });

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows].join('\n');
        const link = document.createElement('a');
        const fileLabel = selectedCustomer ? selectedCustomer.name.replace(/\s+/g, '_') : 'Semua_Customer';
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', `Rekap_Penjualan_${fileLabel}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderStatusBadge = (status: string) => {
        const normalized = status.toLowerCase();
        if (normalized === 'lunas' || normalized === 'paid') {
            return <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">Lunas</Badge>;
        }
        if (normalized === 'utang' || normalized === 'unpaid') {
            return <Badge className="bg-amber-600 text-white hover:bg-amber-700">Utang</Badge>;
        }
        if (normalized === 'submitted') {
            return <Badge variant="outline" className="border-blue-500 text-blue-600">Menunggu Validasi</Badge>;
        }
        return <Badge variant="secondary">{status}</Badge>;
    };

    return (
        <>
            <Head title={t('Rekapan Penjualan per Customer', 'Sales Recap per Customer')} />
            <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
                {/* Print Header */}
                <div className="hidden border-b pb-4 print:block">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">PT. METINCA PRIMA INDUSTRIAL WORKS</h2>
                            <p className="text-sm font-semibold text-slate-600">
                                {t('REKAPAN PENJUALAN & TAGIHAN PER CUSTOMER', 'SALES & STATEMENT RECAP PER CUSTOMER')}
                            </p>
                            <p className="text-xs text-slate-500">
                                Customer: {selectedCustomer ? selectedCustomer.name : t('Semua Customer', 'All Customers')}
                            </p>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                            {new Date().toLocaleString('id-ID')}
                        </div>
                    </div>
                </div>

                {/* Page Header */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center print:hidden">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {t('Rekapan Penjualan per Customer', 'Sales Recap per Customer')}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {t(
                                'Rincian lengkap transaksi penjualan, item produk terjual, status pembayaran, potongan retur, serta denda keterlambatan per customer.',
                                'Complete details of sales transactions, sold products, payment realization, return deductions, and late payment penalties per customer.',
                            )}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportCsv}
                            disabled={invoices.length === 0}
                            className="gap-1.5 border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100/70"
                        >
                            <FileSpreadsheet className="size-4 text-emerald-600" />
                            {t('Ekspor CSV', 'Export CSV')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            className="gap-1.5"
                        >
                            <Printer className="size-4" />
                            {t('Cetak / PDF', 'Print / PDF')}
                        </Button>
                    </div>
                </div>

                {/* Filters Card */}
                <Card className="border border-sidebar-border/70 print:hidden">
                    <CardHeader className="bg-muted/30 border-b pb-4">
                        <CardTitle className="text-base">{t('Filter Rekapan Customer', 'Customer Report Filter')}</CardTitle>
                        <CardDescription>
                            {t(
                                'Pilih customer tertentu atau tampilkan seluruh customer dengan filter status dan periode tanggal.',
                                'Select a specific customer or view all customers filtered by status and date range.',
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-5">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            <div className="space-y-1.5 lg:col-span-2">
                                <Label className="text-xs font-semibold">{t('Pilih Customer', 'Select Customer')}</Label>
                                <Select
                                    value={selectedCustomerId || 'all'}
                                    onValueChange={(val) => applyFilter({ customer_id: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Semua Customer', 'All Customers')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('Semua Customer (Ringkasan & Detail)', 'All Customers (Summary & Details)')}</SelectItem>
                                        {customers.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">{t('Status Pembayaran', 'Payment Status')}</Label>
                                <Select
                                    value={filters.status || 'all'}
                                    onValueChange={(val) => applyFilter({ status: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('Semua Status', 'All Status')}</SelectItem>
                                        <SelectItem value="lunas">{t('Lunas', 'Paid (Lunas)')}</SelectItem>
                                        <SelectItem value="utang">{t('Utang / Belum Lunas', 'Unpaid (Utang)')}</SelectItem>
                                        <SelectItem value="submitted">{t('Menunggu Validasi', 'Submitted')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">{t('Dari Tanggal', 'Date From')}</Label>
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => {
                                        setDateFrom(e.target.value);
                                        applyFilter({ date_from: e.target.value });
                                    }}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">{t('Sampai Tanggal', 'Date To')}</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => {
                                            setDateTo(e.target.value);
                                            applyFilter({ date_to: e.target.value });
                                        }}
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        title={t('Reset Filter', 'Reset Filter')}
                                        onClick={handleResetFilters}
                                    >
                                        <RotateCcw className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 4 KPI Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="shadow-xs border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                                {t('Total Penjualan', 'Total Sales')}
                            </CardTitle>
                            <DollarSign className="size-4 text-indigo-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
                                {formatPrice(totals.totalSales)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {invoices.length} {t('dokumen faktur invoice', 'invoice documents')}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-xs border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase text-emerald-600">
                                {t('Sudah Dibayar (Lunas + DP)', 'Collected (Paid + DP)')}
                            </CardTitle>
                            <Wallet className="size-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">
                                {formatPrice(totals.totalPaid)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {totals.totalSales > 0
                                    ? `${Math.round((totals.totalPaid / totals.totalSales) * 100)}% ${t('dari total tagihan', 'of total invoiced')}`
                                    : '0%'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-xs border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase text-amber-600">
                                {t('Sisa Piutang Customer', 'Remaining Receivables')}
                            </CardTitle>
                            <Clock className="size-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">
                                {formatPrice(totals.totalRemaining)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {t('Tagihan bersih belum terbayar', 'Net unpaid balance')}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-xs border-rose-200 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/10">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase text-rose-600">
                                {t('Retur & Estimasi Denda', 'Returns & Late Penalty')}
                            </CardTitle>
                            <Undo2 className="size-4 text-rose-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-rose-600">
                                {formatPrice(totals.totalReturns + totals.totalPenalty)}
                            </div>
                            <p className="mt-1 text-xs text-rose-600/80">
                                Retur: {formatPrice(totals.totalReturns)} | Denda: {formatPrice(totals.totalPenalty)}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Overview Table per Customer (when All Customers selected) */}
                {selectedCustomerId === 'all' && customerSummaries.length > 0 && (
                    <Card className="border border-sidebar-border/70">
                        <CardHeader className="bg-muted/20 border-b pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="size-4 text-indigo-600" />
                                    <CardTitle className="text-base">
                                        {t('Ringkasan Penjualan per Customer', 'Sales Summary per Customer')}
                                    </CardTitle>
                                </div>
                                <span className="text-xs text-muted-foreground print:hidden">
                                    {t('Klik baris customer untuk memfilter rincian invoicenya', 'Click a customer row to filter their invoices')}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow>
                                        <TableHead>{t('Nama Customer', 'Customer Name')}</TableHead>
                                        <TableHead className="text-center">{t('Jml Faktur', 'Invoices')}</TableHead>
                                        <TableHead className="text-right">{t('Total Penjualan', 'Total Sales')}</TableHead>
                                        <TableHead className="text-right">{t('Sudah Dibayar', 'Paid / DP')}</TableHead>
                                        <TableHead className="text-right">{t('Sisa Piutang', 'Receivables')}</TableHead>
                                        <TableHead className="text-right">{t('Retur', 'Returns')}</TableHead>
                                        <TableHead className="text-right">{t('Denda', 'Penalty')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customerSummaries.map((cust, idx) => (
                                        <TableRow
                                            key={idx}
                                            className="cursor-pointer hover:bg-muted/40"
                                            onClick={() => applyFilter({ customer_id: String(cust.customer_id ?? 'all') })}
                                        >
                                            <TableCell>
                                                <div className="font-semibold text-indigo-600 dark:text-indigo-400">
                                                    {cust.customer_name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">{cust.customer_email}</div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary">{cust.invoices_count}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold">
                                                {formatPrice(cust.total_sales)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-emerald-600">
                                                {formatPrice(cust.paid_amount)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold text-amber-600">
                                                {formatPrice(cust.remaining_balance)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-rose-600">
                                                {cust.return_amount > 0 ? formatPrice(cust.return_amount) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-rose-600">
                                                {cust.penalty_amount > 0 ? formatPrice(cust.penalty_amount) : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* Detailed Invoices Table with Expandable Line Items */}
                <Card className="border border-sidebar-border/70">
                    <CardHeader className="bg-muted/20 border-b pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="size-4 text-primary" />
                                <CardTitle className="text-base">
                                    {t('Rincian Transaksi Invoice & Item Barang', 'Detailed Invoices & Sold Items')}
                                </CardTitle>
                            </div>
                            <span className="text-xs text-muted-foreground print:hidden">
                                {t('Klik baris invoice untuk melihat detail produk & retur', 'Click an invoice row to expand product & return details')}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead className="w-8 print:hidden"></TableHead>
                                    <TableHead>{t('No. Invoice / Order', 'Invoice / Order')}</TableHead>
                                    <TableHead>{t('Tanggal & Validasi', 'Transaction & Validated')}</TableHead>
                                    <TableHead>{t('Customer & Sales Rep', 'Customer & Sales Rep')}</TableHead>
                                    <TableHead>{t('Tipe / Kurs', 'Type / Currency')}</TableHead>
                                    <TableHead className="text-right">{t('Subtotal (DPP)', 'Subtotal')}</TableHead>
                                    <TableHead className="text-right">{t('PPN', 'VAT')}</TableHead>
                                    <TableHead className="text-right">{t('Total Tagihan', 'Total Billed')}</TableHead>
                                    <TableHead className="text-right">{t('Dibayar / DP', 'Paid / DP')}</TableHead>
                                    <TableHead className="text-right">{t('Retur', 'Returns')}</TableHead>
                                    <TableHead className="text-right">{t('Sisa Piutang', 'Balance')}</TableHead>
                                    <TableHead>{t('Jatuh Tempo & Denda', 'Deadline & Penalty')}</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={13} className="h-32 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Search className="size-8 opacity-30" />
                                                {t('Tidak ada data transaksi yang sesuai dengan filter.', 'No transaction records match the selected filters.')}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    invoices.map((inv) => {
                                        const isExpanded = !!expandedIds[inv.id];
                                        return (
                                            <React.Fragment key={inv.id}>
                                                <TableRow
                                                    className="cursor-pointer hover:bg-muted/40"
                                                    onClick={() => toggleExpand(inv.id)}
                                                >
                                                    <TableCell className="print:hidden">
                                                        {isExpanded ? (
                                                            <ChevronDown className="size-4 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronRight className="size-4 text-muted-foreground" />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        <div className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                                                            {inv.invoice_number}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground">
                                                            {inv.order_id} ({inv.items.length} item)
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-xs">
                                                        <div className="font-medium">{inv.transaction_date}</div>
                                                        <div className="text-[11px] text-muted-foreground">
                                                            {inv.validated_at ? `Val: ${inv.validated_at}` : 'Belum validasi'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-semibold text-xs">{inv.customer_name}</div>
                                                        <div className="text-[11px] text-muted-foreground">Sales: {inv.sales_rep}</div>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        {inv.invoice_type === 'domestik' ? (
                                                            <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-[10px]">
                                                                Domestik
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                                                                Ekspor ({inv.currency})
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-xs whitespace-nowrap">
                                                        {formatPrice(inv.subtotal)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-xs text-muted-foreground whitespace-nowrap">
                                                        {inv.tax_amount > 0 ? formatPrice(inv.tax_amount) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-xs font-bold whitespace-nowrap">
                                                        {formatPrice(inv.total_amount)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-xs text-emerald-600 whitespace-nowrap">
                                                        {formatPrice(inv.paid_amount)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-xs text-rose-600 whitespace-nowrap">
                                                        {inv.return_amount > 0 ? `-${formatPrice(inv.return_amount)}` : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-xs font-bold text-amber-600 whitespace-nowrap">
                                                        {inv.remaining_balance > 0 ? formatPrice(inv.remaining_balance) : 'Rp 0'}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-xs">
                                                        <div>
                                                            {inv.deadline_date ? (
                                                                <span className="font-medium">{inv.deadline_date}</span>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </div>
                                                        {inv.days_late > 0 && (
                                                            <div className="text-[11px] font-bold text-red-600">
                                                                Telat {inv.days_late}h ({formatPrice(inv.penalty_amount)})
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center whitespace-nowrap">
                                                        {renderStatusBadge(inv.status)}
                                                    </TableCell>
                                                </TableRow>

                                                {/* Expandable Line Items & Return Notes */}
                                                {isExpanded && (
                                                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                                                        <TableCell colSpan={13} className="p-4">
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <h5 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                                        <Package className="size-3.5 text-indigo-600" />
                                                                        {t('Rincian Item Barang Terjual', 'Sold Product Line Items')} ({inv.invoice_number})
                                                                    </h5>
                                                                    <div className="rounded border bg-background overflow-hidden">
                                                                        <Table>
                                                                            <TableHeader className="bg-muted/40">
                                                                                <TableRow>
                                                                                    <TableHead className="text-xs">{t('Kode', 'Code')}</TableHead>
                                                                                    <TableHead className="text-xs">{t('Nama Barang', 'Product Name')}</TableHead>
                                                                                    <TableHead className="text-center text-xs">{t('Qty & Satuan', 'Qty & Unit')}</TableHead>
                                                                                    <TableHead className="text-right text-xs">{t('Harga Satuan', 'Unit Price')}</TableHead>
                                                                                    <TableHead className="text-right text-xs">{t('Subtotal', 'Subtotal')}</TableHead>
                                                                                </TableRow>
                                                                            </TableHeader>
                                                                            <TableBody>
                                                                                {inv.items.length === 0 ? (
                                                                                    <TableRow>
                                                                                        <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-3">
                                                                                            {t('Tidak ada rincian barang.', 'No line items recorded.')}
                                                                                        </TableCell>
                                                                                    </TableRow>
                                                                                ) : (
                                                                                    inv.items.map((item, idx) => (
                                                                                        <TableRow key={idx}>
                                                                                            <TableCell className="font-mono text-xs">{item.product_code}</TableCell>
                                                                                            <TableCell className="text-xs font-medium">{item.product_name}</TableCell>
                                                                                            <TableCell className="text-center text-xs">
                                                                                                {item.quantity} {item.unit}
                                                                                            </TableCell>
                                                                                            <TableCell className="text-right font-mono text-xs">
                                                                                                {formatPrice(item.price)}
                                                                                            </TableCell>
                                                                                            <TableCell className="text-right font-mono text-xs font-semibold">
                                                                                                {formatPrice(item.subtotal)}
                                                                                            </TableCell>
                                                                                        </TableRow>
                                                                                    ))
                                                                                )}
                                                                            </TableBody>
                                                                        </Table>
                                                                    </div>
                                                                </div>

                                                                {inv.returns.length > 0 && (
                                                                    <div>
                                                                        <h5 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-700">
                                                                            <Undo2 className="size-3.5 text-rose-600" />
                                                                            {t('Potongan Retur Barang Disetujui', 'Approved Item Returns')}
                                                                        </h5>
                                                                        <div className="rounded border border-rose-200 bg-rose-50/40 overflow-hidden">
                                                                            <Table>
                                                                                <TableHeader>
                                                                                    <TableRow>
                                                                                        <TableHead className="text-xs">{t('No. Retur', 'Return No.')}</TableHead>
                                                                                        <TableHead className="text-xs">{t('Tanggal', 'Date')}</TableHead>
                                                                                        <TableHead className="text-xs">{t('Alasan Retur', 'Reason')}</TableHead>
                                                                                        <TableHead className="text-right text-xs">{t('Nilai Potongan', 'Deduction')}</TableHead>
                                                                                    </TableRow>
                                                                                </TableHeader>
                                                                                <TableBody>
                                                                                    {inv.returns.map((rtn, rIdx) => (
                                                                                        <TableRow key={rIdx}>
                                                                                            <TableCell className="font-mono text-xs font-bold text-rose-700">
                                                                                                {rtn.return_number}
                                                                                            </TableCell>
                                                                                            <TableCell className="text-xs">{rtn.date}</TableCell>
                                                                                            <TableCell className="text-xs">{rtn.reason}</TableCell>
                                                                                            <TableCell className="text-right font-mono text-xs font-bold text-rose-700">
                                                                                                -{formatPrice(rtn.total_amount)}
                                                                                            </TableCell>
                                                                                        </TableRow>
                                                                                    ))}
                                                                                </TableBody>
                                                                            </Table>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

CustomerRecap.layout = {
    breadcrumbs: [
        {
            title: 'Reports',
            href: '#',
        },
        {
            title: 'Rekapan Penjualan per Customer',
            href: '/reports/customer-recap',
        },
    ],
};
