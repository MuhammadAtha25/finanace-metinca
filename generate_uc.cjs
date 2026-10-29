const https = require('https');
const fs = require('fs');
const path = require('path');

const puml = `
@startuml
skinparam dpi 300
skinparam backgroundColor white
left to right direction
skinparam packageStyle rectangle

actor "Staff Sales" as sales
actor "Staff Accounting" as acc
actor "Manager Accounting" as mgr

rectangle "Sistem Perekapan Penjualan" {
  usecase "Menginput & Mengirim Invoice Baru" as UC1
  usecase "Menandai Invoice Lunas" as UC2
  usecase "Memvalidasi / Menolak Invoice" as UC3
  usecase "Membuat & Mengirim Laporan Perekapan" as UC4
  usecase "Memvalidasi / Menolak Laporan" as UC5
}

sales --> UC1
sales --> UC2

acc --> UC3
acc --> UC4

UC5 <-- mgr
@enduml
`;

const options = {
  hostname: 'kroki.io',
  port: 443,
  path: '/plantuml/png',
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain',
    'Content-Length': Buffer.byteLength(puml)
  }
};

const outputPath = path.join(__dirname, 'public', 'usecase_diagram.png');

const req = https.request(options, (res) => {
  const file = fs.createWriteStream(outputPath);
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Gambar Use Case berhasil disimpan di: ' + outputPath);
  });
});

req.on('error', (e) => {
  console.error('Terjadi kesalahan saat mengunduh gambar:', e);
});

req.write(puml);
req.end();
