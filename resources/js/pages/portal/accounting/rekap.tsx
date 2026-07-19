import { Head, useForm } from '@inertiajs/react';
import { Package, Award, Clock, FileText, CheckCircle2 } from 'lucide-react';
import * as React from 'react';
import { useCurrency } from '@/components/currency-context';
import { useLanguage } from '@/components/language-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RecapItem {
    id: string;
    date_raised: string;
    validated_at: string | null;
    validated_by_name: string;
    customer_name: string;
    sales_rep: string;
    total_amount: number;
    has_invoice: boolean;
    invoice_id: string | null;
    currency: string;
    exchange_rate: number;
}

interface RekapProps {
    orders: RecapItem[];
}

export default function Rekap({ orders }: RekapProps) {
    const { formatPrice } = useCurrency();
    const { t } = useLanguage();

    const [isOpen, setIsOpen] = React.useState(false);
    const [activeOrder, setActiveOrder] = React.useState<RecapItem | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        order_id: '',
        invoice_type: 'domestik',
        dp_amount: 0,
        due_date: '',
        delivery_date: '',
        tax_percent: 11,
        exchange_rate: 1,
    });

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

    const grandTotalSales = React.useMemo(() => {
        return orders.reduce((sum, item) => sum + Number(item.total_amount), 0);
    }, [orders]);

    // Live calculation for the modal
    const calculation = React.useMemo(() => {
        if (!activeOrder) {
            return {
                subtotal_idr: 0, tax_idr: 0, dp_idr: 0, total_idr: 0,
                subtotal_orig: 0, tax_orig: 0, dp_orig: 0, total_orig: 0
            };
        }

        const exchangeRate = Number(data.exchange_rate) || 1;
        const taxPercent = Number(data.tax_percent) || 0;
        
        // base subtotal in IDR (order total amount is subtotal * 1.11)
        const subtotal_idr = Number(activeOrder.total_amount) / 1.11;
        const tax_idr = subtotal_idr * (taxPercent / 100);
        
        const dp_amount_orig = Number(data.dp_amount) || 0;
        const dp_idr = activeOrder.currency === 'IDR' ? dp_amount_orig : dp_amount_orig * exchangeRate;
        
        const total_idr = subtotal_idr + tax_idr - dp_idr;

        const subtotal_orig = activeOrder.currency === 'IDR' ? subtotal_idr : subtotal_idr / exchangeRate;
        const tax_orig = activeOrder.currency === 'IDR' ? tax_idr : tax_idr / exchangeRate;
        const dp_orig = dp_amount_orig;
        const total_orig = activeOrder.currency === 'IDR' ? total_idr : total_idr / exchangeRate;

        return {
            subtotal_idr, tax_idr, dp_idr, total_idr,
            subtotal_orig, tax_orig, dp_orig, total_orig
        };
    }, [activeOrder, data.tax_percent, data.exchange_rate, data.dp_amount]);

    const handleSubmitInvoice = (e: React.FormEvent) => {
        e.preventDefault();
        post('/accounting/invoices', {
            onSuccess: () => {
                setIsOpen(false);
                reset();
                setActiveOrder(null);
            }
        });
    };

    return (
        <>
            <Head title={t('Rekap Penjualan', 'Sales Recap')} />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t('Rekap Penjualan', 'Sales Recap')}</h1>
                        <p className="text-muted-foreground text-sm">
                            {t('Log transaksi pesanan tervalidasi yang sah untuk pembukuan.', 'Log of approved and validated sales orders for accounting records.')}
                        </p>
                    </div>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-2 flex items-center gap-3 self-start">
                        <Package className="text-primary size-5" />
                        <div>
                            <div className="text-xs text-muted-foreground">{t('Total Nilai Validasi', 'Validated Value')}</div>
                            <div className="text-lg font-bold text-primary">{formatPrice(grandTotalSales)}</div>
                        </div>
                    </div>
                </div>

                <div className="rounded-md border border-sidebar-border/70 bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('ID Pesanan', 'Order ID')}</TableHead>
                                <TableHead>{t('Tanggal Buat', 'Date Raised')}</TableHead>
                                <TableHead>{t('Tanggal Validasi', 'Date Approved')}</TableHead>
                                <TableHead>{t('Sales Rep', 'Sales Rep')}</TableHead>
                                <TableHead>{t('Pelanggan', 'Customer')}</TableHead>
                                <TableHead>{t('Divalidasi Oleh', 'Approved By')}</TableHead>
                                <TableHead className="text-right">{t('Total Nilai', 'Total Amount')}</TableHead>
                                <TableHead className="text-right">{t('Aksi / Invoice', 'Action / Invoice')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Package className="size-8 opacity-30" />
                                            {t('Belum ada transaksi tervalidasi.', 'No validated transactions logged yet.')}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-semibold">{order.id}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{order.date_raised}</TableCell>
                                        <TableCell className="text-xs">
                                            <div className="flex items-center gap-1.5 font-medium text-green-600 dark:text-green-400">
                                                <Clock className="size-3" />
                                                {order.validated_at}
                                            </div>
                                        </TableCell>
                                        <TableCell>{order.sales_rep}</TableCell>
                                        <TableCell className="font-medium">{order.customer_name}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-xs">
                                                <Award className="size-3.5 text-yellow-500" />
                                                {order.validated_by_name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-slate-800 dark:text-zinc-200">
                                            {formatPrice(order.total_amount)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {order.has_invoice ? (
                                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50 flex items-center gap-1 w-fit ml-auto">
                                                    <CheckCircle2 className="size-3" />
                                                    {order.invoice_id}
                                                </Badge>
                                            ) : (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="text-xs h-7 px-2 flex items-center gap-1 ml-auto"
                                                    onClick={() => {
                                                        setActiveOrder(order);
                                                        setData({
                                                            order_id: order.id,
                                                            invoice_type: 'domestik',
                                                            dp_amount: 0,
                                                            due_date: '',
                                                            delivery_date: '',
                                                            tax_percent: 11,
                                                            exchange_rate: order.exchange_rate || 1,
                                                        });
                                                        setIsOpen(true);
                                                    }}
                                                >
                                                    <FileText className="size-3.5" />
                                                    {t('Buat Invoice', 'Create Invoice')}
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Modal Create Invoice */}
            <Dialog open={isOpen} onOpenChange={(open) => {
                setIsOpen(open);

                if (!open) {
                    reset();
                    setActiveOrder(null);
                }
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t('Buat Invoice Baru', 'Create New Invoice')}</DialogTitle>
                        <DialogDescription>
                            {t('Isi detail untuk membuat invoice dari PO ', 'Fill in the details to generate an invoice from PO ')} 
                            <span className="font-semibold text-foreground">{activeOrder?.id}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmitInvoice} className="space-y-4 py-2">
                        {/* Tipe Invoice & Tax Percent */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="invoice_type">{t('Jenis Invoice', 'Invoice Type')}</Label>
                                <Select
                                    value={data.invoice_type}
                                    onValueChange={(value) => {
                                        setData((prev) => ({
                                            ...prev,
                                            invoice_type: value as any,
                                            tax_percent: value === 'domestik' ? 11 : 0
                                        }));
                                    }}
                                >
                                    <SelectTrigger id="invoice_type" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="domestik">{t('Domestik', 'Domestic')}</SelectItem>
                                        <SelectItem value="international">{t('Internasional', 'International')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="tax_percent">{t('Tarif Pajak / PPN (%)', 'Tax / VAT Rate (%)')}</Label>
                                <Input
                                    id="tax_percent"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={data.tax_percent}
                                    onChange={(e) => setData('tax_percent', Number(e.target.value))}
                                    placeholder="PPN %"
                                />
                            </div>
                        </div>

                        {/* Exchange Rate (show if order currency is not IDR) */}
                        {activeOrder?.currency !== 'IDR' && (
                            <div className="grid gap-2">
                                <Label htmlFor="exchange_rate">
                                    {t(`Nilai Tukar (1 ${activeOrder?.currency} = ... IDR)`, `Exchange Rate (1 ${activeOrder?.currency} = ... IDR)`)}
                                </Label>
                                <Input
                                    id="exchange_rate"
                                    type="number"
                                    step="0.000001"
                                    min="0.000001"
                                    value={data.exchange_rate}
                                    onChange={(e) => setData('exchange_rate', Number(e.target.value))}
                                    placeholder="Exchange rate"
                                />
                            </div>
                        )}

                        {/* DP (Down Payment) */}
                        <div className="grid gap-2">
                            <Label htmlFor="dp_amount">
                                {t(
                                    `Uang Muka / DP (${activeOrder?.currency})`, 
                                    `Down Payment (${activeOrder?.currency})`
                                )}
                            </Label>
                            <Input
                                id="dp_amount"
                                type="number"
                                min="0"
                                value={data.dp_amount === 0 ? '' : data.dp_amount}
                                onChange={(e) => setData('dp_amount', Number(e.target.value))}
                                placeholder={t(`Masukkan DP dalam ${activeOrder?.currency}`, `Enter DP in ${activeOrder?.currency}`)}
                            />
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="due_date">{t('Jatuh Tempo', 'Due Date')}</Label>
                                <Input
                                    id="due_date"
                                    type="date"
                                    value={data.due_date}
                                    onChange={(e) => setData('due_date', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="delivery_date">{t('Tgl Pengiriman', 'Delivery Date')}</Label>
                                <Input
                                    id="delivery_date"
                                    type="date"
                                    value={data.delivery_date}
                                    onChange={(e) => setData('delivery_date', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Summary Perhitungan */}
                        <div className="border-t pt-3 mt-4 space-y-2 text-xs">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <div className="text-right">
                                    <div className="font-semibold">
                                        {formatPriceWithCurrency(calculation.subtotal_orig, activeOrder?.currency || 'IDR')}
                                    </div>
                                    {activeOrder?.currency !== 'IDR' && (
                                        <div className="text-[10px] text-muted-foreground/80">
                                            {formatPriceWithCurrency(calculation.subtotal_idr, 'IDR')}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between text-muted-foreground border-t border-dashed pt-1">
                                <span>PPN ({data.tax_percent}%)</span>
                                <div className="text-right">
                                    <div className="font-semibold">
                                        {formatPriceWithCurrency(calculation.tax_orig, activeOrder?.currency || 'IDR')}
                                    </div>
                                    {activeOrder?.currency !== 'IDR' && (
                                        <div className="text-[10px] text-muted-foreground/80">
                                            {formatPriceWithCurrency(calculation.tax_idr, 'IDR')}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {Number(data.dp_amount) > 0 && (
                                <div className="flex justify-between text-red-500 border-t border-dashed pt-1">
                                    <span>Uang Muka (DP)</span>
                                    <div className="text-right font-medium">
                                        <div>
                                            -{formatPriceWithCurrency(calculation.dp_orig, activeOrder?.currency || 'IDR')}
                                        </div>
                                        {activeOrder?.currency !== 'IDR' && (
                                            <div className="text-[10px] text-red-400">
                                                -{formatPriceWithCurrency(calculation.dp_idr, 'IDR')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between text-sm font-bold border-t pt-2 mt-1">
                                <span>Total Tagihan (Grand Total)</span>
                                <div className="text-right">
                                    <span className="text-primary font-bold">
                                        {formatPriceWithCurrency(calculation.total_orig, activeOrder?.currency || 'IDR')}
                                    </span>
                                    {activeOrder?.currency !== 'IDR' && (
                                        <div className="text-[10px] text-muted-foreground/80 font-normal">
                                            {formatPriceWithCurrency(calculation.total_idr, 'IDR')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => {
                                    setIsOpen(false);
                                    reset();
                                    setActiveOrder(null);
                                }}
                            >
                                {t('Batal', 'Cancel')}
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {t('Simpan Invoice', 'Save Invoice')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

Rekap.layout = {
    breadcrumbs: [
        {
            title: 'Sales Recap',
            href: '/accounting/rekap',
        },
    ],
};
