// TOAST NOTIFICATION SYSTEM
function showToast(message, type = "info", duration = 3000) {
  const toast = document.createElement("div");
  const bgColor =
    {
      success: "#27ae60",
      error: "#e74c3c",
      info: "#3498db",
      warning: "#f39c12",
    }[type] || "#3498db";

  toast.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background-color: ${bgColor};
          color: white;
          padding: 15px 20px;
          border-radius: 5px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          z-index: 9999;
          max-width: 400px;
          word-wrap: break-word;
          animation: slideIn 0.3s ease-in;
        `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// CONFIRM DIALOG SYSTEM
function showConfirmDialog(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    const dialog = document.createElement("div");
    dialog.style.cssText = `
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      padding: 30px;
      max-width: 400px;
      text-align: center;
      animation: dialogSlideIn 0.3s ease-out;
    `;

    const messageEl = document.createElement("p");
    messageEl.textContent = message;
    messageEl.style.cssText = `
      font-size: 16px;
      color: #333;
      margin-bottom: 30px;
      line-height: 1.5;
    `;

    const buttonContainer = document.createElement("div");
    buttonContainer.style.cssText = `
      display: flex;
      gap: 15px;
      justify-content: center;
    `;

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "HỦY";
    cancelBtn.style.cssText = `
      padding: 10px 25px;
      background-color: #95a5a6;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      transition: background-color 0.3s;
    `;
    cancelBtn.onmouseover = () => (cancelBtn.style.backgroundColor = "#7f8c8d");
    cancelBtn.onmouseout = () => (cancelBtn.style.backgroundColor = "#95a5a6");
    cancelBtn.onclick = () => {
      overlay.remove();
      resolve(false);
    };

    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "XÁC NHẬN";
    confirmBtn.style.cssText = `
      padding: 10px 25px;
      background-color: #e74c3c;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      transition: background-color 0.3s;
    `;
    confirmBtn.onmouseover = () =>
      (confirmBtn.style.backgroundColor = "#c0392b");
    confirmBtn.onmouseout = () =>
      (confirmBtn.style.backgroundColor = "#e74c3c");
    confirmBtn.onclick = () => {
      overlay.remove();
      resolve(true);
    };

    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(confirmBtn);
    dialog.appendChild(messageEl);
    dialog.appendChild(buttonContainer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  });
}

// Thêm CSS animations
const style = document.createElement("style");
style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(400px); opacity: 0; }
        }
        @keyframes dialogSlideIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `;
document.head.appendChild(style);

let allEmployees = [];
let editingEmployeeId = null;

// Generate employee ID from fullName and phone
function generateEmployeeId(fullName, phone) {
  if (!fullName || !phone) return "";
  const lastNamePart = fullName.trim().split(" ").pop();
  const lastThreeDigits = phone.slice(-3);
  return (lastNamePart + lastThreeDigits).toLowerCase();
}

// Update employee ID field
function updateEmployeeId() {
  const fullName = document.getElementById("fullName").value;
  const phone = document.getElementById("phone").value;
  const employeeIdField = document.getElementById("employeeId");
  employeeIdField.value = generateEmployeeId(fullName, phone);
}

// Tìm kiếm nhân viên
function filterEmployees() {
  const searchText = document.getElementById("searchInput").value.toLowerCase();
  const filtered = allEmployees.filter(
    (emp) =>
      emp.employeeId.toLowerCase().includes(searchText) ||
      emp.fullName.toLowerCase().includes(searchText),
  );
  renderEmployeeTable(filtered);
}

// Setup event listeners for auto-generation
document.addEventListener("DOMContentLoaded", function () {
  const fullNameField = document.getElementById("fullName");
  const phoneField = document.getElementById("phone");

  if (fullNameField) {
    fullNameField.addEventListener("input", updateEmployeeId);
  }
  if (phoneField) {
    phoneField.addEventListener("input", updateEmployeeId);
  }
});

// Chuyển đổi tab
function switchTab(tabName, element) {
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active");
  });
  document.querySelectorAll(".tab-button").forEach((btn) => {
    btn.classList.remove("active");
  });
  document.getElementById("tab-" + tabName).classList.add("active");
  element.classList.add("active");
}

