# Perancangan Halaman - Sistem Informasi Penjualan (Sales Portal)

Berdasarkan desain antarmuka **Sales Portal** yang direncanakan, berikut adalah daftar halaman beserta detail fungsionalitas yang akan dibangun dalam aplikasi:

## 1. Dashboard (Dasbor Utama)
Halaman ringkasan eksekutif untuk memberikan gambaran cepat tentang performa penjualan.
* **Fitur Utama:**
  * Metrik utama (Total Penjualan, Jumlah Pesanan, Rata-rata Nilai Pesanan).
  * Grafik Tren Penjualan bulanan/mingguan.
  * Ringkasan aktivitas terbaru dan status pesanan.
* **Komponen UI:** Ringkasan KPI Cards, Area Chart / Bar Chart, list pesanan terbaru.

## 2. Order Entry (Manajemen Pesanan)
Halaman utama seperti pada mockup untuk melacak, menyaring, dan mengelola pesanan masuk.
* **Fitur Utama:**
  * Tabel data pesanan (Order ID, Date Raised, Customer Name, Sales Rep, Status, Total Amount).
  * Filter cepat berdasarkan status: **All**, **Pending**, **Validated**, dan **Rejected**.
  * Pencarian pesanan secara real-time.
  * Tombol aksi: **Export** (Unduh Laporan Excel/CSV) dan **+ New Order**.
  * Paginasi data yang responsif.
* **Komponen UI:** Tabs navigation, Search input, Data table dengan badge status berwarna, Export button, New Order button, Pagination.

## 3. Form Order Baru (+ New Order)
Formulir interaktif untuk menginput pesanan baru ke dalam sistem.
* **Fitur Utama:**
  * Pemilihan Customer (Searchable dropdown).
  * Pemilihan Produk & Kuantitas (Dynamic row items).
  * Kalkulasi otomatis Subtotal, Diskon, Pajak, dan Total Amount.
  * Pemilihan Sales Representative yang bertugas.
  * Aksi: Simpan sebagai *Pending* atau langsung *Validate*.
* **Komponen UI:** Form input modal/page, searchable select, dynamic table input, total pricing summary.

## 4. Sales Pipeline (Saluran Penjualan)
Halaman visualisasi proses penjualan dari tahap prospek hingga kesepakatan selesai (Closed Won/Lost).
* **Fitur Utama:**
  * Tampilan Kanban Board (Prospek, Negosiasi, Penawaran, Selesai).
  * Drag-and-drop antar tahapan penjualan.
  * Estimasi nilai kesepakatan di setiap tahap.
* **Komponen UI:** Kanban cards, Drag-and-drop wrapper, progress indicators.

## 5. Inventory (Inventaris & Produk)
Halaman untuk memantau stok produk yang tersedia untuk dijual.
* **Fitur Utama:**
  * Daftar produk, kategori, harga jual, dan jumlah stok.
  * Notifikasi stok minimum (Low stock warning).
* **Komponen UI:** Grid/Table view, low stock badges, filter by category.

## 6. Customers (Manajemen Pelanggan)
Halaman basis data pelanggan yang terintegrasi dengan riwayat pembelian mereka.
* **Fitur Utama:**
  * Daftar pelanggan beserta detail kontak dan riwayat pesanan mereka.
  * Total akumulasi pembelian dari masing-masing pelanggan (Customer Lifetime Value).
* **Komponen UI:** Customer profiles list, detail view slide-over/modal.

## 7. Analytics & Reporting (Analisis & Laporan)
Halaman laporan mendalam untuk kebutuhan admin dan manajemen.
* **Fitur Utama:**
  * Laporan performa sales rep (J. Smith, A. Perez, dll).
  * Laporan produk paling laris.
  * Export laporan PDF/Excel berdasarkan rentang tanggal.
* **Komponen UI:** Date range picker, bar charts, export options panel.

---

## Rencana Implementasi Teknis (Next Steps)
1. **Routing:** Menyiapkan rute Inertia di `routes/web.php`.
2. **Layouting:** Implementasi Sidebar (Sales Portal Navigation) & Top Header di `resources/js/layouts`.
3. **Halaman & Komponen:**
   * Membuat halaman `dashboard.tsx`
   * Membuat halaman `orders/index.tsx` (tabel manajemen pesanan)
   * Membuat halaman/modal `orders/create.tsx` (form order baru)
