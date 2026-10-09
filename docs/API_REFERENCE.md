# Katalog & Referensi API (RESTful Endpoints)

Dokumentasi lengkap seluruh endpoint REST API pada portal **IT Asset Management**. Semua endpoint API berada di bawah prefix `/api`.

---

## 1. Otentikasi & Sesi Pengguna

### 1.1. Login Akun Berwenang
Melakukan verifikasi kredensial pengguna berwenang (Direktur, IT Asset Manager, Head of IT, Finance, Lead IT Gov, Super Admin, IT Technician).

- **URL:** `/api/auth/login`
- **Method:** `POST`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "identifier": "admin.it@yodu.id", // atau Employee ID: EMP-0001
    "password": "Password123!"
  }
  ```
- **Response Sukses (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login berhasil",
    "user": {
      "id": 1,
      "employee_id": "EMP-0001",
      "name": "Admin IT",
      "email": "admin.it@yodu.id",
      "department": "IT",
      "role": "super_admin"
    }
  }
  ```
  *Keterangan:* Mengatur cookie HTTP-Only bernama `auth_token` berisi JWT yang berlaku selama 7 hari.

### 1.2. Informasi Profil Sesi Aktif
Mengambil data pengguna yang sedang login berdasarkan cookie `auth_token`.

- **URL:** `/api/auth/me`
- **Method:** `GET`
- **Response Sukses (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "employee_id": "EMP-0001",
      "name": "Admin IT",
      "email": "admin.it@yodu.id",
      "department": "IT",
      "role": "super_admin"
    }
  }
  ```

### 1.3. Logout
Menghapus sesi dan mencabut cookie `auth_token`.

- **URL:** `/api/auth/logout`
- **Method:** `POST`
- **Response Sukses (200 OK):**
  ```json
  {
    "success": true,
    "message": "Logout berhasil"
  }
  ```

---

## 2. Inventaris Aset Fisik (Hardware)

### 2.1. Daftar Inventaris Aset
Mengambil daftar aset dengan opsi pencarian, filter status, dan kategori.

- **URL:** `/api/assets`
- **Method:** `GET`
- **Query Parameters:**
  - `q` (string, opsional): Pencarian teks bebas pada Tag, Serial Number, Model, atau Nama Pemegang.
  - `status` (string, opsional): Filter status (`in_stock`, `deployed`, `repair`, `disposed`).
  - `category` (integer, opsional): ID kategori aset.
- **Response Sukses (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "asset_tag": "IT-NB-2026-0001",
        "serial_number": "PF4XYZ01",
        "brand": "Lenovo",
        "model": "ThinkPad T14 Gen 4",
        "specs": { "cpu": "i7-1365U", "ram": "16GB", "storage": "512GB SSD" },
        "status": "deployed",
        "warranty_expiry": "2027-01-10T00:00:00.000Z",
        "category_name": "Laptop",
        "assigned_to": "Febmy",
        "user_department": "Finance"
      }
    ]
  }
  ```

### 2.2. Tambah Aset Baru
Mendaftarkan unit hardware baru ke basis data.

- **URL:** `/api/assets`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "asset_tag": "IT-NB-2026-0003",
    "category_id": 1,
    "serial_number": "5CD1234XYZ",
    "brand": "Dell",
    "model": "Latitude 5430",
    "specs": {
      "cpu": "Intel Core i5-1245U",
      "ram": "16GB",
      "storage": "512GB NVMe"
    },
    "warranty_expiry": "2027-05-15",
    "purchase_date": "2024-05-15"
  }
  ```
- **Response Sukses (200 OK):**
  ```json
  {
    "success": true,
    "message": "Aset baru berhasil ditambahkan",
    "data": { "id": 3, "asset_tag": "IT-NB-2026-0003" }
  }
  ```

### 2.3. Detail Lengkap & Riwayat Aset
Mengambil detail satu aset lengkap dengan riwayat penyerahan, log servis, dan catatan disposal.

- **URL:** `/api/assets/[id]`
- **Method:** `GET`
- **Response Sukses (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "asset": { "id": 1, "asset_tag": "IT-NB-2026-0001", "brand": "Lenovo", "status": "deployed", ... },
      "assignments": [
        {
          "id": 1,
          "assigned_date": "2024-01-10",
          "returned_date": null,
          "condition_notes": "Lengkap charger bawaan & tas laptop",
          "status": "active",
          "user_name": "Febmy",
          "department": "Finance"
        }
      ],
      "maintenance": [],
      "disposal": null
    }
  }
  ```

