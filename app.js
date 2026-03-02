(function () {
"use strict";

/* ───────────────── ELEMENT HELPER ───────────────── */
const $ = id => document.getElementById(id);

/* ───────────────── ELEMENTS ───────────────── */
const els = {
  prevBtn: $("prevBtn"),
  nextBtn: $("nextBtn"),
  todayBtn: $("todayBtn"),
  monthSelect: $("monthSelect"),
  yearSelect: $("yearSelect"),

  grid: $("grid"),
  searchInput: $("searchInput"),
  dayLabel: $("dayLabel"),
  selectedEvents: $("selectedEvents"),
  upcomingEvents: $("upcomingEvents"),

  addBtn: $("addBtn"),
  editBtn: $("editBtn"),
  deleteSideBtn: $("deleteSideBtn"),
  exportBtn: $("exportBtn"),
  importBtn: $("importBtn"),
  clearAllBtn: $("clearAllBtn"),

  modal: $("eventModal"),
  backdrop: $("backdrop"),
  eventForm: $("eventForm"),
  closeBtn: $("closeBtn"),
  cancelBtn: $("cancelBtn"),
  deleteBtn: $("deleteBtn"),

  modalTitle: $("modalTitle"),
  modalSub: $("modalSub"),

  idInput: $("idInput"),
  titleInput: $("titleInput"),
  dateInput: $("dateInput"),
  endDateInput: $("endDateInput"),
  startInput: $("startInput"),
  endInput: $("endInput"),
  descInput: $("descInput"),
  remindInput: $("remindInput"),
  colorInput: $("colorInput"),
  conflictBox: $("conflictBox"),

  notifBanner: $("notifBanner"),
  notifAllowBtn: $("notifAllowBtn"),
  notifDismissBtn: $("notifDismissBtn"),

  importModal: $("importModal"),
  importCloseBtn: $("importCloseBtn"),
  importCancelBtn: $("importCancelBtn"),
  importConfirmBtn: $("importConfirmBtn"),
  importFileInput: $("importFileInput"),
  importError: $("importError")
};

/* ───────────────── STORAGE KEYS ───────────────── */
const STORAGE_KEY = "calendar_events_v3";
const POPUP_SEEN_KEY = "calendar_popup_seen_v1";
const NOTIF_SENT_KEY = "calendar_notif_sent_v1";
const BANNER_DISMISSED_KEY = "calendar_notif_banner_dismissed";

/* ───────────────── STATE ───────────────── */
let events = loadEvents();
let viewDate = new Date();
let selectedDate = toDateKey(new Date());
let editingId = null;
let selectedEventId = null;
let importParsed = [];

/* ───────────────── INIT ───────────────── */
init();

function init() {
  bind();
  initTheme();
  initYearDropdown();
  initMonthDropdown();
  render();
  renderDayPanel();
  registerServiceWorker();
  initNotificationBanner();
  initImportModal();
  checkPopupReminders();
  checkPassiveReminders();
  setInterval(checkPassiveReminders, 60000);
}

/* ───────────────── SERVICE WORKER ───────────────── */
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(console.error);
  }
}

/* ───────────────── BINDINGS ───────────────── */
function bind() {

  els.prevBtn.onclick = () => { viewDate = addMonths(viewDate,-1); render(); };
  els.nextBtn.onclick = () => { viewDate = addMonths(viewDate,1); render(); };

  els.todayBtn.onclick = () => {
    viewDate = new Date();
    selectedDate = toDateKey(new Date());
    selectedEventId = null;
    render();
    renderDayPanel();
  };

  els.searchInput.oninput = () => { render(); renderDayPanel(); };

  els.addBtn.onclick = () => openModalForDate(selectedDate);

  els.editBtn.onclick = () => {
    if(!selectedEventId) return toast("Select event first");
    openModalForEdit(selectedEventId);
  };

  els.deleteSideBtn.onclick = () => {
    if(!selectedEventId) return toast("Select event first");
    editingId = selectedEventId;
    onDelete();
  };

  els.exportBtn.onclick = exportEvents;
  els.importBtn.onclick = () => els.importModal.showModal();

  els.clearAllBtn.onclick = () => {
    if(!confirm("Delete ALL events?")) return;
    events = [];
    saveEvents(events);
    render();
    renderDayPanel();
  };

  els.closeBtn.onclick = closeModal;
  els.cancelBtn.onclick = closeModal;
  els.backdrop.onclick = closeModal;

  els.eventForm.onsubmit = e => { e.preventDefault(); onSave(); };
  els.deleteBtn.onclick = onDelete;
}

