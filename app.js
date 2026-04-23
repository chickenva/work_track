require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db.js");
const cookieParser = require("cookie-parser");
const path = require("path");
const jwt = require("jsonwebtoken");
const cron = require("node-cron");
const User = require("./models/User");
const { requireAuth } = require("./middlewares/auth");
const Report = require("./models/Report");
const Attendance = require("./models/Attendance");
const moment = require("moment");

const app = express();

// Kết nối Database
connectDB();

// =============================== SCHEDULED TASKS ===============================

// Scheduled task chạy mỗi ngày lúc 00:01 để:
// 1. Auto-checkout cho những user chưa checkout
// 2. Tăng ngày nghỉ cho những user chưa check-in (trừ ngày Chủ Nhật)
cron.schedule("1 0 * * *", async () => {
  try {
    console.log("⏰ Running daily maintenance task at", new Date().toLocaleString());

    // Lấy ngày hôm qua (định dạng DD/MM/YYYY)
    const yesterdayDate = moment()
      .subtract(1, "day")
      .format("DD/MM/YYYY");
    const yesterdayMoment = moment().subtract(1, "day");
    const dayOfWeek = yesterdayMoment.day(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Lấy tất cả users
    const allUsers = await User.find({});

    for (const user of allUsers) {
      // Lấy attendance record của hôm qua
      const yesterdayAttendance = await Attendance.findOne({
        userId: user._id,
        date: yesterdayDate,
      });

      // Nếu không có record nào hôm qua, không cần xử lý
      if (!yesterdayAttendance) {
        // Nếu hôm qua không phải Chủ Nhật (dayOfWeek !== 0) và không có attendance record
        // thì tính là 1 ngày nghỉ
        if (dayOfWeek !== 0) {
          // Không phải Chủ Nhật
          console.log(
            `📍 User ${user.username} - Thêm 1 ngày nghỉ (không check-in hôm qua)`,
          );
          await User.findByIdAndUpdate(user._id, { $inc: { dayOff: 1 } });
        }
        continue;
      }

      // Nếu có check-in nhưng chưa check-out, tự động checkout
      if (
        yesterdayAttendance.checkInTime &&
        !yesterdayAttendance.isCheckedOut
      ) {
        console.log(
          `🚀 Auto-checkout cho user ${user.username} vào lúc ${new Date().toLocaleTimeString()}`,
        );

        // Auto-checkout: Set checkout time = end of yesterday (23:59:59)
        const checkOutTime = moment(yesterdayDate, "DD/MM/YYYY")
          .endOf("day")
          .toDate();

        await Attendance.findByIdAndUpdate(yesterdayAttendance._id, {
          checkOutTime: checkOutTime,
          isCheckedOut: true,
          status: "completed",
        });

        // Tăng workingDays khi auto-checkout
        await User.findByIdAndUpdate(user._id, { $inc: { workingDays: 1 } });

        console.log(`✅ Tăng workingDays cho user ${user.username}`);
      }
      // Nếu chưa check-in hôm qua và hôm qua không phải Chủ Nhật
      else if (
        !yesterdayAttendance.checkInTime &&
        dayOfWeek !== 0
      ) {
        console.log(
          `📍 User ${user.username} - Thêm 1 ngày nghỉ (không check-in hôm qua)`,
        );
        await User.findByIdAndUpdate(user._id, { $inc: { dayOff: 1 } });
      }
    }

    console.log("✅ Daily maintenance task completed");
  } catch (error) {
    console.error("❌ Error in daily maintenance task:", error);
  }
});

// =============================== END SCHEDULED TASKS ===============================

// Middleware
app.use(express.json({ limit: "50mb" })); // Tăng limit để nhận ảnh Base64
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// View Engine
app.set("view engine", "ejs");

app.get("/login", (req, res) => res.render("login"));

// API Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt:", { username, password });
  const user = await User.findOne({ username, password });
  if (!user)
    return res.render("login", {
      error: "Tên tài khoản hoặc mật khẩu không đúng!",
    });

  // Check if account is locked
  if (user.accountStatus === "locked") {
    return res.render("login", { error: "Tài khoản của bạn đã bị khóa!" });
  }

  // Update last active date
  user.lastActiveDate = new Date();
  await user.save();

  const token = jwt.sign(
    {
      userId: user._id,
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
      position: user.position,
      workingDays: user.workingDays,
      dayOff: user.dayOff,
      role: user.role,
      accountStatus: user.accountStatus,
    },
    process.env.JWT_SECRET,
  );
  res.cookie("auth_token", token, { httpOnly: true });
  // Redirect dựa vào role
  const redirectPath =
    user.role === "admin" ? `/admin/${user._id}` : `/user/${user._id}`;
  res.redirect(redirectPath);
});

