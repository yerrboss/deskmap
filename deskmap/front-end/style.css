// FRONTEND – main.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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
const roomWrapperEl      = document.getElementById("roomWrapper");
const studentViewToggle  = document.getElementById("studentViewToggle");
const adjustBtn          = document.getElementById("adjustBtn");
const clearBtn           = document.getElementById("clearBtn");
const notesInputEl       = document.getElementById("notesInput");
const loadBtn            = document.getElementById("loadBtn");
const saveBtn            = document.getElementById("saveBtn");
const layoutPresetEl     = document.getElementById("layoutPreset");
const saveTemplateBtn    = document.getElementById("saveTemplateBtn");
const deleteTemplateBtn  = document.getElementById("deleteTemplateBtn");
const templateModal      = document.getElementById("templateModal");
const templateNameInput  = document.getElementById("templateNameInput");
const confirmTemplateBtn = document.getElementById("confirmTemplateBtn");
const cancelTemplateBtn  = document.getElementById("cancelTemplateBtn");

// 8x8 grid state (64 cells)
const COLS = 8;
const ROWS = 8;
let layout = Array(ROWS).fill(null).map(() => Array(COLS).fill(null).map(() => ({ name: null, isDesk: false })));
let studentNames = [];
let isAdjustMode = false;
let dragSourceCell = null;
let selectedCells = []; // Tracks Multi-Blocks dynamically
let dragSourceCoords = null; // Vector mapping anchor component

// Initialize
function init() {
  createGrid();
  applyPreset("standard"); // Force predefined grid safely
  fetchTeacherTemplates().then(() => loadLayouts());
}

// Ensure remote templates load dynamically if teacher changes
teacherIdEl.addEventListener("change", fetchTeacherTemplates);

// Create 8x8 grid DOM elements
function createGrid() {
  chartGridEl.innerHTML = "";
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.x = x;
      cell.dataset.y = y;
      
      // Events for dragging specific names dynamically
      cell.addEventListener("dragstart", handleDragStart);
      cell.addEventListener("dragover", handleDragOver);
      cell.addEventListener("dragenter", handleDragEnter);
      cell.addEventListener("dragleave", handleDragLeave);
      cell.addEventListener("drop", handleDrop);
      cell.addEventListener("dragend", handleDragEnd);
      
      // Editing
      cell.addEventListener("input", handleCellInput);
      cell.addEventListener("dblclick", handleCellDblClick); 
      cell.addEventListener("contextmenu", handleCellRightClick); // Deletes desk geometry natively
      cell.addEventListener("click", handleCellClick); // Shift-Click grouping mechanics
      
      chartGridEl.appendChild(cell);
    }
  }
}

// Preset Architectures Engine
function applyPreset(presetId) {
  // Wipe to transparent empty floor
  layout = Array(ROWS).fill(null).map(() => Array(COLS).fill(null).map(() => ({ name: null, isDesk: false })));

  if (presetId === "standard") {
    // Elegant 5x5 perfectly centered inside the 8x8 shell
    for (let y = 1; y <= 5; y++) {
      for (let x = 1; x <= 5; x++) layout[y][x].isDesk = true;
    }
  } else if (presetId === "ushape") {
    // Horseshoe outer boundaries
    for (let y = 1; y <= 6; y++) {
      layout[y][1].isDesk = true; // Left array
      layout[y][6].isDesk = true; // Right array
    }
    for (let x = 2; x <= 5; x++) {
      layout[6][x].isDesk = true; // Bottom bridging row
    }
  } else if (presetId === "groups") {
    // Dynamic mini-clusters spanning room
    const groups = [ [1,1], [1,5], [4,1], [4,5] ];
    groups.forEach(([gy, gx]) => {
      layout[gy][gx].isDesk = true; layout[gy][gx+1].isDesk = true;
      layout[gy+1][gx].isDesk = true; layout[gy+1][gx+1].isDesk = true;
    });
  } else if (presetId.startsWith("template_")) {
    const tName = presetId.replace("template_", "");
    if (window.userTemplates && window.userTemplates[tName]) {
      const geo = window.userTemplates[tName];
      layout = [];
      for (let i = 0; i < ROWS; i++) {
        layout.push(geo.slice(i * COLS, i * COLS + COLS).map(c => ({ name: null, isDesk: c.d })));
      }
    }
  }
  
  updateGrid(true);
}