// Tải danh sách nhân viên
function loadEmployees() {
  fetch("/api/employees")
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        allEmployees = data.data;
        renderEmployeeTable(data.data);
      }
    })
    .catch((err) => console.error("Error loading employees:", err));
}

// Render bảng nhân viên
function renderEmployeeTable(employees) {
  const tbody = document.getElementById("employeeTableBody");

  if (employees.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="empty-message">Không có nhân viên nào</td></tr>';
    return;
  }

  tbody.innerHTML = employees
    .map(
      (emp) => `
          <tr>
            <td><strong>${emp.employeeId}</strong></td>
            <td>${emp.fullName}</td>
            <td>${emp.position}</td>
            <td>${emp.workingDays}</td>
            <td>${emp.dayOff}</td>
            <td>
              <span class="status-badge ${getStatusClass(emp.status)}" id="status-${emp._id}">
                ${getStatusText(emp.status)}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button class="btn-action btn-view" onclick="viewEmployeeDetail('${emp._id}')">
                  Xem
                </button>
                <button class="btn-action btn-edit" onclick="editEmployee('${emp._id}')">
                  Sửa
                </button>
              </div>
            </td>
          </tr>
        `,
    )
    .join("");

  // Update real-time status
  employees.forEach((emp) => {
    updateEmployeeStatus(emp._id);
  });
}

// Lấy class CSS cho status
function getStatusClass(status) {
  switch (status) {
    case "checked-in":
      return "status-green";
    case "checked-out":
      return "status-orange";
    default:
      return "status-red";
  }
}

// Lấy text cho status
function getStatusText(status) {
  switch (status) {
    case "checked-in":
      return "Đã check-in";
    case "checked-out":
      return "Đã check-out";
    default:
      return "Chưa check-in";
  }
}

// Update real-time status
function updateEmployeeStatus(employeeId) {
  fetch(`/api/employee/${employeeId}/status`)
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        const statusEl = document.getElementById(`status-${employeeId}`);
        if (statusEl) {
          statusEl.textContent = getStatusText(data.status);
          statusEl.className = `status-badge ${getStatusClass(data.status)}`;
        }
      }
    })
    .catch((err) => console.error("Error updating status:", err));
}

// Xem chi tiết nhân viên
function viewEmployeeDetail(employeeId) {
  viewEmployeeDetailTab(employeeId);
}

