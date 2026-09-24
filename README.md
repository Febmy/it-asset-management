# IT Asset Management System (Enterprise Portal)

Sistem Manajemen Aset Teknologi Informasi (IT Asset Management) berbasis web modern yang dirancang untuk mengelola seluruh siklus hidup perangkat keras (*Hardware Asset Management*), perizinan perangkat lunak (*Software Asset Management*), serah terima unit karyawan dengan Berita Acara resmi (BAST), pemeliharaan teknis & biaya perbaikan, audit opname fisik berbasis label QR Code, hingga disposisi pemusnahan aset sesuai standar tata kelola TI perusahaan.

---

## 📑 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Teknologi & Arsitektur](#-teknologi--arsitektur)
- [Struktur Direktori Proyek](#-struktur-direktori-proyek)
- [Peran Pengguna & Hak Akses (RBAC)](#-peran-pengguna--hak-akses-rbac)
- [Prasyarat Sistem](#-prasyarat-sistem)
- [Panduan Instalasi & Menjalankan](#-panduan-instalasi--menjalankan)
- [Konfigurasi Lingkungan (.env.local)](#-konfigurasi-lingkungan-envlocal)
- [Inisialisasi & Seeding Database](#-inisialisasi--seeding-database)
- [Skrip Otomasi & Cron Job](#-skrip-otomasi--cron-job)
- [Dokumentasi Lengkap Tambahan](#-dokumentasi-lengkap-tambahan)

---

## 🚀 Fitur Utama

### 1. Manajemen Inventaris Hardware (Master Assets)
- Pencatatan aset komprehensif: Tag Aset, Nomor Seri (*Serial Number*), Merk, Model, Kategori, Alamat MAC (LAN/Wi-Fi), Tanggal Pengadaan, dan Masa Berlaku Garansi Vendor.
- Penyimpanan spesifikasi fleksibel dengan PostgreSQL `JSONB` (CPU, RAM, Media Penyimpanan/Storage).
- Filter status dinamis: `in_stock` (tersedia di gudang), `deployed` (sedang digunakan karyawan), `repair` (dalam perbaikan), dan `disposed` (dihapuskan).

### 2. Siklus Hidup Aset (Lifecycle Management)
- **Check-out (Penyerahan):** Mendistribusikan aset ke karyawan, mencatat kondisi awal dan kelengkapan.
- **Check-in (Pengembalian):** Pengembalian unit ke gudang IT saat mutasi atau pengunduran diri karyawan.
- **Maintenance Tracking:** Pendaftaran tiket perbaikan perangkat, pencatatan vendor servis, tindakan teknis, dan total akumulasi biaya.
- **Disposal & Sanitasi Data:** Penghapusan permanen unit rusak total/End-of-Life dengan pencatatan nilai residu (salvage value), kepatuhan pembersihan data storage (NIST 800-88 / DoD 5220.22-M), serta persetujuan manajemen.

### 3. Berita Acara Serah Terima (BAST) Digital Otomatis
- Pembuatan dokumen BAST legal secara otomatis begitu serah terima unit berhasil dilakukan.
- Format cetak standar A4 resmi siap ditandatangani oleh Tim IT dan Karyawan penerima unit via endpoint `/api/assets/bast/[id]`.

### 4. Pelabelan & Pemindaian QR Code (Kamera Langsung)
- **Cetak Label QR:** Pembuatan stiker kode QR otomatis untuk seluruh tag aset, siap dicetak dalam format stiker label.
- **Kamera Scanner (`/scan`):** Pemindaian stiker QR menggunakan kamera smartphone/laptop via `html5-qrcode` untuk pencarian data instan dan aksi cepat di lapangan.

### 5. Sesi Audit Opname Fisik (Stock Opname)
- Pembukaan sesi audit berkala untuk verifikasi fisik aset secara langsung di lokasi kerja.
- Pemindaian stiker QR di lokasi, verifikasi kondisi fisik (`good`, `damaged`), pencatatan lokasi aktual, serta pencegahan entri ganda otomatis.

### 6. Manajemen Lisensi Perangkat Lunak (SAM)
- Pendataan lisensi aplikasi (Microsoft 365, Adobe, AutoCAD, dll.), kuota kursi (*seats*), tanggal kedaluwarsa, dan kalkulasi biaya langganan tahunan.

### 7. Rekapitulasi Laporan & Ekspor Multiformat
- Laporan mutasi penyerahan, pemeliharaan teknis & pengeluaran biaya servis, pemusnahan unit, lisensi, dan log audit.
- Ekspor langsung ke format **CSV** untuk analisis spreadsheet atau laporan cetak resmi.

### 8. Notifikasi Telegram Otomatis & Peringatan Garansi
- Integrasi Telegram Bot untuk notifikasi tiket servis baru.
- Pemicu cron otomatis (`/api/cron/alerts`) untuk memindai dan mengirimkan ringkasan unit yang garansinya akan habis dalam 60 hari ke depan.

### 9. Self-Service Karyawan ("Unit Saya")
- Portal mandiri bagi karyawan untuk meninjau detail unit yang sedang dipinjam beserta formulir pelaporan kendala teknis langsung ke teknisi IT.

---

## 🛠 Teknologi & Arsitektur

| Lapisan | Teknologi | Kegunaan |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) | Arsitektur full-stack React berbasis server dan client components |
| **Library UI** | [React 19](https://react.dev/) | Rendering antarmuka komponen reaktif modern |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Utilitas desain responsif dan tema antarmuka elegan |
| **Bahasa** | [TypeScript](https://www.typescriptlang.org/) | *Static typing* untuk keandalan kode skala korporasi |
| **Basis Data** | [PostgreSQL](https://www.postgresql.org/) | RDBMS utama dengan koneksi *connection pool* via library `pg` |
| **Autentikasi** | [jose](https://github.com/panva/jose) | JWT (JSON Web Token) tersimpan pada `HttpOnly` Secure Cookie |
| **Keamanan Sandi** | Node.js Crypto (`scrypt`) | Enkripsi kata sandi dengan salt unik dan timing-safe verification |
| **Scanner QR** | [html5-qrcode](https://scanapp.org/) & [qrcode](https://github.com/soldair/node-qrcode) | Generator data URL QR dan pemindaian kamera browser |

---

## 📂 Struktur Direktori Proyek

```plaintext
it-asset-management/
├── db/
│   ├── schema.sql                 # Skema DDL tabel relasional PostgreSQL
│   └── seed.sql                   # Data permulaan (User awal, kategori, sample aset)
├── docs/
│   ├── API_REFERENCE.md           # Katalog endpoint REST API & schema request/response
│   ├── DATABASE_SCHEMA.md         # Kamus data, ERD, dan indeks database
│   └── WORKFLOWS.md               # SOP alur operasional bisnis & siklus hidup aset
├── public/                        # Aset statis & favicon
├── scripts/
│   ├── import-assets.ts           # Skrip impor massal data aset dari berkas CSV
│   └── sample-assets.csv          # Berkas contoh format impor aset
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/             # Halaman portal login akun berwenang
│   │   ├── (dashboard)/
│   │   │   ├── assets/            # Master inventaris aset & halaman print-labels
│   │   │   ├── audit/             # Modul Stock Opname / Audit Fisik
│   │   │   ├── dashboard/         # Dashboard metrik KPI & grafik ringkasan
│   │   │   ├── departments/       # Manajemen data master divisi perusahaan
│   │   │   ├── employees/         # Manajemen master karyawan penerima aset
│   │   │   ├── licenses/          # Manajemen lisensi software & langganan
│   │   │   ├── my-assets/         # Halaman self-service karyawan
│   │   │   ├── reports/           # Rekapitulasi laporan & ekspor CSV
│   │   │   ├── users/             # Manajemen pendaftaran akun login sistem
│   │   │   └── layout.tsx         # Tata letak dashboard (Sidebar + Top Navbar)
│   │   ├── api/                   # Seluruh Route Handlers REST API
│   │   ├── scan/                  # Halaman scanner fisik berbasis kamera perangkat
│   │   ├── globals.css            # Pengaturan tema global Tailwind v4
│   │   └── layout.tsx             # Root layout aplikasi
│   ├── components/
│   │   ├── layout/                # Komponen Sidebar dan TopNavbar
│   │   ├── modals/                # Modal dialog formulir (Aset, Servis, Disposal, BAST)
│   │   ├── scanner/               # Komponen kamera pembaca QR Code
│   │   └── ui/                    # Komponen atomik (Button, Badge, Table, Modal)
│   ├── lib/
│   │   ├── auth.ts                # Utilitas JWT, Hash Scrypt, dan manajemen session cookie
│   │   ├── db.ts                  # Inisialisasi pool koneksi database PostgreSQL
│   │   ├── qr.ts                  # Generator QR Code canvas & buffer
│   │   └── telegram.ts            # Modul integrasi Telegram Bot API
│   ├── middleware.ts              # Edge middleware untuk proteksi rute dashboard
│   └── types/                     # Definisi tipe data TypeScript (Asset, User, API)
├── .env.local                     # Konfigurasi variabel lingkungan
├── package.json                   # Konfigurasi dependensi proyek
└── tsconfig.json                  # Konfigurasi TypeScript
```

---

## 👥 Peran Pengguna & Hak Akses (RBAC)

Aplikasi memisahkan secara tegas antara **Akun Login Sistem** dan **Master Karyawan**:

| Role | Kelompok | Deskripsi & Wewenang |
| :--- | :--- | :--- |
| `director` | Akun Login | Direktur Utama / Board of Directors: Meninjau dashboard eksekutif, persetujuan disposal, dan laporan strategis. |
| `it_asset_manager` | Akun Login | Pengelola Aset TI: Pengelolaan penuh aset, serah terima, pengembalian, perbaikan, pencetakan BAST, dan disposal. |
| `head_it` | Akun Login | Kepala Departemen IT: Pengawasan teknis seluruh aset, persetujuan servis, dan pengesahan audit opname. |
| `finance` | Akun Login | Divisi Keuangan: Pengawasan anggaran servis/perbaikan, biaya lisensi, dan nilai residu aset yang dihapuskan. |
| `lead_it_gov` | Akun Login | IT Governance & Kepatuhan: Mengawasi audit lisensi perangkat lunak dan kepatuhan sanitasi data disposal. |
| `super_admin` | Akun Login | Administrator Sistem: Hak penuh atas seluruh modul konfigurasi sistem dan database. |
| `it_technician` | Akun Login | Teknisi Lapangan: Pelaksana servis teknis, pemindaian QR di lapangan, dan eksekutor opname fisik. |
| `employee` | Master Data | Karyawan Perusahaan: Terdaftar sebagai penerima unit aset (tidak memiliki akun login dashboard; mengakses portal mandiri `/my-assets`). |

---

## 📋 Prasyarat Sistem

Sebelum menjalankan aplikasi, pastikan komputer/server Anda telah terpasang:
- **Node.js** versi 20.x atau 22.x LTS
- **PostgreSQL** versi 14 atau yang lebih baru
- **npm** atau package manager kompatibel lainnya (pnpm / yarn)

---

## ⚙ Konfigurasi Lingkungan (.env.local)

Salin berkas `.env.example` atau buat berkas `.env.local` di root proyek:

```env
# Konfigurasi Database PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=it_assets
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Rahasia Autentikasi JWT (Minimal 32 karakter)
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long

# Integrasi Notifikasi Telegram Bot (Opsional)
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ
TELEGRAM_CHAT_ID=-100123456789

# Token Pemicu Cron Job (Opsional)
CRON_SECRET_TOKEN=my_cron_secret_token_here
```

---

## 🗄 Inisialisasi & Seeding Database

1. Buat database di PostgreSQL Anda:
   ```sql
   CREATE DATABASE it_assets;
   ```
2. Jalankan skrip DDL skema:
   ```bash
   psql -U postgres -d it_assets -f db/schema.sql
   ```
3. (Opsional) Isi database dengan data contoh (Akun sistem, kategori, sample aset):
   ```bash
   psql -U postgres -d it_assets -f db/seed.sql
   ```

### Akun Awal Bawaan (Seed):
- **Email:** `admin.it@company.com` atau `EMP-0001`
- **Password:** Sesuai dengan hash pada saat pendaftaran akun via antarmuka `/users`.

---

## 💻 Panduan Instalasi & Menjalankan

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Mode Pengembangan (Development)
Menjalankan server pengembangan lokal dengan Hot Module Replacement (HMR):
```bash
npm run dev
```
Buka peramban di [http://localhost:3000](http://localhost:3000). Rute akan secara otomatis mengarahkan ke halaman `/login` jika belum terotentikasi.

### 3. Kompilasi & Produksi (Production Build)
Untuk memvalidasi sintaks dan membangun bundle produksi:
```bash
npm run build
npm run start
```

---

## 🤖 Skrip Otomasi & Cron Job

### 1. Impor Massal Aset dari Berkas CSV
Gunakan skrip `scripts/import-assets.ts` untuk mengimpor ratusan unit perangkat keras sekaligus:
```bash
npx tsx scripts/import-assets.ts scripts/sample-assets.csv
```

### 2. Notifikasi Pengingat Masa Garansi Otomatis (Cron Alert)
Jadwalkan panggilan HTTP GET berkala (menggunakan Windows Task Scheduler, Crontab Linux, atau Vercel Cron) ke endpoint:
```bash
curl -X GET http://localhost:3000/api/cron/alerts \
  -H "Authorization: Bearer my_cron_secret_token_here"
```
Endpoint ini akan mendeteksi seluruh perangkat yang masa garansinya tersisa kurang dari 60 hari dan secara otomatis menyiarkan notifikasi ke bot Telegram IT.

---

## 📚 Dokumentasi Lengkap Tambahan

Untuk panduan teknis mendalam, silakan baca dokumentasi pendukung berikut:
- 👥 [Panduan Akun, Autentikasi & Hak Akses (RBAC)](docs/ACCOUNTS_AND_ROLES.md)
- 📖 [Katalog & Referensi REST API](docs/API_REFERENCE.md)
- 🗃 [Skema & Kamus Data Basis Data PostgreSQL](docs/DATABASE_SCHEMA.md)
- 🔄 [SOP Alur Operasional & Siklus Hidup Aset](docs/WORKFLOWS.md)

---
*Dikembangkan dengan standar arsitektur enterprise untuk pengelolaan aset TI yang akuntabel, transparan, dan terintegrasi.*