let previousPresetValue = layoutPresetEl.value;

layoutPresetEl.addEventListener("focus", function() {
    previousPresetValue = this.value;
});

layoutPresetEl.addEventListener("change", (e) => {
  if (e.target.value === "custom") {
     templateNameInput.value = "";
     templateModal.style.display = "flex";
     templateNameInput.focus();
     
     // We revert the visual selection temporarily before the modal finishes
     e.target.value = previousPresetValue;
  } else {
    if(confirm("Warning: Applying a Preset template will replace the physical layout structure of the desks! Proceed?")) {
      applyPreset(e.target.value);
      previousPresetValue = e.target.value;
      deleteTemplateBtn.style.display = e.target.value.startsWith("template_") ? "flex" : "none";
    } else {
      // Revert safely if strictly cancelled
      e.target.value = previousPresetValue; 
    }
  }
});

// Modal Actions
cancelTemplateBtn.addEventListener("click", () => {
    templateModal.style.display = "none";
    layoutPresetEl.value = "standard";
});

confirmTemplateBtn.addEventListener("click", async () => {
    const name = templateNameInput.value.trim();
    if(!name) {
        alert("Please enter a name for your template!");
        return;
    }
    
    // Starts with 5x5 Standard array explicitly instead of cloning layout screen natively per user request!
    applyPreset("standard");
    
    const geometry = layout.flat().map(c => ({ d: c.isDesk }));
    const tid = teacherIdEl.value.trim() || "default";
    
    confirmTemplateBtn.textContent = "⏳ Saving...";
    try {
        await setDoc(doc(db, "templates", tid), { [name]: geometry }, { merge: true });
        await fetchTeacherTemplates();
        layoutPresetEl.value = "template_" + name;
        previousPresetValue = layoutPresetEl.value;
        deleteTemplateBtn.style.display = "flex";
        
        if (!isAdjustMode) adjustBtn.click();
    } catch(e) {
        alert("Template Entry Failed: " + e.message);
    }
    
    confirmTemplateBtn.textContent = "Save Layout";
    templateModal.style.display = "none";
});

deleteTemplateBtn.addEventListener("click", async () => {
    const val = layoutPresetEl.value;
    if (!val.startsWith("template_")) return;
    const name = val.replace("template_", "");
    
    if(!confirm(`Delete the custom layout "${name}"?`)) return;
    
    const tid = teacherIdEl.value.trim() || 'default';
    try {
        await updateDoc(doc(db, "templates", tid), { [name]: deleteField() });
        await fetchTeacherTemplates();
        applyPreset("standard");
        layoutPresetEl.value = "standard";
        deleteTemplateBtn.style.display = "none";
    } catch(e) { alert(e.message); }
});

// Map custom layout modifications reliably
function clearSelection() {
    selectedCells = [];
    document.querySelectorAll(".cell.selected").forEach(c => c.classList.remove("selected"));
}

function handleCellClick(e) {
    if (!isAdjustMode) return;
    
    // Clicking empty floor clears natively to drop grab focus
    if (!this.classList.contains("is-desk")) {
        if (!e.shiftKey) clearSelection();
        return;
    }
    
    const isStudentView = studentViewToggle.checked;
    const mapX = isStudentView ? (COLS - 1) - Number(this.dataset.x) : Number(this.dataset.x);
    const mapY = isStudentView ? (ROWS - 1) - Number(this.dataset.y) : Number(this.dataset.y);
    
    if (e.shiftKey) {
        e.preventDefault(); // Don't highlight text blocks globally
        const idx = selectedCells.findIndex(sc => sc.x === mapX && sc.y === mapY);
        if (idx >= 0) {
            selectedCells.splice(idx, 1);
            this.classList.remove("selected");
        } else {
            selectedCells.push({ x: mapX, y: mapY });
            this.classList.add("selected");
        }
    } else {
        clearSelection();
    }
}

