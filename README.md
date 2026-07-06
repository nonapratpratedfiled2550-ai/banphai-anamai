# ระบบอนามัยโรงเรียนบ้านไผ่

เว็บแอป static — deploy บน Vercel ได้โดยไม่ต้อง build

## ไฟล์ที่ต้องอัปโหลด GitHub ให้ครบ

| ไฟล์ | ความสำคัญ |
|------|-----------|
| `index.html` | หน้าแอปหลัก (~1.4 MB) |
| `student-basic-data.js` | ข้อมูลนักเรียน 2,725 คน (~2.4 MB) **ต้องมี** |
| `sheets-sync.js` | ซิงค์ Google Sheet |
| `auth-gate.js` | ล็อกอิน |
| `info-hub-restore.js` | ศูนย์ข้อมูล |
| `assets/physical-screening/` | รูปตรวจร่างกาย (~14 MB) |
| `google-apps-script.gs` | อ้างอิงสำหรับ deploy Apps Script (ไม่ใช้บน Vercel) |

## Deploy Vercel

1. Push โปรเจกต์ขึ้น GitHub ให้ครบไฟล์ด้านบน
2. เชื่อม Vercel กับ repo
3. Framework: **Other** (static)
4. ไม่ต้องตั้ง build command

## หมายเหตุ

- ข้อมูลใน `localStorage` บนเครื่องคุณ **ไม่ไปกับ Vercel** — ข้อมูลบน Vercel มาจาก Google Sheet + ไฟล์ใน repo
- ถ้าข้อมูลไม่ตรง ให้ตรวจว่า `student-basic-data.js` ถูก push ขึ้น GitHub ครบหรือไม่
