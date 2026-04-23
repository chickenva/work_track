# 📊 Work Track - Hệ Thống Quản Lý Chấm Công Và Báo Cáo Công Việc

## 📋 Mục Lục

- [Giới Thiệu](#giới-thiệu)
- [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
- [Tính Năng Chính](#tính-năng-chính)
- [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
- [Luồng Hoạt Động](#luồng-hoạt-động)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [Cơ Sở Dữ Liệu](#cơ-sở-dữ-liệu)
- [Cài Đặt Và Chạy](#cài-đặt-và-chạy)
- [API Endpoints](#api-endpoints)

---

## 🎯 Giới Thiệu

**Work Track** là một ứng dụng web toàn diện để quản lý chấm công nhân viên và báo cáo tiến độ công việc hàng ngày. Hệ thống cho phép nhân viên check-in/check-out, upload tấm chụp xác nhận, gửi báo cáo công việc, và quản lý trị kỳ nghỉ. Đồng thời, quản trị viên có thể giám sát chấm công, xem báo cáo, và quản lý tài khoản nhân viên.

---

## 🛠 Công Nghệ Sử Dụng

### Backend

| Công Nghệ              | Phiên Bản | Mục Đích                               |
| ---------------------- | --------- | -------------------------------------- |
| **Node.js**            | -         | Runtime JavaScript phía server         |
| **Express.js**         | 5.2.1     | Web framework chính                    |
| **MongoDB**            | -         | Cơ sở dữ liệu NoSQL                    |
| **Mongoose**           | 9.4.1     | Object Data Modeling (ODM) cho MongoDB |
| **JWT (jsonwebtoken)** | 9.0.3     | Xác thực và quản lý phiên              |
| **node-cron**          | 3.0.2     | Lập lịch các tác vụ tự động            |
| **moment.js**          | 2.30.1    | Xử lý ngày giờ                         |
| **multer**             | 2.1.1     | Upload file                            |
| **dotenv**             | 17.4.2    | Quản lý biến môi trường                |

### Frontend

| Công Nghệ      | Phiên Bản | Mục Đích                    |
| -------------- | --------- | --------------------------- |
| **EJS**        | 5.0.2     | Template engine             |
| **HTML/CSS**   | -         | Giao diện người dùng        |
| **JavaScript** | -         | Tương tác phía client       |
| **Bootstrap**  | -         | CSS framework (nếu sử dụng) |

### Công Cụ Phát Triển

| Công Cụ     | Phiên Bản |
| ----------- | --------- | ------------------------------------ |
| **nodemon** | 3.1.14    | Auto-reload server khi code thay đổi |

---

## ✨ Tính Năng Chính

### 🧑‍💼 Cho Nhân Viên

- ✅ **Chấm Công**: Check-in/check-out với tấm chụp xác nhận (selfie)
- ✅ **Báo Cáo Công Việc**: Gửi báo cáo hàng ngày (công việc hôm qua, hôm nay, kế hoạch, đánh giá hoàn thành, ghi chú)
- ✅ **Quản Lý Trị Kỳ Nghỉ**: Xem số ngày làm việc và ngày nghỉ
- ✅ **Xem Lịch Sử**: Xem các bản ghi chấm công và báo cáo quá khứ
- ✅ **Xác Thực JWT**: Đăng nhập an toàn với JWT tokens

### 👨‍💻 Cho Quản Trị Viên

- ✅ **Quản Lý Nhân Viên**: Tạo, sửa, xóa tài khoản nhân viên
- ✅ **Giám Sát Chấm Công**: Xem toàn bộ bản ghi chấm công của tất cả nhân viên
- ✅ **Xem Báo Cáo**: Theo dõi báo cáo công việc từ các nhân viên
- ✅ **Thống Kê**: Xem số liệu thống kê về chấm công, ngày nghỉ
- ✅ **Khoá Tài Khoản**: Khoá/mở khoá tài khoản nhân viên

### ⚙️ Tính Năng Tự Động

- ✅ **Auto-checkout**: Tự động checkout vào lúc 23:59:59 nếu nhân viên chưa checkout
- ✅ **Tính Ngày Nghỉ**: Tự động tính ngày không check-in (không tính ngày Chủ Nhật)
- ✅ **Thực Hiện Hàng Ngày**: Chạy vào lúc 00:01 mỗi ngày

---

## 🏗 Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────┐
│                   Client (Frontend)                      │
│              (Browser - EJS Templates)                   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP Requests
┌──────────────────────▼──────────────────────────────────┐
│               Express Server (app.js)                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Authentication Middleware                 │  │
│  │     (JWT Verification, Cookie Parser)            │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Routes & Controllers                   │  │
│  │  - Login/Logout                                  │  │
│  │  - Check-in/Check-out                           │  │
│  │  - Report Management                            │  │
│  │  - Admin Dashboard                              │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Scheduled Tasks (node-cron)              │  │
│  │     - Auto-checkout                              │  │
│  │     - Calculate Day Off                          │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ Database Queries
┌──────────────────────▼──────────────────────────────────┐
│         MongoDB Database & Mongoose Models              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ User | Attendance | Report                       │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 🔄 Luồng Hoạt Động

### 1️⃣ Luồng Đăng Nhập (Login Flow)

```
User Submit Credentials
        ↓
Validate Email/Password
        ↓
Generate JWT Token (30 ngày)
        ↓
Set Cookie + Redirect to Dashboard
        ↓
✅ Logged In
```

### 2️⃣ Luồng Check-in/Check-out (Attendance Flow)

```
User Click Check-in
        ↓
Capture Selfie
        ↓
Validate Time (trong giờ hành chính)
        ↓
Create Attendance Record
   {userId, date, checkInTime, selfie}
        ↓
✅ Check-in Success / Status: "checked-in"

---

User Click Check-out
        ↓
Capture Selfie
        ↓
Update Attendance Record
   {checkOutTime, checkOutSelfie, isCheckedOut: true}
        ↓
Update User workingDays += 1
        ↓
✅ Check-out Success / Status: "completed"
```

### 3️⃣ Luồng Báo Cáo Công Việc (Report Flow)

```
User Submit Report Form
        ↓
Fields:
- prevWork (công việc hôm qua)
- todayWork (công việc hôm nay)
- completionRate (tỷ lệ hoàn thành %)
- nextPlan (kế hoạch tiếp theo)
- suggestions (đề xuất)
- notes (ghi chú)
- files (upload file đính kèm)
        ↓
Create/Update Report Record
   {userId, date, ...fields, files}
        ↓
✅ Report Submitted
```

### 4️⃣ Luồng Tác Vụ Tự Động (Auto Task Flow)

```
Cron Job Chạy: 00:01 Mỗi Ngày
        ↓
Lấy Ngày Hôm Qua (yesterday)
        ↓
Lặp Qua Tất Cả Users:
        ├─ Kiểm Tra Check-out:
        │  - Nếu checked-in nhưng chưa checked-out
        │    → Auto-checkout lúc 23:59:59
        │    → workingDays += 1
        │
        └─ Kiểm Tra Check-in:
           - Nếu không có check-in record
           - Và hôm qua không phải Chủ Nhật
             → dayOff += 1
        ↓
✅ Daily Maintenance Complete
```

---

## 📁 Cấu Trúc Dự Án

```
work_track/
│
├── app.js                          # File chính - Express server & Cron jobs
├── package.json                    # Dependencies & Scripts
├── .env                            # Biến môi trường (cần tạo)
│
├── config/
│   └── db.js                       # MongoDB connection
│
├── models/
│   ├── User.js                     # Schema người dùng
│   ├── Attendance.js               # Schema chấm công
│   └── Report.js                   # Schema báo cáo công việc
│
├── middlewares/
│   └── auth.js                     # JWT authentication middleware
│
├── views/                          # EJS Templates
│   ├── login.ejs                   # Trang đăng nhập
│   ├── index.ejs                   # Dashboard nhân viên
│   └── admin.ejs                   # Dashboard admin
│
└── public/
    ├── css/
    │   ├── index.css               # CSS dashboard nhân viên
    │   └── admin.css               # CSS dashboard admin
    └── js/
        ├── index.js                # JavaScript dashboard nhân viên
        └── admin.js                # JavaScript dashboard admin
```

---

## 💾 Cơ Sở Dữ Liệu

### 👤 User Model (Người Dùng)

```javascript
{
  username: String (unique, bắt buộc),
  password: String (hash, bắt buộc),
  fullName: String (bắt buộc),
  phone: String (bắt buộc),
  position: String (bắt buộc) - e.g., "Developer", "Designer"
  workingDays: Number (default: 0) - Tổng ngày làm việc
  dayOff: Number (default: 0) - Tổng ngày nghỉ
  role: String (enum: ["user", "admin"], default: "user"),
  employeeId: String - Tự động tạo từ tên + số điện thoại
  accountStatus: String (enum: ["active", "locked"], default: "active"),
  lastActiveDate: Date,
  timestamps: {createdAt, updatedAt}
}
```

### 📋 Attendance Model (Chấm Công)

```javascript
{
  userId: ObjectId (ref: User, bắt buộc),
  date: String (format: DD/MM/YYYY, bắt buộc),

  // Check-in Info
  checkInTime: Date,
  selfie: String (path đến ảnh check-in),

  // Check-out Info
  checkOutTime: Date,
  checkOutSelfie: String (path đến ảnh check-out),
  isCheckedOut: Boolean (default: false),

  status: String (enum: ["checked-in", "completed"], default: "checked-in"),
  timestamps: {createdAt, updatedAt}
}
```

### 📝 Report Model (Báo Cáo Công Việc)

```javascript
{
  userId: ObjectId (ref: User, bắt buộc),
  date: String (format: DD/MM/YYYY, bắt buộc),

  prevWork: String - Công việc hôm qua
  todayWork: String - Công việc hôm nay
  completionRate: Number (0-100) - % hoàn thành
  nextPlan: String - Kế hoạch tiếp theo
  suggestions: String - Đề xuất/phản hồi
  notes: String - Ghi chú thêm

  files: [ - Danh sách file đính kèm
    {
      name: String,
      type: String (MIME type),
      data: String (Base64 encoded)
    }
  ],

  timestamps: {createdAt, updatedAt}
}
```

---

## 🚀 Cài Đặt Và Chạy

### 1. Yêu Cầu Hệ Thống

- Node.js 14+
- MongoDB (local hoặc Atlas)
- npm hoặc yarn

### 2. Cài Đặt Dependencies

```bash
npm install
```

### 3. Cấu Hình Môi Trường

Tạo file `.env` trong thư mục gốc:

```env
# Database
MONGO_URI=mongodb://localhost:27017/work_track
# hoặc nếu dùng MongoDB Atlas
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/work_track

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=30d

# Server
PORT=3000
NODE_ENV=development
```

### 4. Chạy Ứng Dụng

```bash
# Development (auto-reload với nodemon)
npm start

# Production
NODE_ENV=production node app.js
```

### 5. Truy Cập Ứng Dụng

- URL: `http://localhost:3000`
- Trang đăng nhập: `http://localhost:3000/login`

---

## 🔌 API Endpoints

### 🔐 Authentication

| Method | Endpoint            | Mô Tả                             |
| ------ | ------------------- | --------------------------------- |
| POST   | `/api/auth/login`   | Đăng nhập                         |
| POST   | `/api/auth/logout`  | Đăng xuất                         |
| GET    | `/api/auth/profile` | Lấy thông tin user (require auth) |

### ⏰ Attendance

| Method | Endpoint                    | Mô Tả                                |
| ------ | --------------------------- | ------------------------------------ |
| POST   | `/api/attendance/check-in`  | Check-in                             |
| POST   | `/api/attendance/check-out` | Check-out                            |
| GET    | `/api/attendance/today`     | Lấy chấm công hôm nay (require auth) |
| GET    | `/api/attendance/history`   | Lấy lịch sử chấm công (require auth) |
| GET    | `/api/admin/attendance`     | Xem tất cả chấm công (admin only)    |

### 📋 Report

| Method | Endpoint              | Mô Tả                              |
| ------ | --------------------- | ---------------------------------- |
| POST   | `/api/report/submit`  | Gửi báo cáo (require auth)         |
| GET    | `/api/report/today`   | Lấy báo cáo hôm nay (require auth) |
| GET    | `/api/report/history` | Lấy lịch sử báo cáo (require auth) |
| GET    | `/api/admin/report`   | Xem tất cả báo cáo (admin only)    |

### 👥 Admin - User Management

| Method | Endpoint                      | Mô Tả                                   |
| ------ | ----------------------------- | --------------------------------------- |
| GET    | `/api/admin/users`            | Lấy danh sách tất cả users (admin only) |
| POST   | `/api/admin/users`            | Tạo user mới (admin only)               |
| PUT    | `/api/admin/users/:id`        | Cập nhật user (admin only)              |
| DELETE | `/api/admin/users/:id`        | Xóa user (admin only)                   |
| PUT    | `/api/admin/users/:id/lock`   | Khoá tài khoản (admin only)             |
| PUT    | `/api/admin/users/:id/unlock` | Mở khoá tài khoản (admin only)          |

---

## 🔒 Bảo Mật

### JWT Authentication

- Token lưu trữ trong Cookie HTTP-only
- Token hết hạn sau 30 ngày (configurable)
- Mỗi request cần gửi token hợp lệ

### Middleware Auth

```javascript
// Kiểm tra JWT token từ cookie
// Nếu không hợp lệ → redirect to login
// Nếu hợp lệ → cho phép truy cập
```

### Quyền Hạn

- **User**: Chỉ xem/sửa dữ liệu của chính mình
- **Admin**: Có quyền truy cập tất cả dữ liệu và quản lý

---

## 📊 Workflow Logic

### Daily Maintenance Logic (00:01 Mỗi Ngày)

```
FOR EACH USER:
  1. Lấy attendance record của hôm qua

  2. Nếu không có record:
     - Nếu hôm qua là Chủ Nhật → Không xử lý
     - Nếu hôm qua không phải Chủ Nhật → dayOff += 1

  3. Nếu có record:
     - Nếu có checkInTime nhưng isCheckedOut = false:
       → Set checkOutTime = 23:59:59 (hôm qua)
       → Set isCheckedOut = true
       → Set status = "completed"
       → workingDays += 1

     - Nếu không có checkInTime AND không phải Chủ Nhật:
       → dayOff += 1
```

---

## 🐛 Troubleshooting

### Lỗi Kết Nối MongoDB

```
Error: connect ECONNREFUSED
```

**Giải pháp**: Kiểm tra MongoDB service đang chạy và `MONGO_URI` đúng

### JWT Token Hết Hạn

```
Error: jwt expired
```

**Giải pháp**: Đăng nhập lại để lấy token mới

### Auto-checkout Không Chạy

```
Cron job không chạy
```

**Giải pháp**: Kiểm tra server đang chạy, xem logs console

---

## 📈 Mở Rộng Tương Lai

- [ ] Thêm xác thực 2FA (Two-Factor Authentication)
- [ ] Export báo cáo sang Excel/PDF
- [ ] Dashboard thống kê nâng cao
- [ ] Thông báo email/SMS
- [ ] Mobile app (React Native/Flutter)
- [ ] Intergration với hệ thống HR khác
- [ ] Real-time notifications (WebSocket)

---

## 👨‍💻 Hỗ Trợ & Liên Hệ

Nếu có câu hỏi hoặc phát hiện lỗi, vui lòng liên hệ:

- Email: support@worktrack.com
- Issues: GitHub Issues

---

## 📄 Giấy Phép

ISC License - Xem file LICENSE để chi tiết

---

**Last Updated**: April 2026 | **Version**: 1.0.0
