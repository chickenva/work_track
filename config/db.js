const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🚀 MongoDB đã kết nối thành công!");
  } catch (err) {
    console.error("❌ Lỗi kết nối DB:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
