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
`;
document.head.appendChild(style);

// NHẬN DỮ LIỆU THẬT TỪ SERVER
const realCheckinData =
  typeof window.checkinData === "string"
    ? JSON.parse(window.checkinData)
    : window.checkinData || {};
const realCheckoutData =
  typeof window.checkoutData === "string"
    ? JSON.parse(window.checkoutData)
    : window.checkoutData || {};
const isCheckedInServer = window.isCheckedInToday || false;
const isCheckedOutServer = window.isCheckedOutToday || false;

// LOGIC CHUYỂN ĐỔI TAB
function switchTab(tabName, element) {
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active");
  });
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
  });
  document.getElementById("tab-" + tabName).classList.add("active");
  element.classList.add("active");
}

// Vẽ lịch check-in
let currentDate = new Date();
function renderCalendar() {
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  document.getElementById("month-year-display").innerText =
    `Tháng ${month + 1} - ${year}`;

  const grid = document.getElementById("calendar-grid");
  grid.innerHTML = "";

  const firstDayIndex = new Date(year, month, 1).getDay();
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < startOffset; i++) {
    grid.innerHTML += `<div></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    let dateStr = `${String(d).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`;

    let html = "";
    let checkinInfo = realCheckinData[dateStr];
    if (checkinInfo) {
      html = `
            <div class="day-item" onclick="viewImage('${checkinInfo.selfie}', '${dateStr} - ${checkinInfo.time}')">
                <img src="${checkinInfo.selfie}" class="day-circle filled">
                <div class="day-num text-primary fw-bold">${d}</div>
            </div>`;
    } else {
      html = `
            <div class="day-item">
                <div class="day-circle">-</div>
                <div class="day-num">${d}</div>
            </div>`;
    }
    grid.innerHTML += html;
  }
}

// Chuyển tháng cho lịch check-in
function changeMonth(step) {
  currentDate.setMonth(currentDate.getMonth() + step);
  renderCalendar();
}