function handleCellDblClick(e) {
  if (!isAdjustMode) return;
  e.preventDefault();
  
  const isStudentView = studentViewToggle.checked;
  const mapX = isStudentView ? (COLS - 1) - Number(this.dataset.x) : Number(this.dataset.x);
  const mapY = isStudentView ? (ROWS - 1) - Number(this.dataset.y) : Number(this.dataset.y);
  
  if (layout[mapY][mapX].isDesk) {
      // Double clicking an active desk turns it into an editable text field
      this.setAttribute("contenteditable", "true");
      this.focus();
      
      const blurHandler = () => {
          this.removeAttribute("contenteditable");
          const val = this.textContent.trim() || null;
          layout[mapY][mapX].name = val;
          if (val) this.classList.add("filled");
          else this.classList.remove("filled");
          this.removeEventListener("blur", blurHandler);
      };
      this.addEventListener("blur", blurHandler);
  } else {
      // Double clicking an empty floor tile spawns a desk natively
      if (!layoutPresetEl.value.startsWith("template_") && layoutPresetEl.value !== "custom") {
         layoutPresetEl.value = "custom";
         previousPresetValue = "custom";
      }
      layout[mapY][mapX].isDesk = true;
      updateGrid(false);
  }
}

function handleCellRightClick(e) {
   if (!isAdjustMode) return;
   e.preventDefault();
   
   const isStudentView = studentViewToggle.checked;
   const mapX = isStudentView ? (COLS - 1) - Number(this.dataset.x) : Number(this.dataset.x);
   const mapY = isStudentView ? (ROWS - 1) - Number(this.dataset.y) : Number(this.dataset.y);

   if (layout[mapY][mapX].isDesk) {
       if (!layoutPresetEl.value.startsWith("template_") && layoutPresetEl.value !== "custom") {
           layoutPresetEl.value = "custom";
           previousPresetValue = "custom";
       }
       layout[mapY][mapX].isDesk = false;
       layout[mapY][mapX].name = null;
       updateGrid(false);
   }
}

