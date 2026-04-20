// FRONTEND – main.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js"; 
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCahJzd-gHkkADQBDlMkNSfqKS5rIyBa00",
  authDomain: "deskmap-be5a6.firebaseapp.com",
  projectId: "deskmap-be5a6",
  storageBucket: "deskmap-be5a6.firebasestorage.app",
  messagingSenderId: "200348796305",
  appId: "1:200348796305:web:f20453db81eb6a97498630",
  measurementId: "G-KH34DGB1R6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM elements
const teacherIdEl        = document.getElementById("teacherId");
const classSetEl         = document.getElementById("classSet");
const excelFileEl        = document.getElementById("excelFile");
const nameInputEl        = document.getElementById("nameInput");
const pasteNamesBtn      = document.getElementById("pasteNamesBtn");
const chartGridEl        = document.getElementById("chartGrid");
const gridContainerEl    = document.getElementById("gridContainer");
const roomWrapperEl      = document.getElementById("roomWrapper");
const studentViewToggle  = document.getElementById("studentViewToggle");
const adjustBtn          = document.getElementById("adjustBtn");
const clearBtn           = document.getElementById("clearBtn");
const notesInputEl       = document.getElementById("notesInput");
const loadBtn            = document.getElementById("loadBtn");
const saveBtn            = document.getElementById("saveBtn");
const printBtn           = document.getElementById("printBtn");

// 5×5 grid state
let layout = Array(5).fill(null).map(() => Array(5).fill(null));
let studentNames = [];
let isAdjustMode = false;
let dragSourceCell = null;

// Initialize
function init() {
  createGrid();
  loadLayouts(); // Attempt to load initial if any
}

// Create a 5×5 grid in the DOM
function createGrid() {
  chartGridEl.innerHTML = "";
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.x = x;
      cell.dataset.y = y;
      
      // Events for drag & drop
      cell.addEventListener("dragstart", handleDragStart);
      cell.addEventListener("dragover", handleDragOver);
      cell.addEventListener("dragenter", handleDragEnter);
      cell.addEventListener("dragleave", handleDragLeave);
      cell.addEventListener("drop", handleDrop);
      cell.addEventListener("dragend", handleDragEnd);
      
      // Events for manual typing
      cell.addEventListener("input", handleCellInput);
      
      chartGridEl.appendChild(cell);
    }
  }
}

// Drag logic
function handleDragStart(e) {
  if (!isAdjustMode) { e.preventDefault(); return; }
  dragSourceCell = this;
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", this.textContent);
  this.classList.add("dragging");
}

function handleDragOver(e) {
  if (!isAdjustMode) return;
  e.preventDefault(); 
}

function handleDragEnter(e) {
  if (!isAdjustMode || this === dragSourceCell) return;
  this.classList.add("drag-over");
}

function handleDragLeave(e) {
  this.classList.remove("drag-over");
}

function handleDrop(e) {
  if (!isAdjustMode) return;
  e.stopPropagation();
  this.classList.remove("drag-over");
  
  if (dragSourceCell !== this) {
    const isStudentView = studentViewToggle.checked;
    
    // Map visual element coordinates to physical 2d array backing store
    const srcMapX = isStudentView ? 4 - Number(dragSourceCell.dataset.x) : Number(dragSourceCell.dataset.x);
    const srcMapY = isStudentView ? 4 - Number(dragSourceCell.dataset.y) : Number(dragSourceCell.dataset.y);
    const destMapX = isStudentView ? 4 - Number(this.dataset.x) : Number(this.dataset.x);
    const destMapY = isStudentView ? 4 - Number(this.dataset.y) : Number(this.dataset.y);
    
    const temp = layout[srcMapY][srcMapX];
    layout[srcMapY][srcMapX] = layout[destMapY][destMapX];
    layout[destMapY][destMapX] = temp;
    updateGrid(false);
  }
  return false;
}

function handleDragEnd(e) {
  this.classList.remove("dragging");
  document.querySelectorAll(".cell").forEach(c => c.classList.remove("drag-over"));
}

function handleCellInput(e) {
  if (!isAdjustMode) return;
  const isStudentView = studentViewToggle.checked;
  const mapX = isStudentView ? 4 - Number(this.dataset.x) : Number(this.dataset.x);
  const mapY = isStudentView ? 4 - Number(this.dataset.y) : Number(this.dataset.y);
  layout[mapY][mapX] = this.textContent.trim() || null;
  if (layout[mapY][mapX]) this.classList.add("filled");
  else this.classList.remove("filled");
}

// Render grid from state
function updateGrid(animate = true) {
  const isStudentView = studentViewToggle.checked;
  const cells = Array.from(chartGridEl.children);
  
  cells.forEach((cell) => {
    // Physical coordinate of cell in the CSS Grid
    const domX = Number(cell.dataset.x);
    const domY = Number(cell.dataset.y);
    
    // If student view, map reverse coordinates to the DOM cell
    const mapX = isStudentView ? 4 - domX : domX;
    const mapY = isStudentView ? 4 - domY : domY;
    
    const name = layout[mapY][mapX];
    
    // reset animation
    cell.classList.remove("pop");
    // force reflow
    void cell.offsetWidth;
    
    if (name) {
      cell.textContent = name;
      cell.classList.add("filled");
      if (animate) cell.classList.add("pop");
    } else {
      cell.textContent = "";
      cell.classList.remove("filled");
    }
    
    // Adjust mode interactions
    if (isAdjustMode) {
      cell.setAttribute("contenteditable", "true");
      cell.setAttribute("draggable", "true");
      cell.classList.add("editable");
    } else {
      cell.removeAttribute("contenteditable");
      cell.removeAttribute("draggable");
      cell.classList.remove("editable");
    }
  });
}