### 2.4. Pembaruan Informasi Aset
- **URL:** `/api/assets/[id]`
- **Method:** `PUT`
- **Request Body:**
  ```json
  {
    "brand": "Lenovo",
    "model": "ThinkPad T14 Gen 4",
    "serial_number": "PF4XYZ01-UPDATED",
    "specs": { "cpu": "i7-1365U", "ram": "32GB", "storage": "1TB SSD" },
    "warranty_expiry": "2027-01-10",
    "purchase_date": "2024-01-10"
  }
  ```

### 2.5. Quick Lookup / Scan QR
Pencarian instan berdasarkan kode stiker QR/Tag Aset.

- **URL:** `/api/assets/scan?tag=IT-NB-2026-0001`
- **Method:** `GET`
- **Response Sukses (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "asset_tag": "IT-NB-2026-0001",
      "category": "Laptop",
      "brand": "Lenovo",
      "model": "ThinkPad T14 Gen 4",
      "status": "deployed",
      "current_user_name": "Febmy",
      "current_user_dept": "Finance"
    }
  }
  ```

---

## 3. Siklus Hidup Aset (Lifecycle Management)

### 3.1. Penyerahan Unit (Check-out)
Menyerahkan aset yang siap pakai (`in_stock`) ke karyawan (`deployed`), membuat catatan mutasi aktif dan referensi BAST.

- **URL:** `/api/assets/checkout`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "asset_id": 2,
    "user_id": 8,
    "condition_notes": "Unit baru mulus, kelengkapan adaptor + kabel power"
  }
  ```
- **Response Sukses (200 OK):**
  ```json
  {
    "success": true,
    "message": "Aset berhasil diserahkan ke pengguna",
    "data": { "assignment_id": 2, "asset_tag": "IT-NB-2026-0002" }
  }
  ```

### 3.2. Pengembalian Unit (Check-in)
Mengembalikan aset dari karyawan kembali ke ruang penyimpanan IT (`in_stock`).

- **URL:** `/api/assets/checkin`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "asset_id": 2,
    "return_condition_notes": "Unit dikembalikan dalam keadaan normal, ada sedikit goresan halus di casing atas"
  }
  ```
- **Response Sukses (200 OK):**
  ```json
  {
    "success": true,
    "message": "Aset berhasil dikembalikan ke inventaris (In-Stock)"
  }
  ```

### 3.3. Pendaftaran Servis / Maintenance
Memindahkan status unit menjadi `repair` dan mencatat vendor serta estimasi biaya.

- **URL:** `/api/assets/maintenance`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "asset_id": 1,
    "issue_description": "Layar bergaris dan kipas pendingin bising",
    "vendor_name": "Lenovo Authorized Service Center",
    "cost": 1500000
  }
  ```

### 3.4. Penyelesaian Servis / Maintenance
Menyelesaikan status servis dan memulihkan aset ke `in_stock` atau `deployed`.

- **URL:** `/api/assets/maintenance`
- **Method:** `PATCH`
- **Request Body:**
  ```json
  {
    "maintenance_id": 1,
    "action_taken": "Penggantian modul LCD panel dan pembersihan heasink fan",
    "final_cost": 1450000,
    "target_status": "in_stock"
  }
  ```

### 3.5. Pemusnahan Aset (Disposal)
Menghapus unit secara permanen dari inventaris aktif (`disposed`).

