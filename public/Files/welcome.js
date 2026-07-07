let EMPLOYEES = [];
let attendance = {};
let isWithinRange = false;
let currentLocation = "";

const OFFICE_LAT = 17.4324168195164;
const OFFICE_LON = 78.37925483570811;
const MAX_DISTANCE_METERS = 150;

const HOLIDAYS = [
  { date: "2026-01-26", name: "Republic Day", message: "🇮🇳 Jai Hind! Wishing everyone a Happy Republic Day!", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/320px-Flag_of_India.svg.png" },
  { date: "2026-03-05", name: "Republic Day", message: "🇮🇳 Jai Hind! Wishing everyone a Happy Republic Day!", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/320px-Flag_of_India.svg.png" },
  { date: "2026-03-19", name: "Gudi Padwa / Ugadi", message: "🌸 Ugadi Subhakankshalu! Wishing you and your family a very Happy & Prosperous Telugu New Year!", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Ugadi_Pachadi.jpg/320px-Ugadi_Pachadi.jpg" },
  { date: "2026-03-21", name: "Ramzan / Eid ul-Fitr", message: "🌙 Eid Mubarak! May this special day bring peace, happiness and prosperity to everyone.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Eid_Mubarak_Decorations.jpg/320px-Eid_Mubarak_Decorations.jpg" },
  { date: "2026-05-01", name: "Labour Day", message: "👷 Happy International Labour Day!", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Railway_Labour_Day.jpg/320px-Railway_Labour_Day.jpg" },
  { date: "2026-05-28", name: "Bakri Eid / Eid ul-Adha", message: "🐑 Eid ul-Adha Mubarak! May Allah accept your sacrifices!", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Eid_al-Adha_Prayers.jpg/320px-Eid_al-Adha_Prayers.jpg" },
  { date: "2026-08-15", name: "Independence Day", message: "🇮🇳 Happy Independence Day! Jai Hind! 🎆", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/320px-Flag_of_India.svg.png" },
  { date: "2026-09-13", name: "Ganesh Chaturthi", message: "🐘 Ganpati Bappa Morya! May Lord Ganesha bless you with wisdom and success!", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Ganesh_Chaturthi_Mumbai.jpg/320px-Ganesh_Chaturthi_Mumbai.jpg" },
  { date: "2026-10-02", name: "Gandhi Jayanti", message: "🕊️ Happy Gandhi Jayanti! Be the change you wish to see!", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Mahatma-Gandhi%2C_studio%2C_1931.jpg/240px-Mahatma-Gandhi%2C_studio%2C_1931.jpg" },
  { date: "2026-10-20", name: "Dussera / Vijayadashami", message: "🏹 Happy Dussehra! May the victory of good over evil inspire us all.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Mysore_Dasara_2007.jpg/320px-Mysore_Dasara_2007.jpg" },
  { date: "2026-11-10", name: "Diwali", message: "🪔 Happy Diwali! Shubh Deepawali!", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Diwali_2012_-_Kolkata%2C_India.jpg/320px-Diwali_2012_-_Kolkata%2C_India.jpg" },
  { date: "2026-11-11", name: "Diwali - Bhai Duj", message: "💝 Happy Bhai Duj! Celebrating the beautiful bond between brothers and sisters.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Diwali_2012_-_Kolkata%2C_India.jpg/320px-Diwali_2012_-_Kolkata%2C_India.jpg" },
  { date: "2026-12-25", name: "Christmas", message: "🎄 Merry Christmas! 🎅", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/ChristmasTree.jpg/240px-ChristmasTree.jpg" },
];

// ─── HELPERS ──────────────────────────────────────────────────────

function getTodayHoliday() {
  const todayStr = new Date().toISOString().split("T")[0];
  return HOLIDAYS.find(h => h.date === todayStr) || null;
}

function appUrl(path) {
  const base = (window.APP_URL || window.location.origin).replace(/\/$/, "");
  return base + "/" + path.replace(/^\//, "");
}

function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content || "";
}

// ─── PULSE HTML helper ────────────────────────────────────────────
function pulseOpenHTML() {
  return `<span class="open-label">OPEN</span><span class="pulse-ring"><span class="pulse-dot-inner"></span></span>`;
}

// ─── THEME SWITCHER ───────────────────────────────────────────────
let _isNightTheme = null;

function applyTheme() {
  const hour = new Date().getHours();
  const shouldBeNight = hour >= 18;
  if (shouldBeNight === _isNightTheme) return;
  _isNightTheme = shouldBeNight;
  if (shouldBeNight) {
    document.body.classList.add("night-theme");
    const ind = document.getElementById("night-indicator");
    if (ind) ind.style.display = "inline-block";
  } else {
    document.body.classList.remove("night-theme");
    const ind = document.getElementById("night-indicator");
    if (ind) ind.style.display = "none";
  }
}

// ─── HOLIDAY POPUP ────────────────────────────────────────────────
function showHolidayPopup(holiday) {
  Swal.fire({
    icon: "info",
    title: holiday.name,
    text: holiday.message,
    confirmButtonColor: "#16a34a",
    confirmButtonText: "OK, Got it! 🎊"
  });
}

// ─── MOBILE-SAFE EVENT BINDER ─────────────────────────────────────
function onTap(element, handler) {
  let touchMoved = false;
  element.addEventListener("touchstart", () => { touchMoved = false; }, { passive: true });
  element.addEventListener("touchmove", () => { touchMoved = true; }, { passive: true });
  element.addEventListener("touchend", (e) => {
    if (touchMoved || element.disabled) return;
    e.preventDefault();
    handler();
  });
  element.addEventListener("click", () => {
    if (element.disabled) return;
    handler();
  });
}

// ─── INIT ─────────────────────────────────────────────────────────
window.onload = function () {
  applyTheme();
  setInterval(updateClock, 1000);
  updateClock();

  if (window.EMPLOYEE_DATA && window.EMPLOYEE_DATA.length > 0) {
    EMPLOYEES = window.EMPLOYEE_DATA;
  }

  onTap(document.getElementById("btn-in"),  () => markAttendance("IN"));
  onTap(document.getElementById("btn-out"), () => markAttendance("OUT"));
  onTap(document.getElementById("loc-btn"), getLocation);
  onTap(document.getElementById("emp-location"), getLocation);

  getLocation();

  populateDropdown().then(() => { startSelectPoller(); });

  const holiday = getTodayHoliday();
  if (holiday) setTimeout(() => showHolidayPopup(holiday), 500);
};

// ─── SELECT POLLER ────────────────────────────────────────────────
let _lastSelectedId = "";
function startSelectPoller() {
  setInterval(() => {
    const sel = document.getElementById("emp-id");
    if (!sel) return;
    const currentId = sel.value;
    if (currentId !== _lastSelectedId) {
      _lastSelectedId = currentId;
      if (currentId) { getLocation(); checkEmployeeStatus(currentId); }
      refreshButtons();
    }
  }, 300);
}

// ─── POPULATE DROPDOWN ────────────────────────────────────────────
async function populateDropdown() {
  const sel = document.getElementById("emp-id");

  if (window.EMPLOYEE_DATA && window.EMPLOYEE_DATA.length > 0) {
    EMPLOYEES = window.EMPLOYEE_DATA;
  } else {
    EMPLOYEES = Array.from(sel.options)
      .filter(o => o.value)
      .map(o => ({ emp_id: o.value, name: o.getAttribute("data-name") || "", email: o.getAttribute("data-email") || "" }));

    const missingData = EMPLOYEES.some(e => !e.name);
    if (missingData) {
      try {
        const empRes = await fetch(appUrl("/get-employees"), {
          headers: { "Accept": "application/json", "X-CSRF-TOKEN": csrfToken() }
        });
        if (empRes.ok) {
          const empData = await empRes.json();
          EMPLOYEES = EMPLOYEES.map(e => {
            const found = empData.find(d => (d.emp_id || d.id) === e.emp_id);
            return found ? { ...e, name: found.name || found.emp_name || "", email: found.email || "" } : e;
          });
        }
      } catch (e) { console.warn("Could not fetch employee details:", e); }
    }
  }

  try {
    const attRes = await fetch(appUrl("/api/today-attendance"), {
      headers: { "Accept": "application/json", "X-CSRF-TOKEN": csrfToken() }
    });
    if (!attRes.ok) throw new Error("HTTP " + attRes.status);
    const rows = await attRes.json();
    rows.forEach(row => {
      attendance[row.emp_id] = {
        inTime: row.in_time ? formatTimeStr(row.in_time) : null,
        outTime: row.out_time ? formatTimeStr(row.out_time) : null,
        inLocation: row.check_in_location || "",
        outLocation: row.check_out_location || ""
      };
    });
  } catch (e) { console.warn("Could not load today attendance:", e); }

  refreshButtons();
}

// ─── CHECK EMPLOYEE STATUS ────────────────────────────────────────
async function checkEmployeeStatus(empId) {
  try {
    const res = await fetch(appUrl(`/api/check-status/${empId}`), {
      headers: { "Accept": "application/json", "X-CSRF-TOKEN": csrfToken() }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        attendance[empId] = attendance[empId] || {};
        attendance[empId].statusMessage = data.message;
        refreshButtons();
      }
    } else {
      if (attendance[empId]) attendance[empId].statusMessage = null;
      refreshButtons();
    }
  } catch (e) { console.warn("Could not check status:", e); }
}

function fillEmployee() { refreshButtons(); }

// ─── CLOCK ────────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  document.getElementById("live-time").textContent = now.toLocaleTimeString("en-IN");
  document.getElementById("live-date").textContent = now.toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
  applyTheme();
  refreshButtons();
}

function isSunday(d) { return d.getDay() === 0; }

// ─── REFRESH BUTTONS ──────────────────────────────────────────────
function refreshButtons() {
  const sel = document.getElementById("emp-id");
  const id = sel.value;
  const now = new Date();
  const totalMin = now.getHours() * 60 + now.getMinutes();
  const sunday = isSunday(now);
  const holiday = getTodayHoliday();
  const isHoliday = !!holiday;
  const holidayName = holiday ? holiday.name : "";

  const inOpen  = !sunday && !isHoliday && totalMin < 23 * 60;
  const outOpen = !sunday && !isHoliday && totalMin < 23 * 60;

  const empIdStr = id ? (sel.options[sel.selectedIndex]?.value || "") : "";
  const rec = empIdStr ? (attendance[empIdStr] || {}) : {};
  const hasIn  = !!rec.inTime;
  const hasOut = !!rec.outTime;

  // ── Pills class ── (guarded: time-banner may have been removed from the DOM)
  const inPillEl  = document.getElementById("in-pill");
  const outPillEl = document.getElementById("out-pill");
  if (inPillEl)  inPillEl.className  = "time-pill " + (inOpen  ? "active" : "inactive");
  if (outPillEl) outPillEl.className = "time-pill " + (outOpen ? "active" : "inactive");

  // ── Pill status with pulse animation ── (guarded)
  const inStatusEl  = document.getElementById("in-status");
  const outStatusEl = document.getElementById("out-status");

  if (inStatusEl && outStatusEl) {
    if (isHoliday) {
      inStatusEl.innerHTML  = `🎉 ${holidayName}`;
      outStatusEl.innerHTML = `🎉 ${holidayName}`;
    } else if (sunday) {
      inStatusEl.innerHTML  = "HOLIDAY";
      outStatusEl.innerHTML = "HOLIDAY";
    } else if (inOpen) {
      inStatusEl.innerHTML  = pulseOpenHTML();
      outStatusEl.innerHTML = pulseOpenHTML();
    } else {
      inStatusEl.innerHTML  = "CLOSED";
      outStatusEl.innerHTML = "CLOSED";
    }
  }

  // ── Sunday / Holiday banner ── (guarded, in case it's ever removed too)
  const banner = document.getElementById("sunday-banner");
  if (banner) {
    banner.style.display = (sunday || isHoliday) ? "flex" : "none";
    if (isHoliday) banner.textContent = `🎉 Today is ${holidayName} — Office Closed!`;
    else if (sunday) banner.textContent = "🚫 Sunday is a Holiday — Office Closed!";
  }

  // ── Buttons ──
  const btnIn  = document.getElementById("btn-in");
  const btnOut = document.getElementById("btn-out");

  btnIn.disabled  = !id || !inOpen  || hasIn  || isHoliday || !isWithinRange;
  btnOut.disabled = !id || !outOpen || !hasIn || hasOut     || isHoliday || !isWithinRange;

  btnIn.style.pointerEvents  = btnIn.disabled  ? "none" : "auto";
  btnOut.style.pointerEvents = btnOut.disabled ? "none" : "auto";
  btnIn.style.display  = (id && hasIn)  ? "none" : "";
  btnOut.style.display = (id && !hasIn) ? "none" : "";

  // ── Hint ──
  let hint = "";
  const hintEl = document.getElementById("btn-hint");
  hintEl.style.color = "#ff4757"; // default

  if (isHoliday) hint = `🎉 Today is ${holidayName} — Enjoy your Holiday!`;
  else if (sunday) hint = "🚫 Sunday is a Holiday";
  else if (!id) hint = "Select an employee to continue";
  else if (!isWithinRange) hint = "📍 You must be within office range to mark attendance";
  else if (hasOut) { hint = "✅ Attendance fully marked for today"; hintEl.style.color = "#16a34a"; }
  else if (hasIn) {
    const statusMsg = rec.statusMessage;
    if (statusMsg && statusMsg.includes("completed your working hours")) {
      hint = `⏱  ${statusMsg}`;
      hintEl.style.color = "#16a34a";
    } else {
      hint = statusMsg ? `⏱ ${statusMsg}` : "Ready to Check OUT!";
    }
  }
  else if (!inOpen) hint = "⏳ Attendance window closed (after 11:00 PM)";
  else hint = "Ready to Check IN!";

  hintEl.textContent = hint;
}

// ─── GEOLOCATION ──────────────────────────────────────────────────
function getLocation() {
  const status = document.getElementById("loc-status");
  const isLocalhost = ["localhost", "127.0.0.1"].includes(location.hostname);

  if (location.protocol !== "https:" && !isLocalhost) {
    status.className = "loc-status error";
    status.textContent = "❌ Location needs HTTPS — please enable SSL on your server.";
    return;
  }
  if (!navigator.geolocation) {
    status.className = "loc-status error";
    status.textContent = "❌ Geolocation not supported on this device/browser";
    return;
  }

  status.textContent = "⏳ Detecting location...";
  status.className = "loc-status";

  navigator.geolocation.getCurrentPosition(
    (pos) => handlePosition(pos),
    () => {
      status.textContent = "⏳ Trying GPS...";
      navigator.geolocation.getCurrentPosition(
        (pos) => handlePosition(pos),
        (err) => {
          const msgs = { 1: "❌ Permission denied — allow location in browser settings.", 2: "❌ GPS unavailable — make sure device location is ON.", 3: "❌ Timed out — tap 📍 to retry." };
          status.className = "loc-status error";
          status.textContent = msgs[err.code] || "❌ " + err.message;
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    },
    { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 }
  );
}

function handlePosition(pos) {
  const { latitude: lat, longitude: lon } = pos.coords;
  const dist = getDistance(lat, lon, OFFICE_LAT, OFFICE_LON);

  currentLocation = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  document.getElementById("emp-location").value = currentLocation;
  applyLocationStatus(dist);
  getWeather(lat, lon);

  if (location.protocol !== "https:" && !["localhost","127.0.0.1"].includes(location.hostname)) return;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
    { headers: { "Accept-Language": "en" }, signal: controller.signal })
    .then(r => { clearTimeout(timeoutId); if (!r.ok) throw new Error(); return r.json(); })
    .then(data => {
      const addr = data.address || {};
      const readable = [addr.suburb || addr.neighbourhood || addr.village, addr.road || addr.street, addr.city || addr.town].filter(Boolean).join(", ");
      if (readable) {
        currentLocation = readable;
        document.getElementById("emp-location").value = currentLocation;
        applyLocationStatus(dist);
      }
    })
    .catch(() => { clearTimeout(timeoutId); });
}

// ─── WEATHER ──────────────────────────────────────────────────────
// Uses Open-Meteo (free, no API key) — fetches current weathercode
// and maps it to Drizzle / Rain / Thunderstorm badges.
let _lastWeatherFetch = 0;
const WEATHER_REFRESH_MS = 10 * 60 * 1000; // refetch at most every 10 min

async function getWeather(lat, lon) {
  const now = Date.now();
  if (now - _lastWeatherFetch < WEATHER_REFRESH_MS) return; // avoid spamming API
  _lastWeatherFetch = now;

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
    );
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const code = data?.current_weather?.weathercode;
    updateWeatherBadge(code);
  } catch (e) {
    console.warn("Could not fetch weather:", e);
  }
}

function updateWeatherBadge(code) {
  const badge = document.getElementById("weather-badge");
  if (!badge) return; // badge element not added to this page — skip silently

  if (code === undefined || code === null) {
    badge.style.display = "none";
    return;
  }

  // WMO weather interpretation codes (used by Open-Meteo)
  const DRIZZLE      = [51, 53, 55, 56, 57];       // light/moderate/dense drizzle, freezing drizzle
  const RAIN         = [61, 63, 66, 67, 80, 81];   // slight/moderate rain, freezing rain, rain showers
  const THUNDERSTORM = [65, 82, 95, 96, 99];       // heavy rain, violent showers, thunderstorms (+ hail)
  const FOG          = [45, 48];
  const CLOUDY       = [1, 2, 3];

  let text, emoji, cls;

  if (THUNDERSTORM.includes(code)) {
    text = "Thunderstorm"; emoji = "⛈️"; cls = "weather-storm";
    startRainEffect("storm");
  } else if (DRIZZLE.includes(code)) {
    text = "Drizzling"; emoji = "🌦️"; cls = "weather-drizzle";
    startRainEffect("drizzle");
  } else if (RAIN.includes(code)) {
    text = "Raining"; emoji = "🌧️"; cls = "weather-rain";
    startRainEffect("rain");
  } else if (FOG.includes(code)) {
    text = "Foggy"; emoji = "🌫️"; cls = "weather-fog";
    stopRainEffect();
  } else if (CLOUDY.includes(code)) {
    text = "Cloudy"; emoji = "⛅"; cls = "weather-cloudy";
    stopRainEffect();
  } else if (code === 0) {
    text = "Clear"; emoji = "☀️"; cls = "weather-clear";
    stopRainEffect();
  } else {
    badge.style.display = "none";
    stopRainEffect();
    return;
  }

  badge.className = "weather-badge " + cls;
  badge.innerHTML = `${emoji} ${text}`;
  badge.style.display = "inline-flex";
}

// ─── WEATHER VISUAL EFFECTS (animated rain overlay, Google-weather style) ──
let _rainCanvas = null, _rainCtx = null, _rainAnimId = null, _rainDrops = [];
let _currentWeatherEffect = null;
let _lightningTimeout = null;

function ensureRainCanvas() {
  if (_rainCanvas) return;
  _rainCanvas = document.createElement("canvas");
  _rainCanvas.id = "rain-canvas";
  Object.assign(_rainCanvas.style, {
    position: "fixed", top: "0", left: "0",
    width: "100vw", height: "100vh",
    pointerEvents: "none", zIndex: "9999"
  });
  document.body.appendChild(_rainCanvas);
  _rainCtx = _rainCanvas.getContext("2d");
  resizeRainCanvas();
  window.addEventListener("resize", resizeRainCanvas);
}

function resizeRainCanvas() {
  if (!_rainCanvas) return;
  _rainCanvas.width = window.innerWidth;
  _rainCanvas.height = window.innerHeight;
}

function createDrop(cfg) {
  return {
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    length: cfg.length[0] + Math.random() * (cfg.length[1] - cfg.length[0]),
    speed: cfg.speed[0] + Math.random() * (cfg.speed[1] - cfg.speed[0]),
  };
}

// type: "drizzle" | "rain" | "storm"
function startRainEffect(type) {
  if (_currentWeatherEffect === type) return; // already running
  stopRainEffect();
  _currentWeatherEffect = type;
  ensureRainCanvas();
  _rainCanvas.style.display = "block";

  const CONFIG = {
    drizzle: { count: 60,  speed: [2, 4],   length: [6, 12],  opacity: 0.25, wind: 0.3 },
    rain:    { count: 150, speed: [6, 10],  length: [12, 22], opacity: 0.4,  wind: 0.6 },
    storm:   { count: 250, speed: [10, 16], length: [18, 30], opacity: 0.55, wind: 1.2 },
  }[type];

  _rainDrops = Array.from({ length: CONFIG.count }, () => createDrop(CONFIG));

  function loop() {
    _rainCtx.clearRect(0, 0, _rainCanvas.width, _rainCanvas.height);
    _rainCtx.strokeStyle = `rgba(174,194,224,${CONFIG.opacity})`;
    _rainCtx.lineWidth = 1.2;

    _rainDrops.forEach(d => {
      _rainCtx.beginPath();
      _rainCtx.moveTo(d.x, d.y);
      _rainCtx.lineTo(d.x + CONFIG.wind * 4, d.y + d.length);
      _rainCtx.stroke();

      d.x += CONFIG.wind;
      d.y += d.speed;

      if (d.y > _rainCanvas.height) {
        d.y = -20;
        d.x = Math.random() * _rainCanvas.width;
      }
    });

    _rainAnimId = requestAnimationFrame(loop);
  }
  loop();

  if (type === "storm") startLightningFlashes();
}

function startLightningFlashes() {
  function flash() {
    if (_currentWeatherEffect !== "storm") return;
    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "fixed", top: "0", left: "0",
      width: "100vw", height: "100vh",
      background: "rgba(255,255,255,0.35)",
      zIndex: "9998", pointerEvents: "none",
      transition: "opacity 0.4s ease-out"
    });
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = "0"; });
    setTimeout(() => overlay.remove(), 500);

    _lightningTimeout = setTimeout(flash, 4000 + Math.random() * 6000);
  }
  flash();
}

function stopRainEffect() {
  _currentWeatherEffect = null;
  if (_rainAnimId) cancelAnimationFrame(_rainAnimId);
  _rainAnimId = null;
  if (_lightningTimeout) clearTimeout(_lightningTimeout);
  _lightningTimeout = null;
  if (_rainCanvas) _rainCanvas.style.display = "none";
}

function applyLocationStatus(dist) {
  const status = document.getElementById("loc-status");
  if (dist <= MAX_DISTANCE_METERS) {
    isWithinRange = true;
    status.className = "loc-status done";
    status.textContent = `✅ Within office range (${Math.round(dist)}m)`;
  } else {
    isWithinRange = false;
    status.className = "loc-status error";
    status.textContent = `❌ Outside office — ${currentLocation} (${Math.round(dist)}m away)`;
  }
  refreshButtons();
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ─── MARK ATTENDANCE ──────────────────────────────────────────────
async function markAttendance(type) {
  const sel = document.getElementById("emp-id");
  const empIdStr = sel.value;
  const locationStr = document.getElementById("emp-location").value || "Unknown";
  const empName = document.getElementById("emp-name").value;

  if (!empIdStr) {
    Swal.fire({ icon: "warning", title: "Employee Required", text: "Please select an Employee first", confirmButtonColor: "#f59e0b" });
    return;
  }

  const holiday = getTodayHoliday();
  if (holiday) { showHolidayPopup(holiday); return; }

  if (!isWithinRange) {
    Swal.fire({ icon: "error", title: "Outside Office Range", text: `You are too far from the office (${currentLocation}). Please come within ${MAX_DISTANCE_METERS}m to mark attendance.`, confirmButtonColor: "#f59e0b" });
    return;
  }

  if (type === "OUT") {
    const rec = attendance[empIdStr] || {};
    if (rec.statusMessage && rec.statusMessage.includes("remaining")) {
      const confirmEarly = await Swal.fire({
        title: "Early Check-Out?", text: rec.statusMessage, icon: "warning",
        showCancelButton: true, confirmButtonColor: "#dc2626", cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, Check Out", cancelButtonText: "No, Stay"
      });
      if (!confirmEarly.isConfirmed) return;
    }
  }

  document.getElementById("btn-in").disabled  = true;
  document.getElementById("btn-out").disabled = true;

  Swal.fire({ title: "Recording Attendance...", text: "Please wait", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  try {
    const response = await fetch(appUrl("/api/mark-attendance"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json", "X-CSRF-TOKEN": csrfToken() },
      body: JSON.stringify({ emp_id: empIdStr, type, location: locationStr })
    });

    let result = {};
    try { result = await response.json(); } catch (e) {}

    if (response.ok && result.success !== false) {
      if (!attendance[empIdStr]) attendance[empIdStr] = {};
      const timeStr = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
      }).toUpperCase();

      if (type === "IN") {
        attendance[empIdStr].inTime = timeStr;
        attendance[empIdStr].inLocation = locationStr;
      } else {
        attendance[empIdStr].outTime = timeStr;
        attendance[empIdStr].outLocation = locationStr;
      }

      refreshButtons();

      Swal.fire({
        icon: "success",
        title: type === "IN" ? "Check-In Successful" : "Check-Out Successful",
        html: `
          <div style="text-align:left;font-size:14px;line-height:2;">
            <b>Employee:</b> ${empName}<br>
            <b>Time:</b> ${timeStr}<br>
            <b>Location:</b> ${locationStr}<br>
            <b>Date:</b> ${new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}<br><br>
            ${type==="OUT" && result.message && result.message.includes("Remaining")
              ? `<div style="color:#dc2626;font-weight:600;">⏱ 😜 ${result.message}</div>` : ""}
          </div>`,
        confirmButtonColor: type === "IN" ? "#16a34a" : "#dc2626",
        confirmButtonText: "OK"
      }).then(() => location.reload());

    } else {
      const msg = result.message || result.error || (result.errors ? Object.values(result.errors).flat().join(", ") : "") || ("Server error " + response.status);
      Swal.fire({ icon: "error", title: "Attendance Failed", text: msg });
      refreshButtons();
    }

  } catch (err) {
    console.error("markAttendance error:", err);
    Swal.fire({ icon: "error", title: "Connection Error", text: "Check your network and try again." });
    refreshButtons();
  }
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.style.display = "block";
  setTimeout(() => t.style.display = "none", 3000);
}

function formatTimeStr(timeStr) {
  if (!timeStr) return null;
  if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;
  const [h, m, s] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, s || 0);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).toUpperCase();
}