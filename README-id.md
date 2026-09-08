<div align="center">
  <img src="extension/public/icons/logo-128.png" width="80" height="80" alt="Syntive Icon">

# Syntive

Ekstensi sinkronisasi bookmark untuk Chromium & Firefox — terenkripsi end-to-end **zero-knowledge** berbasis Cloudflare Worker & D1.

[Laporkan Masalah](https://github.com/bismawy/syntive/issues) · [English](README.md)

[![Build Extension](https://github.com/bismawy/syntive/actions/workflows/build-extension.yml/badge.svg)](https://github.com/bismawy/syntive/actions/workflows/build-extension.yml)
![Chromium MV3](https://img.shields.io/badge/Chromium-MV3-4285F4?logo=googlechrome&logoColor=white)
![Firefox MV2](https://img.shields.io/badge/Firefox-MV2-FF7139?logo=firefoxbrowser&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers%20%26%20D1-F38020?logo=cloudflare&logoColor=white)
![License](https://img.shields.io/badge/License-Apache--2.0-blue)

</div>

<img src="design/Syntive_hero.webp" alt="Syntive Hero" width="100%">

## Fitur

- **Dashboard New Tab:** Tampilan halaman tab baru yang bersih dengan widget interaktif (Waktu, Statistik Bookmark, Situs Favorit, Sering Diakses, Catatan, Todo, Pomodoro, Kalender Hijriyah, Radio Qur'an, dan Suasana Alam) yang posisinya dapat diatur (*drag & drop*).
- **Sinkronisasi E2E Zero-Knowledge:** Pohon bookmark dienkripsi lokal dengan AES-GCM 256-bit di browser sebelum dikirim ke server. Server hanya menyimpan ciphertext terenkripsi dan tidak bisa membaca bookmark Anda.
- **Multi-Perangkat & Manajemen Sesi:** Pantau perangkat yang terhubung, riwayat sinkronisasi, dan hentikan sesi perangkat dari jarak jauh (*terminate session*). Resolusi konflik menggunakan *last-write-wins*.
- **Peralatan Bookmark Pintar:**
  - Pindai & bersihkan link duplikat (normalisasi URL kanonikal).
  - Gabungkan folder duplikat bernama sama secara rekursif.
  - Kelompokkan bookmark ke sub-folder berdasarkan domain.
  - Bersihkan folder kosong (aman tanpa menyentuh root sistem browser).
- **Kotak Sampah (Trash Bin):** Pemulihan bookmark/folder yang terhapus dengan masa retensi otomatis 30 hari.
- **Kustomisasi & Tema:** Mode Terang/Gelap/Sistem, ragam preset warna, dan impor aksen dari file tema GitHub.
- **Dua Bahasa Antarmuka:** Tersedia dalam Bahasa Indonesia (default) dan Bahasa Inggris.

## Model Keamanan

Secret Key 12 kata mnemonic diturunkan secara lokal di browser melalui Web Crypto API:

```text
12 Kata Mnemonic (Secret Key)
   └─ PBKDF2-SHA512 (salt="syntive/v1", 210.000 iterasi, 64 bytes)
        ├─ seed[0:32]  -> authId (Hex) sebagai identitas akun & bearer token
        └─ seed[32:64] -> encKey (AES-GCM 256-bit) untuk enkripsi & dekripsi lokal
```

- Mnemonic dan kunci enkripsi **tidak pernah meninggalkan perangkat**.
- Server Cloudflare Worker hanya menerima `authId` dan blob ciphertext terkompresi GZIP.
- Jika Secret Key hilang, data tidak dapat dipulihkan karena server tidak menyimpan kunci cadangan.

<details>
<summary><b>Detail Format Data Vault (SYN1)</b></summary>

```text
[SYN1 (4B)][IV (12B)][Ciphertext AES-GCM (Payload JSON terkompresi GZIP)] -> Base64
```
Payload dikompresi sebelum dienkripsi untuk menghemat kuota transmisi dan penyimpanan database D1 hingga ~70%.
</details>

## Setup & Panduan

<details open>
<summary><b>1. Setup Backend Sendiri (Cloudflare Worker + D1)</b></summary>

Syntive bebas digunakan dengan akun Cloudflare dan database D1 pribadi Anda:

1. **Login ke Cloudflare via Wrangler:**
   ```bash
   cd backend
   bun install
   bunx wrangler login
   ```

2. **Buat database D1:**
   ```bash
   bunx wrangler d1 create syntive
   ```
   Salin `database_id` yang dicetak ke `backend/wrangler.toml`:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "syntive"
   database_id = "UUID-DATABASE-ANDA"
   migrations_dir = "migrations"
   ```

3. **Terapkan migrasi database:**
   ```bash
   bunx wrangler d1 migrations apply syntive --remote
   ```

4. **Deploy Worker:**
   ```bash
   bunx wrangler deploy
   ```

5. **Arahkan ekstensi ke Worker:**
   Buat file `extension/.env` dari template:
   ```bash
   cd ../extension
   cp .env.example .env
   ```
   Lalu isi `VITE_API_BASE` dengan URL Worker hasil deploy (misal: `https://syntive.<subdomain>.workers.dev`).
</details>

<details>
<summary><b>2. Menjalankan Ekstensi (Development)</b></summary>

```bash
cd extension
bun install
bun run dev
```

- **Chrome / Edge / Brave:** Buka `chrome://extensions`, aktifkan *Developer mode*, pilih *Load unpacked*, dan arahkan ke `extension/.output/chrome-mv3`.
- **Firefox:** Buka `about:debugging#/runtime/this-firefox`, pilih *Load Temporary Add-on*, dan pilih `manifest.json` di `extension/.output/firefox-mv2`.
</details>

<details>
<summary><b>3. Build & Pembuatan Paket (.zip)</b></summary>

Dari root proyek:

```bash
# Build produksi Chrome & Firefox
bun run build:ext

# Buat file archive zip siap rilis
bun run zip:ext
```

Hasil paket zip tersimpan di folder `extension/.output/`.
</details>

<details>
<summary><b>4. Pemeriksaan Tipe & Self-Check</b></summary>

```bash
bun run typecheck
bun run extension/lib/crypto.selfcheck.ts
bun run extension/lib/bookmarkManagement.selfcheck.ts
bun run extension/lib/sync.selfcheck.ts
```
</details>

## Struktur Proyek

<details>
<summary><b>Lihat Struktur Direktori</b></summary>

```text
.
├── backend/                        # Cloudflare Worker native & database D1
│   ├── migrations/                 # Migrasi tabel vaults dan devices
│   ├── src/index.ts                # Handler API Worker & CORS
│   └── wrangler.toml               # Konfigurasi binding Cloudflare D1
│
├── extension/                      # Ekstensi browser (WXT + React + Tailwind)
│   ├── components/                 # Komponen UI, Dashboard, Bookmark, Manajemen, Modal
│   ├── entrypoints/                # Service worker background, newtab, dan popup
│   ├── lib/                        # Modul kripto, sinkronisasi, i18n, tema, dan utilitas
│   └── wxt.config.ts               # Konfigurasi framework WXT
│
├── design/                         # Asset visual & mockup
└── package.json                    # Script workspace root
```
</details>

## Lisensi

Didistribusikan di bawah lisensi **Apache-2.0**. Lihat berkas [LICENSE](LICENSE) untuk informasi lebih lanjut.

## Pengembang

Dikembangkan dan dirawat oleh [Bisma](https://github.com/bismawy).