// Chỉnh sửa nhân viên
function editEmployee(employeeId) {
  fetch(`/api/employee/${employeeId}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        const emp = data.data;
        editingEmployeeId = emp._id;
        document.getElementById("username").value = emp.username;
        document.getElementById("username").disabled = true;
        document.getElementById("password").value = "";
        document.getElementById("password").required = false;
        document.getElementById("employeeId").value = emp.employeeId;
        document.getElementById("fullName").value = emp.fullName;
        document.getElementById("phone").value = emp.phone;
        document.getElementById("position").value = emp.position;
        document.getElementById("workingDays").value = emp.workingDays;
        document.getElementById("workingDays").readOnly = true;
        document.getElementById("dayOff").value = emp.dayOff;
        document.getElementById("dayOff").readOnly = true;
        document.getElementById("role").value = emp.role;

        // Set account status
        const statusMap = {
          active: "Hoạt động",
          locked: "Đang khóa",
        };
        document.getElementById("accountStatus").value =
          statusMap[emp.accountStatus] || "Hoạt động";

        document.getElementById("formTitle").textContent =
          "CHỈNH SỬA THÔNG TIN NHÂN VIÊN";

        // Show edit mode buttons
        document.getElementById("submitBtn").textContent = "LƯU THAY ĐỔI";
        document.getElementById("submitBtn").style.flex = "1";
        document.getElementById("submitBtn").style.minWidth = "auto";
        document.getElementById("cancelEditBtn").style.display = "block";
        document.getElementById("resetBtn").style.display = "none";

        // Show lock/unlock and delete buttons
        document.getElementById("lockBtn").style.display = "block";
        document.getElementById("deleteBtn").style.display = "block";

        // Update lock button text based on current status
        if (emp.accountStatus === "locked") {
          document.getElementById("lockBtn").textContent = "MỞ KHÓA";
          document.getElementById("lockBtn").style.backgroundColor = "#f39c12";
        } else {
          document.getElementById("lockBtn").textContent = "KHÓA";
          document.getElementById("lockBtn").style.backgroundColor = "#f39c12";
        }

        switchTab("add", document.querySelectorAll(".tab-button")[1]);
      }
    })
    .catch((err) => console.error("Error:", err));
}

// Submit form nhân viên
function submitEmployeeForm() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const fullName = document.getElementById("fullName").value;
  const phone = document.getElementById("phone").value;
  const position = document.getElementById("position").value;
  const workingDays = parseInt(document.getElementById("workingDays").value);
  const dayOff = parseInt(document.getElementById("dayOff").value);
  const role = document.getElementById("role").value;

  if (!username || !fullName || !phone || !position) {
    showToast("Vui lòng điền đầy đủ thông tin bắt buộc!", "warning");
    return;
  }

  if (editingEmployeeId) {
    // Update
    const updateData = {
      fullName,
      phone,
      position,
      role,
    };

    // Only include password if provided
    if (password) {
      updateData.password = password;
    }

    fetch(`/api/employee/${editingEmployeeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showToast("Cập nhật thông tin nhân viên thành công!", "success");
          resetEmployeeForm();
          loadEmployees();

          // Switch to list tab
          setTimeout(() => {
            const listTabBtn = document.querySelector(".tab-button");
            if (listTabBtn) switchTab("list", listTabBtn);
          }, 300);
        } else {
          showToast(data.message || "Không thể cập nhật!", "error");
        }
      })
      .catch((err) => showToast(err.message, "error"));
  } else {
    // Create
    if (!password) {
      showToast("Vui lòng nhập mật khẩu!", "warning");
      return;
    }
    fetch("/api/employee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        fullName,
        phone,
        position,
        workingDays,
        dayOff,
        role,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showToast("Thêm nhân viên thành công!", "success");
          resetEmployeeForm();
          loadEmployees();

          // Switch to list tab
          setTimeout(() => {
            const listTabBtn = document.querySelector(".tab-button");
            if (listTabBtn) switchTab("list", listTabBtn);
          }, 300);
        } else {
          showToast(data.message || "Không thể thêm nhân viên!", "error");
        }
      })
      .catch((err) => showToast(err.message, "error"));
  }
}

// Reset form
function resetEmployeeForm() {
  document.getElementById("employeeForm").reset();
  document.getElementById("username").disabled = false;
  document.getElementById("password").value = "";
  document.getElementById("password").required = true;
  document.getElementById("employeeId").value = "";
  document.getElementById("workingDays").value = "0";
  document.getElementById("workingDays").readOnly = true;
  document.getElementById("dayOff").value = "0";
  document.getElementById("dayOff").readOnly = true;
  document.getElementById("accountStatus").value = "Hoạt động";
  document.getElementById("formTitle").textContent = "THÊM NHÂN VIÊN MỚI";
  editingEmployeeId = null;

  // Show add mode buttons
  document.getElementById("submitBtn").textContent = "THÊM NHÂN VIÊN";
  document.getElementById("submitBtn").style.flex = "1";
  document.getElementById("submitBtn").style.minWidth = "150px";
  document.getElementById("cancelEditBtn").style.display = "none";
  document.getElementById("resetBtn").style.display = "none";
  document.getElementById("lockBtn").style.display = "none";
  document.getElementById("deleteBtn").style.display = "none";
}

// Hủy chỉnh sửa
function cancelEdit() {
  showToast("Đã hủy chỉnh sửa!", "info");
  const listTabBtn = document.querySelector(".tab-button");
  if (listTabBtn) {
    switchTab("list", listTabBtn);
  }
  resetEmployeeForm();
}