// Vẽ lịch check-out
let checkoutDate = new Date();
function renderCheckoutCalendar() {
  const month = checkoutDate.getMonth();
  const year = checkoutDate.getFullYear();
  document.getElementById("month-year-checkout-display").innerText =
    `Tháng ${month + 1} - ${year}`;

  const grid = document.getElementById("checkout-calendar-grid");
  grid.innerHTML = "";

  const firstDayIndex = new Date(year, month, 1).getDay();
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < startOffset; i++) {
    grid.innerHTML += `<div></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    let dateStr = `${String(d).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`;

    let html = "";
    let checkoutInfo = realCheckoutData[dateStr];
    if (checkoutInfo) {
      html = `
            <div class="day-item" onclick="viewCheckoutImage('${checkoutInfo.checkOutSelfie}', '${dateStr} - ${checkoutInfo.time}')">
                <img src="${checkoutInfo.checkOutSelfie}" class="day-circle filled">
                <div class="day-num text-primary fw-bold">${d}</div>
            </div>`;
    } else {
      html = `
            <div class="day-item">
                <div class="day-circle">-</div>
                <div class="day-num">${d}</div>
            </div>`;
    }
    grid.innerHTML += html;
  }
}

// Chuyển tháng cho lịch checkout
function changeCheckoutMonth(step) {
  checkoutDate.setMonth(checkoutDate.getMonth() + step);
  renderCheckoutCalendar();
}

// Khởi tạo lịch & Trạng thái nút
document.addEventListener("DOMContentLoaded", () => {
  renderCalendar();
  renderCheckoutCalendar();
  // FIX: Cập nhật trạng thái nút "Thêm / Sửa báo cáo" khi trang load
  updateAddReportButtonState();

  const statusText = document.getElementById("status-text");
  if (statusText) {
    statusText.classList.remove("status-red", "status-green", "status-orange");
    if (isCheckedInServer) {
      if (isCheckedOutServer) {
        statusText.classList.add("status-orange");
      } else {
        statusText.classList.add("status-green");
      }
    } else {
      statusText.classList.add("status-red");
    }
  }

  const btnCheckout = document.getElementById("btn-checkout");
  if (btnCheckout) {
    if (!isCheckedInServer) {
      btnCheckout.disabled = true;
      btnCheckout.innerText = "CHƯA CHECK-IN";
    } else if (isCheckedInServer && !isCheckedOutServer) {
      btnCheckout.disabled = false;
      btnCheckout.innerText = "CHECK-OUT";
    } else if (isCheckedOutServer) {
      btnCheckout.disabled = true;
      btnCheckout.innerText = "ĐÃ CHECK-OUT";
    }
  }
});

// XỬ LÝ ẢNH CHECK-IN & GỬI LÊN SERVER
document.addEventListener("DOMContentLoaded", () => {
  const btnCapture = document.getElementById("btn-capture");
  const video = document.getElementById("camera-stream");
  const canvas = document.getElementById("snapshot");

  if (btnCapture) {
    btnCapture.addEventListener("click", () => {
      // ĐÃ SỬA: Logic kiểm tra camera sẵn sàng
      if (!video.srcObject || video.readyState < 2) {
        showToast("Vui lòng chờ camera sẵn sàng...", "warning");
        return;
      }

      try {
        const context = canvas.getContext("2d");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        if (canvas.width === 0 || canvas.height === 0) {
          showToast("Vui lòng chờ camera sẵn sàng...", "warning");
          return;
        }

        // Lật ảnh lại cho đúng chiều
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = canvas.toDataURL("image/jpeg", 0.8);

        btnCapture.disabled = true;
        btnCapture.innerText = "Đang gửi...";

        fetch("/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: imageData }),
        })
          .then(async (res) => {
            // Chặn và dịch lỗi Payload Too Large từ Backend
            if (!res.ok) {
              const errText = await res.text();
              if (errText.includes("Too Large")) {
                throw new Error(
                  "Dung lượng ảnh quá lớn! Vui lòng giảm chất lượng ảnh hoặc sử dụng thiết bị khác.",
                );
              }
              throw new Error(`Lỗi Server: ${res.status}`);
            }
            return res.json();
          })
          .then((data) => {
            if (data.success) {
              showToast("Check-in thành công!", "success");
              setTimeout(() => window.location.reload(), 1500);
            } else {
              showToast("Lỗi: " + (data.message || "Không xác định"), "error");
              btnCapture.disabled = false;
              btnCapture.innerText = "CHỤP & GỬI";
            }
          })
          .catch((err) => {
            console.error("Lỗi Fetch:", err);
            // In đúng thông báo lỗi ra màn hình
            showToast(err.message || "Lỗi kết nối mạng!", "error");
            btnCapture.disabled = false;
            btnCapture.innerText = "CHỤP & GỬI";
          });
      } catch (err) {
        console.error("Lỗi chụp ảnh:", err);
        showToast("Lỗi xử lý ảnh trên trình duyệt!", "error");
        btnCapture.disabled = false;
        btnCapture.innerText = "CHỤP & GỬI";
      }
    });
  }
});

// Biến để theo dõi lần cuối check ngày
let lastCheckedDate = localStorage.getItem("lastCheckedDate") || "";

// LOGIC ĐỒNG HỒ & KHÓA NÚT CHẤM CÔNG
document.addEventListener("DOMContentLoaded", () => {
  const btnCheckin = document.getElementById("btn-checkin-top");
  const btnCheckout = document.getElementById("btn-checkout");

  function updateClock() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeStr = now.toLocaleTimeString("vi-VN", { hour12: false });
    const dateStr = now.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const clockElement = document.getElementById("live-clock");

    if (clockElement) {
      clockElement.innerText = timeStr + "  " + dateStr;
    }

    // Kiểm tra xem ngày đã thay đổi so với lần cuối check
    if (lastCheckedDate !== dateStr) {
      lastCheckedDate = dateStr;
      localStorage.setItem("lastCheckedDate", dateStr);

      // Nếu qua ngày mới mà chưa check-in, tăng dayOff (trừ Chủ Nhật)
      const isCheckedInToday = window.isCheckedInToday || false;
      if (!isCheckedInToday) {
        const dayOfWeek = now.getDay(); // 0 = Chủ Nhật, 1 = Thứ 2, ..., 6 = Thứ 7
        if (dayOfWeek !== 0) {
          // Không phải Chủ Nhật
          fetch("/increment-day-off", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                console.log("Ngày nghỉ đã tăng lên:", data.dayOff);
              }
            })
            .catch((err) => console.error("Lỗi tăng ngày nghỉ:", err));
        }
      }
    }

    // Reset check-in status lúc 7:30 AM
    if (hours === 7 && minutes === 30) {
      localStorage.removeItem("isCheckedOutToday");
      localStorage.removeItem("isCheckedInToday");
      localStorage.removeItem("lastCheckedDate");
      window.location.reload();
    }

    if (isCheckedInServer && btnCheckin) {
      btnCheckin.disabled = false;
      btnCheckin.innerText = "Đăng xuất";
      btnCheckin.style.backgroundColor = "#e74c3c";
      btnCheckin.setAttribute("data-bs-toggle", "");
      btnCheckin.setAttribute("data-bs-target", "");
      btnCheckin.onclick = () => {
        window.location.href = "/logout";
      };
    }

    if (!isCheckedInServer && btnCheckout) {
      btnCheckout.disabled = true;
      btnCheckout.innerText = "CHƯA CHECK-IN";
    } else if (isCheckedInServer && !isCheckedOutServer && btnCheckout) {
      btnCheckout.disabled = false;
      btnCheckout.innerText = "CHECK-OUT";
    } else if (isCheckedOutServer && btnCheckout) {
      btnCheckout.disabled = true;
      btnCheckout.innerText = "ĐÃ CHECK-OUT";
    }
  }

  setInterval(updateClock, 1000);
  updateClock();
});

// XEM ẢNH CHECK-IN
function viewImage(imgUrl, timeText) {
  document.getElementById("viewer-img").src = imgUrl;
  document.getElementById("viewer-time").innerText = "Check-in: " + timeText;
  new bootstrap.Modal(document.getElementById("imageViewerModal")).show();
}

// XEM ẢNH CHECK-OUT
function viewCheckoutImage(imgUrl, timeText) {
  document.getElementById("viewer-img").src = imgUrl;
  document.getElementById("viewer-time").innerText = "Check-out: " + timeText;
  new bootstrap.Modal(document.getElementById("imageViewerModal")).show();
}

// XỬ LÝ CAMERA CHECK-IN
document.addEventListener("DOMContentLoaded", () => {
  const cameraModal = document.getElementById("cameraModal");
  const video = document.getElementById("camera-stream");

  if (cameraModal) {
    cameraModal.addEventListener("shown.bs.modal", function () {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "user" } })
        .then((stream) => {
          video.srcObject = stream;
          video.play(); // Đảm bảo video chạy
        })
        .catch((err) => showToast("Vui lòng cấp quyền Camera!", "error"));
    });

    cameraModal.addEventListener("hidden.bs.modal", function () {
      const stream = video.srcObject;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    });
  }
});

// XỬ LÝ CAMERA CHECK-OUT
document.addEventListener("DOMContentLoaded", () => {
  const checkoutCameraModal = document.getElementById("checkoutCameraModal");
  const checkoutVideo = document.getElementById("checkout-camera-stream");
  const btnCheckoutCapture = document.getElementById("btn-checkout-capture");
  const checkoutCanvas = document.getElementById("checkout-snapshot");

  // Bật/tắt camera khi mở/đóng modal
  if (checkoutCameraModal) {
    checkoutCameraModal.addEventListener("shown.bs.modal", function () {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "user" } })
        .then((stream) => {
          checkoutVideo.srcObject = stream;
          checkoutVideo.play(); // Đảm bảo video chạy mượt
        })
        .catch((err) => showToast("Vui lòng cấp quyền Camera!", "error"));
    });

    checkoutCameraModal.addEventListener("hidden.bs.modal", function () {
      const stream = checkoutVideo.srcObject;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    });
  }

  // Xử lý khi bấm nút CHỤP & GỬI
  if (btnCheckoutCapture) {
    btnCheckoutCapture.addEventListener("click", () => {
      // Logic kiểm tra camera sẵn sàng
      if (!checkoutVideo.srcObject || checkoutVideo.readyState < 2) {
        showToast("Vui lòng chờ camera sẵn sàng...", "warning");
        return;
      }

      try {
        const context = checkoutCanvas.getContext("2d");
        checkoutCanvas.width = checkoutVideo.videoWidth;
        checkoutCanvas.height = checkoutVideo.videoHeight;

        if (checkoutCanvas.width === 0 || checkoutCanvas.height === 0) {
          showToast("Vui lòng chờ camera sẵn sàng...", "warning");
          return;
        }

        // Lật ảnh lại (chống ngược chữ/hình)
        context.translate(checkoutCanvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(
          checkoutVideo,
          0,
          0,
          checkoutCanvas.width,
          checkoutCanvas.height,
        );

        // Chuyển sang Base64
        const imageData = checkoutCanvas.toDataURL("image/jpeg", 0.8);
        const now = new Date();
        const dateStr = now.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        // Khóa nút trong lúc đợi server
        btnCheckoutCapture.disabled = true;
        btnCheckoutCapture.innerText = "Đang gửi...";

        fetch("/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: dateStr,
            imageBase64: imageData,
          }),
        })
          .then(async (res) => {
            // Bắt lỗi trực tiếp từ Server (ví dụ: 500, 413) để không nhảy vào lỗi catch vô nghĩa
            if (!res.ok) {
              const errText = await res.text();
              if (errText.includes("Too Large")) {
                throw new Error("Dung lượng ảnh quá lớn!");
              }
              throw new Error(`Lỗi Server: ${res.status}`);
            }
            return res.json();
          })
          .then((data) => {
            if (data.success) {
              showToast("Check-out thành công!", "success");

              // Cập nhật giao diện lập tức trước khi reload
              const btnCheckout = document.getElementById("btn-checkout");
              if (btnCheckout) {
                btnCheckout.disabled = true;
                btnCheckout.innerText = "ĐÃ CHECK-OUT";
              }

              const statusText = document.getElementById("status-text");
              if (statusText) {
                statusText.classList.remove("status-red", "status-green");
                statusText.classList.add("status-orange");
                statusText.innerText = "Đã check-out";
              }

              // Đợi 2 giây cho user đọc Toast rồi reload trang
              setTimeout(() => window.location.reload(), 2000);
            } else {
              showToast(
                "Lỗi: " + (data.message || "Check-out thất bại"),
                "error",
              );
              btnCheckoutCapture.disabled = false;
              btnCheckoutCapture.innerText = "CHỤP & GỬI";
            }
          })
          .catch((err) => {
            console.error("Lỗi Fetch Checkout:", err);
            showToast(err.message || "Lỗi không thể kết nối server", "error");
            btnCheckoutCapture.disabled = false;
            btnCheckoutCapture.innerText = "CHỤP & GỬI";
          });
      } catch (err) {
        console.error("Lỗi chụp ảnh Checkout:", err);
        showToast("Lỗi chụp ảnh trên trình duyệt!", "error");
        btnCheckoutCapture.disabled = false;
        btnCheckoutCapture.innerText = "CHỤP & GỬI";
      }
    });
  }
});

// =========================== LOGIC BÁO CÁO - Quản lý báo cáo ===========================
let currentEditingReport = null;
let isCheckedOut = false;
let allReports = [];
let currentReportPage = 1;
const REPORTS_PER_PAGE = 7;

// Chuyển tab trong phần báo cáo
function switchReportTab(tabName, element) {
  document.querySelectorAll(".report-sub-content").forEach((tab) => {
    tab.classList.remove("active");
    tab.style.display = "none";
  });
  document.querySelectorAll(".report-sub-tab").forEach((item) => {
    item.classList.remove("active");
  });
  document.getElementById("report-" + tabName).classList.add("active");
  document.getElementById("report-" + tabName).style.display = "block";
  element.classList.add("active");

  if (tabName === "list") {
    loadReportList();
  }
}

// FIX: Kiểm tra xem báo cáo hôm nay có tồn tại chưa
// Nếu tồn tại, khóa nút "Thêm / Sửa báo cáo"
// THÊM: Khóa nút nếu chưa check-in hoặc qua 0h mà vẫn chưa báo cáo
function updateAddReportButtonState() {
  const addReportTabBtn = document.querySelectorAll(".report-sub-tab")[1];
  if (!addReportTabBtn) return;

  // Kiểm tra xem hôm nay đã check-in chưa (từ window.isCheckedInToday)
  const isCheckedInToday = window.isCheckedInToday || false;

  // Nếu chưa check-in hôm nay -> Khóa nút
  if (!isCheckedInToday) {
    addReportTabBtn.disabled = true;
    addReportTabBtn.style.opacity = "0.5";
    addReportTabBtn.style.cursor = "not-allowed";
    addReportTabBtn.title = "Vui lòng check-in trước khi báo cáo!";
    return;
  }

  // Lấy danh sách báo cáo để kiểm tra báo cáo hôm nay
  fetch("/reports")
    .then((res) => res.json())
    .then((data) => {
      if (data.success && data.data.length > 0) {
        const todayStr = new Date().toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        // Tìm báo cáo hôm nay
        const todayReport = data.data.find((r) => r.date === todayStr);

        // Nếu hôm nay đã có báo cáo (todayWork !== null/empty) thì khóa nút
        if (
          todayReport &&
          todayReport.todayWork &&
          todayReport.todayWork.trim() !== ""
        ) {
          addReportTabBtn.disabled = true;
          addReportTabBtn.style.opacity = "0.5";
          addReportTabBtn.style.cursor = "not-allowed";
          addReportTabBtn.title =
            "Báo cáo hôm nay đã được thêm rồi. Check-in ngày hôm sau để thêm báo cáo mới.";
        } else {
          addReportTabBtn.disabled = false;
          addReportTabBtn.style.opacity = "1";
          addReportTabBtn.style.cursor = "pointer";
          addReportTabBtn.title = "";
        }
      }
    })
    .catch((err) => console.error("Lỗi cập nhật trạng thái nút báo cáo:", err));
}

// Tải danh sách báo cáo từ server
function loadReportList() {
  fetch("/reports")
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        allReports = data.data;
        currentReportPage = 1; // Reset pagination to first page
        renderReportTable(data.data);
        // FIX: Cập nhật trạng thái nút "Thêm / Sửa báo cáo" sau khi tải danh sách
        updateAddReportButtonState();
      } else {
        showToast(data.message || "Không thể tải báo cáo", "error");
      }
    })
    .catch((err) => {
      console.error("Lỗi tải báo cáo:", err);
      showToast(err.message || "Không thể tải báo cáo", "error");
    });
}

// Kiểm tra xem ngày truyền vào đã là ngày hôm qua (trở về trước) chưa
function checkIsPastDay(dateStr) {
  if (!dateStr) return false;
  let reportDateObj;

  // Xử lý chuỗi ngày định dạng DD/MM/YYYY
  if (dateStr.includes("/")) {
    const [d, m, y] = dateStr.split("/");
    reportDateObj = new Date(y, m - 1, d);
  } else {
    reportDateObj = new Date(dateStr);
  }

  // Đưa về mốc 0h00 để so sánh chính xác
  reportDateObj.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return reportDateObj < today;
}

// Render bảng báo cáo
function renderReportTable(reports) {
  const tbody = document.getElementById("report-table-body");
  tbody.innerHTML = "";

  if (reports.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #7f8c8d;">Không có báo cáo nào</td></tr>';
    updateReportPaginationInfo();
    return;
  }

  // Calculate pagination
  const totalPages = Math.ceil(reports.length / REPORTS_PER_PAGE);
  if (currentReportPage > totalPages) {
    currentReportPage = totalPages;
  }
  if (currentReportPage < 1) {
    currentReportPage = 1;
  }

  const startIdx = (currentReportPage - 1) * REPORTS_PER_PAGE;
  const endIdx = startIdx + REPORTS_PER_PAGE;
  const pageReports = reports.slice(startIdx, endIdx);

  pageReports.forEach((report) => {
    const row = document.createElement("tr");
    row.style.borderBottom = "1px solid #bdc3c7";

    const hasReport = report.todayWork && report.todayWork.trim() !== "";

    let actionBtnHTML = "";

    // YÊU CẦU 1: Chỉ khóa nút thành "Chưa báo cáo" nếu chưa có dữ liệu
    if (!hasReport) {
      actionBtnHTML = `<button disabled style="background-color: #95a5a6; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: not-allowed;">Chưa báo cáo</button>`;
    } else {
      actionBtnHTML = `<button onclick="editReport('${report.date}')" style="background-color: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Chỉnh sửa</button>`;
    }

    // Determine color for check-in status
    let checkInStatusColor = "#333";
    if (report.checkInStatus && report.checkInStatus.includes("Sớm")) {
      checkInStatusColor = "#27ae60"; // Green for early
    } else if (report.checkInStatus && report.checkInStatus.includes("Trễ")) {
      checkInStatusColor = "#e74c3c"; // Red for late
    }

    row.innerHTML = `
      <td style="padding: 10px; border: 1px solid #bdc3c7">${report.date}</td>
      <td style="padding: 10px; text-align: center; border: 1px solid #bdc3c7; color: #27ae60;">${report.checkInTime || "--:--"}</td>
      <td style="padding: 10px; text-align: center; border: 1px solid #bdc3c7; color: #e74c3c;">${report.checkOutTime || "--:--"}</td>
      <td style="padding: 10px; text-align: center; border: 1px solid #bdc3c7; color: ${checkInStatusColor}; font-weight: bold;">${report.checkInStatus || "--:--"}</td>
      <td style="padding: 10px; text-align: center; border: 1px solid #bdc3c7;">${actionBtnHTML}</td>
    `;
    tbody.appendChild(row);
  });

  updateReportPaginationInfo();
}