// Helper function để render dashboard
const renderDashboard = async (req, res) => {
  const today = moment().format("DD/MM/YYYY");

  // Fetch the full user from database to get all fields
  let fullUser = await User.findById(req.user.userId);

  // Fallback to req.user if fullUser is not found
  if (!fullUser) {
    fullUser = req.user;
  }

  const reportToday = await Report.findOne({
    userId: req.user.userId,
    date: today,
  });

  // Lấy Attendance record của hôm nay
  const attendanceToday = await Attendance.findOne({
    userId: req.user.userId,
    date: today,
  });

  // Lấy lịch sử để đổ lên lịch từ Attendance
  const allAttendances = await Attendance.find({
    userId: req.user.userId,
  }).select(
    "date selfie checkInTime checkOutSelfie checkOutTime status isCheckedOut",
  );
  const checkinMap = {};
  const checkoutMap = {};
  allAttendances.forEach((a) => {
    if (a.selfie) {
      checkinMap[a.date] = {
        selfie: a.selfie,
        time: moment(a.checkInTime).format("HH:mm A"),
        status: a.status,
      };
    }
    if (a.checkOutSelfie) {
      checkoutMap[a.date] = {
        checkOutSelfie: a.checkOutSelfie,
        time: moment(a.checkOutTime).format("HH:mm A"),
      };
    }
  });

  res.render("index", {
    user: fullUser,
    report: reportToday,
    attendance: attendanceToday,
    checkinData: JSON.stringify(checkinMap),
    checkoutData: JSON.stringify(checkoutMap),
  });
};

// Redirect về /user/:id hoặc /admin/:id
app.get("/", requireAuth, (req, res) => {
  const redirectPath =
    req.user.role === "admin"
      ? `/admin/${req.user.userId}`
      : `/user/${req.user.userId}`;
  res.redirect(redirectPath);
});

// Route User - /user/:id
app.get("/user/:id", requireAuth, async (req, res) => {
  // Validate user ID match
  if (req.params.id !== req.user.userId) {
    return res.status(403).send("Forbidden");
  }
  await renderDashboard(req, res);
});

// Route Admin - /admin/:id
app.get("/admin/:id", requireAuth, async (req, res) => {
  // Validate admin role
  if (req.user.role !== "admin") {
    return res.status(403).send("Access denied. Admin only!");
  }
  // Validate user ID match
  if (req.params.id !== req.user.userId) {
    return res.status(403).send("Forbidden");
  }
  // Fetch the full user from database
  let fullUser = await User.findById(req.user.userId);
  if (!fullUser) {
    fullUser = req.user;
  }
  res.render("admin", { user: fullUser });
});