// Đóng modal
function closeDetailModal(event) {
  if (event && event.target !== document.getElementById("detailModal")) return;
  document.getElementById("detailModal").classList.remove("active");
}

// View employee detail in detail tab
let currentDetailEmployeeId = null;
function viewEmployeeDetailTab(employeeId) {
  currentDetailEmployeeId = employeeId;
  switchTab("detail", document.querySelectorAll(".tab-button")[2]);
  loadEmployeeDetailTab(employeeId);
}

// Load employee detail tab content
function loadEmployeeDetailTab(employeeId) {
  fetch(`/api/employee/${employeeId}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        const emp = data.data;
        let html = `<h3 style="margin-bottom: 20px; color: #2c3e50">CHI TIẾT: ${emp.fullName} (${emp.employeeId})</h3>`;

        // Load reports
        html += `<h4 style="margin-top: 30px; margin-bottom: 15px; color: #34495e">DANH SÁCH BÁO CÁO</h4>`;
        html += `<div id="reportsContainer">Đang tải...</div>`;

        // Load check-in calendar
        html += `<h4 style="margin-top: 30px; margin-bottom: 15px; color: #34495e">LỊCH CHECK-IN</h4>`;
        html += `<div id="checkinCalendarContainer">Đang tải...</div>`;

        // Load check-out calendar
        html += `<h4 style="margin-top: 30px; margin-bottom: 15px; color: #34495e">LỊCH CHECK-OUT</h4>`;
        html += `<div id="checkoutCalendarContainer">Đang tải...</div>`;

        document.getElementById("detailTabContent").innerHTML = html;

        // Load reports data
        loadEmployeeReports(employeeId);

        // Load calendar data
        loadEmployeeCalendars(employeeId);
      }
    })
    .catch((err) => console.error("Error:", err));
}

// Load employee reports
function loadEmployeeReports(employeeId) {
  fetch(`/api/employee/${employeeId}/reports`)
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        const reports = data.data;
        let html = `<div style="overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 8px;">
          <table class="employee-table" style="width: 100%; border-collapse: collapse; color: #333; min-width: 600px">
                <thead style="background-color: #34495e">
                  <tr>
                    <th style="padding: 10px; text-align: left; border: 1px solid #bdc3c7; color: white;">Ngày</th>
                    <th style="padding: 10px; text-align: center; border: 1px solid #bdc3c7; color: white;">Check-in</th>
                    <th style="padding: 10px; text-align: center; border: 1px solid #bdc3c7; color: white;">Check-out</th>
                    <th style="padding: 10px; text-align: center; border: 1px solid #bdc3c7; color: white;">Trạng thái check-in</th>
                    <th style="padding: 10px; text-align: center; border: 1px solid #bdc3c7; color: white;">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody>`;

        if (reports.length === 0) {
          html += `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #7f8c8d;">Không có báo cáo nào</td></tr>`;
        } else {
          reports.forEach((r) => {
            let checkInStatusColor = "#333";
            if (r.checkInStatus && r.checkInStatus.includes("Sớm")) {
              checkInStatusColor = "#27ae60"; // Green for early
            } else if (r.checkInStatus && r.checkInStatus.includes("Trễ")) {
              checkInStatusColor = "#e74c3c"; // Red for late
            }

            html += `<tr style="border-bottom: 1px solid #bdc3c7;">
                    <td style="padding: 10px; border: 1px solid #bdc3c7;">${r.date}</td>
                    <td style="padding: 10px; text-align: center; border: 1px solid #bdc3c7; color: #27ae60;">${r.checkInTime}</td>
                    <td style="padding: 10px; text-align: center; border: 1px solid #bdc3c7; color: #e74c3c;">${r.checkOutTime}</td>
                    <td style="padding: 10px; text-align: center; border: 1px solid #bdc3c7; color: ${checkInStatusColor}; font-weight: bold;">${r.checkInStatus}</td>
                    <td style="padding: 10px; text-align: center; border: 1px solid #bdc3c7;">
                      <button class="btn-action btn-view" onclick="viewReportDetail('${r.date}', '${employeeId}')">Xem</button>
                    </td>
                  </tr>`;
          });
        }

        html += `</tbody></table></div>`;
        document.getElementById("reportsContainer").innerHTML = html;
      }
    })
    .catch((err) => console.error("Error:", err));
}

