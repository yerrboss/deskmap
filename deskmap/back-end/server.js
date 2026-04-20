// backend/server.js

const express = require("express");
const mongoose = require("mongoose");

const app = express();

app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema: one document per teacher + set
const LayoutSchema = new mongoose.Schema({
  teacherId: String,
  setId: String,
  roster: [String],
  layout: [[String]],   // 5×5 grid
  notes: String,        // per‑set notes (simple text)
  reminders: [
    {
      date: String,
      title: String,
      description: String,
    },
  ],
});

const Layout = mongoose.model("Layout", LayoutSchema);

// LOAD all layouts for a teacher
app.get("/api/layouts", async (req, res) => {
  const { teacherId } = req.query;
  const layouts = await Layout.find({ teacherId });
  res.json(layouts);
});

// SAVE or UPDATE a layout
app.post("/api/layout", async (req, res) => {
  const { teacherId, setId, roster, layout, notes, reminders } = req.body;

  const existing = await Layout.findOne({ teacherId, setId });
  if (existing) {
    existing.roster = roster;
    existing.layout = layout;
    existing.notes = notes;
    existing.reminders = reminders;
    await existing.save();
  } else {
    const newLayout = new Layout({ teacherId, setId, roster, layout, notes, reminders });
    await newLayout.save();
  }

  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));