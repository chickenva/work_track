// models/User.js
const mongoose = require("mongoose");
const moment = require("moment");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    department: {
      type: String,
      enum: ["R&D"],
      default: "R&D",
      required: true,
    },
    position: {
      type: String,
      enum: [
        "Giám đốc công nghệ",
        "Team leader",
        "Kỹ sư điện tử",
        "Kỹ sư phần mềm",
        "Sinh viên điện tử (Thực tập)",
      ],
      required: true,
    },
    workingDays: { type: Number, default: Date.now },
    dayOff: { type: Number, default: 0 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    employeeId: { type: String, unique: true },
    accountStatus: {
      type: String,
      enum: ["active", "locked"],
      default: "active",
    },
    startDate: {
      type: String,
      default: () => moment().format("DD/MM/YYYY"),
      required: true,
    },
    lastActiveDate: { type: Date, default: Date.now }, // Ngày bắt đầu làm
  },
  { timestamps: true },
);

// Pre-save middleware: Viết theo kiểu Thuần Async (Không dùng tham số next)
userSchema.pre("save", async function () {
  console.log(">>> Middleware đang chạy...");

  // Chỉ chạy logic tạo ID khi nhân viên được tạo mới (isNew = true)
  if (this.isNew) {
    try {
      // Dùng this.constructor để lấy Model User mà không bị lỗi vòng lặp (circular dependency)
      const User = this.constructor;
      const count = await User.countDocuments({ department: this.department });

      // Tạo số thứ tự (STT) 3 chữ số: 001, 002...
      const stt = (count + 1).toString().padStart(3, "0");

      // Gán mã nhân viên theo format: WG-mã phòng ban-STT
      const deptCode = this.department.replace("&", "N"); // Thay thế ký tự đặc biệt nếu có (ví dụ: R&D -> RND)
      this.employeeId = `WG-${deptCode}-${stt}`;

      // Với hàm async, khi hàm kết thúc, Mongoose sẽ tự hiểu là "next"
    } catch (error) {
      throw error;
    }
  }
});

module.exports = mongoose.model("User", userSchema);