// Load employee calendars
let checkinCalendarData = {};
let checkoutCalendarData = {};
function loadEmployeeCalendars(employeeId) {
  fetch(`/api/employee/${employeeId}/calendars`)
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        checkinCalendarData = data.checkinData || {};
        checkoutCalendarData = data.checkoutData || {};
        renderCheckinCalendar();
        renderCheckoutCalendar();
      }
    })
    .catch((err) => console.error("Error:", err));
}

// Vẽ lịch check-in
let currentCheckinDate = new Date();
function renderCheckinCalendar() {
  const month = currentCheckinDate.getMonth();
  const year = currentCheckinDate.getFullYear();

  let html = `<div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <button class="btn btn-sm btn-outline-success" onclick="changeCheckinMonth(-1)">❮</button>
            <span style="font-weight: bold; color: #27ae60;">Tháng ${month + 1} - ${year}</span>
            <button class="btn btn-sm btn-outline-success" onclick="changeCheckinMonth(1)">❯</button>
          </div>
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 15px 5px;">`;

  const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  weekDays.forEach((day) => {
    html += `<div style="text-align: center; font-weight: bold; font-size: 13px; color: #888;">${day}</div>`;
  });

  const firstDayIndex = new Date(year, month, 1).getDay();
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < startOffset; i++) {
    html += `<div></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${String(d).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`;
    const hasCheckin = checkinCalendarData[dateStr];

    if (hasCheckin) {
      html += `
            <div class="day-item" onclick="viewImage('${hasCheckin.selfie}', '${dateStr} - ${hasCheckin.time}')">
              <img src="${hasCheckin.selfie}" class="day-circle filled-checkin">
              <div class="day-num text-success fw-bold">${d}</div>
            </div>`;
    } else {
      // NẾU TRỐNG -> HIỂN THỊ DẤU TRỪ
      html += `
            <div class="day-item">
              <div class="day-circle">-</div>
              <div class="day-num">${d}</div>
            </div>`;
    }
  }

  html += `</div></div>`;
  document.getElementById("checkinCalendarContainer").innerHTML = html;
}

// Vẽ lịch check-out
let currentCheckoutDate = new Date();
function renderCheckoutCalendar() {
  const month = currentCheckoutDate.getMonth();
  const year = currentCheckoutDate.getFullYear();

  let html = `<div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <button class="btn btn-sm btn-outline-danger" onclick="changeCheckoutMonth(-1)">❮</button>
            <span style="font-weight: bold; color: #e74c3c;">Tháng ${month + 1} - ${year}</span>
            <button class="btn btn-sm btn-outline-danger" onclick="changeCheckoutMonth(1)">❯</button>
          </div>
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 15px 5px;">`;

  const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  weekDays.forEach((day) => {
    html += `<div style="text-align: center; font-weight: bold; font-size: 13px; color: #888;">${day}</div>`;
  });

  const firstDayIndex = new Date(year, month, 1).getDay();
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < startOffset; i++) {
    html += `<div></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${String(d).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`;
    const hasCheckout = checkoutCalendarData[dateStr];

    if (hasCheckout) {
      html += `
            <div class="day-item" onclick="viewImage('${hasCheckout.checkOutSelfie}', '${dateStr} - ${hasCheckout.time}')">
              <img src="${hasCheckout.checkOutSelfie}" class="day-circle filled-checkout">
              <div class="day-num text-danger fw-bold">${d}</div>
            </div>`;
    } else {
      // NẾU TRỐNG -> HIỂN THỊ DẤU CỘNG
      html += `
            <div class="day-item">
              <div class="day-circle">-</div>
              <div class="day-num">${d}</div>
            </div>`;
    }
  }

  html += `</div></div>`;
  document.getElementById("checkoutCalendarContainer").innerHTML = html;
}

