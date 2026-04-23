// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    position: { type: String, required: true },
    workingDays: { type: Number, default: 0 },
    dayOff: { type: Number, default: 0 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    employeeId: { type: String },
    accountStatus: {
      type: String,
      enum: ["active", "locked"],
      default: "active",
    },
    lastActiveDate: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Helper function to generate employeeId
function generateEmployeeId(fullName, phone) {
  if (fullName && phone) {
    const shortName = fullName.split(" ").pop(); // Get last name part
    const lastThreeDigits = phone.slice(-3);
    return (shortName + lastThreeDigits).toLowerCase();
  }
  return "";
}

// Pre-save middleware to generate employeeId
userSchema.pre("save", async function () {
  if (this.fullName || this.phone) {
    this.employeeId = generateEmployeeId(this.fullName, this.phone);
  }
});

module.exports = mongoose.model("User", userSchema);
