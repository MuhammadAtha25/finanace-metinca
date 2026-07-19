import { Head, Link, usePage, router } from '@inertiajs/react';
import { Undo2, Plus, Check, X } from 'lucide-react';
import * as React from 'react';
import { useCurrency } from '@/components/currency-context';
import { useLanguage } from '@/components/language-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ReturnNote {
    id: number;
    order_id: string;
    customer_name: string;
    type: 'credit_internal' | 'debit_external';
    total_amount: number;
    status: string;
    date: string;
}

interface ReturnIndexProps {
    returns: ReturnNote[];
}

export default function ReturnsIndex({ returns }: ReturnIndexProps) {
    const { formatPrice } = useCurrency();
    const { t } = useLanguage();
    const { auth } = usePage().props as any;
    const isSales = auth?.user?.role === 'staff_sales';
    const isAccounting = auth?.user?.role === 'staff_accounting' || auth?.user?.role === 'manager';

    return (
        <>
            <Head title={t('Barang Reject / Return', 'Return / Rejected Items')} />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t('Retur Barang', 'Item Returns')}</h1>
                        <p className="text-muted-foreground text-sm">
                            {t('Kelola pengembalian barang (Kredit Internal & Debit Eksternal).', 'Manage item returns (Internal Credit & External Debit).')}
                        </p>
                    </div>
                    {isSales && (
                        <div className="flex gap-4">
                            <Button asChild>
                                <Link href="/returns/create" className="flex items-center gap-2">
                                    <Plus className="size-4" /> {t('Buat Retur', 'Create Return')}
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>

                <div className="rounded-md border border-sidebar-border/70 bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>{t('Pesanan / PO', 'Order / PO')}</TableHead>
                                <TableHead>{t('Pelanggan', 'Customer')}</TableHead>
                                <TableHead>{t('Tipe Retur', 'Return Type')}</TableHead>
                                <TableHead>{t('Tanggal', 'Date')}</TableHead>
                                <TableHead className="text-right">{t('Total Nilai', 'Total Amount')}</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {returns.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Undo2 className="size-8 opacity-30" />
                                            {t('Belum ada data retur barang.', 'No item returns logged yet.')}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                returns.map((rtn) => (
                                    <TableRow key={rtn.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-semibold">{rtn.id}</TableCell>
                                        <TableCell className="font-medium text-xs">{rtn.order_id}</TableCell>
                                        <TableCell>{rtn.customer_name}</TableCell>
                                        <TableCell>
                                            {rtn.type === 'credit_internal' ? (
                                                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                                    Kredit Internal
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">
                                                    Debit Eksternal
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{rtn.date}</TableCell>
                                        <TableCell className="text-right font-bold text-slate-800 dark:text-zinc-200">
                                            {formatPrice(rtn.total_amount)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {rtn.status === 'Pending' && isAccounting ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        className="h-7 px-2 text-green-600 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-700"
                                                        onClick={() => router.post(`/accounting/returns/${rtn.id}/approve`)}
                                                    >
                                                        <Check className="size-3 mr-1" /> {t('Setujui', 'Approve')}
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        className="h-7 px-2 text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100 hover:text-rose-700"
                                                        onClick={() => router.post(`/accounting/returns/${rtn.id}/reject`)}
                                                    >
                                                        <X className="size-3 mr-1" /> {t('Tolak', 'Reject')}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Badge variant={rtn.status === 'Approved' ? 'default' : (rtn.status === 'Rejected' ? 'destructive' : 'secondary')}>
                                                    {rtn.status}
                                                </Badge>
                                            )}
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

ReturnsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Returns',
            href: '/returns',
        },
    ],
};