// Change check-in month
function changeCheckinMonth(step) {
  currentCheckinDate.setMonth(currentCheckinDate.getMonth() + step);
  renderCheckinCalendar();
}

// Change check-out month
function changeCheckoutMonth(step) {
  currentCheckoutDate.setMonth(currentCheckoutDate.getMonth() + step);
  renderCheckoutCalendar();
}

// View report detail
function viewReportDetail(reportDate, employeeId) {
  fetch(
    `/api/employee/${employeeId}/report?date=${encodeURIComponent(reportDate)}`,
  )
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        const r = data.data;
        // FIX: Helper function to display "Không có" for empty fields
        const displayValue = (value) => {
          if (!value || value.trim() === "" || value === 0 || value === "N/A") {
            return "Không có";
          }
          return value;
        };

        let filesHTML = "";
        // FIX: Display files section if available
        if (r.files && Array.isArray(r.files) && r.files.length > 0) {
          filesHTML = `
            <div class="detail-row">
              <span class="detail-label">File/Hình Ảnh Sản Phẩm:</span>
              <div class="detail-value" style="display: flex; flex-wrap: wrap; gap: 10px;">
          `;
          r.files.forEach((file) => {
            const fileType = file.type || "application/octet-stream";
            const isImage = fileType.startsWith("image/");
            if (isImage) {
              filesHTML += `
                <div style="cursor: pointer; text-align: center;" onclick="viewImage('${file.data}', '${file.name}')">
                  <img src="${file.data}" style="max-width: 100px; max-height: 100px; border-radius: 5px; border: 1px solid #bdc3c7;" />
                  <small style="display: block; margin-top: 5px; color: #7f8c8d;">${file.name}</small>
                </div>
              `;
            } else {
              filesHTML += `
                <a href="${file.data}" download="${file.name}" style="padding: 10px; background-color: #3498db; color: white; border-radius: 5px; text-decoration: none;">
                  📄 ${file.name}
                </a>
              `;
            }
          });
          filesHTML += `
              </div>
            </div>
          `;
        } else {
          filesHTML = `
            <div class="detail-row">
              <span class="detail-label">File/Hình Ảnh Sản Phẩm:</span>
              <span class="detail-value">Không có</span>
            </div>
          `;
        }

        const html = `
                <div class="detail-info">
                  <div class="detail-row">
                    <span class="detail-label">Ngày:</span>
                    <span class="detail-value">${r.date}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Check-in:</span>
                    <span class="detail-value">${r.checkInTime || "N/A"}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Check-out:</span>
                    <span class="detail-value">${r.checkOutTime || "N/A"}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Công Việc Hôm Nay:</span>
                    <span class="detail-value">${displayValue(r.todayWork)}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Công Việc Hôm Trước:</span>
                    <span class="detail-value">${displayValue(r.prevWork)}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Mức Hoàn Thành:</span>
                    <span class="detail-value">${r.completionRate ? r.completionRate + "%" : "Không có"}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Kế Hoạch Tiếp Theo:</span>
                    <span class="detail-value">${displayValue(r.nextPlan)}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Đề Xuất:</span>
                    <span class="detail-value">${displayValue(r.suggestions)}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Ghi Chú:</span>
                    <span class="detail-value">${displayValue(r.notes)}</span>
                  </div>
                  ${filesHTML}
                </div>
              `;
        document.getElementById("reportDetailContent").innerHTML = html;
        document.getElementById("reportDetailModal").classList.add("active");
      }
    })
    .catch((err) => console.error("Error:", err));
}

// Close report detail modal
function closeReportDetailModal(event) {
  if (event && event.target !== document.getElementById("reportDetailModal"))
    return;
  document.getElementById("reportDetailModal").classList.remove("active");
}