// API Check-in
app.post("/checkin", requireAuth, async (req, res) => {
  try {
    const moment = require("moment");
    // ÉP CHUẨN ĐỊNH DẠNG DD/MM/YYYY
    const todayStr = moment().format("DD/MM/YYYY");

    const exist = await Attendance.findOne({
      userId: req.user.userId,
      date: todayStr,
    });
    if (exist)
      return res.json({ success: false, message: "Đã chấm công rồi!" });

    // Tạo Attendance record
    await Attendance.create({
      userId: req.user.userId,
      date: todayStr,
      checkInTime: new Date(),
      selfie: req.body.imageBase64,
      status: "checked-in",
    });

    // Tạo Report record cho ngày hôm nay nếu chưa có
    const reportExists = await Report.findOne({
      userId: req.user.userId,
      date: todayStr,
    });
    if (!reportExists) {
      await Report.create({
        userId: req.user.userId,
        date: todayStr,
      });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API Check-out
app.post("/checkout", requireAuth, async (req, res) => {
  try {
    const { date, imageBase64 } = req.body;

    // Cập nhật Attendance record
    const attendance = await Attendance.findOneAndUpdate(
      { userId: req.user.userId, date: date },
      {
        checkOutTime: new Date(),
        checkOutSelfie: imageBase64,
        isCheckedOut: true,
        status: "completed",
      },
      { new: true },
    );

    if (!attendance)
      return res.json({
        success: false,
        message: "Không tìm thấy dữ liệu check-in hôm nay!",
      });

    // Tăng workingDays khi checkout thành công
    await User.findByIdAndUpdate(
      req.user.userId,
      { $inc: { workingDays: 1 } },
      { new: true },
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API Tăng số ngày nghỉ (khi qua ngày mới mà không check-in)
app.post("/increment-day-off", requireAuth, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { $inc: { dayOff: 1 } },
      { new: true },
    );

    res.json({
      success: true,
      message: "Ngày nghỉ đã được cập nhật!",
      dayOff: updatedUser.dayOff,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Helper function: Calculate check-in/check-out status
function calculateCheckInStatus(checkInTime) {
  if (!checkInTime) return "--:--";

  const inTime = moment(checkInTime);

  // Define time boundaries
  const onTimeStart = moment(inTime)
    .clone()
    .set({ hour: 8, minute: 0, second: 0 }); // 8:00 AM
  const onTimeEnd = moment(inTime)
    .clone()
    .set({ hour: 8, minute: 30, second: 0 }); // 8:30 AM

  if (inTime < onTimeStart) {
    // Check-in before 8:00 AM = EARLY
    const diffSeconds = onTimeStart.diff(inTime, "seconds");
    return formatTimeDifference(diffSeconds, "Sớm");
  } else if (inTime <= onTimeEnd) {
    // Check-in from 8:00 AM to 8:30 AM = ON TIME
    return "Đúng giờ";
  } else {
    // Check-in after 8:30 AM = LATE
    const diffSeconds = inTime.diff(onTimeEnd, "seconds");
    return formatTimeDifference(diffSeconds, "Trễ");
  }
}

function formatTimeDifference(seconds, label) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  let result = label;

  if (hours > 0) {
    result += ` ${hours} tiếng`;
  }

  if (minutes > 0) {
    result += ` ${minutes} phút`;
  }

  if (secs > 0 && hours === 0 && minutes === 0) {
    result += ` ${secs} giây`;
  }

  return result;
}

function calculateCheckOutStatus(checkInTime, checkOutTime) {
  if (!checkOutTime) return "Chưa checkout";
  return moment(checkOutTime).format("HH:mm");
}

// API Lấy danh sách báo cáo
app.get("/reports", requireAuth, async (req, res) => {
  try {
    const moment = require("moment");
    // Tìm toàn bộ báo cáo của user này
    const reports = await Report.find({ userId: req.user.userId }).sort({
      createdAt: -1,
    });

    // Tìm toàn bộ attendance của user này
    const attendances = await Attendance.find({ userId: req.user.userId }).sort(
      {
        createdAt: -1,
      },
    );

    // Tạo map attendance theo date để tìm nhanh
    const attendanceMap = {};
    attendances.forEach((a) => {
      attendanceMap[a.date] = a;
    });

    // Format lại dữ liệu trước khi gửi xuống Frontend
    const formattedReports = reports.map((r) => {
      const attendance = attendanceMap[r.date];
      let totalHours = 0;
      if (attendance && attendance.checkInTime && attendance.checkOutTime) {
        const inTime = moment(attendance.checkInTime);
        const outTime = moment(attendance.checkOutTime);
        const duration = moment.duration(outTime.diff(inTime));
        totalHours = duration.asHours().toFixed(1);
      }

      return {
        date: r.date,
        checkInTime:
          attendance && attendance.checkInTime
            ? moment(attendance.checkInTime).format("HH:mm")
            : "--:--",
        checkOutTime:
          attendance && attendance.checkOutTime
            ? moment(attendance.checkOutTime).format("HH:mm")
            : "--:--",
        checkInStatus: attendance
          ? calculateCheckInStatus(attendance.checkInTime)
          : "--:--",
        checkOutStatus: attendance
          ? calculateCheckOutStatus(
              attendance.checkInTime,
              attendance.checkOutTime,
            )
          : "--:--",
        totalHours: totalHours,
        todayWork: r.todayWork,
        files: r.files || [],
      };
    });

    res.json({ success: true, data: formattedReports });
  } catch (err) {
    console.error("Lỗi lấy danh sách báo cáo:", err);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
});

// API Lấy chi tiết báo cáo của một ngày
app.get("/report-detail", requireAuth, async (req, res) => {
  try {
    const date = req.query.date;
    console.log("GET /report-detail - date param:", date);

    if (!date) {
      return res.json({ success: false, message: "Thiếu ngày" });
    }

    const report = await Report.findOne({
      userId: req.user.userId,
      date: date,
    });

    if (!report) {
      console.log("Report not found for date:", date);
      return res.json({ success: false, message: "Báo cáo không tồn tại" });
    }

    res.json({ success: true, data: report });
  } catch (err) {
    console.error("Error fetching report:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// API Thêm báo cáo
app.post("/report", requireAuth, async (req, res) => {
  try {
    const moment = require("moment");
    // ÉP CHUẨN ĐỊNH DẠNG DD/MM/YYYY (Phải giống hệt lúc checkin)
    const todayStr = moment().format("DD/MM/YYYY");

    // Cầm chuỗi "17/04/2026" đi tìm trong DB
    const report = await Report.findOne({
      userId: req.user.userId,
      date: todayStr,
    });

    // NẾU KHÔNG TÌM THẤY SẼ VĂNG LỖI MÀ BẠN ĐANG GẶP PHẢI
    if (!report) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng check-in trước khi gửi báo cáo!",
      });
    }

    // FIX: Kiểm tra xem báo cáo hôm nay đã được thêm chưa
    // Nếu đã có todayWork (công việc thực hiện) thì không cho thêm lần nữa
    if (report.todayWork && report.todayWork.trim() !== "") {
      return res.status(400).json({
        success: false,
        message:
          "Báo cáo hôm nay đã được thêm rồi! Vui lòng check-in ngày hôm sau để thêm báo cáo mới.",
      });
    }

    report.prevWork = req.body.prevWork;
    report.todayWork = req.body.todayWork;
    report.completionRate = req.body.completionRate;
    report.nextPlan = req.body.nextPlan;
    report.suggestions = req.body.suggestions;
    report.notes = req.body.notes;
    // FIX: Lưu files nếu có - xử lý các trường hợp null hoặc undefined
    if (
      req.body.files &&
      Array.isArray(req.body.files) &&
      req.body.files.length > 0
    ) {
      report.files = req.body.files;
    } else {
      report.files = [];
    }

    await report.save();
    res.json({ success: true, message: "Báo cáo đã được lưu thành công!" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi Server: " + err.message });
  }
});

// API Cập nhật báo cáo
app.put("/report-detail", requireAuth, async (req, res) => {
  try {
    const moment = require("moment");
    const reportDate = req.query.date;

    const report = await Report.findOne({
      userId: req.user.userId,
      date: reportDate,
    });
    if (!report)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy báo cáo!" });

    // Chuyển về cùng mốc 0h để so sánh ngày
    const isPastDay = moment(reportDate, ["YYYY-MM-DD", "DD/MM/YYYY"]).isBefore(
      moment().startOf("day"),
    );

    if (isPastDay) {
      // ĐÃ QUA NGÀY MỚI -> Chỉ cho sửa ghi chú
      report.notes = req.body.notes;
    } else {
      // VẪN TRONG NGÀY HÔM NAY -> Cho sửa toàn bộ (dù đã check-out)
      report.prevWork = req.body.prevWork;
      report.todayWork = req.body.todayWork;
      report.completionRate = req.body.completionRate;
      report.nextPlan = req.body.nextPlan;
      report.suggestions = req.body.suggestions;
      report.notes = req.body.notes;
      // FIX: Cập nhật files nếu có - xử lý các trường hợp null hoặc undefined
      if (
        req.body.files &&
        Array.isArray(req.body.files) &&
        req.body.files.length > 0
      ) {
        report.files = req.body.files;
      } else if (req.body.files && Array.isArray(req.body.files)) {
        report.files = [];
      }
    }

    await report.save();
    res.json({ success: true, message: "Cập nhật báo cáo thành công!" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi Server: " + err.message });
  }
});

// =============================== ADMIN APIs ===============================

// API Lấy danh sách nhân viên (admin only)
app.get("/api/employees", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const employees = await User.find({ role: "user" }).select(
      "username fullName phone position workingDays dayOff role employeeId",
    );

    // Add employee ID virtual field to response
    const employeesWithId = employees.map((emp) => ({
      _id: emp._id,
      username: emp.username,
      fullName: emp.fullName,
      phone: emp.phone,
      position: emp.position,
      workingDays: emp.workingDays,
      dayOff: emp.dayOff,
      role: emp.role,
      employeeId: emp.employeeId,
      status: "not-checked-in", // Default, will be updated real-time
    }));

    res.json({ success: true, data: employeesWithId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API Lấy chi tiết nhân viên
app.get("/api/employee/:id", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.json({ success: false, message: "Nhân viên không tồn tại" });
    }

    res.json({
      success: true,
      data: {
        _id: employee._id,
        username: employee.username,
        fullName: employee.fullName,
        phone: employee.phone,
        position: employee.position,
        workingDays: employee.workingDays,
        dayOff: employee.dayOff,
        role: employee.role,
        employeeId: employee.employeeId,
        accountStatus: employee.accountStatus,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API Lấy status real-time của nhân viên
app.get("/api/employee/:id/status", requireAuth, async (req, res) => {
  try {
    const today = moment().format("DD/MM/YYYY");
    const attendance = await Attendance.findOne({
      userId: req.params.id,
      date: today,
    });

    let status = "not-checked-in";
    if (attendance) {
      if (attendance.isCheckedOut) {
        status = "checked-out";
      } else if (attendance.checkInTime) {
        status = "checked-in";
      }
    }

    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API Tạo nhân viên mới
app.post("/api/employee", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const {
      username,
      password,
      fullName,
      phone,
      position,
      workingDays,
      dayOff,
      role,
    } = req.body;

    // Validation
    if (!username || !password || !fullName || !phone || !position) {
      return res.json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin bắt buộc",
      });
    }

    // Check username exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.json({
        success: false,
        message: "Tên tài khoản đã tồn tại",
      });
    }

    const newEmployee = await User.create({
      username,
      password,
      fullName,
      phone,
      position,
      workingDays: workingDays || 0,
      dayOff: dayOff || 0,
      role: role || "user",
    });

    res.json({
      success: true,
      message: "Thêm nhân viên thành công!",
      data: newEmployee,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API Cập nhật thông tin nhân viên
app.put("/api/employee/:id", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const { password, fullName, phone, position, workingDays, dayOff, role } =
      req.body;

    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.json({ success: false, message: "Nhân viên không tồn tại" });
    }

    // Update fields
    if (password) employee.password = password;
    if (fullName) employee.fullName = fullName;
    if (phone) employee.phone = phone;
    if (position) employee.position = position;
    if (workingDays !== undefined) employee.workingDays = workingDays;
    if (dayOff !== undefined) employee.dayOff = dayOff;
    if (role) employee.role = role;

    await employee.save();

    res.json({
      success: true,
      message: "Cập nhật thông tin thành công",
      data: employee,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API Khóa tài khoản nhân viên
app.put("/api/employee/:id/lock", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.json({ success: false, message: "Nhân viên không tồn tại" });
    }

    employee.accountStatus = "locked";
    await employee.save();

    res.json({
      success: true,
      message: "Khóa tài khoản thành công!",
      data: employee,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API Mở khóa tài khoản nhân viên
app.put("/api/employee/:id/unlock", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.json({ success: false, message: "Nhân viên không tồn tại" });
    }

    employee.accountStatus = "active";
    employee.lastActiveDate = new Date();
    await employee.save();

    res.json({
      success: true,
      message: "Mở khóa tài khoản thành công!",
      data: employee,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API Xóa tài khoản nhân viên
app.delete("/api/employee/:id", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only!" });
    }

    const employee = await User.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.json({ success: false, message: "Nhân viên không tồn tại!" });
    }

    // Also delete associated reports and attendances
    await Report.deleteMany({ userId: req.params.id });
    await Attendance.deleteMany({ userId: req.params.id });

    res.json({
      success: true,
      message: "Xóa tài khoản thành công!",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API Lấy danh sách báo cáo của nhân viên
app.get("/api/employee/:id/reports", async (req, res) => {
  try {
    const { id } = req.params;
    const reports = await Report.find({ userId: id })
      .sort({ date: -1 })
      .limit(30);

    const attendances = await Attendance.find({ userId: id }).sort({
      date: -1,
    });

    // Tạo map attendance theo date để tìm nhanh
    const attendanceMap = {};
    attendances.forEach((a) => {
      attendanceMap[a.date] = a;
    });

    const formattedReports = reports.map((r) => {
      const attendance = attendanceMap[r.date];
      return {
        date: r.date,
        checkInTime:
          attendance && attendance.checkInTime
            ? moment(attendance.checkInTime).format("HH:mm")
            : "--:--",
        checkOutTime:
          attendance && attendance.checkOutTime
            ? moment(attendance.checkOutTime).format("HH:mm")
            : "--:--",
        checkInStatus: attendance
          ? calculateCheckInStatus(attendance.checkInTime)
          : "--:--",
        checkOutStatus: attendance
          ? calculateCheckOutStatus(
              attendance.checkInTime,
              attendance.checkOutTime,
            )
          : "--:--",
        totalHours:
          attendance && attendance.checkOutTime && attendance.checkInTime
            ? moment(attendance.checkOutTime)
                .diff(moment(attendance.checkInTime), "hours", true)
                .toFixed(1)
            : 0,
      };
    });

    res.json({ success: true, data: formattedReports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API Lấy lịch làm việc của nhân viên
app.get(
  "/api/employee/:employeeId/calendars",
  requireAuth,
  async (req, res) => {
    try {
      const moment = require("moment");
      const attendances = await Attendance.find({
        userId: req.params.employeeId,
      });

      let checkinData = {};
      let checkoutData = {};

      attendances.forEach((a) => {
        // Biến a.date trong DB của bạn đang là DD/MM/YYYY
        const dateKey = a.date;

        // Dữ liệu ảnh Check-in
        if (a.selfie) {
          checkinData[dateKey] = {
            selfie: a.selfie,
            time: a.checkInTime
              ? moment(a.checkInTime).format("HH:mm")
              : "--:--",
          };
        }
        // Dữ liệu ảnh Check-out
        if (a.checkOutSelfie) {
          checkoutData[dateKey] = {
            checkOutSelfie: a.checkOutSelfie,
            time: a.checkOutTime
              ? moment(a.checkOutTime).format("HH:mm")
              : "--:--",
          };
        }
      });

      res.json({
        success: true,
        checkinData: checkinData,
        checkoutData: checkoutData,
      });
    } catch (err) {
      console.error("Lỗi lấy lịch:", err);
      res.status(500).json({ success: false, message: "Lỗi Server" });
    }
  },
);

// API Lấy chi tiết báo cáo của nhân viên
app.get("/api/employee/:id/report", async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    const report = await Report.findOne({
      userId: id,
      date: date,
    });

    const attendance = await Attendance.findOne({
      userId: id,
      date: date,
    });

    if (!report) {
      return res.json({
        success: true,
        data: {
          date: date,
          checkInTime: "N/A",
          checkOutTime: "N/A",
          totalHours: 0,
          todayWork: "N/A",
          prevWork: "N/A",
          completionRate: 0,
          nextPlan: "N/A",
          suggestions: "N/A",
          notes: "N/A",
          files: [],
        },
      });
    }

    let totalHours = 0;
    if (attendance && attendance.checkInTime && attendance.checkOutTime) {
      totalHours = moment(attendance.checkOutTime)
        .diff(moment(attendance.checkInTime), "hours", true)
        .toFixed(1);
    }

    res.json({
      success: true,
      data: {
        date: report.date,
        checkInTime:
          attendance && attendance.checkInTime
            ? new Date(attendance.checkInTime).toLocaleTimeString()
            : "N/A",
        checkOutTime:
          attendance && attendance.checkOutTime
            ? new Date(attendance.checkOutTime).toLocaleTimeString()
            : "N/A",
        totalHours: totalHours,
        todayWork: report.todayWork || "N/A",
        prevWork: report.prevWork || "N/A",
        completionRate: report.completionRate || 0,
        nextPlan: report.nextPlan || "N/A",
        suggestions: report.suggestions || "N/A",
        notes: report.notes || "N/A",
        files: report.files || [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Logout
app.get("/logout", (req, res) => {
  res.clearCookie("auth_token");
  res.redirect("/login");
});

// Nếu không có auth thì redirect về login
app.use((req, res) => {
  res.redirect("/login");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🔥 Server running on http://localhost:${PORT}`),
);
