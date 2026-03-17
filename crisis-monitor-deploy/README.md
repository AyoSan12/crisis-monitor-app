<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Crisis Monitor — Pantauan Bencana & Konflik</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#0e0f11;--bg2:#16181c;--bg3:#1e2026;--bg4:#262830;
    --border:#2e3038;--border2:#3a3c48;
    --text:#e8e9ec;--text2:#9395a0;--text3:#5c5e6a;
    --red:#e03e3e;--red-dim:#3a1a1a;
    --amber:#c27c1a;--amber-dim:#2e2010;
    --blue:#2f7de0;--blue-dim:#122040;
    --green:#2ea86e;
    --ff:'DM Sans',sans-serif;--ffm:'DM Mono',monospace;
  }
  html,body{height:100%;overflow:hidden;background:var(--bg);color:var(--text);font-family:var(--ff);font-size:15px;line-height:1.65}
  .shell{display:grid;grid-template-columns:1fr;height:100vh;overflow:hidden}
  @media(min-width:860px){.shell{grid-template-columns:290px 1fr}}
  @media(min-width:1200px){.shell{grid-template-columns:270px 1fr 360px}}

  /* SIDEBAR */
  .sidebar{background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;height:100vh;overflow:hidden}
  .sb-inner{flex:1;overflow-y:auto;padding:1.375rem}
  .sb-inner::-webkit-scrollbar{width:3px}
  .sb-inner::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
  .sb-footer{padding:1rem 1.375rem;border-top:1px solid var(--border)}

  /* LOGO */
  .logo{display:flex;align-items:center;gap:10px;margin-bottom:1.375rem}
  .logo-icon{width:34px;height:34px;background:var(--red);border-radius:5px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .logo-icon svg{width:19px;height:19px}
  .logo-title{font-size:15px;font-weight:500;line-height:1.2}
  .logo-sub{font-family:var(--ffm);font-size:10px;color:var(--text3);letter-spacing:.06em;text-transform:uppercase}

  /* LIVE BAR */
  .live-bar{display:flex;align-items:center;justify-content:space-between;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:8px 12px;margin-bottom:1.125rem;font-family:var(--ffm);font-size:11px;color:var(--text3)}
  .live-pill{display:flex;align-items:center;gap:5px;color:var(--green);font-weight:500}
  .live-dot{width:7px;height:7px;border-radius:50%;background:var(--green);animation:pulse 2s infinite}
  .loading-dot{background:var(--amber);animation:pulse .6s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}

  /* STATS */
  .stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:1.125rem}
  .stat{background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:10px 9px}
  .stat-val{font-family:var(--ffm);font-size:22px;font-weight:500;line-height:1}
  .stat-lbl{font-size:10px;font-family:var(--ffm);color:var(--text3);letter-spacing:.05em;text-transform:uppercase;margin-top:3px}
  .stat.red .stat-val{color:var(--red)}
  .stat.amber .stat-val{color:var(--amber)}
  .stat.blue .stat-val{color:var(--blue)}

  .sec{font-family:var(--ffm);font-size:10px;color:var(--text3);letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}
  .filter-group{margin-bottom:1.125rem}

  /* REGION */
  .region-row{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:1.125rem}
  .rbtn{padding:6px 0;border-radius:4px;border:1px solid var(--border);background:transparent;color:var(--text3);font-size:11px;font-family:var(--ffm);cursor:pointer;transition:all .1s;text-align:center}
  .rbtn:hover{border-color:var(--border2);color:var(--text2)}
  .rbtn.active{background:var(--bg4);border-color:var(--border2);color:var(--text)}

  /* CHIPS */
  .chips{display:flex;flex-direction:column;gap:2px}
  .chip{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:5px;border:1px solid transparent;cursor:pointer;font-size:13px;color:var(--text2);background:transparent;transition:all .1s;text-align:left;width:100%}
  .chip:hover{background:var(--bg3);color:var(--text)}
  .chip.active{background:var(--bg3);border-color:var(--border2);color:var(--text)}
  .cdot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
  .ccnt{margin-left:auto;font-family:var(--ffm);font-size:11px;color:var(--text3)}

  /* SEARCH */
  .srch-wrap{position:relative}
  .srch{width:100%;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:8px 12px 8px 34px;color:var(--text);font-size:13px;font-family:var(--ff);outline:none;transition:border-color .12s}
  .srch::placeholder{color:var(--text3)}
  .srch:focus{border-color:var(--border2)}
  .srch-ic{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--text3);pointer-events:none}

  /* SOURCE STATUS */
  .src-status{display:flex;flex-direction:column;gap:2px;margin-top:.75rem}
  .src-row{display:flex;align-items:center;justify-content:space-between;font-family:var(--ffm);font-size:10px;color:var(--text3);padding:3px 0}
  .src-badge{font-size:9px;padding:1px 6px;border-radius:2px}
  .src-badge.ok{background:rgba(46,168,110,.15);color:var(--green)}
  .src-badge.err{background:var(--red-dim);color:#f87171}
  .src-badge.loading{background:var(--amber-dim);color:#fbbf24}

  /* SAVE BTN */
  .save-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:7px;padding:9px;border-radius:6px;border:1px solid var(--border2);background:transparent;color:var(--text2);font-size:12px;font-family:var(--ffm);cursor:pointer;transition:all .12s}
  .save-btn:hover{background:var(--bg3);color:var(--text);border-color:var(--green)}

  /* MAIN */
  .main{display:flex;flex-direction:column;height:100vh;overflow:hidden}
  .main-head{padding:1.125rem 1.375rem;border-bottom:1px solid var(--border);background:var(--bg);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-shrink:0}
  .main-title{font-size:15px;font-weight:500}
  .main-sub{font-size:11px;color:var(--text3);font-family:var(--ffm);margin-top:2px}
  .lang-row{display:flex;gap:3px}
  .lbtn{padding:4px 9px;border-radius:3px;border:1px solid var(--border);background:transparent;color:var(--text3);font-size:11px;font-family:var(--ffm);cursor:pointer;transition:all .1s}
  .lbtn.active{background:var(--bg3);color:var(--text);border-color:var(--border2)}
  .main-scroll{flex:1;overflow-y:auto}
  .main-scroll::-webkit-scrollbar{width:3px}
  .main-scroll::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}

  /* SKELETON */
  .skeleton-wrap{padding:1.375rem}
  .skel-row{display:flex;gap:12px;padding:14px 0;border-bottom:1px solid var(--border)}
  .skel-line{background:var(--bg3);border-radius:3px;animation:shimmer 1.5s infinite}
  @keyframes shimmer{0%{opacity:.4}50%{opacity:.7}100%{opacity:.4}}

  /* ERROR */
  .error-banner{margin:1.375rem;padding:13px 15px;background:var(--red-dim);border:1px solid rgba(224,62,62,.3);border-radius:6px;font-size:13px;color:#f87171;display:none}
  .error-banner.show{display:block}

  /* TIMELINE */
  .timeline{padding:1.125rem 1.375rem}
  .day-group{margin-bottom:1.375rem}
  .day-lbl{font-family:var(--ffm);font-size:10px;color:var(--text3);letter-spacing:.07em;text-transform:uppercase;padding:5px 0;border-bottom:1px solid var(--border);margin-bottom:1rem;display:flex;align-items:center;gap:8px}
  .day-lbl-line{flex:1;height:1px;background:var(--border)}

  .ev{display:flex;margin-bottom:2px;cursor:pointer;border-radius:8px;transition:background .1s;padding:10px 10px 10px 0}
  .ev:hover{background:var(--bg2)}
  .ev.sel{background:var(--bg3);border:1px solid var(--border2)}

  .ev-tc{width:52px;flex-shrink:0;padding-top:3px}
  .ev-time{font-family:var(--ffm);font-size:11px;color:var(--text3);line-height:1.4}
  .ev-tz{font-size:9px}
  .ev-spine{width:28px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;padding-top:5px}
  .ev-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0}
  .ev-dot.critical{background:var(--red);box-shadow:0 0 0 3px var(--red-dim)}
  .ev-dot.warning{background:var(--amber);box-shadow:0 0 0 3px var(--amber-dim)}
  .ev-dot.info{background:var(--blue);box-shadow:0 0 0 3px var(--blue-dim)}
  .ev-line{width:1px;background:var(--border);flex:1;min-height:14px;margin-top:5px}
  .last-ev .ev-line{display:none}
  .ev-body{flex:1;min-width:0}

  .ev-tags{display:flex;gap:4px;align-items:center;margin-bottom:5px;flex-wrap:wrap}
  .tag{font-size:10px;font-family:var(--ffm);letter-spacing:.04em;padding:2px 7px;border-radius:3px;font-weight:500}
  .tag.critical{background:var(--red-dim);color:#f87171;border:1px solid rgba(224,62,62,.2)}
  .tag.warning{background:var(--amber-dim);color:#fbbf24;border:1px solid rgba(194,124,26,.2)}
  .tag.info{background:var(--blue-dim);color:#60a5fa;border:1px solid rgba(47,125,224,.2)}
  .tag.neutral{background:var(--bg4);color:var(--text2);border:1px solid var(--border)}

  .ev-title{font-size:14px;font-weight:500;line-height:1.45;margin-bottom:4px;color:var(--text)}
  .ev-desc{font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .ev-meta{display:flex;align-items:center;gap:7px;font-size:11px;font-family:var(--ffm);color:var(--text3)}
  .ev-meta-dot{width:3px;height:3px;border-radius:50%;background:var(--text3)}

  /* PAGINATION */
  .pagination{display:flex;align-items:center;justify-content:center;gap:5px;padding:1.375rem;border-top:1px solid var(--border)}
  .pbtn{width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:5px;border:1px solid var(--border);background:transparent;color:var(--text2);font-family:var(--ffm);font-size:12px;cursor:pointer;transition:all .1s}
  .pbtn:hover{background:var(--bg3);color:var(--text);border-color:var(--border2)}
  .pbtn.active{background:var(--bg3);color:var(--text);border-color:var(--red)}
  .pbtn:disabled{opacity:.3;cursor:default}
  .pinfo{font-family:var(--ffm);font-size:11px;color:var(--text3);padding:0 6px}

  /* DETAIL PANEL */
  .detail{background:var(--bg2);border-left:1px solid var(--border);display:none;flex-direction:column;height:100vh;overflow:hidden}
  .detail.open{display:flex}
  @media(min-width:1200px){.detail{display:flex}}
  .det-head{padding:1.125rem 1.375rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
  .det-close{background:transparent;border:none;color:var(--text3);cursor:pointer;font-size:18px;line-height:1;padding:2px 6px;border-radius:3px}
  .det-close:hover{color:var(--text)}
  .det-body{flex:1;overflow-y:auto;padding:1.375rem}
  .det-body::-webkit-scrollbar{width:3px}
  .det-body::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
  .det-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text3);text-align:center;gap:10px;padding:2rem}
  .det-empty-ic{font-size:30px;opacity:.25}
  .det-empty-tx{font-size:13px;font-family:var(--ffm);line-height:1.6}
  .det-title{font-size:16px;font-weight:500;line-height:1.45;margin:.5rem 0 1rem}
  .det-grid{display:grid;grid-template-columns:auto 1fr;gap:6px 12px;margin-bottom:1.125rem}
  .dk{font-family:var(--ffm);font-size:10px;color:var(--text3);letter-spacing:.04em;text-transform:uppercase;padding-top:2px}
  .dv{font-size:13px;color:var(--text2)}
  .divider{height:1px;background:var(--border);margin:1rem 0}
  .det-sec{font-family:var(--ffm);font-size:10px;color:var(--text3);letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}
  .det-desc{font-size:14px;color:var(--text2);line-height:1.75}
  .upd-list{display:flex;flex-direction:column;gap:.75rem;margin-top:.5rem}
  .upd{padding:10px 12px;background:var(--bg3);border-radius:6px;border-left:2px solid var(--border2)}
  .upd.red{border-left-color:var(--red)}
  .upd.amber{border-left-color:var(--amber)}
  .upd-time{font-family:var(--ffm);font-size:10px;color:var(--text3);margin-bottom:4px}
  .upd-text{font-size:13px;color:var(--text2);line-height:1.6}
  .src-link{display:flex;align-items:center;gap:7px;width:100%;padding:10px 13px;background:var(--bg3);border:1px solid var(--border2);border-radius:6px;color:var(--text2);font-size:13px;font-family:var(--ffm);cursor:pointer;transition:all .12s;margin-top:1rem;text-decoration:none}
  .src-link:hover{background:var(--bg4);color:var(--text)}
  .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4rem 2rem;color:var(--text3);text-align:center;gap:8px}

  /* MOBILE OVERLAY */
  .mob-detail{position:fixed;top:0;left:0;right:0;bottom:0;background:var(--bg2);z-index:100;display:none;flex-direction:column;overflow:hidden}
  .mob-detail.open{display:flex}

  @keyframes fadeIn{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}
  .ev{animation:fadeIn .18s ease both}
</style>
</head>
<body>
<div class="shell">

  <!-- SIDEBAR -->
  <aside class="sidebar">
    <div class="sb-inner">

      <div class="logo">
        <div class="logo-icon">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M10 2L18 16H2L10 2Z" fill="white" fill-opacity=".85"/>
            <rect x="9.25" y="7.5" width="1.5" height="4.5" rx=".6" fill="#e03e3e"/>
            <rect x="9.25" y="13" width="1.5" height="1.5" rx=".6" fill="#e03e3e"/>
          </svg>
        </div>
        <div>
          <div class="logo-title">Crisis Monitor</div>
          <div class="logo-sub">Real-time · ID & Global</div>
        </div>
      </div>

      <div class="live-bar">
        <div class="live-pill">
          <div class="live-dot loading-dot" id="live-dot"></div>
          <span id="live-label">Memuat...</span>
        </div>
        <span id="live-time">--:--</span>
      </div>

      <div class="stats-row">
        <div class="stat red"><div class="stat-val" id="stat-crit">–</div><div class="stat-lbl">KRITIS</div></div>
        <div class="stat amber"><div class="stat-val" id="stat-warn">–</div><div class="stat-lbl">WASPADA</div></div>
        <div class="stat blue"><div class="stat-val" id="stat-tot">–</div><div class="stat-lbl">TOTAL</div></div>
      </div>

      <div class="filter-group">
        <div class="sec">Wilayah</div>
        <div class="region-row">
          <button class="rbtn active" onclick="setRegion('all',this)">Semua</button>
          <button class="rbtn" onclick="setRegion('id',this)">Indonesia</button>
          <button class="rbtn" onclick="setRegion('global',this)">Global</button>
        </div>
      </div>

      <div class="filter-group">
        <div class="sec">Kategori</div>
        <div class="chips" id="cat-chips">
          <button class="chip active" onclick="setCat('all',this)"><span class="cdot" style="background:var(--text3)"></span>Semua kategori<span class="ccnt" id="cnt-all">–</span></button>
          <button class="chip" onclick="setCat('gempa',this)"><span class="cdot" style="background:var(--red)"></span>Gempa & Tsunami<span class="ccnt" id="cnt-gempa">–</span></button>
          <button class="chip" onclick="setCat('bencana',this)"><span class="cdot" style="background:var(--amber)"></span>Bencana Alam<span class="ccnt" id="cnt-bencana">–</span></button>
          <button class="chip" onclick="setCat('konflik',this)"><span class="cdot" style="background:var(--red)"></span>Konflik & Perang<span class="ccnt" id="cnt-konflik">–</span></button>
          <button class="chip" onclick="setCat('cuaca',this)"><span class="cdot" style="background:var(--blue)"></span>Cuaca Ekstrem<span class="ccnt" id="cnt-cuaca">–</span></button>
          <button class="chip" onclick="setCat('wabah',this)"><span class="cdot" style="background:#2ea86e"></span>Wabah & Kesehatan<span class="ccnt" id="cnt-wabah">–</span></button>
          <button class="chip" onclick="setCat('kebakaran',this)"><span class="cdot" style="background:var(--amber)"></span>Kebakaran<span class="ccnt" id="cnt-kebakaran">–</span></button>
        </div>
      </div>

      <div class="filter-group">
        <div class="sec">Cari</div>
        <div class="srch-wrap">
          <svg class="srch-ic" width="13" height="13" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M11 11L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <input class="srch" id="srch" placeholder="Cari kejadian..." oninput="onSearch()">
        </div>
      </div>

      <div class="filter-group">
        <div class="sec">Status sumber data</div>
        <div class="src-status">
          <div class="src-row"><span>BMKG</span><span class="src-badge loading" id="s-bmkg">–</span></div>
          <div class="src-row"><span>PVMBG / MAGMA</span><span class="src-badge loading" id="s-pvmbg">–</span></div>
          <div class="src-row"><span>USGS</span><span class="src-badge loading" id="s-usgs">–</span></div>
          <div class="src-row"><span>NASA EONET</span><span class="src-badge loading" id="s-eonet">–</span></div>
          <div class="src-row"><span>GDACS (UN)</span><span class="src-badge loading" id="s-gdacs">–</span></div>
          <div class="src-row"><span>ReliefWeb (UN)</span><span class="src-badge loading" id="s-reliefweb">–</span></div>
          <div class="src-row"><span>OCHA / Konflik</span><span class="src-badge loading" id="s-icrc">–</span></div>
          <div class="src-row"><span>Crisis Group</span><span class="src-badge loading" id="s-crisisgroup">–</span></div>
          <div class="src-row"><span>Al Jazeera</span><span class="src-badge loading" id="s-msf">–</span></div>
          <div class="src-row"><span>WHO</span><span class="src-badge loading" id="s-who">–</span></div>
          <div class="src-row"><span>NOAA / NHC</span><span class="src-badge loading" id="s-noaa">–</span></div>
          <div class="src-row"><span>ACLED</span><span class="src-badge loading" id="s-acled">–</span></div>
        </div>
      </div>

    </div>
    <div class="sb-footer">
      <button class="save-btn" onclick="saveOffline()">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 12h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Simpan snapshot offline
      </button>
    </div>
  </aside>

  <!-- MAIN -->
  <main class="main">
    <div class="main-head">
      <div>
        <div class="main-title" id="main-title">Semua kejadian</div>
        <div class="main-sub" id="main-sub">Mengambil data dari sumber...</div>
      </div>
      <div class="lang-row">
        <button class="lbtn active" onclick="setLang('id',this)">ID</button>
        <button class="lbtn" onclick="setLang('en',this)">EN</button>
      </div>
    </div>

    <div class="error-banner" id="error-banner">
      Gagal mengambil data. Pastikan koneksi internet tersedia dan coba muat ulang halaman.
    </div>

    <div class="main-scroll">
      <div id="skeleton" class="skeleton-wrap">
        <div class="skel-row"><div class="skel-line" style="width:44px;height:30px;flex-shrink:0"></div><div style="flex:1;display:flex;flex-direction:column;gap:7px;padding-left:10px"><div class="skel-line" style="height:13px;width:60%"></div><div class="skel-line" style="height:12px;width:85%"></div><div class="skel-line" style="height:11px;width:40%"></div></div></div>
        <div class="skel-row"><div class="skel-line" style="width:44px;height:30px;flex-shrink:0"></div><div style="flex:1;display:flex;flex-direction:column;gap:7px;padding-left:10px"><div class="skel-line" style="height:13px;width:75%"></div><div class="skel-line" style="height:12px;width:90%"></div><div class="skel-line" style="height:11px;width:35%"></div></div></div>
        <div class="skel-row"><div class="skel-line" style="width:44px;height:30px;flex-shrink:0"></div><div style="flex:1;display:flex;flex-direction:column;gap:7px;padding-left:10px"><div class="skel-line" style="height:13px;width:55%"></div><div class="skel-line" style="height:12px;width:80%"></div><div class="skel-line" style="height:11px;width:45%"></div></div></div>
      </div>
      <div class="timeline" id="tl" style="display:none"></div>
      <div class="pagination" id="pg"></div>
    </div>
  </main>

  <!-- DETAIL PANEL desktop -->
  <aside class="detail" id="det">
    <div class="det-head">
      <span style="font-size:11px;font-family:var(--ffm);color:var(--text3);letter-spacing:.07em;text-transform:uppercase">Detail Kejadian</span>
      <button class="det-close" onclick="closeDetail()">×</button>
    </div>
    <div class="det-body" id="det-body">
      <div class="det-empty">
        <div class="det-empty-ic">⊙</div>
        <div class="det-empty-tx">Pilih kejadian<br>untuk melihat detail</div>
      </div>
    </div>
  </aside>
</div>

<!-- MOBILE DETAIL -->
<div class="mob-detail" id="mob-det">
  <div class="det-head">
    <span style="font-size:11px;font-family:var(--ffm);color:var(--text3);letter-spacing:.07em;text-transform:uppercase">Detail Kejadian</span>
    <button class="det-close" onclick="closeMob()">× Kembali</button>
  </div>
  <div class="det-body" id="mob-det-body" style="flex:1;overflow-y:auto"></div>
</div>

<script>
let ALL = [], lang = 'id', cat = 'all', region = 'all', q = '', page = 1;
const PER = 8;
let selId = null, lastUpdated = null;

async function loadData() {
  try {
    const res = await fetch('/api/events');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    ALL = data.events || [];
    lastUpdated = data.updated;
    if (data.sources) {
      Object.entries(data.sources).forEach(([k, v]) => {
        const el = document.getElementById('s-' + k);
        if (!el) return;
        el.textContent = v === 'ok' ? 'OK' : 'ERROR';
        el.className = 'src-badge ' + (v === 'ok' ? 'ok' : 'err');
      });
    }
    document.getElementById('live-dot').classList.remove('loading-dot');
    document.getElementById('live-label').textContent = 'LIVE';
    document.getElementById('error-banner').classList.remove('show');
    document.getElementById('skeleton').style.display = 'none';
    document.getElementById('tl').style.display = 'block';
    updateStats(); updateCounts(); render();
  } catch (e) {
    document.getElementById('error-banner').classList.add('show');
    document.getElementById('skeleton').style.display = 'none';
    document.getElementById('tl').style.display = 'block';
    document.getElementById('live-label').textContent = 'ERROR';
    document.getElementById('main-sub').textContent = 'Gagal memuat data';
  }
}
setInterval(loadData, 5 * 60 * 1000);

function T(ev, f) { return lang === 'id' ? ev[f + '_id'] : ev[f + '_en']; }

function filtered() {
  return ALL.filter(ev => {
    if (cat !== 'all' && ev.cat !== cat) return false;
    if (region !== 'all' && ev.region !== region) return false;
    if (q) {
      const s = q.toLowerCase();
      if (![T(ev,'title'), T(ev,'desc'), ev.source, ev.loc].some(x => x?.toLowerCase().includes(s))) return false;
    }
    return true;
  });
}

function groupByDate(evs) {
  const m = {};
  evs.forEach(ev => (m[ev.date] = m[ev.date] || []).push(ev));
  return Object.entries(m).sort((a, b) => b[0].localeCompare(a[0]));
}

function fmtDate(d) {
  const dt = new Date(d + 'T00:00:00');
  return lang === 'id'
    ? dt.toLocaleDateString('id-ID', {weekday:'long',year:'numeric',month:'long',day:'numeric'})
    : dt.toLocaleDateString('en-GB', {weekday:'long',year:'numeric',month:'long',day:'numeric'});
}

function updateStats() {
  document.getElementById('stat-crit').textContent = ALL.filter(e => e.severity === 'critical').length;
  document.getElementById('stat-warn').textContent = ALL.filter(e => e.severity === 'warning').length;
  document.getElementById('stat-tot').textContent = ALL.length;
}

function updateCounts() {
  const base = ALL.filter(e => region === 'all' || e.region === region);
  document.getElementById('cnt-all').textContent = base.length;
  ['gempa','bencana','konflik','cuaca','wabah','kebakaran'].forEach(c => {
    const el = document.getElementById('cnt-' + c);
    if (el) el.textContent = base.filter(e => e.cat === c).length;
  });
}

function render() {
  const evs = filtered();
  const total = Math.max(1, Math.ceil(evs.length / PER));
  if (page > total) page = 1;
  const paged = evs.slice((page-1)*PER, page*PER);
  const grouped = groupByDate(paged);
  const tl = document.getElementById('tl');

  if (evs.length === 0) {
    tl.innerHTML = `<div class="empty-state"><div style="font-size:26px;opacity:.2">⊘</div><div style="font-size:13px;font-family:var(--ffm);color:var(--text3)">${lang==='id'?'Tidak ada kejadian':'No events found'}</div></div>`;
    document.getElementById('pg').innerHTML = '';
    document.getElementById('main-sub').textContent = '0 kejadian';
    return;
  }

  let html = '';
  grouped.forEach(([date, evList]) => {
    html += `<div class="day-group"><div class="day-lbl">${fmtDate(date)}<div class="day-lbl-line"></div></div>`;
    evList.forEach((ev, i) => {
      const isLast = i === evList.length - 1;
      html += `<div class="ev${isLast?' last-ev':''}${ev.id===selId?' sel':''}" onclick="selectEv('${ev.id}')" style="animation-delay:${i*.03}s">
        <div class="ev-tc"><div class="ev-time">${ev.time}<br><span class="ev-tz">${ev.region==='id'?'WIB':'UTC'}</span></div></div>
        <div class="ev-spine"><div class="ev-dot ${ev.severity}"></div>${!isLast?'<div class="ev-line"></div>':''}</div>
        <div class="ev-body">
          <div class="ev-tags"><span class="tag ${ev.severity}">${ev.badge}</span><span class="tag neutral">${ev.source}</span></div>
          <div class="ev-title">${T(ev,'title')}</div>
          <div class="ev-desc">${T(ev,'desc')}</div>
          <div class="ev-meta"><span>${ev.loc}</span><div class="ev-meta-dot"></div><span>${ev.region==='id'?'Indonesia':'Global'}</span></div>
        </div>
      </div>`;
    });
    html += '</div>';
  });
  tl.innerHTML = html;

  const labels = {all:lang==='id'?'Semua kejadian':'All events',gempa:lang==='id'?'Gempa & Tsunami':'Earthquakes & Tsunami',bencana:lang==='id'?'Bencana Alam':'Natural Disasters',konflik:lang==='id'?'Konflik & Perang':'Conflict & War',cuaca:lang==='id'?'Cuaca Ekstrem':'Extreme Weather',wabah:lang==='id'?'Wabah & Kesehatan':'Outbreaks',kebakaran:lang==='id'?'Kebakaran':'Wildfires'};
  document.getElementById('main-title').textContent = labels[cat] || labels['all'];
  const lu = lastUpdated ? new Date(lastUpdated).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta',hour12:false}) : '--:--';
  document.getElementById('main-sub').textContent = `${evs.length} kejadian · diperbarui ${lu} WIB · hal ${page}/${total}`;
  renderPg(total);
}

function renderPg(total) {
  const pg = document.getElementById('pg');
  if (total <= 1) { pg.innerHTML = ''; return; }
  let h = `<button class="pbtn" onclick="goPage(${page-1})" ${page===1?'disabled':''}>‹</button>`;
  const s = Math.max(1,page-2), e = Math.min(total,page+2);
  if (s>1) h += `<button class="pbtn" onclick="goPage(1)">1</button>${s>2?'<span class="pinfo">…</span>':''}`;
  for (let i=s;i<=e;i++) h += `<button class="pbtn${i===page?' active':''}" onclick="goPage(${i})">${i}</button>`;
  if (e<total) h += `${e<total-1?'<span class="pinfo">…</span>':''}<button class="pbtn" onclick="goPage(${total})">${total}</button>`;
  h += `<button class="pbtn" onclick="goPage(${page+1})" ${page===total?'disabled':''}>›</button>`;
  pg.innerHTML = h;
}

function goPage(p) { page = p; render(); document.querySelector('.main-scroll').scrollTo(0,0); }

function buildDetail(ev) {
  const sl = {critical:lang==='id'?'KRITIS':'CRITICAL',warning:lang==='id'?'WASPADA':'WARNING',info:'INFO'};
  let upd = '';
  if (ev.updates?.length > 0) {
    upd = `<div class="divider"></div><div class="det-sec">${lang==='id'?'Pembaruan':'Updates'}</div>
    <div class="upd-list">${ev.updates.map(u=>`<div class="upd ${u.border||''}"><div class="upd-time">${u.time}</div><div class="upd-text">${u.text}</div></div>`).join('')}</div>`;
  }
  return `
    <div><span class="tag ${ev.severity}">${sl[ev.severity]}</span> <span class="tag neutral" style="margin-left:3px">${ev.badge}</span></div>
    <div class="det-title">${T(ev,'title')}</div>
    <div class="det-grid">
      <div class="dk">${lang==='id'?'Waktu':'Time'}</div><div class="dv">${ev.time} · ${fmtDate(ev.date)}</div>
      <div class="dk">${lang==='id'?'Lokasi':'Location'}</div><div class="dv">${ev.loc}</div>
      <div class="dk">${lang==='id'?'Sumber':'Source'}</div><div class="dv">${ev.source}</div>
      <div class="dk">${lang==='id'?'Wilayah':'Region'}</div><div class="dv">${ev.region==='id'?'Indonesia':'Global'}</div>
    </div>
    <div class="divider"></div>
    <div class="det-sec">${lang==='id'?'Ringkasan':'Summary'}</div>
    <div class="det-desc">${T(ev,'desc')}</div>
    ${upd}
    <a class="src-link" href="${ev.url}" target="_blank" rel="noopener noreferrer">
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M7 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 2h4m0 0v4m0-4L8 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      ${lang==='id'?'Buka artikel sumber asli':'Open original source article'}
    </a>`;
}

function selectEv(id) {
  selId = id;
  const ev = ALL.find(e => e.id === id);
  if (!ev) return;
  const html = buildDetail(ev);
  document.getElementById('det-body').innerHTML = html;
  document.getElementById('det').classList.add('open');
  if (window.innerWidth < 1200) {
    document.getElementById('mob-det-body').innerHTML = html;
    document.getElementById('mob-det').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  render();
}

function closeDetail() {
  selId = null;
  document.getElementById('det').classList.remove('open');
  document.getElementById('det-body').innerHTML = `<div class="det-empty"><div class="det-empty-ic">⊙</div><div class="det-empty-tx">${lang==='id'?'Pilih kejadian<br>untuk melihat detail':'Select an event<br>to view details'}</div></div>`;
  render();
}

function closeMob() {
  document.getElementById('mob-det').classList.remove('open');
  document.body.style.overflow = '';
  selId = null; render();
}

function setCat(c, el) { cat=c; page=1; document.querySelectorAll('#cat-chips .chip').forEach(x=>x.classList.remove('active')); el.classList.add('active'); render(); }
function setRegion(r, el) { region=r; page=1; document.querySelectorAll('.rbtn').forEach(x=>x.classList.remove('active')); el.classList.add('active'); updateCounts(); render(); }
function onSearch() { q=document.getElementById('srch').value; page=1; render(); }
function setLang(l, el) { lang=l; document.querySelectorAll('.lbtn').forEach(x=>x.classList.remove('active')); el.classList.add('active'); render(); updateCounts(); if(selId) selectEv(selId); }

function tick() {
  document.getElementById('live-time').textContent = new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'Asia/Jakarta',hour12:false})+' WIB';
}
setInterval(tick, 1000); tick();

function saveOffline() {
  const blob = new Blob([document.documentElement.outerHTML], {type:'text/html'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'crisis-monitor-' + new Date().toISOString().slice(0,16).replace('T','_').replace(':','') + '.html';
  a.click();
}

loadData();
</script>
</body>
</html>