/* ───────────────── RENDER CALENDAR ───────────────── */
function render() {
  const y = viewDate.getFullYear();
  const m = viewDate.getMonth();

  els.yearSelect.value = y;
  els.monthSelect.value = m;

  const first = new Date(y,m,1);
  const startDay = first.getDay();
  const daysInMonth = new Date(y,m+1,0).getDate();

  els.grid.innerHTML = "";

  for(let i=0;i<startDay;i++){
    const empty = document.createElement("div");
    empty.className="cell empty";
    els.grid.appendChild(empty);
  }

  for(let d=1; d<=daysInMonth; d++){
    const date = new Date(y,m,d);
    const key = toDateKey(date);
    const cell = document.createElement("div");
    cell.className="cell";
    if(key===selectedDate) cell.classList.add("selected");
    if(key===toDateKey(new Date())) cell.classList.add("today");

    cell.onclick = () => {
      selectedDate = key;
      selectedEventId = null;
      render();
      renderDayPanel();
    };

    const dayEvents = getEventsOnDate(key);
    cell.innerHTML = `<div class="date">${d}${dayEvents.length ? `<span class="pill">${dayEvents.length}</span>`:""}</div>`;
    els.grid.appendChild(cell);
  }
}

/* ───────────────── DAY PANEL ───────────────── */
function renderDayPanel() {

  els.selectedEvents.innerHTML="";
  els.upcomingEvents.innerHTML="";

  const selected = new Date(selectedDate+"T00:00:00");

  els.dayLabel.textContent = selected.toLocaleDateString(undefined,{
    weekday:"long",year:"numeric",month:"long",day:"numeric"
  });

  const dayEvents = getEventsOnDate(selectedDate)
    .sort((a,b)=>(a.start||"").localeCompare(b.start||""));

  if(!dayEvents.length){
    els.selectedEvents.innerHTML=`<div class="day-item">No events.</div>`;
  } else {
    dayEvents.forEach(ev=>{
      const item = createEventCard(ev,false);
      if(ev.id===selectedEventId) item.classList.add("selected");
      item.onclick=()=>{selectedEventId=ev.id; renderDayPanel();};
      els.selectedEvents.appendChild(item);
    });
  }

  const upcoming = events
    .filter(ev=>ev.date>selectedDate)
    .sort((a,b)=>a.date.localeCompare(b.date))
    .slice(0,5);

  if(!upcoming.length){
    els.upcomingEvents.innerHTML=`<div class="day-item">No upcoming events.</div>`;
  } else {
    upcoming.forEach(ev=>{
      els.upcomingEvents.appendChild(createEventCard(ev,true));
    });
  }
}

function createEventCard(ev,showDate){
  const item=document.createElement("div");
  item.className="day-item";

  let tag="All day";
  if(ev.start && ev.end) tag=`${ev.start} – ${ev.end}`;

  item.innerHTML=`
  <div class="event-row">
    <div class="event-info">
      <div class="title">${escapeHtml(ev.title)}</div>
      ${showDate?`<div class="meta">${ev.date}</div>`:""}
      <div class="tag">${tag}</div>
    </div>
    <div class="event-actions">
      <button class="pill-btn edit-btn">Edit</button>
      <button class="pill-btn delete-btn">Delete</button>
    </div>
  </div>`;

  item.querySelector(".edit-btn").onclick=e=>{
    e.stopPropagation();
    openModalForEdit(ev.id);
  };

  item.querySelector(".delete-btn").onclick=e=>{
    e.stopPropagation();
    editingId=ev.id;
    onDelete();
  };

  return item;
}

