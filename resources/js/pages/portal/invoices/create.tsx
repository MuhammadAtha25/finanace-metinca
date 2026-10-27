import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Plus, Trash2, ArrowLeft, Save, UploadCloud } from 'lucide-react';
import * as React from 'react';
import { useCurrency } from '@/components/currency-context';
import { useLanguage } from '@/components/language-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Customer {
    id: number;
    name: string;
    email: string;
}

interface Product {
    id: number;
    name: string;
    category: string;
    price: number;
    stock: number;
}

interface CreateInvoiceProps {
    customers: Customer[];
    products: Product[];
}

interface InvoiceLineItem {
    productId: number;
    quantity: number;
    price: number;
}

export default function CreateInvoice({ customers, products }: CreateInvoiceProps) {
    const { formatPrice } = useCurrency();
    const { t } = useLanguage();
    const { auth } = usePage().props as any;

    const { data, setData, post, processing, errors } = useForm({
        customerId: customers[0]?.id || 0,
        salesRep: auth?.user?.name || '',
        invoice_type: 'domestik',
        currency: 'IDR',
        exchangeRate: 1,
        items: [] as InvoiceLineItem[],
        dp_amount: 0,
        tax_percent: 11,
        due_date: '',
        delivery_date: '',
        attachment: null as File | null,
    });

    const [selectedProductId, setSelectedProductId] = React.useState<number>(products[0]?.id || 0);
    const [selectedQty, setSelectedQty] = React.useState<number>(1);

    const handleAddItem = () => {
        const product = products.find(p => p.id === selectedProductId);

        if (!product) {
            return;
        }

        // Check if item already exists
        const existingIdx = data.items.findIndex(item => item.productId === selectedProductId);

        if (existingIdx > -1) {
            const updatedItems = [...data.items];
            updatedItems[existingIdx].quantity += selectedQty;
            setData('items', updatedItems);
        } else {
            setData('items', [
                ...data.items,
                {
                    productId: selectedProductId,
                    quantity: selectedQty,
                    price: product.price
                }
            ]);
        }
    };

    const handleRemoveItem = (index: number) => {
        const updatedItems = data.items.filter((_, i) => i !== index);
        setData('items', updatedItems);
    };

    // Calculate invoice totals
    const subtotal = React.useMemo(() => {
        return data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [data.items]);

    const taxAmount = React.useMemo(() => {
        if (data.invoice_type === 'international') return 0;
        return subtotal * (data.tax_percent / 100);
    }, [subtotal, data.invoice_type, data.tax_percent]);

    const grandTotal = React.useMemo(() => {
        return subtotal + taxAmount;
    }, [subtotal, taxAmount]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Since we are sending a file, we need to use formData internally which inertia handles automatically
        post('/invoices', {
            forceFormData: true,
            onError: () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
        });
    };

    // When invoice type changes, adjust defaults
    React.useEffect(() => {
        if (data.invoice_type === 'international') {
            setData(d => ({ ...d, currency: 'USD', tax_percent: 0 }));
        } else {
            setData(d => ({ ...d, currency: 'IDR', tax_percent: 11, exchangeRate: 1 }));
        }
    }, [data.invoice_type]);

    return (
        <>
            <Head title={t('Input Invoice Baru', 'New Invoice Entry')} />
            <div className="flex flex-1 flex-col gap-6 p-6 max-w-5xl mx-auto">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/sales/invoice-rekap" aria-label={t('Kembali ke Rekap Invoice', 'Back to Invoice Recap')}>
                            <ArrowLeft className="size-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t('Input Invoice Baru', 'New Invoice Entry')}</h1>
                        <p className="text-muted-foreground text-sm">{t('Tambahkan informasi pelanggan, item, dan jenis invoice untuk diserahkan ke bagian Akuntansi.', 'Add customer information, items, and invoice type to submit to Accounting.')}</p>
                    </div>
                </div>

                {Object.keys(errors).length > 0 && (
                    <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                        <p className="font-semibold">{t('Gagal menyimpan invoice. Periksa kembali isian berikut:', 'Failed to save invoice. Please check the following:')}</p>
                        <ul className="mt-1 list-disc list-inside">
                            {Object.values(errors).map((message, idx) => (
                                <li key={idx}>{message}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-3">
                    {/* Left 2 Columns: Details & Products */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Invoice & Customer Information */}
                        <Card className="border border-sidebar-border/70 shadow-sm">
                            <CardHeader className="bg-muted/20 pb-4 border-b">
                                <CardTitle>{t('Detail Pelanggan & Invoice', 'Customer & Invoice Details')}</CardTitle>
                                <CardDescription>{t('Pilih pelanggan dan tentukan jenis tagihan (Domestik/Ekspor).', 'Select the client and invoice type (Domestic/Export).')}</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2 pt-6">
                                <div className="space-y-2">
                                    <Label htmlFor="invoice-type">{t('Tipe Invoice', 'Invoice Type')}</Label>
                                    <Select
                                        value={data.invoice_type}
                                        onValueChange={(value) => setData('invoice_type', value)}
                                    >
                                        <SelectTrigger id="invoice-type" className="w-full font-medium">
                                            <SelectValue placeholder={t('Pilih Tipe', 'Select Type')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="domestik">Domestik (Lokal)</SelectItem>
                                            <SelectItem value="international">Internasional (Ekspor)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="customer">{t('Pelanggan', 'Customer')}</Label>
                                    <Select
                                        value={String(data.customerId)}
                                        onValueChange={(value) => setData('customerId', Number(value))}
                                    >
                                        <SelectTrigger id="customer" className="w-full">
                                            <SelectValue placeholder={t('Pilih Pelanggan', 'Select Customer')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                {data.invoice_type === 'international' && (
                                    <div className="sm:col-span-2 space-y-2 p-4 border border-dashed border-blue-300 bg-blue-50/50 dark:bg-blue-950/20 rounded-md">
                                        <Label htmlFor="attachment" className="text-blue-800 dark:text-blue-300 flex items-center gap-2">
                                            <UploadCloud className="size-4" /> 
                                            {t('Unggah Dokumen Invoice EXIM (Wajib)', 'Upload EXIM Document (Required)')}
                                        </Label>
                                        <Input
                                            id="attachment"
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => setData('attachment', e.target.files?.[0] || null)}
                                            className="bg-white dark:bg-zinc-900"
                                        />
                                        <p className="text-xs text-blue-600/80 dark:text-blue-400/80">Format didukung: PDF, JPG, PNG. Maksimal 5MB.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Add Line Item Form */}
                        <Card className="border border-sidebar-border/70 shadow-sm">
                            <CardHeader className="bg-muted/20 pb-4 border-b">
                                <CardTitle>{t('Tambah Produk', 'Add Products')}</CardTitle>
                                <CardDescription>{t('Pilih produk dan jumlah kuantitas untuk dimasukkan ke invoice.', 'Choose products and quantities to add to the invoice.')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="sm:col-span-2 space-y-2">
                                        <Label htmlFor="product">{t('Produk', 'Product')}</Label>
                                        <Select
                                            value={String(selectedProductId)}
                                            onValueChange={(value) => setSelectedProductId(Number(value))}
                                        >
                                            <SelectTrigger id="product" className="w-full">
                                                <SelectValue placeholder={t('Pilih Produk', 'Select Product')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map((p) => (
                                                    <SelectItem key={p.id} value={String(p.id)}>{p.name} - {formatPrice(p.price)}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="qty">{t('Jumlah', 'Quantity')}</Label>
                                        <Input
                                            id="qty"
                                            type="number"
                                            min="1"
                                            value={selectedQty}
                                            onChange={(e) => setSelectedQty(Math.max(1, Number(e.target.value)))}
                                        />
                                    </div>
                                </div>
                                <Button type="button" onClick={handleAddItem} variant="secondary" className="w-full flex items-center justify-center gap-1">
                                    <Plus className="size-4" /> {t('Tambah Baris Item', 'Add Item Line')}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Order Lines Table */}
                        <Card className="border border-sidebar-border/70 shadow-sm">
                            <CardHeader className="bg-muted/20 pb-4 border-b">
                                <CardTitle>{t('Barang Penjualan', 'Sales Items')}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="pl-6">{t('Nama Produk', 'Product Name')}</TableHead>
                                            <TableHead className="w-[100px] text-right">{t('Harga', 'Price')}</TableHead>
                                            <TableHead className="w-[80px] text-center">{t('Kuantitas', 'Qty')}</TableHead>
                                            <TableHead className="w-[120px] text-right">Total</TableHead>
                                            <TableHead className="w-[50px] pr-6"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.items.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                    {t('Belum ada produk ditambahkan. Pilih produk dan klik "Tambah Baris Item".', 'No items added yet. Choose a product and click "Add Item Line".')}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            data.items.map((item, index) => {
                                                const product = products.find(p => p.id === item.productId);

                                                return (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium pl-6">{product?.name || 'Unknown'}</TableCell>
                                                        <TableCell className="text-right">{formatPrice(item.price)}</TableCell>
                                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                                        <TableCell className="text-right font-semibold">
                                                            {formatPrice(item.price * item.quantity)}
                                                        </TableCell>
                                                        <TableCell className="pr-6">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => handleRemoveItem(index)}
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right 1 Column: Invoice summary & Config */}
                    <div className="space-y-6">
                        <Card className="border border-sidebar-border/70 sticky top-6 bg-neutral-50 dark:bg-neutral-900/50 shadow-sm">
                            <CardHeader className="border-b pb-4">
                                <CardTitle>{t('Pengaturan & Ringkasan', 'Settings & Summary')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="space-y-2">
                                    <Label htmlFor="currency">{t('Mata Uang', 'Currency')}</Label>
                                    <Select
                                        value={data.currency}
                                        onValueChange={(value) => setData('currency', value)}
                                    >
                                        <SelectTrigger id="currency" className="w-full">
                                            <SelectValue placeholder={t('Pilih Mata Uang', 'Select Currency')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="IDR">IDR (Rupiah)</SelectItem>
                                            <SelectItem value="EUR">EUR (Euro)</SelectItem>
                                            <SelectItem value="USD">USD (US Dollar)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {data.currency !== 'IDR' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="exchange-rate">{t('Nilai Tukar (Exchange Rate)', 'Exchange Rate')}</Label>
                                        <Input
                                            id="exchange-rate"
                                            type="number"
                                            step="0.000001"
                                            min="0"
                                            value={data.exchangeRate}
                                            onChange={(e) => setData('exchangeRate', Number(e.target.value))}
                                        />
                                    </div>
                                )}
                                
                                <div className="space-y-2">
                                    <Label htmlFor="tax">{t('Persentase Pajak (%)', 'Tax Percentage (%)')}</Label>
                                    <Input
                                        id="tax"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={data.tax_percent}
                                        onChange={(e) => setData('tax_percent', Number(e.target.value))}
                                        disabled={data.invoice_type === 'international'}
                                    />
                                    {data.invoice_type === 'international' && (
                                        <p className="text-xs text-muted-foreground">Ekspor dibebaskan dari PPN (0%).</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dp">{t('Uang Muka (DP)', 'Down Payment (DP)')}</Label>
                                    <Input
                                        id="dp"
                                        type="number"
                                        min="0"
                                        value={data.dp_amount || ''}
                                        onChange={(e) => setData('dp_amount', Number(e.target.value))}
                                        placeholder="0"
                                    />
                                </div>

                                <div className="space-y-2 border-y py-4 my-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">{t('Pajak', 'Tax')} ({data.tax_percent}%)</span>
                                        <span>{formatPrice(taxAmount)}</span>
                                    </div>
                                    {data.dp_amount > 0 && (
                                        <div className="flex justify-between text-sm mb-1 text-amber-600 dark:text-amber-400">
                                            <span>Dikurangi DP</span>
                                            <span>-{formatPrice(data.dp_amount)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between font-bold text-lg items-start">
                                    <span>{t('Total Akhir', 'Grand Total')}</span>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-primary text-xl">
                                            {formatPrice(Math.max(0, grandTotal - (data.dp_amount || 0)))}
                                        </span>
                                        {data.currency !== 'IDR' && data.exchangeRate > 0 && (
                                            <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md flex items-center gap-1 border border-sidebar-border/50">
                                                ≈ {new Intl.NumberFormat('id-ID', {
                                                    style: 'currency',
                                                    currency: data.currency
                                                }).format(Math.max(0, grandTotal - (data.dp_amount || 0)) / data.exchangeRate)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <Button 
                                    type="submit" 
                                    size="lg"
                                    className="w-full mt-4 flex items-center justify-center gap-2 font-semibold shadow-md"
                                    disabled={data.items.length === 0 || processing}
                                >
                                    <Save className="size-5" /> {t('Simpan Invoice', 'Save Invoice')}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </div>
        </>
    );
}

CreateInvoice.layout = {
    breadcrumbs: [
        {
            title: 'Invoice Recap',
            href: '/sales/invoice-rekap',
        },
        {
            title: 'New Invoice',
            href: '/invoices/create',
        },
    ],
};
