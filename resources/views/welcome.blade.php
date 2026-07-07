@php
    $employees = \App\Models\Employees::select('emp_id', 'name', 'email')
                    ->orderBy('emp_id')
                    ->get();
@endphp

<!DOCTYPE html>
<html lang="en">
<head>
  {{-- ── Meta ──────────────────────────────────────────────────── --}}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="csrf-token" content="{{ csrf_token() }}">

  {{-- FIX: Inject app base URL so welcome.js fetch calls always resolve correctly --}}
  <script>
    window.APP_URL = "{{ url('/') }}";
    // FIX: Embed ALL employee data directly — no API call needed, works 100% offline too
    window.EMPLOYEE_DATA = {!! json_encode($employees) !!};
  </script>

  {{-- FIX: Tell mobile browsers this is an HTTPS-capable web app --}}
  <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">

  <title>Kustard Attendance</title>

  {{-- ── Favicon ─────────────────────────────────────────────── --}}
  <!--<link rel="icon" href="{{ asset('Files/kustard-logo.png') }}">-->
  <link rel="icon" href="{{ asset('Files/kustard-logo.png') }}" type="image/png">

  {{-- ── Fonts ───────────────────────────────────────────────── --}}
  {{-- FIX: preconnect speeds up font load on mobile, display=swap prevents invisible text --}}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Goldman:wght@400;700&family=Merienda:wght@300..900&family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&family=Unbounded:wght@200..900&display=swap" rel="stylesheet">
  {{-- ── Styles ──────────────────────────────────────────────── --}}
  {{-- FIX: use asset() helper so path is always absolute — avoids 404 on subdirectory deployments --}}
  <link rel="stylesheet" href="{{ asset('welcome.css') }}">
</head>
<body>

<div class="wrapper">

  {{-- ── Header ─────────────────────────────────────────────── --}}
  <header>
    <div class="logo-badge"> Kustard</div>
    <h1>Employee <span>Attendance</span></h1>
    <div class="datetime-bar">
      <span><span class="dot"></span><span class="live" id="live-time">--:--:--</span></span>
      <span id="live-date">Loading...</span>
    </div>
    <br>
    <div class="shimmer-line"></div>
      <!-- <span id="weather-badge" class="weather-badge" style="display:none;"></span> -->
  </header>

  


  {{-- ── Sunday / Holiday Banner ─────────────────────────────── --}}
  <div
    id="sunday-banner"
    style="display:none; align-items:center; gap:16px; background:rgba(255,71,87,0.08);
           border:1px solid rgba(255,71,87,0.3); border-radius:14px;
           padding:18px 24px; margin-bottom:24px;"
  >
    <span style="font-size:28px">🚫</span>
    <div>
      <div style="font-family:'Syne',sans-serif; font-weight:700; font-size:15px; color:#ff4757;">
        Sunday — Holiday
      </div>
      <div style="font-size:12px; color:var(--muted); margin-top:3px;">
        Attendance is closed today.
      </div>
    </div>
  </div>

  {{-- ── Main Card ────────────────────────────────────────────── --}}
  <div class="main-card">
    <div class="section-label">Mark Attendance</div>

    <div class="form-grid">

      {{-- Employee ID Select --}}
      <div class="form-group full">
        <label for="emp-id">Employee ID</label>
        <div class="select-wrap">
          {{-- FIX: removed inline onchange/oninput — listeners added in JS to avoid duplicate calls --}}
          <select id="emp-id">
            <option value="">— Select Employee ID —</option>
            @foreach($employees as $emp)
              <option
                value="{{ $emp->emp_id }}"
                data-name="{{ htmlspecialchars($emp->name ?? '', ENT_QUOTES, 'UTF-8') }}"
                data-email="{{ htmlspecialchars($emp->email ?? '', ENT_QUOTES, 'UTF-8') }}"
              >{{ $emp->emp_id }}</option>
            @endforeach
          </select>
        </div>
      </div>

      {{-- Full Name --}}
      <div class="form-group">
        <label for="emp-name">Full Name</label>
        {{-- FIX: autocomplete="off" prevents mobile browsers pre-filling readonly fields --}}
        <input type="text" id="emp-name" readonly placeholder="Auto-filled" autocomplete="off">
      </div>

      {{-- Email --}}
      <div class="form-group">
        <label for="emp-email">Email</label>
        <input type="text" id="emp-email" readonly placeholder="Auto-filled" autocomplete="off">
      </div>

      {{-- Location --}}
      <div class="form-group full">
        <label for="emp-location">Current Location</label>
        <div class="location-wrap">
          <input
            type="text"
            id="emp-location"
            readonly
            placeholder="Click 📍 to detect location"
            autocomplete="off"
          >
          {{-- FIX: type="button" prevents accidental form submission on mobile --}}
          <button class="loc-btn" id="loc-btn" type="button" title="Detect Location"></button>
        </div>
        <div class="loc-status" id="loc-status">Location required for marking attendance</div>
      </div>

    </div>{{-- /.form-grid --}}

    <div
      style="text-align:center; margin-bottom:30px;margin-top:20px; font-size:15px; color:#ff4757"
      id="btn-hint"
    >Select an employee to continue</div>

    {{-- Action Buttons --}}
    <div class="action-row">
      {{-- FIX: type="button" on both — prevents any mobile form-submit behaviour --}}
      <button class="btn btn-in"  id="btn-in"  type="button" disabled>Check IN</button>
      <button class="btn btn-out" id="btn-out" type="button" disabled>Check OUT</button>
    </div>

  </div>{{-- /.main-card --}}

</div>{{-- /.wrapper --}}

{{-- Toast notification --}}
<div class="toast" id="toast"></div>

{{-- FIX: defer lets the page render fully before JS runs — faster perceived load on mobile --}}
<script src="{{ asset('Files/welcome.js') }}?v={{ filemtime(public_path('Files/welcome.js')) }}" defer></script>

<script>
// INLINE OVERRIDE — runs after welcome.js, guaranteed to have EMPLOYEE_DATA
// Overrides fillEmployee with a direct lookup from window.EMPLOYEE_DATA
document.addEventListener("DOMContentLoaded", function() {
  // Wait briefly for welcome.js to finish initializing
  setTimeout(function() {
    // Override the select change handler directly
    var sel = document.getElementById("emp-id");
    if (!sel) return;

    function smartFill() {
      var id = sel.value;
      var nameEl  = document.getElementById("emp-name");
      var emailEl = document.getElementById("emp-email");
      if (!id) { nameEl.value = ""; emailEl.value = ""; return; }

      var data = window.EMPLOYEE_DATA || [];
      var emp  = data.find(function(e) { return String(e.emp_id).trim() === String(id).trim(); });
      if (emp) {
        nameEl.value  = emp.name  || "";
        emailEl.value = emp.email || "";
        console.log("✅ Inline fill:", emp.name);
      } else {
        console.warn("❌ No employee found for id:", id);
      }
    }

    sel.addEventListener("change", smartFill);
    sel.addEventListener("input",  smartFill);

    // Also fire immediately in case something is already selected
    if (sel.value) smartFill();
  }, 500);
});
</script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</body>
</html>