// View image
function viewImage(imgUrl, timeText) {
  document.getElementById("imageViewerTitle").textContent = timeText;
  const viewerImg = document.getElementById("viewerImg");
  viewerImg.src = imgUrl;
  // Store image URL for download
  viewerImg.dataset.downloadUrl = imgUrl;
  viewerImg.dataset.downloadName =
    timeText.replace(/[^a-zA-Z0-9]/g, "_") + ".jpg";
  document.getElementById("imageViewerModal").classList.add("active");
}

// Download image function
function downloadImage() {
  const viewerImg = document.getElementById("viewerImg");
  const downloadUrl = viewerImg.dataset.downloadUrl;
  const downloadName = viewerImg.dataset.downloadName || "image.jpg";

  if (!downloadUrl) return;

  // Create a temporary link to download the base64 image
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = downloadName;
  link.click();
}

// Close image viewer modal
function closeImageViewerModal(event) {
  if (event && event.target !== document.getElementById("imageViewerModal"))
    return;
  document.getElementById("imageViewerModal").classList.remove("active");
}

// Toggle lock/unlock account
function toggleLockEmployee() {
  if (!editingEmployeeId) {
    showToast("Không tìm thấy ID nhân viên!", "error");
    return;
  }

  const lockBtn = document.getElementById("lockBtn");
  const isCurrentlyLocked = lockBtn.textContent.includes("MỞ KHÓA");
  const confirmMsg = isCurrentlyLocked
    ? "Bạn có chắc chắn muốn MỞ KHÓA tài khoản này?"
    : "Bạn có chắc chắn muốn KHÓA tài khoản này?";

  showConfirmDialog(confirmMsg).then((confirmed) => {
    if (!confirmed) return;

    const endpoint = isCurrentlyLocked
      ? `/api/employee/${editingEmployeeId}/unlock`
      : `/api/employee/${editingEmployeeId}/lock`;

    fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showToast(data.message, "success");

          // Update UI
          const statusMap = {
            active: "Hoạt động",
            locked: "Đang khóa",
          };
          document.getElementById("accountStatus").value =
            statusMap[data.data.accountStatus] || "Hoạt động";

          // Update lock button
          if (data.data.accountStatus === "locked") {
            lockBtn.textContent = "MỞ KHÓA";
            lockBtn.style.backgroundColor = "#f39c12";
          } else {
            lockBtn.textContent = "KHÓA";
            lockBtn.style.backgroundColor = "#f39c12";
          }

          // Reload employees list
          loadEmployees();

          // Switch to list tab
          setTimeout(() => {
            const listTabBtn = document.querySelector(".tab-button");
            if (listTabBtn) switchTab("list", listTabBtn);
          }, 300);
        } else {
          showToast(data.message || "Không thể thay đổi trạng thái!", "error");
        }
      })
      .catch((err) => {
        showToast(err.message, "error");
      });
  });
}

// Delete employee account
function deleteEmployee() {
  if (!editingEmployeeId) {
    showToast("Không tìm thấy ID nhân viên!", "error");
    return;
  }

  showConfirmDialog(
    "Bạn có chắc chắn muốn XÓA tài khoản này? Hành động này KHÔNG THỂ HOÀN TÁC!",
  ).then((confirmed) => {
    if (!confirmed) return;

    fetch(`/api/employee/${editingEmployeeId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showToast("Xóa tài khoản thành công!", "success");
          resetEmployeeForm();
          loadEmployees();

          // Switch to list tab
          const listTabBtn = document.querySelector(".tab-button");
          if (listTabBtn) switchTab("list", listTabBtn);
        } else {
          showToast(data.message || "Không thể xóa tài khoản", "error");
        }
      })
      .catch((err) => {
        showToast(err.message, "error");
      });
  });
}

// Update status mỗi 5 giây
setInterval(() => {
  allEmployees.forEach((emp) => {
    updateEmployeeStatus(emp._id);
  });
}, 5000);

// Load data khi trang tải
document.addEventListener("DOMContentLoaded", () => {
  loadEmployees();
});