// Fluid Drag Mapping Mechanics
function handleDragStart(e) {
  if (!isAdjustMode || !this.classList.contains("is-desk")) { e.preventDefault(); return; }
  dragSourceCell = this;
  
  const isStudentView = studentViewToggle.checked;
  const mapX = isStudentView ? (COLS - 1) - Number(this.dataset.x) : Number(this.dataset.x);
  const mapY = isStudentView ? (ROWS - 1) - Number(this.dataset.y) : Number(this.dataset.y);
  
  // Independent drag logic grabs strictly the parent element bypassing selected cache natively if it wasn't tracked globally
  if (!selectedCells.some(sc => sc.x === mapX && sc.y === mapY)) {
      clearSelection();
      selectedCells.push({ x: mapX, y: mapY });
      this.classList.add("selected");
  }
  
  dragSourceCoords = { x: mapX, y: mapY };
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", this.textContent);
  this.classList.add("dragging");
}
function handleDragOver(e) { if (!isAdjustMode) return; e.preventDefault(); }
function handleDragEnter(e) {
  if (!isAdjustMode || this === dragSourceCell) return;
  this.classList.add("drag-over");
}
function handleDragLeave(e) { this.classList.remove("drag-over"); }
function handleDrop(e) {
  if (!isAdjustMode) return;
  e.stopPropagation();
  this.classList.remove("drag-over");
  
  if (dragSourceCell !== this) {
    const isStudentView = studentViewToggle.checked;
    const destMapX = isStudentView ? (COLS - 1) - Number(this.dataset.x) : Number(this.dataset.x);
    const destMapY = isStudentView ? (ROWS - 1) - Number(this.dataset.y) : Number(this.dataset.y);
    
    const offsetX = destMapX - dragSourceCoords.x;
    const offsetY = destMapY - dragSourceCoords.y;
    
    let isNameSwap = false;
    let isValid = true;
    
    // Group boundary calculation natively mapped
    const groupTargets = selectedCells.map(sc => ({
        sX: sc.x, sY: sc.y,
        dX: sc.x + offsetX, dY: sc.y + offsetY
    }));
    
    groupTargets.forEach(tgt => {
        if (tgt.dX < 0 || tgt.dX >= COLS || tgt.dY < 0 || tgt.dY >= ROWS) isValid = false;
        else {
            const trgGeo = layout[tgt.dY][tgt.dX];
            const isInternal = selectedCells.some(sc => sc.x === tgt.dX && sc.y === tgt.dY);
            if (trgGeo.isDesk && !isInternal) {
                if (selectedCells.length === 1) isNameSwap = true;
                else isValid = false;
            }
        }
    });
    
    if (!isValid) {
        alert("Blocked! The selected group is hitting an active desk or jumping out of the grid boundaries.");
        clearSelection();
        return false;
    }
    
    if (isNameSwap) {
        const sX = groupTargets[0].sX; const sY = groupTargets[0].sY;
        const dX = groupTargets[0].dX; const dY = groupTargets[0].dY;
        const temp = layout[sY][sX].name;
        layout[sY][sX].name = layout[dY][dX].name;
        layout[dY][dX].name = temp;
    } else {
        // Safe deep extract before injections
        const payload = groupTargets.map(tgt => ({
           n: layout[tgt.sY][tgt.sX].name,
           d: layout[tgt.sY][tgt.sX].isDesk,
           ...tgt
        }));
        
        // 1. Decouple native mapping cleanly to prevent internal overlapping artifacts
        payload.forEach(tgt => {
            layout[tgt.sY][tgt.sX].isDesk = false;
            layout[tgt.sY][tgt.sX].name = null;
        });
        
        // 2. Re-inject physically spanning exact vector offsets
        payload.forEach(tgt => {
            layout[tgt.dY][tgt.dX].isDesk = tgt.d;
            layout[tgt.dY][tgt.dX].name = tgt.n;
        });
        
        // Follow internal coordinates visually mapping DOM trackers natively mapping cleanly
        selectedCells = payload.map(tgt => ({ x: tgt.dX, y: tgt.dY }));
        
        if (!layoutPresetEl.value.startsWith("template_") && layoutPresetEl.value !== "custom") {
           layoutPresetEl.value = "custom";
           previousPresetValue = "custom";
        }
    }
    updateGrid(false);
  }
  return false;
}
function handleDragEnd(e) {
  this.classList.remove("dragging");
  document.querySelectorAll(".cell").forEach(c => c.classList.remove("drag-over"));
}
function handleCellInput(e) {
  if (!isAdjustMode || !this.classList.contains("is-desk")) return;
  const isStudentView = studentViewToggle.checked;
  const mapX = isStudentView ? (COLS - 1) - Number(this.dataset.x) : Number(this.dataset.x);
  const mapY = isStudentView ? (ROWS - 1) - Number(this.dataset.y) : Number(this.dataset.y);
  
  layout[mapY][mapX].name = this.textContent.trim() || null;
  if (layout[mapY][mapX].name) this.classList.add("filled");
  else this.classList.remove("filled");
}

