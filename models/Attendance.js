const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { type: String, required: true },

    // Check-in fields
    checkInTime: { type: Date },
    selfie: { type: String },

    // Check-out fields
    checkOutTime: { type: Date },
    checkOutSelfie: { type: String },
    isCheckedOut: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["checked-in", "completed"],
      default: "checked-in",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Attendance", attendanceSchema);