/* ───────────────── SAVE / DELETE ───────────────── */
function onSave(){
  const ev={
    id: editingId || safeUUID(),
    title: els.titleInput.value.trim(),
    date: els.dateInput.value,
    endDate: els.endDateInput.value,
    start: els.startInput.value || null,
    end: els.endInput.value || null,
    description: els.descInput.value.trim(),
    remindMode: els.remindInput.value,
    color: els.colorInput.value
  };

  if(!ev.title || !ev.date) return toast("Fill required fields");

  const idx=events.findIndex(e=>e.id===ev.id);
  if(idx>=0) events[idx]=ev;
  else events.push(ev);

  saveEvents(events);

  selectedDate=ev.date;
  selectedEventId=ev.id;
  viewDate=new Date(ev.date);

  render();
  renderDayPanel();
  closeModal();
}

function onDelete(){
  if(!editingId) return;
  if(!confirm("Delete this event?")) return;

  events=events.filter(e=>e.id!==editingId);
  saveEvents(events);
  selectedEventId=null;

  render();
  renderDayPanel();
  closeModal();
}

/* ───────────────── IMPORT / EXPORT ───────────────── */
function exportEvents(){
  if(!events.length) return toast("No events to export");
  const blob=new Blob([JSON.stringify(events,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="calendar-events.json";
  a.click();
}

function initImportModal(){
  els.importCloseBtn.onclick=()=>els.importModal.close();
  els.importCancelBtn.onclick=()=>els.importModal.close();

  els.importFileInput.onchange=e=>{
    const file=e.target.files[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const data=JSON.parse(reader.result);
        if(!Array.isArray(data)) throw Error("Invalid file");
        importParsed=data;
        els.importConfirmBtn.disabled=false;
      }catch{
        els.importError.hidden=false;
        els.importError.textContent="Invalid JSON file";
      }
    };
    reader.readAsText(file);
  };

  els.importConfirmBtn.onclick=()=>{
    events.push(...importParsed);
    saveEvents(events);
    els.importModal.close();
    render();
    renderDayPanel();
  };
}

/* ───────────────── NOTIFICATIONS ───────────────── */
function initNotificationBanner(){
  if(!("Notification" in window)) return;
  if(Notification.permission==="default"){
    els.notifBanner.hidden=false;
    els.notifAllowBtn.onclick=()=>Notification.requestPermission();
    els.notifDismissBtn.onclick=()=>els.notifBanner.hidden=true;
  }
}

function checkPopupReminders(){}
function checkPassiveReminders(){}

/* ───────────────── STORAGE ───────────────── */
function loadEvents(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");}
  catch{return[];}
}

function saveEvents(list){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(list));
}

/* ───────────────── HELPERS ───────────────── */
function getEventsOnDate(key){
  return events.filter(ev=>key>=ev.date && key<=(ev.endDate||ev.date));
}

function toDateKey(d){
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}

function addMonths(d,n){
  return new Date(d.getFullYear(),d.getMonth()+n,1);
}

function safeUUID(){
  return crypto.randomUUID?crypto.randomUUID():Date.now()+"_"+Math.random();
}

function escapeHtml(s=""){
  return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

function closeModal(){
  els.modal.close();
  els.backdrop.hidden=true;
}

function initYearDropdown(){
  const current=new Date().getFullYear();
  for(let y=current-50;y<=current+50;y++){
    const opt=document.createElement("option");
    opt.value=y; opt.textContent=y;
    els.yearSelect.appendChild(opt);
  }
}

function initMonthDropdown(){
  const months=["January","February","March","April","May","June","July","August","September","October","November","December"];
  months.forEach((m,i)=>{
    const opt=document.createElement("option");
    opt.value=i; opt.textContent=m;
    els.monthSelect.appendChild(opt);
  });
}

function toast(msg){
  alert(msg);
}

function initTheme(){
  const btn=$("themeToggle");
  const saved=localStorage.getItem("calendar_theme");
  if(saved==="dark") document.body.classList.add("dark");
  btn.onclick=()=>document.body.classList.toggle("dark");
}

})();