- **URL:** `/api/assets/disposal`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "asset_id": 1,
    "disposal_type": "Scrap Fisik",
    "residual_value": 300000,
    "data_wiped": true,
    "wipe_method": "NIST 800-88 Rev 1 (Cryptographic Erase)",
    "reason": "Motherboard konslet terbakar, suku cadang tidak tersedia",
    "approved_by": 1
  }
  ```

### 3.6. Dokumen BAST Resmi (HTML Cetak)
Mengambil formulir cetak resmi Berita Acara Serah Terima dalam standar A4.

- **URL:** `/api/assets/bast/[assigmentId]`
- **Method:** `GET`
- **Output:** Dokumen HTML responsif cetak dengan styling CSS print (`window.print()`).

---

## 4. Audit & Stock Opname

### 4.1. Ambil Sesi Audit Aktif & Rekap Log
- **URL:** `/api/audit`
- **Method:** `GET`

### 4.2. Buka Sesi Audit Baru
- **URL:** `/api/audit`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "name": "Audit Opname IT Semester I 2026"
  }
  ```

### 4.3. Tutup Sesi Audit (Selesai)
- **URL:** `/api/audit`
- **Method:** `PATCH`
- **Request Body:**
  ```json
  {
    "session_id": 1
  }
  ```

### 4.4. Verifikasi Scan Fisik di Lapangan
- **URL:** `/api/assets/audit/scan`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "session_id": 1,
    "asset_tag": "IT-NB-2026-0001",
    "physical_location": "Lantai 2 - Meja Finance",
    "condition": "good",
    "notes": "Unit diverifikasi fisik dan beroperasi normal",
    "user_id": 1
  }
  ```

---

## 5. Master Data Karyawan, Akun, & Divisi

### 5.1. Master Karyawan Penerima Aset
- **`GET /api/employees`**: Daftar master karyawan, filter `search` & `department`.
- **`POST /api/employees`**: Tambah karyawan baru (`name`, `email`, `employee_id`, `department`).
- **`PUT /api/employees`**: Perbarui data karyawan.
- **`DELETE /api/employees?id={id}`**: Hapus data karyawan (jika tidak memiliki aset aktif).

### 5.2. Akun Sistem Berwenang
- **`GET /api/users?type=accounts`**: Daftar akun portal login.
- **`POST /api/users`**: Buat akun berwenang baru dengan role dan kata sandi terenkripsi scrypt.
- **`PUT /api/users`**: Perbarui role, status aktif, atau ganti password akun.

### 5.3. Master Divisi / Departemen
- **`GET /api/departments`**: Daftar divisi beserta jumlah anggota dan pemegang akun.
- **`POST /api/departments`**: Tambah divisi baru (`name`, `code`, `description`).
- **`PUT /api/departments/[id]`**: Edit divisi.
- **`DELETE /api/departments/[id]`**: Hapus divisi.

---

## 6. Lisensi Software & Laporan

### 6.1. Lisensi Perangkat Lunak
- **`GET /api/licenses`**: Daftar seluruh lisensi.
- **`POST /api/licenses`**: Tambah lisensi baru (`software_name`, `license_key`, `total_seats`, `expiry_date`, `cost_per_year`).

### 6.2. Laporan & Ekspor Multiformat
- **`GET /api/reports`**
- **Query Parameters:**
  - `type`: `assignments` | `maintenance` | `disposal` | `assets` | `licenses` | `audit`
  - `startDate`: `YYYY-MM-DD` (opsional)
  - `endDate`: `YYYY-MM-DD` (opsional)
  - `format`: `json` | `csv`
- *Catatan:* Jika `format=csv`, server mengembalikan berkas unduhan `.csv` dengan header `Content-Disposition`.

### 6.3. Self-Service "Unit Saya"
- **`GET /api/user/my-assets`**: Mengambil daftar perangkat yang saat ini dipegang oleh pengguna yang sedang login beserta kelengkapan data serah terima dan opsi pelaporan kendala.

---

## 7. Cron Job & Otomasi

### 7.1. Pemicu Alert Masa Garansi (Telegram Notification)
- **URL:** `/api/cron/alerts`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <CRON_SECRET_TOKEN>` (opsional jika dikonfigurasi)
- **Logika:** Memindai aset yang masa garansinya habis dalam $\le 60$ hari ke depan dan belum berstatus `disposed`. Mengirimkan ringkasan pesan ke grup/chat Telegram melalui bot.
