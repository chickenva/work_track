const jwt = require("jsonwebtoken");

const requireAuth = (req, res, next) => {
  const token = req.cookies.auth_token;

  // Nếu không có token, đá văng về trang đăng nhập
  if (!token) {
    return res.redirect("/login");
  }

  try {
    // Giải mã token xem có hợp lệ không
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Gắn thông tin user vào request để dùng ở trang chủ
    next(); // Cho phép đi tiếp
  } catch (err) {
    // Token sai hoặc hết hạn
    res.clearCookie("auth_token");
    return res.redirect("/login");
  }
};

module.exports = { requireAuth };