// Fisher-Yates array shuffle helper
function shuffleArray(array) {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Core generation function
function generateSeating() {
  // Try to use parsed excel names, fallback to textarea
  let namesToUse = [...studentNames];
  if (namesToUse.length === 0) {
    namesToUse = nameInputEl.value
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (namesToUse.length === 0) {
    alert("Please upload an Excel file or paste names first!");
    return;
  }

  // Shuffle names for random seating
  const shuffledNames = shuffleArray(namesToUse);

  // Fill 5x5 layout
  layout = Array(5).fill(null).map(() => Array(5).fill(null));
  
  let i = 0;
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      if (i < shuffledNames.length) {
        layout[y][x] = shuffledNames[i++];
      }
    }
  }
  updateGrid(true);
}

// Excel Parsing via SheetJS
excelFileEl.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    const data = evt.target.result;
    const workbook = XLSX.read(data, { type: "binary" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    // Convert to JSON, expecting names in rows
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Flatten and clean
    studentNames = rows.flat().map(s => s ? String(s).trim() : "").filter(Boolean);
    
    if (studentNames.length > 0) {
      alert(`Successfully loaded ${studentNames.length} names from Excel!`);
      // optionally auto clear the textarea
      nameInputEl.value = "";
    }
  };
  reader.readAsBinaryString(file);
});

// Settings save / load via Cloud Firestore
function getStorageKey() {
  const tid = teacherIdEl.value.trim() || "default";
  const sid = classSetEl.value;
  return `${tid}_${sid}`;
}

async function saveLayout() {
  const payload = {
    layout: layout.flat(), // Firestore does not support nested arrays
    notes: notesInputEl.value,
    timestamp: Date.now() // Record save time
  };
  
  saveBtn.textContent = "⏳ Saving...";
  saveBtn.disabled = true;
  
  try {
    const docRef = doc(db, "classrooms", getStorageKey());
    await setDoc(docRef, payload);
    saveBtn.textContent = "✅ Saved to Cloud";
  } catch (error) {
    console.error("Error saving document: ", error);
    alert("Firebase Save Error: " + error.message);
    saveBtn.textContent = "Save Class";
  }
  
  // Revert button text after 2 seconds safely
  setTimeout(() => {
    saveBtn.textContent = "Save Class";
    saveBtn.disabled = false;
  }, 2000);
}

async function loadLayouts() {
  loadBtn.textContent = "⏳ Loading...";
  loadBtn.disabled = true;
  
  try {
    const docRef = doc(db, "classrooms", getStorageKey());
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.layout && Array.isArray(data.layout)) {
        if (data.layout.length === 25) {
          // Reconstruct 5x5 2D array from Firestore's 1D array constraint
          layout = [];
          for (let i = 0; i < 5; i++) layout.push(data.layout.slice(i * 5, i * 5 + 5));
        } else {
          layout = data.layout;
        }
        updateGrid(true);
      }
      if (data.notes !== undefined) notesInputEl.value = data.notes;
    } else {
      // Document doesn't exist, reset layout securely
      layout = Array(5).fill(null).map(() => Array(5).fill(null));
      updateGrid(false);
      notesInputEl.value = "";
    }
  } catch (error) {
    console.error("Error loading document:", error);
    alert("Firebase Load Error: " + error.message);
  }
  
  loadBtn.textContent = "Load Class";
  loadBtn.disabled = false;
}

// Student View Toggle (Smooth re-render instead of container rotation)
function toggleStudentView() {
  const isActive = studentViewToggle.checked;
  if(isActive) {
    roomWrapperEl.classList.add("student-view-active");
  } else {
    roomWrapperEl.classList.remove("student-view-active");
  }
  updateGrid(true); // Re-render grid mapping with pop anim
}

// Clear Board
function clearBoard() {
  if (!confirm("Are you sure you want to completely clear the current board?")) return;
  layout = Array(5).fill(null).map(() => Array(5).fill(null));
  studentNames = [];
  nameInputEl.value = "";
  notesInputEl.value = "";
  if (excelFileEl) excelFileEl.value = "";
  updateGrid(true);
}

// UI Events
adjustBtn.addEventListener("click", () => {
  isAdjustMode = !isAdjustMode;
  if(isAdjustMode) {
    adjustBtn.textContent = "🔓";
    adjustBtn.title = "Click to Lock Layout";
    adjustBtn.classList.add("active");
    chartGridEl.classList.add("adjusting");
  } else {
    adjustBtn.textContent = "🔒";
    adjustBtn.title = "Click to Unlock Layout";
    adjustBtn.classList.remove("active");
    chartGridEl.classList.remove("adjusting");
  }
  updateGrid(false);
});

pasteNamesBtn.addEventListener("click", () => {
  generateSeating();
});

clearBtn.addEventListener("click", clearBoard);
loadBtn.addEventListener("click", loadLayouts);
saveBtn.addEventListener("click", saveLayout);
studentViewToggle.addEventListener("change", toggleStudentView);
printBtn.addEventListener("click", () => window.print());

document.addEventListener("DOMContentLoaded", init);
