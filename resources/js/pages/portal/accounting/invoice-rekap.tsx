import { Head } from '@inertiajs/react';
import { FileText, ClipboardList, TrendingUp } from 'lucide-react';
import * as React from 'react';
import { useCurrency } from '@/components/currency-context';
import { useLanguage } from '@/components/language-context';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface InvoiceItem {
    id: string;
    order_id: string;
    customer_name: string;
    invoice_type: 'domestik' | 'international';
    subtotal: number;
    tax_percent: number;
    tax_amount: number;
    dp_amount: number;
    total_amount: number;
    status: string;
    created_at: string;
    currency: string;
    exchange_rate: number;
}

interface InvoiceRekapProps {
    invoices: InvoiceItem[];
}

export default function InvoiceRekap({ invoices }: InvoiceRekapProps) {
    const { formatPrice } = useCurrency();
    const { t } = useLanguage();

    const formatPriceWithCurrency = (amount: number, currencyCode: string) => {
        if (currencyCode === 'USD') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
            }).format(amount);
        } else if (currencyCode === 'EUR') {
            return new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR',
            }).format(amount);
        }
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const stats = React.useMemo(() => {
        let totalRevenue = 0;
        let localCount = 0;
        let exportCount = 0;

        invoices.forEach(inv => {
            totalRevenue += Number(inv.total_amount);

            if (inv.invoice_type === 'domestik') {
                localCount++;
            } else {
                exportCount++;
            }
        });

        return { totalRevenue, localCount, exportCount };
    }, [invoices]);

    return (
        <>
            <Head title={t('Rekap Invoice PO', 'PO Invoice Recap')} />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t('Rekap Invoice PO', 'PO Invoice Recap')}</h1>
                        <p className="text-muted-foreground text-sm">
                            {t('Daftar invoice penjualan terbit berdasarkan jenis (Domestik & Internasional).', 'List of issued sales invoices grouped by type (Domestic & International).')}
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-2 flex items-center gap-3">
                            <TrendingUp className="text-primary size-5" />
                            <div>
                                <div className="text-xs text-muted-foreground">{t('Total Tagihan', 'Total Invoiced')}</div>
                                <div className="text-lg font-bold text-primary">{formatPrice(stats.totalRevenue)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border bg-card text-card-foreground p-5 flex flex-col gap-1 shadow-xs">
                        <span className="text-sm font-medium text-muted-foreground">{t('Invoice Domestik', 'Domestic Invoices')}</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold">{stats.localCount}</span>
                            <span className="text-xs text-muted-foreground">{t('Dengan PPN 11%', 'With 11% VAT')}</span>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card text-card-foreground p-5 flex flex-col gap-1 shadow-xs">
                        <span className="text-sm font-medium text-muted-foreground">{t('Invoice Internasional', 'International Invoices')}</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold">{stats.exportCount}</span>
                            <span className="text-xs text-muted-foreground">{t('Tanpa PPN', 'VAT Exempt')}</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-md border border-sidebar-border/70 bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('ID Invoice', 'Invoice ID')}</TableHead>
                                <TableHead>{t('ID Pesanan / PO', 'Order / PO ID')}</TableHead>
                                <TableHead>{t('Tanggal', 'Date Created')}</TableHead>
                                <TableHead>{t('Pelanggan', 'Customer')}</TableHead>
                                <TableHead>{t('Jenis', 'Type')}</TableHead>
                                <TableHead>{t('Valuta / Rate', 'Currency / Rate')}</TableHead>
                                <TableHead className="text-right">{t('Subtotal', 'Subtotal')}</TableHead>
                                <TableHead className="text-right">{t('Pajak / PPN', 'Tax / VAT')}</TableHead>
                                <TableHead className="text-right">{t('DP / Uang Muka', 'Down Payment')}</TableHead>
                                <TableHead className="text-right">{t('Total Tagihan', 'Grand Total')}</TableHead>
                                <TableHead className="text-center">{t('Status', 'Status')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <FileText className="size-8 opacity-30" />
                                            {t('Belum ada invoice yang diterbitkan.', 'No invoices have been issued yet.')}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                invoices.map((inv) => (
                                    <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-bold flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                                            <FileText className="size-3.5" />
                                            {inv.id}
                                        </TableCell>
                                        <TableCell className="font-semibold text-xs">{inv.order_id}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{inv.created_at}</TableCell>
                                        <TableCell className="font-medium text-xs">{inv.customer_name}</TableCell>
                                        <TableCell>
                                            {inv.invoice_type === 'domestik' ? (
                                                <Badge variant="default" className="bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-50 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/50">
                                                    Domestik
                                                </Badge>
                                            ) : (
                                                <Badge variant="default" className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/50">
                                                    Internasional
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs font-medium">
                                            {inv.currency === 'IDR' ? (
                                                <span className="text-muted-foreground">IDR</span>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-foreground">{inv.currency}</span>
                                                    <span className="text-[10px] text-muted-foreground/80">
                                                        Rate: {new Intl.NumberFormat('id-ID').format(inv.exchange_rate)}
                                                    </span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right text-xs">
                                            <div className="flex flex-col text-right">
                                                <span className="font-medium">
                                                    {formatPriceWithCurrency(inv.currency === 'IDR' ? inv.subtotal : inv.subtotal / inv.exchange_rate, inv.currency)}
                                                </span>
                                                {inv.currency !== 'IDR' && (
                                                    <span className="text-[10px] text-muted-foreground/80">
                                                        {formatPriceWithCurrency(inv.subtotal, 'IDR')}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-xs">
                                            {inv.tax_amount > 0 ? (
                                                <div className="flex flex-col text-right">
                                                    <span className="font-medium">
                                                        {formatPriceWithCurrency(inv.currency === 'IDR' ? inv.tax_amount : inv.tax_amount / inv.exchange_rate, inv.currency)}
                                                    </span>
                                                    <div className="text-[10px] text-muted-foreground/80 flex items-center justify-end gap-1">
                                                        {inv.currency !== 'IDR' && (
                                                            <span>{formatPriceWithCurrency(inv.tax_amount, 'IDR')}</span>
                                                        )}
                                                        <span className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-1 py-0.25 rounded text-[9px] font-semibold">
                                                            {inv.tax_percent}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right text-xs">
                                            {inv.dp_amount > 0 ? (
                                                <div className="flex flex-col text-right text-red-500 font-medium">
                                                    <span>
                                                        -{formatPriceWithCurrency(inv.currency === 'IDR' ? inv.dp_amount : inv.dp_amount / inv.exchange_rate, inv.currency)}
                                                    </span>
                                                    {inv.currency !== 'IDR' && (
                                                        <span className="text-[10px] text-red-400">
                                                            -{formatPriceWithCurrency(inv.dp_amount, 'IDR')}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col text-right font-bold text-slate-800 dark:text-zinc-200">
                                                <span>
                                                    {formatPriceWithCurrency(inv.currency === 'IDR' ? inv.total_amount : inv.total_amount / inv.exchange_rate, inv.currency)}
                                                </span>
                                                {inv.currency !== 'IDR' && (
                                                    <span className="text-[10px] text-muted-foreground/80 font-normal">
                                                        {formatPriceWithCurrency(inv.total_amount, 'IDR')}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50">
                                                {inv.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    );
}

InvoiceRekap.layout = {
    breadcrumbs: [
        {
            title: 'Invoice Recap',
            href: '/accounting/invoice-rekap',
        },
    ],
};
