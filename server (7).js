<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bill Payment — Electricity Services · Government of Assam</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet" />

  <style>
    /* ═══════════════════════════════════════════════
       DESIGN TOKENS
    ═══════════════════════════════════════════════ */
    :root {
      --white:        #FFFFFF;
      --charcoal:     #1C231F;
      --forest:       #3B6939;
      --leaf:         #5CBA60;
      --amber:        #F5A623;
      --soft-gray:    #E2E8F0;
      --mid-gray:     #8A9BA8;
      --light-green:  #EBF5EC;

      --forest-dark:  #2a5028;
      --forest-deep:  #1e3a1c;
      --amber-light:  #FEF3DC;
      --card-border:  rgba(59,105,57,0.13);
      --red:          #dc2626;
      --red-light:    #fee2e2;
      --blue:         #1d4ed8;
      --blue-light:   #dbeafe;

      --shadow-sm:    0 1px 3px rgba(28,35,31,0.06), 0 3px 10px rgba(59,105,57,0.06);
      --shadow-md:    0 2px 8px rgba(28,35,31,0.07), 0 10px 28px rgba(59,105,57,0.10);
      --shadow-lg:    0 4px 14px rgba(28,35,31,0.09), 0 18px 44px rgba(59,105,57,0.14);

      --radius:       11px;
      --ease:         0.22s cubic-bezier(0.4,0,0.2,1);
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 16px; scroll-behavior: smooth; }
    body {
      font-family: 'DM Sans', system-ui, sans-serif;
      background: #f2f5f2;
      color: var(--charcoal);
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }
    a { color: var(--forest); text-decoration: none; }
    a:hover { color: var(--leaf); }

    /* ═══════════════════════════════════════════════
       NAVBAR
    ═══════════════════════════════════════════════ */
    .navbar {
      background: var(--white);
      border-bottom: 2.5px solid var(--forest);
      position: sticky; top: 0; z-index: 600;
      box-shadow: 0 2px 10px rgba(28,35,31,0.09);
    }
    .navbar-top {
      max-width: 1280px; margin: 0 auto;
      padding: 0 1.25rem; height: 54px;
      display: flex; align-items: center; gap: 1rem;
    }
    .nav-brand { display: flex; align-items: center; gap: 0.55rem; flex-shrink: 0; text-decoration: none; }
    .nav-brand-icon {
      width: 30px; height: 30px;
      background: linear-gradient(145deg, var(--forest), var(--forest-dark));
      border-radius: 7px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 7px rgba(59,105,57,0.35); flex-shrink: 0;
    }
    .nav-brand-icon svg { width: 17px; height: 17px; stroke: var(--white); fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .nav-brand-text { font-size: 0.9rem; font-weight: 600; color: var(--charcoal); letter-spacing: -0.01em; line-height: 1.2; white-space: nowrap; }
    .nav-brand-text small { display: block; font-size: 0.63rem; font-weight: 400; color: var(--mid-gray); letter-spacing: 0.02em; }

    .nav-hamburger {
      display: none; flex-shrink: 0; background: none;
      border: 1.5px solid var(--soft-gray); border-radius: 7px;
      width: 36px; height: 34px; cursor: pointer;
      align-items: center; justify-content: center;
      transition: border-color var(--ease), background var(--ease); margin-left: auto;
    }
    .nav-hamburger:hover { border-color: var(--forest); background: var(--light-green); }
    .nav-hamburger svg { width: 18px; height: 18px; stroke: var(--charcoal); fill: none; stroke-width: 2; stroke-linecap: round; }

    .navbar-links-wrap { background: var(--white); border-top: 1px solid var(--soft-gray); }
    .navbar-links {
      max-width: 1280px; margin: 0 auto; padding: 0 1.25rem;
      display: flex; align-items: center; gap: 0.1rem; height: 36px; list-style: none;
    }
    .navbar-links li a {
      display: block; font-size: 0.77rem; font-weight: 500; color: var(--mid-gray);
      padding: 0.28rem 0.68rem; border-radius: 6px; white-space: nowrap; position: relative;
      transition: background var(--ease), color var(--ease);
    }
    .navbar-links li a::after {
      content: ''; position: absolute; bottom: -1px; left: 50%; right: 50%;
      height: 2px; background: var(--forest); border-radius: 2px 2px 0 0;
      transition: left var(--ease), right var(--ease);
    }
    .navbar-links li a:hover { background: var(--light-green); color: var(--forest); }
    .navbar-links li a:hover::after { left: 10%; right: 10%; }
    .navbar-links li a.active { background: var(--light-green); color: var(--forest); font-weight: 600; }
    .navbar-links li a.active::after { left: 10%; right: 10%; }

    @media (max-width: 900px) {
      .navbar-links-wrap { display: none; }
      .nav-hamburger { display: flex; }
      .navbar-links-wrap.open { display: block; border-bottom: 2px solid var(--forest); box-shadow: 0 8px 24px rgba(28,35,31,0.12); animation: dropDown 0.2s ease-out; }
      .navbar-links.open { height: auto; flex-direction: column; align-items: stretch; padding: 0.5rem 1rem 0.7rem; gap: 2px; }
      .navbar-links.open li a { padding: 0.6rem 0.85rem; font-size: 0.86rem; border-radius: 8px; }
      .navbar-links.open li a::after { display: none; }
    }
    @keyframes dropDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

    /* ═══════════════════════════════════════════════
       HERO BAND
    ═══════════════════════════════════════════════ */
    .hero-band {
      background: linear-gradient(135deg, var(--charcoal) 0%, #253327 55%, var(--forest-deep) 100%);
      position: relative; overflow: hidden;
    }
    .hero-band::before {
      content: ''; position: absolute; inset: 0;
      background:
        radial-gradient(ellipse 65% 70% at 88% 50%, rgba(59,105,57,0.38) 0%, transparent 70%),
        repeating-linear-gradient(-45deg, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.02) 1px, transparent 0, transparent 36px);
    }
    .hero-band::after {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, var(--forest) 0%, var(--leaf) 45%, var(--amber) 100%);
    }
    .hero-inner {
      max-width: 1280px; margin: 0 auto; padding: 2.2rem 1.5rem;
      position: relative; z-index: 1;
      display: flex; align-items: center; justify-content: space-between; gap: 2rem; flex-wrap: wrap;
    }
    .hero-eyebrow {
      font-size: 0.67rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--leaf); opacity: 0.9; display: flex; align-items: center; gap: 0.45rem; margin-bottom: 0.42rem;
    }
    .hero-eyebrow::before { content: ''; width: 18px; height: 1.5px; background: var(--leaf); border-radius: 2px; }
    .hero-title { font-family: 'DM Serif Display', serif; font-size: 1.85rem; line-height: 1.2; color: var(--white); letter-spacing: -0.02em; margin-bottom: 0.4rem; }
    .hero-sub { font-size: 0.84rem; font-weight: 300; color: rgba(235,245,236,0.68); max-width: 420px; line-height: 1.6; }
    .hero-stats {
      display: flex; flex-shrink: 0;
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.10);
      border-radius: var(--radius); backdrop-filter: blur(6px); overflow: hidden;
    }
    .hero-stat { padding: 0.95rem 1.4rem; text-align: center; border-right: 1px solid rgba(255,255,255,0.09); }
    .hero-stat:last-child { border-right: none; }
    .hero-stat-num { font-family: 'DM Serif Display', serif; font-size: 1.55rem; color: var(--amber); line-height: 1; }
    .hero-stat-label { font-size: 0.63rem; font-weight: 500; color: rgba(235,245,236,0.58); letter-spacing: 0.07em; text-transform: uppercase; margin-top: 0.18rem; }
    @media (max-width: 720px) { .hero-stats { width: 100%; } .hero-stat { flex: 1; padding: 0.7rem 0.5rem; } }

    /* ═══════════════════════════════════════════════
       BREADCRUMB
    ═══════════════════════════════════════════════ */
    .breadcrumb-bar { background: var(--white); border-bottom: 1px solid var(--soft-gray); }
    .breadcrumb {
      max-width: 1280px; margin: 0 auto; padding: 0.55rem 1.5rem;
      display: flex; align-items: center; gap: 0.4rem; font-size: 0.73rem; color: var(--mid-gray);
    }
    .breadcrumb a { color: var(--forest); font-weight: 500; }
    .breadcrumb a:hover { color: var(--leaf); }
    .breadcrumb-sep { opacity: 0.4; }
    .breadcrumb-current { color: var(--charcoal); font-weight: 500; }

    /* ═══════════════════════════════════════════════
       MAIN
    ═══════════════════════════════════════════════ */
    .main { max-width: 1280px; margin: 0 auto; padding: 2.25rem 1.5rem 4rem; }

    .section-label { font-size: 0.64rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--forest); margin-bottom: 0.17rem; }
    .section-title { font-family: 'DM Serif Display', serif; font-size: 1.35rem; color: var(--charcoal); letter-spacing: -0.02em; }

    /* ═══════════════════════════════════════════════
       PAYMENT LAYOUT — 2 col
    ═══════════════════════════════════════════════ */
    .pay-layout {
      display: grid; grid-template-columns: 1fr 340px;
      gap: 1.4rem; align-items: start;
    }
    @media (max-width: 960px) { .pay-layout { grid-template-columns: 1fr; } }

    /* ── STEP PROGRESS BAR ── */
    .step-progress {
      background: var(--white); border: 1px solid var(--card-border);
      border-radius: var(--radius); padding: 1.3rem 1.5rem;
      box-shadow: var(--shadow-sm); margin-bottom: 1.2rem;
      animation: fadeSlideUp 0.35s ease-out both;
    }
    .step-track { display: flex; align-items: flex-start; position: relative; }
    .step-track::before {
      content: ''; position: absolute; top: 14px;
      left: calc(16.66% / 2 + 8px); right: calc(16.66% / 2 + 8px);
      height: 2px; background: var(--soft-gray); z-index: 0;
    }
    .step-track-fill {
      position: absolute; top: 14px; left: calc(16.66% / 2 + 8px);
      height: 2px; background: linear-gradient(90deg, var(--forest), var(--leaf));
      z-index: 1; transition: width 0.5s cubic-bezier(0.4,0,0.2,1); border-radius: 2px;
    }
    .step-item { flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; z-index: 2; }
    .step-dot {
      width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--soft-gray);
      background: var(--white); color: var(--mid-gray); font-size: 0.74rem; font-weight: 600;
      display: flex; align-items: center; justify-content: center; margin-bottom: 0.38rem;
      transition: all var(--ease);
    }
    .step-dot.done { background: var(--forest); border-color: var(--forest); color: var(--white); }
    .step-dot.active { background: var(--white); border-color: var(--forest); color: var(--forest); box-shadow: 0 0 0 4px rgba(59,105,57,0.12); }
    .step-name { font-size: 0.62rem; font-weight: 500; color: var(--mid-gray); white-space: nowrap; }
    .step-name.active { color: var(--forest); font-weight: 600; }
    .step-name.done { color: var(--forest); }

    /* ── MAIN CARD ── */
    .pay-card {
      background: var(--white); border: 1px solid var(--card-border);
      border-radius: var(--radius); box-shadow: var(--shadow-md); overflow: hidden;
      animation: fadeSlideUp 0.4s ease-out both; animation-delay: 0.05s;
    }
    .pay-card-header {
      padding: 1.2rem 1.5rem; border-bottom: 1px solid var(--soft-gray);
      display: flex; align-items: center; justify-content: space-between;
    }
    .pay-card-header-left { display: flex; align-items: center; gap: 0.7rem; }
    .pay-header-icon {
      width: 40px; height: 40px; background: var(--light-green);
      border: 1.5px solid rgba(92,186,96,0.25); border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
    }
    .pay-header-icon svg { width: 20px; height: 20px; stroke: var(--forest); fill: none; stroke-width: 1.7; stroke-linecap: round; }
    .pay-header-title { font-size: 1rem; font-weight: 600; color: var(--charcoal); }
    .pay-header-sub { font-size: 0.73rem; color: var(--mid-gray); margin-top: 0.06rem; }
    .secure-badge {
      display: inline-flex; align-items: center; gap: 0.28rem;
      background: var(--light-green); border: 1px solid rgba(92,186,96,0.3);
      border-radius: 6px; padding: 0.24rem 0.6rem;
      font-size: 0.67rem; font-weight: 600; color: var(--forest); letter-spacing: 0.04em;
    }
    .secure-badge svg { width: 11px; height: 11px; stroke: var(--forest); fill: none; stroke-width: 2; }

    .pay-body { padding: 1.5rem; }
    .pay-panel { display: none; animation: fadeSlideUp 0.3s ease-out; }
    .pay-panel.active { display: block; }

    /* ── FORM ── */
    .form-group { margin-bottom: 1rem; }
    .form-label { display: block; font-size: 0.78rem; font-weight: 600; color: var(--charcoal); margin-bottom: 0.38rem; }
    .form-label span { font-weight: 400; color: var(--mid-gray); font-size: 0.72rem; }
    .form-input {
      width: 100%; height: 42px; border: 1.5px solid var(--soft-gray); border-radius: 8px;
      padding: 0 0.9rem; font-family: 'DM Sans', sans-serif; font-size: 0.83rem;
      color: var(--charcoal); background: var(--white); outline: none;
      transition: border-color var(--ease), box-shadow var(--ease);
    }
    .form-input:focus { border-color: var(--forest); box-shadow: 0 0 0 3px rgba(59,105,57,0.10); }
    .form-input::placeholder { color: var(--mid-gray); }
    .form-input:read-only { background: #f6f8f6; color: var(--mid-gray); cursor: default; }
    .form-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238A9BA8' stroke-width='2' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.8rem center; padding-right: 2.2rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; }
    @media (max-width: 540px) { .form-row { grid-template-columns: 1fr; } }
    .form-hint { font-size: 0.69rem; color: var(--mid-gray); margin-top: 0.3rem; display: flex; align-items: center; gap: 0.28rem; }
    .form-hint svg { width: 11px; height: 11px; stroke: var(--mid-gray); fill: none; stroke-width: 2; stroke-linecap: round; flex-shrink: 0; }

    /* ── BILL SUMMARY BOX ── */
    .bill-summary {
      background: var(--light-green); border: 1px solid rgba(92,186,96,0.25);
      border-radius: 9px; padding: 1.1rem 1.25rem; margin-bottom: 1.2rem;
      animation: fadeSlideUp 0.35s ease-out;
    }
    .bill-summary-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.8rem; flex-wrap: wrap; gap: 0.5rem; }
    .bill-consumer-name { font-size: 0.92rem; font-weight: 600; color: var(--charcoal); }
    .bill-consumer-id { font-size: 0.72rem; color: var(--forest); margin-top: 0.05rem; }
    .due-badge {
      display: inline-flex; align-items: center; gap: 0.3rem;
      background: var(--red-light); color: var(--red);
      font-size: 0.62rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
      padding: 0.22rem 0.5rem; border-radius: 5px;
    }
    .due-badge svg { width: 10px; height: 10px; stroke: currentColor; fill: none; stroke-width: 2.2; }
    .bill-rows { border-top: 1px solid rgba(92,186,96,0.2); padding-top: 0.8rem; }
    .bill-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; margin-bottom: 0.45rem; }
    .bill-row:last-child { margin-bottom: 0; }
    .bill-row-label { color: var(--mid-gray); }
    .bill-row-value { font-weight: 500; color: var(--charcoal); }
    .bill-row-value.green { color: var(--forest); }
    .bill-row-value.red { color: var(--red); }
    .bill-row.total { border-top: 1px dashed rgba(59,105,57,0.22); padding-top: 0.55rem; margin-top: 0.35rem; }
    .bill-row.total .bill-row-label { font-weight: 600; color: var(--charcoal); font-size: 0.84rem; }
    .bill-row.total .bill-row-value { font-family: 'DM Serif Display', serif; font-size: 1.3rem; color: var(--forest); }

    /* ── PARTIAL PAYMENT ── */
    .partial-toggle {
      display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1rem;
      padding: 0.7rem 0.9rem; background: #f6f8f6; border-radius: 8px;
      border: 1.5px solid var(--soft-gray); cursor: pointer;
      transition: border-color var(--ease), background var(--ease);
    }
    .partial-toggle:hover { border-color: var(--forest); background: var(--light-green); }
    .partial-toggle input[type="checkbox"] { accent-color: var(--forest); width: 15px; height: 15px; cursor: pointer; }
    .partial-toggle label { font-size: 0.78rem; font-weight: 500; color: var(--charcoal); cursor: pointer; }
    .partial-toggle span { font-size: 0.72rem; color: var(--mid-gray); margin-left: auto; }

    /* ── PAYMENT METHOD CARDS ── */
    .pay-methods { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem; margin-bottom: 1.2rem; }
    @media (max-width: 480px) { .pay-methods { grid-template-columns: 1fr; } }
    .method-card {
      border: 2px solid var(--soft-gray); border-radius: var(--radius);
      padding: 0.9rem 1rem; cursor: pointer; text-align: center; position: relative;
      transition: all var(--ease); background: var(--white);
    }
    .method-card:hover { border-color: var(--forest); background: var(--light-green); }
    .method-card.selected { border-color: var(--forest); background: var(--light-green); }
    .method-card.selected::after {
      content: '✓'; position: absolute; top: 0.5rem; right: 0.6rem;
      width: 18px; height: 18px; background: var(--forest); border-radius: 50%;
      color: var(--white); font-size: 0.65rem; display: flex; align-items: center;
      justify-content: center; font-weight: 700; line-height: 18px;
    }
    .method-icon { font-size: 1.6rem; margin-bottom: 0.35rem; display: block; }
    .method-name { font-size: 0.8rem; font-weight: 600; color: var(--charcoal); }
    .method-sub { font-size: 0.67rem; color: var(--mid-gray); margin-top: 0.12rem; }
    .method-tag {
      display: inline-block; margin-top: 0.35rem;
      background: var(--amber-light); color: #92400e;
      font-size: 0.57rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
      padding: 0.1rem 0.35rem; border-radius: 4px;
    }
    .method-tag.green { background: var(--light-green); color: var(--forest); }

    /* ── UPI INPUT AREA ── */
    .upi-area { margin-bottom: 1.2rem; }
    .upi-apps { display: flex; gap: 0.55rem; margin-top: 0.6rem; flex-wrap: wrap; }
    .upi-app-btn {
      display: flex; align-items: center; gap: 0.4rem;
      border: 1.5px solid var(--soft-gray); border-radius: 7px;
      padding: 0.4rem 0.75rem; font-family: 'DM Sans', sans-serif;
      font-size: 0.75rem; font-weight: 500; cursor: pointer; background: var(--white);
      color: var(--charcoal); transition: all var(--ease);
    }
    .upi-app-btn:hover { border-color: var(--forest); background: var(--light-green); color: var(--forest); }
    .upi-app-btn.selected { background: var(--forest); border-color: var(--forest); color: var(--white); }
    .upi-app-emoji { font-size: 1rem; }
    .upi-or { display: flex; align-items: center; gap: 0.7rem; margin: 0.85rem 0; color: var(--mid-gray); font-size: 0.72rem; }
    .upi-or::before, .upi-or::after { content: ''; flex: 1; height: 1px; background: var(--soft-gray); }

    /* ── CARD FORM ── */
    .card-form { margin-bottom: 1rem; }
    .card-number-wrap { position: relative; }
    .card-number-wrap .form-input { padding-right: 5rem; }
    .card-type-icons { position: absolute; right: 0.8rem; top: 50%; transform: translateY(-50%); display: flex; gap: 0.3rem; align-items: center; }
    .card-type-pill { font-size: 0.58rem; font-weight: 700; padding: 0.12rem 0.35rem; border-radius: 3px; letter-spacing: 0.04em; }
    .pill-visa { background: #1a1f71; color: white; }
    .pill-mc { background: #eb001b; color: white; }

    /* ── NETBANKING ── */
    .bank-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.55rem; margin-bottom: 1rem; }
    @media (max-width: 480px) { .bank-grid { grid-template-columns: repeat(2, 1fr); } }
    .bank-tile {
      border: 1.5px solid var(--soft-gray); border-radius: 8px; padding: 0.7rem 0.5rem;
      text-align: center; cursor: pointer; font-size: 0.7rem; font-weight: 500;
      color: var(--charcoal); background: var(--white); transition: all var(--ease);
    }
    .bank-tile:hover { border-color: var(--forest); background: var(--light-green); color: var(--forest); }
    .bank-tile.selected { border-color: var(--forest); background: var(--light-green); color: var(--forest); font-weight: 600; }
    .bank-emoji { display: block; font-size: 1.2rem; margin-bottom: 0.3rem; }

    /* ── CONFIRM TABLE ── */
    .confirm-table { width: 100%; border-collapse: collapse; margin-bottom: 1.1rem; }
    .confirm-table tr td { padding: 0.6rem 0; font-size: 0.81rem; border-bottom: 1px solid var(--soft-gray); }
    .confirm-table tr:last-child td { border-bottom: none; }
    .confirm-table td:first-child { color: var(--mid-gray); width: 42%; }
    .confirm-table td:last-child { color: var(--charcoal); font-weight: 500; text-align: right; }
    .confirm-highlight {
      background: var(--light-green); border: 1px solid rgba(92,186,96,0.25);
      border-radius: 9px; padding: 0.9rem 1.1rem; margin-bottom: 1.1rem;
      display: flex; align-items: center; gap: 0.75rem;
    }
    .confirm-icon { width: 36px; height: 36px; background: var(--forest); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .confirm-icon svg { width: 18px; height: 18px; stroke: var(--white); fill: none; stroke-width: 2; stroke-linecap: round; }
    .confirm-hl-title { font-size: 0.83rem; font-weight: 600; color: var(--charcoal); }
    .confirm-hl-sub { font-size: 0.72rem; color: var(--forest); margin-top: 0.1rem; }
    .terms-row { display: flex; align-items: flex-start; gap: 0.55rem; margin-bottom: 1.1rem; }
    .terms-cb { accent-color: var(--forest); width: 15px; height: 15px; cursor: pointer; flex-shrink: 0; margin-top: 2px; }
    .terms-text { font-size: 0.73rem; color: var(--mid-gray); line-height: 1.5; }
    .terms-text a { color: var(--forest); font-weight: 600; }

    /* ── SUCCESS PANEL ── */
    .success-panel { text-align: center; padding: 1.5rem 1rem 1rem; }
    .success-anim {
      width: 72px; height: 72px; border-radius: 50%; background: var(--forest);
      display: flex; align-items: center; justify-content: center; margin: 0 auto 1.1rem;
      box-shadow: 0 0 0 10px rgba(92,186,96,0.15), 0 0 0 20px rgba(92,186,96,0.06);
      animation: successPop 0.5s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes successPop { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .success-anim svg { width: 34px; height: 34px; stroke: var(--white); fill: none; stroke-width: 2.5; stroke-linecap: round; }
    .success-title { font-family: 'DM Serif Display', serif; font-size: 1.45rem; color: var(--charcoal); margin-bottom: 0.35rem; }
    .success-sub { font-size: 0.81rem; color: var(--mid-gray); max-width: 320px; margin: 0 auto 1.3rem; line-height: 1.55; }
    .txn-ref {
      background: var(--light-green); border: 1px solid rgba(92,186,96,0.3);
      border-radius: 9px; padding: 0.85rem 1.3rem; display: inline-flex;
      flex-direction: column; align-items: center; margin-bottom: 1.3rem;
    }
    .txn-ref-label { font-size: 0.62rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--forest); margin-bottom: 0.2rem; }
    .txn-ref-num { font-family: 'DM Serif Display', serif; font-size: 1.35rem; color: var(--charcoal); letter-spacing: 0.04em; }
    .txn-meta { font-size: 0.71rem; color: var(--mid-gray); margin-top: 0.25rem; }
    .success-actions { display: flex; gap: 0.7rem; justify-content: center; flex-wrap: wrap; }

    /* ── CARD FOOTER ── */
    .pay-card-footer {
      padding: 1.1rem 1.5rem; background: #fafcfa; border-top: 1px solid var(--soft-gray);
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
    }

    /* ── BUTTONS ── */
    .btn {
      display: inline-flex; align-items: center; gap: 0.4rem;
      height: 40px; padding: 0 1.1rem; border-radius: 8px;
      font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 600;
      cursor: pointer; transition: all var(--ease); border: none; text-decoration: none;
    }
    .btn-primary { background: var(--forest); color: var(--white); }
    .btn-primary:hover { background: var(--forest-dark); color: var(--white); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59,105,57,0.3); }
    .btn-outline { background: var(--white); color: var(--forest); border: 1.5px solid var(--soft-gray); }
    .btn-outline:hover { border-color: var(--forest); background: var(--light-green); }
    .btn-ghost { background: none; color: var(--mid-gray); border: 1.5px solid var(--soft-gray); }
    .btn-ghost:hover { color: var(--charcoal); border-color: var(--charcoal); }
    .btn-lg { height: 44px; padding: 0 1.4rem; font-size: 0.87rem; border-radius: 9px; }
    .btn svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }

    /* ═══════════════════════════════════════════════
       SIDEBAR
    ═══════════════════════════════════════════════ */
    .sidebar { display: flex; flex-direction: column; gap: 1rem; }

    .side-card {
      background: var(--white); border: 1px solid var(--card-border);
      border-radius: var(--radius); box-shadow: var(--shadow-sm); overflow: hidden;
      animation: fadeSlideUp 0.45s ease-out both; animation-delay: 0.12s;
    }
    .side-head {
      padding: 0.82rem 1.1rem; border-bottom: 1px solid var(--soft-gray);
      display: flex; align-items: center; justify-content: space-between;
    }
    .side-head-title { font-size: 0.84rem; font-weight: 600; color: var(--charcoal); display: flex; align-items: center; gap: 0.45rem; }
    .side-head-title svg { width: 14px; height: 14px; stroke: var(--forest); fill: none; stroke-width: 2; stroke-linecap: round; }
    .side-head a { font-size: 0.72rem; color: var(--forest); font-weight: 500; }
    .side-head a:hover { color: var(--leaf); }

    /* Bill Summary Sidebar card */
    .bill-detail-row { padding: 0.7rem 1.1rem; border-bottom: 1px solid var(--soft-gray); display: flex; justify-content: space-between; font-size: 0.78rem; }
    .bill-detail-row:last-child { border-bottom: none; }
    .bill-detail-row .lbl { color: var(--mid-gray); }
    .bill-detail-row .val { font-weight: 500; color: var(--charcoal); text-align: right; }
    .bill-detail-row .val.green { color: var(--forest); }
    .bill-detail-row .val.red { color: var(--red); font-weight: 600; }
    .bill-due-total { padding: 0.9rem 1.1rem; background: var(--forest); display: flex; justify-content: space-between; align-items: center; }
    .bill-due-total .lbl { font-size: 0.78rem; color: rgba(255,255,255,0.7); font-weight: 500; }
    .bill-due-total .val { font-family: 'DM Serif Display', serif; font-size: 1.5rem; color: var(--amber); }

    /* History rows */
    .hist-row { padding: 0.72rem 1.1rem; border-bottom: 1px solid var(--soft-gray); cursor: pointer; transition: background var(--ease); }
    .hist-row:last-child { border-bottom: none; }
    .hist-row:hover { background: var(--light-green); }
    .hist-row-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.18rem; }
    .hist-month { font-size: 0.78rem; font-weight: 600; color: var(--charcoal); }
    .hist-amount { font-size: 0.81rem; font-weight: 600; color: var(--charcoal); }
    .hist-meta { font-size: 0.68rem; color: var(--mid-gray); }
    .hist-status { font-size: 0.59rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 0.13rem 0.38rem; border-radius: 4px; }
    .sp-paid { background: var(--light-green); color: var(--forest); }
    .sp-due { background: var(--red-light); color: var(--red); }

    /* Info tips */
    .info-item { display: flex; align-items: flex-start; gap: 0.65rem; padding: 0.72rem 1.1rem; border-bottom: 1px solid var(--soft-gray); font-size: 0.75rem; }
    .info-item:last-child { border-bottom: none; }
    .info-bullet { width: 26px; height: 26px; border-radius: 6px; background: var(--light-green); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .info-bullet svg { width: 13px; height: 13px; stroke: var(--forest); fill: none; stroke-width: 2; stroke-linecap: round; }
    .info-text { color: var(--mid-gray); line-height: 1.5; }
    .info-text strong { color: var(--charcoal); display: block; margin-bottom: 0.1rem; font-size: 0.77rem; }

    /* ═══════════════════════════════════════════════
       FOOTER
    ═══════════════════════════════════════════════ */
    .page-footer {
      background: var(--charcoal); color: rgba(255,255,255,0.38);
      padding: 0.88rem 1.5rem; font-size: 0.71rem;
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;
    }
    .page-footer a { color: rgba(255,255,255,0.38); }
    .page-footer a:hover { color: var(--leaf); }
    .footer-links { display: flex; gap: 1.2rem; flex-wrap: wrap; }
    .footer-status { display: flex; align-items: center; gap: 0.38rem; }
    .status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--leaf); box-shadow: 0 0 5px var(--leaf); }

    /* ── Alert band ── */
    .alert-band {
      display: flex; align-items: center; gap: 0.75rem;
      background: var(--amber-light); border: 1px solid rgba(245,166,35,0.3);
      border-radius: 9px; padding: 0.8rem 1rem; margin-bottom: 1.2rem;
    }
    .alert-band svg { width: 16px; height: 16px; stroke: #92400e; fill: none; stroke-width: 2; stroke-linecap: round; flex-shrink: 0; }
    .alert-band-text { font-size: 0.77rem; color: #92400e; }
    .alert-band-text strong { font-weight: 600; }
  </style>
</head>
<body>

<!-- ══════════════════════════════════════════
     NAVBAR
══════════════════════════════════════════ -->
<nav class="navbar" id="mainNav">
  <div class="navbar-top">
    <a href="#" class="nav-brand">
      <div class="nav-brand-icon">
        <svg viewBox="0 0 24 24"><polyline points="13 2 13 9 20 9 11 22 11 15 4 15 13 2"/></svg>
      </div>
      <div class="nav-brand-text">
        Electricity Services
        <small>Government of Assam · APDCL</small>
      </div>
    </a>
    <button class="nav-hamburger" id="navToggle" aria-label="Toggle navigation" aria-expanded="false">
      <svg id="hamburgerSvg" viewBox="0 0 24 24">
        <line x1="3" y1="6"  x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
  </div>
  <div class="navbar-links-wrap" id="navLinksWrap">
    <ul class="navbar-links" id="navLinks">
      <li><a href="#">Services</a></li>
      <li><a href="#" class="active">Bill Payment</a></li>
      <li><a href="#">My Account</a></li>
      <li><a href="#">Complaints</a></li>
      <li><a href="#">Notices</a></li>
      <li><a href="#">New Connection</a></li>
      <li><a href="#">Contact Us</a></li>
    </ul>
  </div>
</nav>

<!-- ══════════════════════════════════════════
     HERO
══════════════════════════════════════════ -->
<div class="hero-band">
  <div class="hero-inner">
    <div>
      <div class="hero-eyebrow">Digital Assam · APDCL</div>
      <div class="hero-title">Bill Payment Portal</div>
      <div class="hero-sub">Pay your electricity bill securely via UPI, Net Banking, Debit/Credit Card, or Cash on Counter. Instant receipt on every successful payment.</div>
    </div>
    <div class="hero-stats">
      <div class="hero-stat">
        <div class="hero-stat-num">₹0</div>
        <div class="hero-stat-label">Conv. Fee</div>
      </div>
      <div class="hero-stat">
        <div class="hero-stat-num">&lt;30s</div>
        <div class="hero-stat-label">Instant Receipt</div>
      </div>
      <div class="hero-stat">
        <div class="hero-stat-num">256-bit</div>
        <div class="hero-stat-label">SSL Encrypted</div>
      </div>
    </div>
  </div>
</div>

<!-- BREADCRUMB -->
<div class="breadcrumb-bar">
  <div class="breadcrumb">
    <a href="#">Home</a>
    <span class="breadcrumb-sep">›</span>
    <a href="#">Services</a>
    <span class="breadcrumb-sep">›</span>
    <span class="breadcrumb-current">Bill Payment</span>
  </div>
</div>

<!-- ══════════════════════════════════════════
     MAIN
══════════════════════════════════════════ -->
<main class="main">

  <!-- DUE DATE ALERT -->
  <div class="alert-band">
    <svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    <div class="alert-band-text"><strong>Payment Due Reminder:</strong> Your current bill of ₹2,318.00 is due on <strong>15 Mar 2026</strong>. Late payment attracts 2% surcharge per month.</div>
  </div>

  <!-- STEP PROGRESS -->
  <div class="step-progress">
    <div class="step-track" id="stepTrack">
      <div class="step-track-fill" id="trackFill" style="width:0%"></div>
      <div class="step-item">
        <div class="step-dot active" id="dot1">1</div>
        <div class="step-name active" id="name1">Consumer</div>
      </div>
      <div class="step-item">
        <div class="step-dot" id="dot2">2</div>
        <div class="step-name" id="name2">Bill Review</div>
      </div>
      <div class="step-item">
        <div class="step-dot" id="dot3">3</div>
        <div class="step-name" id="name3">Payment</div>
      </div>
      <div class="step-item">
        <div class="step-dot" id="dot4">4</div>
        <div class="step-name" id="name4">Confirm</div>
      </div>
    </div>
  </div>

  <!-- 2-COL LAYOUT -->
  <div class="pay-layout">

    <!-- LEFT — WIZARD -->
    <div>
      <div class="pay-card">

        <!-- Card Header -->
        <div class="pay-card-header">
          <div class="pay-card-header-left">
            <div class="pay-header-icon">
              <svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h2M10 15h4"/></svg>
            </div>
            <div>
              <div class="pay-header-title">Online Bill Payment</div>
              <div class="pay-header-sub">Complete 4 steps to pay your electricity bill</div>
            </div>
          </div>
          <div class="secure-badge">
            <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            PCI DSS Secured
          </div>
        </div>

        <div class="pay-body">

          <!-- ── PANEL 1: CONSUMER LOOKUP ── -->
          <div class="pay-panel active" id="panel1">
            <div class="section-label" style="margin-bottom:0.7rem">Step 1 of 4</div>
            <div class="section-title" style="margin-bottom:1.2rem">Consumer Verification</div>

            <div class="form-group">
              <label class="form-label">Consumer ID <span>(printed on your bill)</span></label>
              <input class="form-input" type="text" id="consumerIdInput" value="AS-2400-8271" placeholder="e.g. AS-2400-XXXX" />
              <div class="form-hint">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                Find your Consumer ID in the top-right corner of your electricity bill
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Registered Mobile <span>(for OTP)</span></label>
                <input class="form-input" type="tel" placeholder="+91 98XXXXXXXX" value="+91 98XX-XXXX-XX" />
              </div>
              <div class="form-group">
                <label class="form-label">Division / Circle</label>
                <select class="form-input form-select">
                  <option>Guwahati Urban</option>
                  <option>Guwahati Rural</option>
                  <option>Dispur</option>
                  <option>Jorhat</option>
                  <option>Dibrugarh</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Bill Month <span>(for verification)</span></label>
              <select class="form-input form-select">
                <option>February 2026 (Current)</option>
                <option>January 2026</option>
                <option>December 2025</option>
              </select>
            </div>
          </div>

          <!-- ── PANEL 2: BILL REVIEW ── -->
          <div class="pay-panel" id="panel2">
            <div class="section-label" style="margin-bottom:0.7rem">Step 2 of 4</div>
            <div class="section-title" style="margin-bottom:1.1rem">Bill Review</div>

            <div class="bill-summary">
              <div class="bill-summary-top">
                <div>
                  <div class="bill-consumer-name">Rajib Kumar Deka</div>
                  <div class="bill-consumer-id">Consumer ID: AS-2400-8271 · Meter: GHY-SM-00481</div>
                </div>
                <div class="due-badge">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Due 15 Mar
                </div>
              </div>
              <div class="bill-rows">
                <div class="bill-row"><span class="bill-row-label">Billing Period</span><span class="bill-row-value">1 Feb – 28 Feb 2026</span></div>
                <div class="bill-row"><span class="bill-row-label">Units Consumed</span><span class="bill-row-value">284 kWh</span></div>
                <div class="bill-row"><span class="bill-row-label">Energy Charges</span><span class="bill-row-value">₹1,926.00</span></div>
                <div class="bill-row"><span class="bill-row-label">Fixed / Demand Charge</span><span class="bill-row-value">₹250.00</span></div>
                <div class="bill-row"><span class="bill-row-label">Electricity Duty (5%)</span><span class="bill-row-value">₹96.30</span></div>
                <div class="bill-row"><span class="bill-row-label">Arrears</span><span class="bill-row-value red">₹0.00</span></div>
                <div class="bill-row"><span class="bill-row-label">Govt. Subsidy Adjustment</span><span class="bill-row-value green">– ₹0.00</span></div>
                <div class="bill-row total">
                  <span class="bill-row-label">Total Payable</span>
                  <span class="bill-row-value">₹2,318.00</span>
                </div>
              </div>
            </div>

            <div class="partial-toggle" id="partialToggle">
              <input type="checkbox" id="partialCb" />
              <label for="partialCb">Pay a partial / custom amount instead</label>
              <span>Optional</span>
            </div>

            <div id="partialInput" style="display:none">
              <div class="form-group">
                <label class="form-label">Custom Amount <span>(minimum ₹100)</span></label>
                <input class="form-input" type="number" placeholder="Enter amount in ₹" min="100" max="2318" />
                <div class="form-hint">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  Remaining balance will be carried forward as arrears in the next bill
                </div>
              </div>
            </div>
          </div>

          <!-- ── PANEL 3: PAYMENT METHOD ── -->
          <div class="pay-panel" id="panel3">
            <div class="section-label" style="margin-bottom:0.7rem">Step 3 of 4</div>
            <div class="section-title" style="margin-bottom:1.1rem">Choose Payment Method</div>

            <div class="pay-methods">
              <div class="method-card selected" id="mUpi" onclick="selectMethod('upi')">
                <span class="method-icon">📱</span>
                <div class="method-name">UPI</div>
                <div class="method-sub">GPay, PhonePe, BHIM, Paytm</div>
                <span class="method-tag green">⚡ Instant</span>
              </div>
              <div class="method-card" id="mCard" onclick="selectMethod('card')">
                <span class="method-icon">💳</span>
                <div class="method-name">Debit / Credit Card</div>
                <div class="method-sub">Visa, Mastercard, RuPay</div>
                <span class="method-tag">Secure</span>
              </div>
              <div class="method-card" id="mNet" onclick="selectMethod('net')">
                <span class="method-icon">🏦</span>
                <div class="method-name">Net Banking</div>
                <div class="method-sub">All major Indian banks</div>
                <span class="method-tag">Verified</span>
              </div>
              <div class="method-card" id="mCash" onclick="selectMethod('cash')">
                <span class="method-icon">🏪</span>
                <div class="method-name">Cash Counter</div>
                <div class="method-sub">APDCL offices & CSCs</div>
                <span class="method-tag">In Person</span>
              </div>
            </div>

            <!-- UPI section -->
            <div id="secUpi">
              <div class="upi-area">
                <label class="form-label">Select UPI App</label>
                <div class="upi-apps">
                  <button class="upi-app-btn selected" id="btnGpay" onclick="selectUpiApp(this)"><span class="upi-app-emoji">🔵</span>GPay</button>
                  <button class="upi-app-btn" id="btnPhonePe" onclick="selectUpiApp(this)"><span class="upi-app-emoji">🟣</span>PhonePe</button>
                  <button class="upi-app-btn" id="btnBhim" onclick="selectUpiApp(this)"><span class="upi-app-emoji">🟢</span>BHIM</button>
                  <button class="upi-app-btn" id="btnPaytm" onclick="selectUpiApp(this)"><span class="upi-app-emoji">🔵</span>Paytm</button>
                </div>
              </div>
              <div class="upi-or">or enter UPI ID manually</div>
              <div class="form-group">
                <label class="form-label">UPI ID <span>(e.g. yourname@upi)</span></label>
                <input class="form-input" type="text" placeholder="yourname@okicici / @ybl / @upi" />
              </div>
            </div>

            <!-- Card section -->
            <div id="secCard" style="display:none">
              <div class="card-form">
                <div class="form-group">
                  <label class="form-label">Card Number</label>
                  <div class="card-number-wrap">
                    <input class="form-input" type="text" placeholder="XXXX  XXXX  XXXX  XXXX" maxlength="19" />
                    <div class="card-type-icons">
                      <span class="card-type-pill pill-visa">VISA</span>
                      <span class="card-type-pill pill-mc">MC</span>
                    </div>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Expiry Date</label>
                    <input class="form-input" type="text" placeholder="MM / YY" maxlength="7" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">CVV</label>
                    <input class="form-input" type="password" placeholder="•••" maxlength="4" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Cardholder Name</label>
                  <input class="form-input" type="text" placeholder="Name as on card" />
                </div>
              </div>
            </div>

            <!-- Net Banking section -->
            <div id="secNet" style="display:none">
              <label class="form-label" style="margin-bottom:0.65rem">Select Your Bank</label>
              <div class="bank-grid">
                <div class="bank-tile selected" onclick="selectBank(this)"><span class="bank-emoji">🏦</span>SBI</div>
                <div class="bank-tile" onclick="selectBank(this)"><span class="bank-emoji">🏛️</span>HDFC</div>
                <div class="bank-tile" onclick="selectBank(this)"><span class="bank-emoji">🏦</span>ICICI</div>
                <div class="bank-tile" onclick="selectBank(this)"><span class="bank-emoji">🏛️</span>Axis</div>
                <div class="bank-tile" onclick="selectBank(this)"><span class="bank-emoji">🏦</span>PNB</div>
                <div class="bank-tile" onclick="selectBank(this)"><span class="bank-emoji">🏛️</span>BOB</div>
                <div class="bank-tile" onclick="selectBank(this)"><span class="bank-emoji">🏦</span>Canara</div>
                <div class="bank-tile" onclick="selectBank(this)"><span class="bank-emoji">🏛️</span>UCO</div>
              </div>
              <div class="form-hint" style="margin-top:0.5rem">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                You will be redirected to your bank's secure login page
              </div>
            </div>

            <!-- Cash Counter section -->
            <div id="secCash" style="display:none">
              <div class="confirm-highlight">
                <div class="confirm-icon">
                  <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div>
                  <div class="confirm-hl-title">Nearest APDCL Cash Counters</div>
                  <div class="confirm-hl-sub">3 counters within 5 km of your registered address</div>
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:0.6rem">
                <div style="border:1.5px solid var(--soft-gray);border-radius:9px;padding:0.85rem 1rem;font-size:0.8rem;">
                  <div style="font-weight:600;color:var(--charcoal);margin-bottom:0.2rem">APDCL Sub-Division Office, Paltan Bazar</div>
                  <div style="color:var(--mid-gray);font-size:0.72rem;">Mon–Sat 9:00 AM – 5:00 PM · 1.2 km away</div>
                  <div style="color:var(--forest);font-size:0.72rem;font-weight:500;margin-top:0.3rem;">Accepts: Cash, Cheque, DD</div>
                </div>
                <div style="border:1.5px solid var(--soft-gray);border-radius:9px;padding:0.85rem 1rem;font-size:0.8rem;">
                  <div style="font-weight:600;color:var(--charcoal);margin-bottom:0.2rem">Common Service Centre (CSC), Dispur</div>
                  <div style="color:var(--mid-gray);font-size:0.72rem;">Mon–Sat 9:00 AM – 6:00 PM · 2.7 km away</div>
                  <div style="color:var(--forest);font-size:0.72rem;font-weight:500;margin-top:0.3rem;">Accepts: Cash, UPI at counter</div>
                </div>
              </div>
            </div>

          </div>

          <!-- ── PANEL 4: CONFIRM ── -->
          <div class="pay-panel" id="panel4">
            <div class="section-label" style="margin-bottom:0.7rem">Step 4 of 4</div>
            <div class="section-title" style="margin-bottom:1.1rem">Review & Confirm Payment</div>

            <div class="confirm-highlight">
              <div class="confirm-icon">
                <svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h2M10 15h4"/></svg>
              </div>
              <div>
                <div class="confirm-hl-title">Payment Summary</div>
                <div class="confirm-hl-sub">UPI via GPay · Consumer: AS-2400-8271</div>
              </div>
            </div>

            <table class="confirm-table">
              <tr><td>Consumer Name</td><td>Rajib Kumar Deka</td></tr>
              <tr><td>Consumer ID</td><td>AS-2400-8271</td></tr>
              <tr><td>Billing Period</td><td>Feb 2026</td></tr>
              <tr><td>Units Consumed</td><td>284 kWh</td></tr>
              <tr><td>Payment Method</td><td>UPI — GPay</td></tr>
              <tr><td>Convenience Fee</td><td style="color:var(--forest)">₹0.00 (Waived)</td></tr>
              <tr><td><strong>Total Amount</strong></td><td><strong style="font-size:1.05rem">₹2,318.00</strong></td></tr>
            </table>

            <div class="terms-row">
              <input type="checkbox" class="terms-cb" id="termsCb" checked />
              <label class="terms-text" for="termsCb">
                I confirm that the above details are correct and authorise APDCL to debit ₹2,318.00 from my payment account. I have read the <a href="#">Terms of Service</a> and <a href="#">Refund Policy</a>.
              </label>
            </div>
          </div>

          <!-- ── PANEL 5: SUCCESS ── -->
          <div class="pay-panel" id="panel5">
            <div class="success-panel">
              <div class="success-anim">
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div class="success-title">Payment Successful!</div>
              <div class="success-sub">Your electricity bill of ₹2,318.00 has been paid. Receipt has been sent to your registered mobile and email.</div>
              <div class="txn-ref">
                <div class="txn-ref-label">Transaction Reference</div>
                <div class="txn-ref-num">APDCL-TXN-26-48291</div>
                <div class="txn-meta">28 Feb 2026, 11:42 AM · UPI / GPay</div>
              </div>
              <div class="success-actions">
                <a href="#" class="btn btn-primary btn-lg">
                  <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download Receipt
                </a>
                <a href="#" class="btn btn-outline btn-lg">
                  <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  View Usage
                </a>
                <a href="#" class="btn btn-ghost btn-lg" onclick="resetWizard();return false;">Pay Another</a>
              </div>
            </div>
          </div>

        </div><!-- /pay-body -->

        <!-- Card Footer (hidden on success) -->
        <div class="pay-card-footer" id="cardFooter">
          <button class="btn btn-ghost" id="prevBtn" onclick="prevStep()" style="display:none">
            <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg> Back
          </button>
          <div style="flex:1"></div>
          <button class="btn btn-primary btn-lg" id="nextBtn" onclick="nextStep()">
            Continue <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>

      </div><!-- /pay-card -->
    </div><!-- /left col -->

    <!-- ══ SIDEBAR ══ -->
    <aside class="sidebar">

      <!-- Current Bill Card -->
      <div class="side-card">
        <div class="side-head">
          <div class="side-head-title">
            <svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
            Current Bill
          </div>
        </div>
        <div class="bill-detail-row"><span class="lbl">Consumer</span><span class="val">Rajib Kumar Deka</span></div>
        <div class="bill-detail-row"><span class="lbl">Period</span><span class="val">Feb 2026</span></div>
        <div class="bill-detail-row"><span class="lbl">Units</span><span class="val">284 kWh</span></div>
        <div class="bill-detail-row"><span class="lbl">Tariff Slab</span><span class="val">₹7.25 / unit</span></div>
        <div class="bill-detail-row"><span class="lbl">Due Date</span><span class="val red">15 Mar 2026</span></div>
        <div class="bill-detail-row"><span class="lbl">Arrears</span><span class="val green">₹0.00 (Clear)</span></div>
        <div class="bill-due-total">
          <span class="lbl">Total Payable</span>
          <span class="val">₹2,318</span>
        </div>
      </div>

      <!-- Payment History -->
      <div class="side-card">
        <div class="side-head">
          <div class="side-head-title">
            <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Payment History
          </div>
          <a href="#">View All →</a>
        </div>
        <div class="hist-row">
          <div class="hist-row-top"><span class="hist-month">Jan 2026</span><span class="hist-amount">₹2,124</span></div>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span class="hist-meta">Paid 12 Feb · UPI</span>
            <span class="hist-status sp-paid">Paid</span>
          </div>
        </div>
        <div class="hist-row">
          <div class="hist-row-top"><span class="hist-month">Dec 2025</span><span class="hist-amount">₹2,480</span></div>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span class="hist-meta">Paid 10 Jan · Net Banking</span>
            <span class="hist-status sp-paid">Paid</span>
          </div>
        </div>
        <div class="hist-row">
          <div class="hist-row-top"><span class="hist-month">Nov 2025</span><span class="hist-amount">₹1,764</span></div>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span class="hist-meta">Paid 8 Dec · Debit Card</span>
            <span class="hist-status sp-paid">Paid</span>
          </div>
        </div>
        <div class="hist-row">
          <div class="hist-row-top"><span class="hist-month">Oct 2025</span><span class="hist-amount">₹1,628</span></div>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span class="hist-meta">Paid 9 Nov · UPI</span>
            <span class="hist-status sp-paid">Paid</span>
          </div>
        </div>
      </div>

      <!-- Payment Tips -->
      <div class="side-card">
        <div class="side-head">
          <div class="side-head-title">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            Payment Tips
          </div>
        </div>
        <div class="info-item">
          <div class="info-bullet"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
          <div class="info-text"><strong>Zero Convenience Fee</strong>All online payment methods are completely free — no extra charges.</div>
        </div>
        <div class="info-item">
          <div class="info-bullet"><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
          <div class="info-text"><strong>Instant Confirmation</strong>Payment reflects within 30 seconds. Receipt sent via SMS & WhatsApp.</div>
        </div>
        <div class="info-item">
          <div class="info-bullet"><svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h2M10 15h4"/></svg></div>
          <div class="info-text"><strong>Auto-Pay Available</strong>Set up standing instructions for hassle-free monthly payments.</div>
        </div>
        <div class="info-item">
          <div class="info-bullet"><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.69 15a19.79 19.79 0 01-3.07-8.67A2 2 0 013.6 4.22h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.91 11.1a16 16 0 005 5l.94-.94a2 2 0 012.11-.45c.908.339 1.85.573 2.81.7A2 2 0 0120.21 17.2z"/></svg></div>
          <div class="info-text"><strong>Help & Support</strong>Call 1912 (24×7 toll-free) or WhatsApp +91-8399012345 for payment issues.</div>
        </div>
      </div>

    </aside>
  </div><!-- /pay-layout -->

</main>

<!-- FOOTER -->
<footer class="page-footer">
  <span>© 2026 Assam Power Distribution Company Ltd. (APDCL) · Government of Assam</span>
  <div class="footer-links">
    <a href="#">Privacy Policy</a>
    <a href="#">Disclaimer</a>
    <a href="#">Refund Policy</a>
    <a href="#">Accessibility</a>
  </div>
  <div class="footer-status">
    <span class="status-dot"></span>
    Payment Gateway Operational
  </div>
</footer>

<script>
  /* ── NAVBAR HAMBURGER ── */
  const toggle    = document.getElementById('navToggle');
  const linksWrap = document.getElementById('navLinksWrap');
  const navLinks  = document.getElementById('navLinks');
  const hamSvg    = document.getElementById('hamburgerSvg');
  const OPEN  = `<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>`;
  const CLOSE = `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`;
  function setOpen(o) {
    linksWrap.classList.toggle('open', o);
    navLinks.classList.toggle('open', o);
    hamSvg.innerHTML = o ? CLOSE : OPEN;
    toggle.setAttribute('aria-expanded', o);
  }
  toggle.addEventListener('click', () => setOpen(!linksWrap.classList.contains('open')));
  window.addEventListener('resize', () => { if (window.innerWidth > 900) setOpen(false); });

  /* ── WIZARD STATE ── */
  let currentStep = 1;
  const totalSteps = 4;
  const fills = [0, 0, 33.3, 66.6, 100];

  function showStep(step) {
    for (let i = 1; i <= 5; i++) {
      const p = document.getElementById('panel' + i);
      if (p) p.classList.remove('active');
    }
    document.getElementById('panel' + step).classList.add('active');

    ['dot1','dot2','dot3','dot4'].forEach((id, idx) => {
      const s = idx + 1;
      const dot  = document.getElementById(id);
      const name = document.getElementById('name' + (idx + 1));
      dot.className = 'step-dot';
      name.className = 'step-name';
      if (s < step) {
        dot.classList.add('done');
        name.classList.add('done');
        dot.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.8" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>';
      } else if (s === step && step <= totalSteps) {
        dot.classList.add('active');
        name.classList.add('active');
        dot.innerHTML = s;
      } else {
        dot.innerHTML = s;
      }
    });

    document.getElementById('trackFill').style.width = fills[step - 1] + '%';

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const footer  = document.getElementById('cardFooter');

    if (step === 5) {
      footer.style.display = 'none';
    } else {
      footer.style.display = 'flex';
      prevBtn.style.display = step > 1 ? 'inline-flex' : 'none';
      if (step === totalSteps) {
        nextBtn.innerHTML = 'Pay ₹2,318.00 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" width="14" height="14"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
        nextBtn.style.background = 'var(--forest-dark)';
      } else {
        nextBtn.innerHTML = 'Continue <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" width="14" height="14"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
        nextBtn.style.background = '';
      }
    }
  }

  function nextStep() {
    if (currentStep <= totalSteps) {
      currentStep++;
      showStep(currentStep);
      document.querySelector('.pay-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      currentStep--;
      showStep(currentStep);
    }
  }

  function resetWizard() {
    currentStep = 1;
    showStep(1);
    document.getElementById('cardFooter').style.display = 'flex';
    document.querySelector('.pay-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ── PAYMENT METHOD SELECTION ── */
  function selectMethod(type) {
    ['upi','card','net','cash'].forEach(t => {
      document.getElementById('m' + t.charAt(0).toUpperCase() + t.slice(1)).classList.remove('selected');
      document.getElementById('sec' + t.charAt(0).toUpperCase() + t.slice(1)).style.display = 'none';
    });
    document.getElementById('m' + type.charAt(0).toUpperCase() + type.slice(1)).classList.add('selected');
    document.getElementById('sec' + type.charAt(0).toUpperCase() + type.slice(1)).style.display = 'block';
  }

  /* ── UPI APP SELECTION ── */
  function selectUpiApp(btn) {
    document.querySelectorAll('.upi-app-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  }

  /* ── BANK SELECTION ── */
  function selectBank(tile) {
    document.querySelectorAll('.bank-tile').forEach(t => t.classList.remove('selected'));
    tile.classList.add('selected');
  }

  /* ── PARTIAL PAYMENT TOGGLE ── */
  document.getElementById('partialCb').addEventListener('change', function() {
    document.getElementById('partialInput').style.display = this.checked ? 'block' : 'none';
  });

  /* ── INIT ── */
  showStep(1);
</script>
</body>
</html>
