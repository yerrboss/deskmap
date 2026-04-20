// backend/models/Layouts.js

const mongoose = require("mongoose");

const LayoutSchema = new mongoose.Schema({
  teacherId: String,
  setId: String,
  roster: [String],
  layout: [[String]],   // 5×5 grid
  notes: String,
  reminders: [
    {
      date: String,
      title: String,
      description: String,
    },
  ],
});

module.exports = mongoose.model("Layout", LayoutSchema);