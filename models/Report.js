const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { type: String, required: true },

    // Báo cáo công việc
    prevWork: { type: String, default: "" },
    todayWork: { type: String, default: "" },
    completionRate: { type: Number, default: 0 },
    nextPlan: { type: String, default: "" },
    suggestions: { type: String, default: "" },
    notes: { type: String, default: "" },
    files: [
      {
        name: { type: String },
        type: { type: String },
        data: { type: String },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Report", reportSchema);