// Render graphical elements iteratively bridging logical mappings
function updateGrid(animate = true) {
  const isStudentView = studentViewToggle.checked;
  const cells = Array.from(chartGridEl.children);
  
  cells.forEach((cell) => {
    const domX = Number(cell.dataset.x);
    const domY = Number(cell.dataset.y);
    const mapX = isStudentView ? (COLS - 1) - domX : domX;
    const mapY = isStudentView ? (ROWS - 1) - domY : domY;
    
    // Grabs active logical element mapped backwards seamlessly
    const cellData = layout[mapY][mapX];
    
    cell.classList.remove("pop");
    void cell.offsetWidth;
    
    if (cellData.isDesk) {
      cell.classList.add("is-desk");
      cell.textContent = cellData.name || "";
      if (cellData.name) {
        cell.classList.add("filled");
        if (animate) cell.classList.add("pop");
      } else {
        cell.classList.remove("filled");
      }
      
      if (isAdjustMode) {
        // Draggable enabled natively, editable conditionally blocked to protect physics
        cell.setAttribute("draggable", "true");
        cell.classList.add("editable");
        if (selectedCells.some(sc => sc.x === mapX && sc.y === mapY)) cell.classList.add("selected");
        else cell.classList.remove("selected");
      } else {
        cell.removeAttribute("contenteditable");
        cell.removeAttribute("draggable");
        cell.classList.remove("editable", "selected");
      }
    } else {
      // Invisible geometry floor tiles
      cell.classList.remove("is-desk", "filled", "editable");
      cell.removeAttribute("contenteditable");
      cell.removeAttribute("draggable");
      cell.textContent = "";
    }
  });
}

function shuffleArray(array) {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Standard Fisher-Yates generator mapped tightly exclusively to populated geometries
function generateSeating() {
  let namesToUse = [...studentNames];
  if (namesToUse.length === 0) namesToUse = nameInputEl.value.split("\n").map(s => s.trim()).filter(Boolean);
  if (namesToUse.length === 0) return alert("Please upload an Excel file or paste names first!");
  
  // Wipe existing names immediately but RETAIN geometry bounds constraints
  for(let y=0; y<ROWS; y++) {
      for(let x=0; x<COLS; x++) {
          layout[y][x].name = null;
      }
  }

  const shuffled = shuffleArray(namesToUse);
  let i = 0;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (layout[y][x].isDesk && i < shuffled.length) {
        layout[y][x].name = shuffled[i++];
      }
    }
  }
  updateGrid(true);
}

// Excel Parsing SDK binding
excelFileEl.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    const data = evt.target.result;
    const wb = XLSX.read(data, { type: "binary" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    // Flatten logic
    studentNames = rows.flat().map(s => s ? String(s).trim() : "").filter(Boolean);
    if(studentNames.length > 0) {
      alert(`Loaded ${studentNames.length} names! Click Generate!`);
      nameInputEl.value = "";
    }
  };
  reader.readAsBinaryString(file);
});

// Firestore Caching Implementations Overrides
function getStorageKey() {
  const tid = teacherIdEl.value.trim() || "default";
  const sid = classSetEl.value;
  return `${tid}_${sid}`;
}

async function saveLayout() {
  // Convert 8x8 objects to structurally compact maps
  const serialized = layout.flat().map(c => ({ n: c.name, d: c.isDesk }));
  const payload = {
    layout: serialized,
    notes: notesInputEl.value,
    preset: layoutPresetEl.value,
    timestamp: Date.now()
  };
  
  saveBtn.textContent = "⏳...";
  saveBtn.disabled = true;
  try {
    await setDoc(doc(db, "classrooms", getStorageKey()), payload);
    saveBtn.textContent = "✅ Saved";
  } catch (error) {
    console.error(error);
    alert("Firebase Save Error: " + error.message);
    saveBtn.textContent = "Save Class";
  }
  setTimeout(() => { saveBtn.textContent = "Save Class"; saveBtn.disabled = false; }, 2000);
}

async function fetchTeacherTemplates() {
  const tid = teacherIdEl.value.trim() || "default";
  try {
     const snap = await getDoc(doc(db, "templates", tid));
     if(snap.exists()) {
        const data = snap.data();
        
        // Purge previous dynamically populated templates to prevent stacking
        Array.from(layoutPresetEl.options).forEach(opt => {
           if(opt.classList.contains("user-template")) opt.remove();
        });
        
        Object.keys(data).forEach(key => {
           const opt = document.createElement("option");
           opt.value = "template_" + key;
           opt.textContent = key;
           opt.classList.add("user-template");
           // Splice right before the "Create New Layout..." fallback option
           layoutPresetEl.add(opt, layoutPresetEl.options[layoutPresetEl.length - 1]);
        });
        
        // Ensure UI buttons align on fetch globally
        deleteTemplateBtn.style.display = layoutPresetEl.value.startsWith("template_") ? "flex" : "none";
        window.userTemplates = data;
     }
  } catch(e) { console.warn("No templates exist yet:", e); }
}

