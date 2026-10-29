import { Head, useForm, router } from '@inertiajs/react';
import { ClipboardList, Check, X, FileText, Calendar } from 'lucide-react';
import * as React from 'react';
import { useCurrency } from '@/components/currency-context';
import { useLanguage } from '@/components/language-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

interface ReportMetrics {
    total_sales: number;
    total_invoices: number;
    paid_invoices: number;
    unpaid_invoices: number;
    paid_sales: number;
    unpaid_sales: number;
}

interface ReportItem {
    id: number;
    type: string;
    period_start: string;
    period_end: string;
    metrics_data: ReportMetrics;
    status: string;
    validation_notes: string | null;
    created_by_name: string;
    created_at: string;
    validated_at: string | null;
}

interface ReportsProps {
    reports: ReportItem[];
}

export default function ReportsInbox({ reports }: ReportsProps) {
    const { formatPrice } = useCurrency();
    const { t } = useLanguage();
    const { data, setData, post, processing, reset } = useForm({
        notes: '',
    });

    const [selectedReport, setSelectedReport] = React.useState<ReportItem | null>(null);
    const [isRejecting, setIsRejecting] = React.useState(false);

    const handleValidate = (reportId: number) => {
        if (confirm(t('Apakah Anda yakin ingin menyetujui laporan ini?', 'Are you sure you want to approve this report?'))) {
            post(`/manager/reports/${reportId}/validate`, {
                onSuccess: () => {
                    setSelectedReport(null);
                    reset('notes');
                }
            });
        }
    };

    const handleReject = (e: React.FormEvent, reportId: number) => {
        e.preventDefault();

        if (!data.notes.trim()) {
            alert(t('Catatan penolakan harus diisi.', 'Rejection notes are required.'));
            return;
        }

        post(`/manager/reports/${reportId}/reject`, {
            onSuccess: () => {
                setSelectedReport(null);
                setIsRejecting(false);
                reset('notes');
            }
        });
    };

    return (
        <>
            <Head title={t('Inbox Laporan', 'Report Inbox')} />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('Inbox Laporan', 'Report Inbox')}</h1>
                    <p className="text-muted-foreground text-sm">
                        {t('Tinjau dan validasi laporan kinerja penjualan yang dikirim oleh staf Akuntansi.', 'Review and validate sales performance reports submitted by Accounting staff.')}
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Reports List */}
                    <div className="lg:col-span-2 rounded-md border border-sidebar-border/70 bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('Tipe Laporan', 'Report Type')}</TableHead>
                                    <TableHead>{t('Periode', 'Period')}</TableHead>
                                    <TableHead>{t('Dikirim Oleh', 'Sent By')}</TableHead>
                                    <TableHead>{t('Tanggal Dikirim', 'Date Sent')}</TableHead>
                                    <TableHead className="text-center">{t('Status', 'Status')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reports.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <ClipboardList className="size-8 opacity-30" />
                                                {t('Tidak ada laporan masuk.', 'No reports in the inbox.')}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reports.map((rep) => (
                                        <TableRow 
                                            key={rep.id} 
                                            className={`cursor-pointer transition-colors ${selectedReport?.id === rep.id ? 'bg-muted/80' : ''}`}
                                            onClick={() => {
                                                setSelectedReport(rep);
                                                setIsRejecting(false);
                                                reset('notes');
                                            }}
                                        >
                                            <TableCell className="font-semibold flex items-center gap-2">
                                                <FileText className="size-4 text-blue-500" />
                                                {rep.type === 'monthly' ? 'Bulanan' : 'Tahunan'}
                                            </TableCell>
                                            <TableCell className="text-sm font-medium">
                                                {rep.period_start} - {rep.period_end}
                                            </TableCell>
                                            <TableCell>{rep.created_by_name}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {rep.created_at}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className={
                                                    rep.status === 'validated' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    rep.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-blue-50 text-blue-700 border-blue-200'
                                                }>
                                                    {rep.status === 'submitted' ? 'Menunggu' : rep.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Report Details and Action Panel */}
                    <div className="lg:col-span-1">
                        {selectedReport ? (
                            <Card className="border border-sidebar-border/80 sticky top-6 shadow-sm">
                                <CardHeader className="border-b pb-4 bg-muted/20">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                                            <Calendar className="size-5 text-primary" />
                                            Laporan {selectedReport.type === 'monthly' ? 'Bulanan' : 'Tahunan'}
                                        </CardTitle>
                                    </div>
                                    <CardDescription>
                                        Periode: {selectedReport.period_start} s/d {selectedReport.period_end}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    {/* Metrics Summary */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-muted/30 p-3 rounded-lg border">
                                            <div className="text-xs text-muted-foreground font-semibold uppercase mb-1">Total Penjualan</div>
                                            <div className="font-bold text-primary">{formatPrice(selectedReport.metrics_data.total_sales)}</div>
                                        </div>
                                        <div className="bg-muted/30 p-3 rounded-lg border">
                                            <div className="text-xs text-muted-foreground font-semibold uppercase mb-1">Jumlah Invoice</div>
                                            <div className="font-bold text-lg">{selectedReport.metrics_data.total_invoices}</div>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-100 dark:border-green-900/50">
                                            <div className="text-xs text-green-700 dark:text-green-400 font-semibold uppercase mb-1">Invoice Lunas ({selectedReport.metrics_data.paid_invoices})</div>
                                            <div className="font-bold text-green-700 dark:text-green-400">{selectedReport.metrics_data.paid_sales ? formatPrice(selectedReport.metrics_data.paid_sales) : formatPrice(0)}</div>
                                        </div>
                                        <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-100 dark:border-amber-900/50">
                                            <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold uppercase mb-1">Invoice Utang ({selectedReport.metrics_data.unpaid_invoices})</div>
                                            <div className="font-bold text-amber-700 dark:text-amber-400">{selectedReport.metrics_data.unpaid_sales ? formatPrice(selectedReport.metrics_data.unpaid_sales) : formatPrice(0)}</div>
                                        </div>
                                    </div>

                                    {selectedReport.status === 'validated' || selectedReport.status === 'rejected' ? (
                                        <div className="mt-4 p-4 border rounded-md bg-muted/20">
                                            <div className="text-xs font-bold text-muted-foreground uppercase mb-2">Status & Catatan</div>
                                            <Badge variant="outline" className={selectedReport.status === 'validated' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                                {selectedReport.status === 'validated' ? 'Tervalidasi' : 'Ditolak'} pada {selectedReport.validated_at}
                                            </Badge>
                                            {selectedReport.validation_notes && (
                                                <p className="text-sm mt-3 italic bg-white dark:bg-zinc-900 p-2 rounded border">"{selectedReport.validation_notes}"</p>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {/* Action Buttons for submitted reports */}
                                            {!isRejecting ? (
                                                <div className="flex gap-2 pt-2">
                                                    <Button 
                                                        variant="default" 
                                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-1.5"
                                                        onClick={() => handleValidate(selectedReport.id)}
                                                        disabled={processing}
                                                    >
                                                        <Check className="size-4" /> {t('Setujui', 'Approve')}
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        className="flex-1 text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/10 flex items-center justify-center gap-1.5"
                                                        onClick={() => setIsRejecting(true)}
                                                        disabled={processing}
                                                    >
                                                        <X className="size-4" /> {t('Tolak', 'Reject')}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <form onSubmit={(e) => handleReject(e, selectedReport.id)} className="space-y-3 pt-2">
                                                    <Textarea 
                                                        placeholder={t('Berikan alasan penolakan...', 'Provide rejection reason...')}
                                                        value={data.notes}
                                                        onChange={(e) => setData('notes', e.target.value)}
                                                        className="min-h-[80px] text-sm"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            type="submit" 
                                                            variant="destructive"
                                                            className="flex-1 text-xs"
                                                            disabled={processing}
                                                        >
                                                            {t('Kirim Tolak', 'Confirm Reject')}
                                                        </Button>
                                                        <Button 
                                                            type="button" 
                                                            variant="outline"
                                                            className="flex-1 text-xs"
                                                            onClick={() => {
                                                                setIsRejecting(false);
                                                                reset('notes');
                                                            }}
                                                            disabled={processing}
                                                        >
                                                            {t('Batal', 'Cancel')}
                                                        </Button>
                                                    </div>
                                                </form>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border border-dashed border-sidebar-border/120 flex flex-col items-center justify-center text-center p-8 h-[250px] text-muted-foreground">
                                <ClipboardList className="size-10 opacity-30 mb-2" />
                                <CardTitle className="text-sm font-medium">{t('Pilih Laporan', 'Select a Report')}</CardTitle>
                                <CardDescription className="text-xs">
                                    {t('Pilih laporan di tabel sebelah kiri untuk meninjau rinciannya.', 'Click on a report in the list to view metrics and validate.')}
                                </CardDescription>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

ReportsInbox.layout = {
    breadcrumbs: [
        {
            title: 'Report Inbox',
            href: '/manager/reports',
        },
    ],
};