// Update pagination info
function updateReportPaginationInfo() {
  const totalPages = Math.ceil(allReports.length / REPORTS_PER_PAGE);
  const paginationInfo = document.getElementById("report-pagination-info");
  if (paginationInfo) {
    paginationInfo.textContent = `Trang ${currentReportPage} / ${totalPages}`;
  }
}

// Next report page
function nextReportPage() {
  const totalPages = Math.ceil(allReports.length / REPORTS_PER_PAGE);
  if (currentReportPage < totalPages) {
    currentReportPage++;
    renderReportTable(allReports);
  }
}

// Previous report page
function previousReportPage() {
  if (currentReportPage > 1) {
    currentReportPage--;
    renderReportTable(allReports);
  }
}

// Chỉnh sửa báo cáo
function editReport(date) {
  currentEditingReport = date;

  fetch(`/report-detail?date=${encodeURIComponent(date)}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        const report = data.data;

        document.getElementById("prev-work").value = report.prevWork || "";
        document.getElementById("today-work").value = report.todayWork || "";
        document.getElementById("completion-rate").value =
          report.completionRate || "";
        document.getElementById("next-plan").value = report.nextPlan || "";
        document.getElementById("suggestion").value = report.suggestions || "";
        document.getElementById("notes").value = report.notes || "";
        document.getElementById("editing-report-id").value = date;
        // FIX: Lưu files cũ vào hidden field
        if (report.files && Array.isArray(report.files)) {
          document.getElementById("existing-files-data").value = JSON.stringify(
            report.files,
          );
        }
        document.getElementById("cancel-report-btn").style.display = "block";

        const submitBtn = document.getElementById("submit-report-btn");
        const hasReport = report.todayWork && report.todayWork.trim() !== "";
        const isPastDay = checkIsPastDay(date);

        // Update files display with isPastDay flag
        if (report.files && Array.isArray(report.files)) {
          displayExistingFiles(report.files, isPastDay);
        }

        if (isPastDay) {
          if (!hasReport) {
            // Đã qua ngày hôm sau + Không có báo cáo -> Khóa hoàn toàn
            submitBtn.innerText = "ĐÃ QUÁ HẠN NỘP";
            submitBtn.disabled = true;
            submitBtn.style.backgroundColor = "#95a5a6"; // Màu xám (Khóa)
            toggleReportFields(true, true);
          } else {
            // Đã qua ngày hôm sau + CÓ báo cáo -> Chỉ cho sửa ghi chú
            submitBtn.innerText = "LƯU THAY ĐỔI";
            submitBtn.disabled = false;
            submitBtn.style.backgroundColor = "#27ae60"; // YÊU CẦU 2: Đổi thành xanh lá
            toggleReportFields(true, false);
          }
        } else {
          // VẪN TRONG NGÀY HÔM NAY -> Full quyền (Mặc kệ đã Checkout hay chưa)
          submitBtn.innerText = hasReport ? "LƯU THAY ĐỔI" : "GỬI BÁO CÁO";
          submitBtn.disabled = false;
          submitBtn.style.backgroundColor = "#27ae60"; // YÊU CẦU 2: Đổi thành xanh lá
          toggleReportFields(false, false);
        }

        const addTabBtn = document.querySelectorAll(".report-sub-tab")[1];
        if (addTabBtn) switchReportTab("add", addTabBtn);
      } else {
        showToast("Lỗi: Không thể tải báo cáo", "error");
      }
    })
    .catch((err) => {
      showToast("Lỗi khi tải báo cáo: " + err.message, "error");
    });
}

// FIX: Hiển thị files cũ khi đang edit
function displayExistingFiles(files, isPastDay = false) {
  if (!files || files.length === 0) return;

  const fileList = document.getElementById("existing-files-list");
  if (!fileList) return;

  fileList.innerHTML = "<strong>Files hiện có:</strong><br>";
  files.forEach((file, index) => {
    const fileType = file.type || "application/octet-stream";
    const isImage = fileType.startsWith("image/");

    // Tạo container cho file item
    const fileContainer = document.createElement("div");
    fileContainer.style.display = "flex";
    fileContainer.style.alignItems = "center";
    fileContainer.style.marginBottom = "8px";
    fileContainer.style.padding = "5px";
    fileContainer.style.backgroundColor = "#ecf0f1";
    fileContainer.style.borderRadius = "3px";
    fileContainer.style.justifyContent = "space-between";

    // Link để tải file
    const link = document.createElement("a");
    link.href = file.data;
    link.download = file.name;
    link.style.color = "#3498db";
    link.style.textDecoration = "none";
    link.style.flex = "1";
    link.textContent = (isImage ? "🖼️ " : "📄 ") + file.name;

    fileContainer.appendChild(link);

    // Nút xóa file - chỉ hiển thị nếu không phải ngày quá hạn
    if (!isPastDay) {
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.textContent = "🗑️ Xóa";
      deleteBtn.style.backgroundColor = "#e74c3c";
      deleteBtn.style.color = "white";
      deleteBtn.style.border = "none";
      deleteBtn.style.borderRadius = "3px";
      deleteBtn.style.padding = "3px 8px";
      deleteBtn.style.cursor = "pointer";
      deleteBtn.style.fontSize = "0.85rem";
      deleteBtn.style.marginLeft = "10px";
      deleteBtn.addEventListener("click", () => deleteFileFromList(index));
      fileContainer.appendChild(deleteBtn);
    }

    fileList.appendChild(fileContainer);
  });
  fileList.style.display = "block";
}

// Hàm xóa file khỏi danh sách
function deleteFileFromList(index) {
  const existingFilesData = document.getElementById("existing-files-data");
  if (!existingFilesData.value) return;

  try {
    let filesArray = JSON.parse(existingFilesData.value);
    if (filesArray.length > index) {
      const deletedFile = filesArray[index];
      filesArray.splice(index, 1);
      existingFilesData.value = JSON.stringify(filesArray);

      // Clear and update display
      const fileList = document.getElementById("existing-files-list");
      if (fileList) {
        fileList.innerHTML = "";
      }

      // Only show if files remain
      if (filesArray.length > 0) {
        displayExistingFiles(filesArray);
      } else {
        if (fileList) {
          fileList.style.display = "none";
        }
      }

      showToast(`Đã xóa file: ${deletedFile.name}`, "success");
    }
  } catch (err) {
    console.error("Lỗi xóa file:", err);
    showToast("Lỗi xóa file!", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const today = new Date();
  const todayStr = today.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const todayDateSpan = document.getElementById("today-date");
  if (todayDateSpan) {
    todayDateSpan.innerText = todayStr;
  }

  isCheckedOut = localStorage.getItem("isCheckedOutToday") === "true";
  loadReportList();
});

// Bật/tắt các ô trong form báo cáo
function toggleReportFields(lockMainFields, lockNotes) {
  document.getElementById("prev-work").disabled = lockMainFields;
  document.getElementById("today-work").disabled = lockMainFields;
  document.getElementById("completion-rate").disabled = lockMainFields;
  document.getElementById("next-plan").disabled = lockMainFields;
  document.getElementById("suggestion").disabled = lockMainFields;

  // Nút upload file (nếu có)
  const workFiles = document.getElementById("work-files");
  if (workFiles) workFiles.disabled = lockMainFields;

  // Ghi chú (xử lý riêng)
  document.getElementById("notes").disabled = lockNotes;
}

// Kiểm tra dữ liệu trước khi Submit
function submitReport() {
  const prevWork = document.getElementById("prev-work").value;
  const todayWork = document.getElementById("today-work").value;
  const completionRate = document.getElementById("completion-rate").value;
  const nextPlan = document.getElementById("next-plan").value;
  const suggestions = document.getElementById("suggestion").value;
  const notes = document.getElementById("notes").value;
  const editingId = document.getElementById("editing-report-id").value;

  if (!todayWork || completionRate === "") {
    showToast("Vui lòng điền các trường bắt buộc!", "warning");
    return;
  }

  const rate = parseInt(completionRate);
  if (isNaN(rate) || rate < 0 || rate > 100) {
    showToast("Mức hoàn thành phải từ 0 đến 100%", "warning");
    return;
  }

  // FIX: Xử lý file uploads - convert to base64
  const fileInput = document.getElementById("work-files");
  const files = fileInput.files;
  let filesArray = [];

  // Nếu có file cũ (đang edit), giữ lại
  const existingFiles = document.getElementById("existing-files-data");
  if (existingFiles && existingFiles.value) {
    try {
      filesArray = JSON.parse(existingFiles.value);
    } catch (err) {
      console.error("Lỗi parse existing files:", err);
      filesArray = [];
    }
  }

  if (files.length > 0) {
    // Tạo Promise array để xử lý tất cả file
    const filePromises = Array.from(files).map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            name: file.name,
            type: file.type,
            data: reader.result, // Base64 data
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises)
      .then((newFiles) => {
        filesArray = [...filesArray, ...newFiles];
        sendReportData(
          prevWork,
          todayWork,
          rate,
          nextPlan,
          suggestions,
          notes,
          editingId,
          filesArray,
        );
      })
      .catch((err) => {
        showToast("Lỗi xử lý file: " + err.message, "error");
      });
  } else {
    sendReportData(
      prevWork,
      todayWork,
      rate,
      nextPlan,
      suggestions,
      notes,
      editingId,
      filesArray,
    );
  }
}

function sendReportData(
  prevWork,
  todayWork,
  rate,
  nextPlan,
  suggestions,
  notes,
  editingId,
  files,
) {
  const reportData = {
    prevWork,
    todayWork,
    completionRate: rate,
    nextPlan,
    suggestions,
    notes,
    // FIX: Thêm files vào reportData
    files: files,
  };

  const method = editingId ? "PUT" : "POST";
  const endpoint = editingId
    ? `/report-detail?date=${encodeURIComponent(editingId)}`
    : "/report";

  fetch(endpoint, {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reportData),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        const msg = editingId
          ? "Cập nhật báo cáo thành công!"
          : "Gửi báo cáo thành công!";
        showToast(msg, "success");
        // FIX: Cập nhật trạng thái nút sau khi submit báo cáo
        updateAddReportButtonState();

        document.getElementById("report-form").reset();
        document.getElementById("editing-report-id").value = "";
        document.getElementById("existing-files-data").value = "";
        currentEditingReport = null;

        document.getElementById("submit-report-btn").innerText = "GỬI BÁO CÁO";
        document.getElementById("cancel-report-btn").style.display = "none";

        document.getElementById("prev-work").disabled = false;
        document.getElementById("today-work").disabled = false;
        document.getElementById("completion-rate").disabled = false;
        document.getElementById("next-plan").disabled = false;
        document.getElementById("suggestion").disabled = false;
        document.getElementById("work-files").disabled = false;

        const listTabBtn = document.querySelector(".report-sub-tab");
        if (listTabBtn) {
          switchReportTab("list", listTabBtn);
          loadReportList();
        }
      } else {
        showToast(data.message || "Không thể lưu báo cáo", "error");
      }
    })
    .catch((err) => {
      showToast("Lỗi khi lưu báo cáo: " + err.message, "error");
    });
}

// Hủy chỉnh sửa báo cáo
function cancelEditReport() {
  if (currentEditingReport) {
    currentEditingReport = null;
    document.getElementById("editing-report-id").value = "";
    // FIX: Clear existing files data
    document.getElementById("existing-files-data").value = "";
    const existingFilesList = document.getElementById("existing-files-list");
    if (existingFilesList) {
      existingFilesList.innerHTML = "";
      existingFilesList.style.display = "none";
    }
    document.getElementById("report-form").reset();
    document.getElementById("submit-report-btn").innerText = "GỬI BÁO CÁO";
    document.getElementById("cancel-report-btn").style.display = "none";

    document.getElementById("prev-work").disabled = false;
    document.getElementById("today-work").disabled = false;
    document.getElementById("completion-rate").disabled = false;
    document.getElementById("next-plan").disabled = false;
    document.getElementById("suggestion").disabled = false;
    document.getElementById("work-files").disabled = false;

    const listTabBtn = document.querySelector(".report-sub-tab");
    if (listTabBtn) {
      switchReportTab("list", listTabBtn);
    }
    showToast("Đã hủy chỉnh sửa!", "info");
  }
}

// Xử lý check-out và tự động logout
function handleCheckoutWithReport(date) {
  fetch("/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: dateStr,
      imageBase64: imageData,
    }),
  })
    .then(async (res) => {
      if (!res.ok) {
        const errText = await res.text();
        if (errText.includes("Too Large")) {
          throw new Error(
            "Dung lượng ảnh quá lớn! Nâng limit 50mb trong app.js!",
          );
        }
        throw new Error(`Lỗi HTTP ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      if (data.success) {
        // Đổi câu thông báo để user biết hệ thống đang làm gì
        showToast("Check-out thành công! Đang tự động đăng xuất...", "success");

        btnCheckoutCapture.disabled = true;
        btnCheckoutCapture.innerText = "ĐÃ CHECK-OUT";

        // Đợi 1.5 giây cho user kịp đọc dòng chữ màu xanh rồi đá văng ra ngoài
        setTimeout(() => {
          window.location.href = "/logout";
        }, 1500);
      } else {
        showToast(data.message || "Check-out thất bại", "error");
        btnCheckoutCapture.disabled = false;
        btnCheckoutCapture.innerText = "CHỤP & GỬI";
      }
    })
    .catch((err) => {
      console.error("Lỗi Fetch Checkout:", err);
      showToast(err.message || "Lỗi không thể kết nối server", "error");
      btnCheckoutCapture.disabled = false;
      btnCheckoutCapture.innerText = "CHỤP & GỬI";
    });
}