saveTemplateBtn.addEventListener("click", async () => {
    const val = layoutPresetEl.value;
    if (!val.startsWith("template_")) {
        alert("Please select a Custom Layout from the dropdown first to save geometric changes to it!");
        return;
    }
    const name = val.replace("template_", "");
    const tid = teacherIdEl.value.trim() || "default";
    
    // Architect physical shape exclusively
    const geometry = layout.flat().map(c => ({ d: c.isDesk }));
    
    saveTemplateBtn.textContent = "⏳";
    try {
        await setDoc(doc(db, "templates", tid), { [name]: geometry }, { merge: true });
        saveTemplateBtn.textContent = "✅";
        await fetchTeacherTemplates(); // Dynamically refill dropdown with new entry
        layoutPresetEl.value = "template_" + name;
    } catch(e) {
        alert("Template Save Error: " + e.message);
        saveTemplateBtn.textContent = "💾";
    }
    setTimeout(() => saveTemplateBtn.textContent = "💾", 2500);
});

async function loadLayouts() {
  loadBtn.textContent = "⏳..."; loadBtn.disabled = true;
  try {
    const docSnap = await getDoc(doc(db, "classrooms", getStorageKey()));
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.layout && data.layout.length === ROWS * COLS) {
        layout = [];
        for (let i = 0; i < ROWS; i++) {
          layout.push(data.layout.slice(i * COLS, i * COLS + COLS).map(c => ({ name: c.n, isDesk: c.d })));
        }
      } else {
        // Fallback fallback fallback
        applyPreset("standard");
      }
      if (data.notes !== undefined) notesInputEl.value = data.notes;
      if (data.preset !== undefined) layoutPresetEl.value = data.preset;
      updateGrid(true);
    } else {
       // Blank native setup resets completely securely on 404 cache bounds
       applyPreset("standard");
       notesInputEl.value = "";
       layoutPresetEl.value = "standard";
    }
  } catch (error) {
    console.error(error);
    alert("Firebase Load Error: " + error.message);
  }
  loadBtn.textContent = "Load Class"; loadBtn.disabled = false;
}

// Helper utilities mappings
function clearBoard() {
  if (!confirm("Are you sure you want to completely clear seats? Geometry will remain intact.")) return;
  for(let y=0; y<ROWS; y++) for(let x=0; x<COLS; x++) layout[y][x].name = null;
  studentNames = []; nameInputEl.value = ""; if(excelFileEl) excelFileEl.value = ""; notesInputEl.value = "";
  updateGrid(true);
}

// UI binding triggers globally structured logically reliably
adjustBtn.addEventListener("click", () => {
  isAdjustMode = !isAdjustMode;
  if(!isAdjustMode) clearSelection();
  if(isAdjustMode) {
    adjustBtn.textContent = "🔓";
    adjustBtn.title = "Click to Lock Format securely natively mapped!";
    adjustBtn.classList.add("active");
    roomWrapperEl.classList.add("adjusting");
  } else {
    adjustBtn.textContent = "🔒";
    adjustBtn.title = "Click to open format overrides globally";
    adjustBtn.classList.remove("active");
    roomWrapperEl.classList.remove("adjusting");
  }
  updateGrid(false);
});

studentViewToggle.addEventListener("change", () => {
  if (studentViewToggle.checked) {
    roomWrapperEl.classList.add("student-view-active");
  } else {
    roomWrapperEl.classList.remove("student-view-active");
  }
  updateGrid(true);
});

document.getElementById("printBtn").addEventListener("click", () => window.print());

pasteNamesBtn.addEventListener("click", generateSeating);
clearBtn.addEventListener("click", clearBoard);
loadBtn.addEventListener("click", loadLayouts);
saveBtn.addEventListener("click", saveLayout);

document.addEventListener("DOMContentLoaded", init);
