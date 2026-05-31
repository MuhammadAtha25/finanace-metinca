# Finance Metinca

Aplikasi Sales Portal berbasis **Laravel 13** + **React 19** dengan **Inertia.js**, dibangun menggunakan Vite dan Tailwind CSS v4.

---

## Prasyarat

Pastikan laptop sudah terinstall:

| Tools | Versi Minimum |
|---|---|
| PHP | 8.3+ |
| Composer | 2.x |
| Node.js | 18+ |
| npm | 9+ |
| Git | terbaru |

> **Catatan:** Project ini menggunakan **SQLite** secara default, jadi tidak perlu install MySQL/PostgreSQL.

---

## Cara Instalasi

### 1. Clone Repository

```bash
git clone <url-repository> finance-metinca
cd finance-metinca
```

### 2. Install Dependensi PHP

```bash
composer install
```

### 3. Buat File `.env`

```bash
cp .env.example .env
```

### 4. Generate Application Key

```bash
php artisan key:generate
```

### 5. Buat File Database SQLite

```bash
# Windows (PowerShell)
New-Item database/database.sqlite

# Linux / macOS
touch database/database.sqlite
```

### 6. Jalankan Migrasi Database

```bash
php artisan migrate
```

> Jika ingin mengisi data dummy, tambahkan `--seed`:
> ```bash
> php artisan migrate --seed
> ```

### 7. Install Dependensi Node.js

```bash
npm install
```

### 8. Jalankan Development Server

```bash
composer dev
```

Perintah ini akan menjalankan secara bersamaan:
- **PHP server** → `http://localhost:8000`
- **Vite (frontend)** → hot-reload aktif
- **Queue listener** → untuk background jobs

---

## Cara Cepat (One-Command Setup)

Jika tidak ingin menjalankan langkah satu per satu, gunakan script setup berikut:

```bash
composer setup
```

Script ini otomatis akan:
1. `composer install`
2. Menyalin `.env.example` → `.env`
3. Generate app key
4. Menjalankan migrasi
5. `npm install`
6. Build aset frontend

---

## Konfigurasi `.env` Penting

Setelah menyalin `.env.example`, sesuaikan nilai berikut jika diperlukan:

```env
APP_NAME=Laravel
APP_URL=http://localhost:8000

# Database (default: SQLite)
DB_CONNECTION=sqlite

# Jika ingin pakai PostgreSQL, ubah menjadi:
# DB_CONNECTION=pgsql
# DB_HOST=127.0.0.1
# DB_PORT=5432
# DB_DATABASE=finance_metinca
# DB_USERNAME=postgres
# DB_PASSWORD=
```

---

## Menjalankan Tes

```bash
php artisan test
```

Atau menggunakan Pest:

```bash
./vendor/bin/pest
```

---

## Build untuk Production

```bash
npm run build
```

---

## Struktur Aplikasi

| URL | Halaman |
|---|---|
| `/` | Welcome / Landing page |
| `/dashboard` | Dashboard utama |
| `/orders` | Daftar order |
| `/pipeline` | Sales pipeline |
| `/inventory` | Inventori |
| `/customers` | Data pelanggan |
| `/analytics` | Analitik |

> Halaman di atas memerlukan **login** (autentikasi).

---

## Tech Stack

- **Backend:** Laravel 13, Inertia.js, Laravel Fortify
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Radix UI
- **Database:** SQLite (default)
- **Build Tool:** Vite 8
- **Testing:** Pest PHP

---

## Troubleshooting

**Error: `php artisan` tidak ditemukan**
→ Pastikan PHP sudah ditambahkan ke PATH sistem.

**Error: `npm: command not found`**
→ Install Node.js dari [https://nodejs.org](https://nodejs.org).

**Error: `SQLSTATE[HY000]` saat migrasi**
→ Pastikan file `database/database.sqlite` sudah dibuat (lihat langkah 5).

**Halaman blank setelah login**
→ Jalankan `npm run build` atau pastikan `composer dev` sedang berjalan untuk hot-reload Vite.
