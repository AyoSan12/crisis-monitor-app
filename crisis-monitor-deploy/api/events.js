// ============================================================
// Crisis Monitor — API handler
// Sumber: BMKG, USGS, NASA EONET, ReliefWeb, GDACS,
//         WHO, NOAA, ACLED, PVMBG, ICRC, Crisis Group, MSF
// ============================================================

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const results = await Promise.allSettled([
    fetchBMKG(),
    fetchUSGS(),
    fetchEONET(),
    fetchReliefWeb(),
    fetchGDACS(),
    fetchWHO(),
    fetchNOAA(),
    fetchACLED(),
    fetchPVMBG(),
    fetchICRC(),
    fetchCrisisGroup(),
    fetchMSF(),
  ]);

  const keys = ['bmkg','usgs','eonet','reliefweb','gdacs','who','noaa','acled','pvmbg','icrc','crisisgroup','msf'];
  const sources = {};
  keys.forEach((k, i) => {
    sources[k] = results[i].status === 'fulfilled' ? 'ok' : (results[i].reason?.message || 'error');
  });

  const events = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

  res.status(200).json({ events, updated: new Date().toISOString(), sources });
};

// ============================================================
// BMKG — Gempa terkini Indonesia
// ============================================================
async function fetchBMKG() {
  const res = await fetchWithTimeout('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json');
  const data = await res.json();
  return (data?.Infogempa?.gempa || []).map((g, i) => {
    const mag = parseFloat(g.Magnitude) || 0;
    const dt = g.DateTime ? new Date(g.DateTime) : new Date();
    const hasTsunami = g.Potensi?.toLowerCase().includes('potensi tsunami');
    return {
      id: `bmkg-${i}-${dt.getTime()}`,
      datetime: dt.toISOString(), date: toDateStr(dt), time: toTimeWIB(dt),
      severity: mag >= 6.0 ? 'critical' : mag >= 5.0 ? 'warning' : 'info',
      cat: 'gempa', region: 'id', badge: 'GEMPA',
      title_id: `Gempa M${g.Magnitude} — ${g.Wilayah}`,
      title_en: `M${g.Magnitude} Earthquake — ${g.Wilayah}`,
      desc_id: `Kedalaman ${g.Kedalaman}. ${g.Potensi || ''}. ${g.Dirasakan ? 'Dirasakan: ' + g.Dirasakan : ''}`.trim(),
      desc_en: `Depth ${g.Kedalaman}. ${g.Potensi || ''}`.trim(),
      source: 'BMKG', loc: g.Wilayah || 'Indonesia',
      url: 'https://bmkg.go.id/gempabumi/gempabumi-terkini.bmkg',
      updates: hasTsunami ? [{ time: toTimeWIB(dt), text: '⚠ Potensi tsunami — ikuti arahan BMKG setempat.', border: 'red' }] : [],
    };
  });
}

// ============================================================
// PVMBG / MAGMA Indonesia — Status gunung berapi Indonesia
// ============================================================
async function fetchPVMBG() {
  const res = await fetchWithTimeout('https://magma.esdm.go.id/v1/press-release/xml');
  const text = await res.text();
  const items = [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 10);

  function extract(block, tag) {
    const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`));
    return m ? (m[1] || m[2] || '').trim() : '';
  }

  return items.map((m, i) => {
    const block = m[1];
    const title = extract(block, 'title');
    const desc  = extract(block, 'description').replace(/<[^>]*>/g, '').trim().slice(0, 400);
    const link  = extract(block, 'link');
    const pub   = extract(block, 'pubDate');
    const dt    = pub ? new Date(pub) : new Date();
    const tl    = title.toLowerCase();
    const severity = (tl.includes('awas') || tl.includes('level iv')) ? 'critical'
                   : (tl.includes('siaga') || tl.includes('level iii')) ? 'warning' : 'info';
    return {
      id: `pvmbg-${i}-${dt.getTime()}`,
      datetime: dt.toISOString(), date: toDateStr(dt), time: toTimeWIB(dt),
      severity, cat: 'bencana', region: 'id', badge: 'GUNUNG API',
      title_id: title, title_en: title,
      desc_id: desc || 'Siaran pers terbaru dari PVMBG / MAGMA Indonesia.',
      desc_en: desc || 'Latest press release from PVMBG / MAGMA Indonesia.',
      source: 'PVMBG / MAGMA', loc: 'Indonesia',
      url: link || 'https://magma.esdm.go.id',
      updates: [],
    };
  });
}

// ============================================================
// USGS — Gempa global M4.5+
// ============================================================
async function fetchUSGS() {
  const res = await fetchWithTimeout('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=4.5&limit=20&orderby=time');
  const data = await res.json();
  return (data?.features || []).map(f => {
    const p = f.properties;
    const mag = p.mag || 0;
    const dt = new Date(p.time);
    const coords = f.geometry?.coordinates || [0, 0];
    const isID = coords[1] > -11 && coords[1] < 6 && coords[0] > 95 && coords[0] < 141;
    return {
      id: `usgs-${f.id}`,
      datetime: dt.toISOString(), date: toDateStr(dt), time: toTimeUTC(dt),
      severity: mag >= 6.5 ? 'critical' : mag >= 5.5 ? 'warning' : 'info',
      cat: 'gempa', region: isID ? 'id' : 'global', badge: 'GEMPA',
      title_id: `Gempa M${mag.toFixed(1)} — ${p.place}`,
      title_en: `M${mag.toFixed(1)} Earthquake — ${p.place}`,
      desc_id: `Magnitudo ${mag.toFixed(1)} tercatat USGS. ${p.tsunami ? 'Peringatan tsunami mungkin dikeluarkan.' : 'Tidak ada peringatan tsunami.'}`,
      desc_en: `M${mag.toFixed(1)} recorded by USGS. ${p.tsunami ? 'Tsunami warning may be issued.' : 'No tsunami warning.'}`,
      source: 'USGS', loc: p.place || 'Unknown',
      url: p.url || 'https://earthquake.usgs.gov',
      updates: [],
    };
  });
}

// ============================================================
// NASA EONET — Bencana aktif global
// ============================================================
async function fetchEONET() {
  const res = await fetchWithTimeout('https://eonet.gsfc.nasa.gov/api/v3/events?limit=20&status=open&days=7');
  const data = await res.json();
  const catMap = {
    wildfires:    { cat: 'kebakaran', badge: 'KARHUTLA',   severity: 'warning' },
    severeStorms: { cat: 'cuaca',     badge: 'BADAI',      severity: 'warning' },
    volcanoes:    { cat: 'bencana',   badge: 'GUNUNG API', severity: 'warning' },
    floods:       { cat: 'bencana',   badge: 'BANJIR',     severity: 'warning' },
    landslides:   { cat: 'bencana',   badge: 'LONGSOR',    severity: 'warning' },
  };
  return (data?.events || []).map(ev => {
    const catId = ev.categories?.[0]?.id || '';
    const mapped = catMap[catId] || { cat: 'bencana', badge: 'BENCANA', severity: 'info' };
    const geo = ev.geometry?.[0];
    const dt = geo?.date ? new Date(geo.date) : new Date();
    const coords = geo?.coordinates || [0, 0];
    const isID = coords[1] > -11 && coords[1] < 6 && coords[0] > 95 && coords[0] < 141;
    return {
      id: `eonet-${ev.id}`,
      datetime: dt.toISOString(), date: toDateStr(dt), time: toTimeUTC(dt),
      severity: mapped.severity, cat: mapped.cat, region: isID ? 'id' : 'global', badge: mapped.badge,
      title_id: ev.title, title_en: ev.title,
      desc_id: `Dipantau NASA EONET. Kategori: ${ev.categories?.[0]?.title || '-'}. Koordinat: ${coords[1].toFixed(2)}, ${coords[0].toFixed(2)}.`,
      desc_en: `Tracked by NASA EONET. Category: ${ev.categories?.[0]?.title || '-'}. Coords: ${coords[1].toFixed(2)}, ${coords[0].toFixed(2)}.`,
      source: 'NASA EONET', loc: `${coords[1].toFixed(1)}°, ${coords[0].toFixed(1)}°`,
      url: ev.sources?.[0]?.url || 'https://eonet.gsfc.nasa.gov',
      updates: [],
    };
  });
}

// ============================================================
// ReliefWeb (UN) — Laporan krisis & kemanusiaan
// ============================================================
// ============================================================
// ReliefWeb (UN) — API resmi laporan krisis kemanusiaan
// ============================================================
async function fetchReliefWeb() {
  // Simple GET — paling kompatibel, tidak perlu body
  const res = await fetchWithTimeout(
    'https://api.reliefweb.int/v1/reports?appname=crisismonitor&limit=15&sort[]=date:desc&fields[include][]=title&fields[include][]=date&fields[include][]=source&fields[include][]=country&fields[include][]=disaster_type&fields[include][]=url_alias',
    {
      headers: {
        'User-Agent': 'CrisisMonitor/1.0',
        'Accept': 'application/json',
      },
    }
  );
  const data = await res.json();
  const catMap = {
    'Flood':            { cat: 'bencana',   badge: 'BANJIR',     severity: 'warning'  },
    'Earthquake':       { cat: 'gempa',     badge: 'GEMPA',      severity: 'warning'  },
    'Conflict':         { cat: 'konflik',   badge: 'KONFLIK',    severity: 'critical' },
    'Epidemic':         { cat: 'wabah',     badge: 'WABAH',      severity: 'warning'  },
    'Tropical Cyclone': { cat: 'cuaca',     badge: 'SIKLON',     severity: 'critical' },
    'Drought':          { cat: 'bencana',   badge: 'KEKERINGAN', severity: 'warning'  },
    'Landslide':        { cat: 'bencana',   badge: 'LONGSOR',    severity: 'warning'  },
    'Volcano':          { cat: 'bencana',   badge: 'GUNUNG API', severity: 'warning'  },
    'Fire':             { cat: 'kebakaran', badge: 'KEBAKARAN',  severity: 'warning'  },
  };
  return (data?.data || []).map(item => {
    const f = item.fields;
    const dt = f.date?.created ? new Date(f.date.created) : new Date();
    const country = f.country?.[0]?.name || 'Global';
    const iso3 = f.country?.[0]?.iso3 || '';
    const dtype = f.disaster_type?.[0]?.name || '';
    const source = Array.isArray(f.source) ? f.source.map(s => s.name).join(', ') : 'ReliefWeb';
    const mapped = catMap[dtype] || { cat: 'bencana', badge: 'LAPORAN', severity: 'info' };
    return {
      id: `rw-${item.id}`,
      datetime: dt.toISOString(), date: toDateStr(dt), time: toTimeUTC(dt),
      severity: mapped.severity, cat: mapped.cat, region: iso3 === 'IDN' ? 'id' : 'global', badge: mapped.badge,
      title_id: f.title, title_en: f.title,
      desc_id: `Laporan dari ${source} mengenai situasi di ${country}.${dtype ? ' Tipe: ' + dtype + '.' : ''}`,
      desc_en: `Report from ${source} on the situation in ${country}.${dtype ? ' Type: ' + dtype + '.' : ''}`,
      source, loc: country,
      url: f.url_alias ? `https://reliefweb.int${f.url_alias}` : 'https://reliefweb.int',
      updates: [],
    };
  });
}

// ============================================================
// GDACS (UN) — RSS Feed bencana global
// ============================================================
async function fetchGDACS() {
  const res = await fetchWithTimeout('https://www.gdacs.org/xml/rss.xml');
  const text = await res.text();
  const items = [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 15);
  function extract(block, tag) {
    const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`));
    return m ? (m[1] || m[2] || '').trim() : '';
  }
  return items.map((m, i) => {
    const block = m[1];
    const title = extract(block, 'title');
    const desc  = extract(block, 'description').replace(/<[^>]*>/g, '').slice(0, 300);
    const link  = extract(block, 'link');
    const pub   = extract(block, 'pubDate');
    const dt    = pub ? new Date(pub) : new Date();
    const tl    = title.toLowerCase();
    const severity = tl.includes('red') ? 'critical' : tl.includes('orange') ? 'warning' : 'info';
    let cat = 'bencana', badge = 'BENCANA';
    if (tl.includes('earthquake'))                                          { cat = 'gempa';   badge = 'GEMPA'; }
    else if (tl.includes('cyclone')||tl.includes('hurricane')||tl.includes('typhoon')) { cat = 'cuaca'; badge = 'SIKLON'; }
    else if (tl.includes('flood'))                                          { cat = 'bencana'; badge = 'BANJIR'; }
    else if (tl.includes('volcano'))                                        { cat = 'bencana'; badge = 'GUNUNG API'; }
    const locMatch = title.match(/in\s+([A-Z][a-zA-Z\s,]+?)(?:\s+\(|$)/);
    return {
      id: `gdacs-${i}-${dt.getTime()}`,
      datetime: dt.toISOString(), date: toDateStr(dt), time: toTimeUTC(dt),
      severity, cat, region: 'global', badge,
      title_id: title, title_en: title,
      desc_id: desc || 'Peringatan bencana dari GDACS (UN).',
      desc_en: desc || 'Disaster alert from GDACS (UN).',
      source: 'GDACS', loc: locMatch ? locMatch[1].trim() : 'Global',
      url: link || 'https://gdacs.org',
      updates: [],
    };
  });
}

// ============================================================
// WHO — Wabah & kesehatan global (Disease Outbreak News)
// ============================================================
async function fetchWHO() {
  const urls = [
    'https://www.who.int/feeds/entity/csr/don/en/rss.xml',
    'https://www.who.int/rss-feeds/news-releases.xml',
  ];
  let text = '';
  for (const url of urls) {
    try {
      const res = await fetchWithTimeout(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 CrisisMonitor/1.0' }
      });
      text = await res.text();
      if (text.includes('<item>')) break;
    } catch(e) { continue; }
  }
  if (!text.includes('<item>')) return [];
  const keywords = ['outbreak','epidemic','disease','virus','mpox','cholera','dengue','ebola','flu','covid','plague','alert','health','infection'];
  const items = [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 20);
  function extract(block, tag) {
    const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`));
    return m ? (m[1] || m[2] || '').trim() : '';
  }
  return items
    .filter(m => keywords.some(k => m[1].toLowerCase().includes(k)))
    .slice(0, 8)
    .map((m, i) => {
      const block = m[1];
      const title = extract(block, 'title');
      const desc  = extract(block, 'description').replace(/<[^>]*>/g, '').trim().slice(0, 300);
      const link  = extract(block, 'link');
      const pub   = extract(block, 'pubDate');
      const dt    = pub ? new Date(pub) : new Date();
      const safedt = isNaN(dt) ? new Date() : dt;
      return {
        id: `who-${i}-${safedt.getTime()}`,
        datetime: safedt.toISOString(), date: toDateStr(safedt), time: toTimeUTC(safedt),
        severity: 'warning', cat: 'wabah', region: 'global', badge: 'WABAH',
        title_id: title, title_en: title,
        desc_id: desc || 'Rilis terbaru WHO terkait wabah atau kesehatan global.',
        desc_en: desc || 'Latest WHO release on outbreaks or global health.',
        source: 'WHO', loc: 'Global',
        url: link || 'https://who.int/health-topics/disease-outbreaks',
        updates: [],
      };
    });
}

// ============================================================
// NOAA / NHC — Badai tropis (skip jika tidak ada badai aktif)
// ============================================================
async function fetchNOAA() {
  const urls = [
    'https://www.nhc.noaa.gov/nhc_at1.xml',
    'https://www.nhc.noaa.gov/nhc_ep1.xml',
    'https://www.nhc.noaa.gov/nhc_cp1.xml',
  ];
  const allItems = [];
  function extract(block, tag) {
    const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`));
    return m ? (m[1] || m[2] || '').trim() : '';
  }
  for (const url of urls) {
    try {
      const res = await fetchWithTimeout(url);
      const text = await res.text();
      const items = [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 5);
      for (const m of items) {
        const block = m[1];
        const title = extract(block, 'title');
        // Skip "no current storm" entries
        if (!title || title.toLowerCase().includes('no current storm') || title.toLowerCase().includes('no tropical')) continue;
        const desc  = extract(block, 'description').replace(/<[^>]*>/g, '').trim().slice(0, 300);
        const link  = extract(block, 'link');
        const pub   = extract(block, 'pubDate');
        const dt    = pub ? new Date(pub) : new Date();
        const safedt = isNaN(dt) ? new Date() : dt;
        const tl    = title.toLowerCase();
        allItems.push({
          id: `noaa-${allItems.length}-${safedt.getTime()}`,
          datetime: safedt.toISOString(), date: toDateStr(safedt), time: toTimeUTC(safedt),
          severity: (tl.includes('warning')||tl.includes('hurricane')||tl.includes('typhoon')) ? 'critical' : 'warning',
          cat: 'cuaca', region: 'global', badge: 'BADAI',
          title_id: title, title_en: title,
          desc_id: desc || 'Peringatan cuaca ekstrem dari NOAA / National Hurricane Center.',
          desc_en: desc || 'Extreme weather alert from NOAA / National Hurricane Center.',
          source: 'NOAA / NHC', loc: 'Atlantik / Pasifik',
          url: link || 'https://www.nhc.noaa.gov',
          updates: [],
        });
      }
    } catch(e) { continue; }
  }
  // Kalau tidak ada badai aktif, return array kosong (normal, bukan error)
  return allItems;
}

// ============================================================
// OCHA (UN) — Situasi kemanusiaan & konflik (ganti ICRC yg 404)
// ReliefWeb sudah cover ini, OCHA pakai endpoint berbeda
// ============================================================
async function fetchICRC() {
  // Pakai ReliefWeb filter konflik sebagai sumber ICRC/konflik
  const body = JSON.stringify({
    preset: 'latest', limit: 10,
    filter: { field: 'disaster_type.name', value: 'Conflict' },
    fields: { include: ['title','date','source','country','url_alias'] },
    sort: ['date:desc'],
  });
  const res = await fetchWithTimeout('https://api.reliefweb.int/v1/reports?appname=crisismonitor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'User-Agent': 'CrisisMonitor/1.0' },
    body,
  });
  const data = await res.json();
  return (data?.data || []).map(item => {
    const f = item.fields;
    const dt = f.date?.created ? new Date(f.date.created) : new Date();
    const country = f.country?.[0]?.name || 'Global';
    const source = Array.isArray(f.source) ? f.source.map(s => s.name).join(', ') : 'OCHA';
    return {
      id: `icrc-rw-${item.id}`,
      datetime: dt.toISOString(), date: toDateStr(dt), time: toTimeUTC(dt),
      severity: 'warning', cat: 'konflik', region: 'global', badge: 'KONFLIK',
      title_id: f.title, title_en: f.title,
      desc_id: `Laporan konflik dari ${source} mengenai situasi di ${country}.`,
      desc_en: `Conflict report from ${source} on the situation in ${country}.`,
      source: source || 'OCHA / ReliefWeb', loc: country,
      url: f.url_alias ? `https://reliefweb.int${f.url_alias}` : 'https://reliefweb.int',
      updates: [],
    };
  });
}

// ============================================================
// International Crisis Group — Analisis konflik + bersihkan HTML
// ============================================================
async function fetchCrisisGroup() {
  const res = await fetchWithTimeout('https://www.crisisgroup.org/rss.xml', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CrisisMonitor/1.0)',
      'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    }
  });
  const text = await res.text();
  const items = [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 10);
  function extract(block, tag) {
    const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
    return m ? (m[1] || m[2] || '').trim() : '';
  }
  // Bersihkan HTML entities dan tags dari deskripsi
  function cleanHTML(str) {
    return str
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#\d+;/g, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  // Potong bagian awal yang berisi noise (username, timestamp, nav)
  function extractDesc(rawDesc, title) {
    let text = cleanHTML(rawDesc);
    // Hapus judul artikel yang diulang di awal
    if (text.startsWith(title)) text = text.slice(title.length).trim();
    // Hapus username editor (pendek, sebelum pola tanggal)
    text = text.replace(/^[a-z_]+\s+(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+/i, '');
    // Hapus pola tanggal di awal: "Mon, 03/16/2026 - 23:49"
    text = text.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+\d{2}\/\d{2}\/\d{4}\s+-\s+\d{2}:\d{2}\s+/i, '');
    // Hapus nama lokasi pendek di awal (mis. "Washington", "Tehran", "Lebanon") diikuti pola tanggal
    text = text.replace(/^\w[\w\s]{0,20}\s+(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+\d{2}\/\d{2}\/\d{4}[^a-zA-Z]*/i, '');
    // Hapus pola tanggal lagi setelah lokasi: "16 March 2026"
    text = text.replace(/^\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\s+/i, '');
    // Hapus nav links yang tersisa (tanda banyak kata kapital berurutan)
    text = text.replace(/Latest Updates Africa Asia-Pacific[\s\S]{0,200}My Reading List\s*/i, '');
    text = text.replace(/Latest Updates[\s\S]{0,100}Visual Explainers[\s\S]{0,50}My Reading List\s*/i, '');
    text = text.trim();
    if (!text || text.length < 30) return 'Analisis terbaru dari International Crisis Group tentang situasi konflik global.';
    return text.slice(0, 400);
  }
  return items.map((m, i) => {
    const block = m[1];
    const title = cleanHTML(extract(block, 'title'));
    const rawDesc = extract(block, 'description');
    const desc = extractDesc(rawDesc, title);
    const link  = extract(block, 'link');
    const pub   = extract(block, 'pubDate');
    let dt = new Date();
    if (pub) {
      const parsed = new Date(pub);
      if (!isNaN(parsed)) dt = parsed;
    }
    return {
      id: `icg-${i}-${dt.getTime()}`,
      datetime: dt.toISOString(), date: toDateStr(dt), time: toTimeUTC(dt),
      severity: 'info', cat: 'konflik', region: 'global', badge: 'ANALISIS',
      title_id: title, title_en: title,
      desc_id: desc,
      desc_en: desc,
      source: 'Crisis Group', loc: 'Global',
      url: link || 'https://crisisgroup.org',
      updates: [],
    };
  });
}

// ============================================================
// Al Jazeera — Berita konflik & kemanusiaan (ganti MSF yg 403)
// Sumber berita netral internasional dengan RSS publik
// ============================================================
async function fetchMSF() {
  const res = await fetchWithTimeout('https://www.aljazeera.com/xml/rss/all.xml', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CrisisMonitor/1.0)', 'Accept': 'application/rss+xml, text/xml' }
  });
  const text = await res.text();
  const keywords = ['war','conflict','attack','strike','killed','wounded','crisis','airstrike','military','troops','fighting','ceasefire','offensive','humanitarian','displaced','refugee','massacre','siege','bombing'];
  const items = [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 30);
  function extract(block, tag) {
    const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`));
    return m ? (m[1] || m[2] || '').trim() : '';
  }
  return items
    .filter(m => keywords.some(k => m[1].toLowerCase().includes(k)))
    .slice(0, 10)
    .map((m, i) => {
      const block = m[1];
      const title = extract(block, 'title');
      const desc  = extract(block, 'description').replace(/<[^>]*>/g, '').trim().slice(0, 400);
      const link  = extract(block, 'link');
      const pub   = extract(block, 'pubDate');
      const dt    = pub ? new Date(pub) : new Date();
      const safedt = isNaN(dt) ? new Date() : dt;
      const tl    = title.toLowerCase();
      const severity = (tl.includes('killed')||tl.includes('attack')||tl.includes('airstrike')||tl.includes('massacre')) ? 'critical' : 'warning';
      return {
        id: `aj-${i}-${safedt.getTime()}`,
        datetime: safedt.toISOString(), date: toDateStr(safedt), time: toTimeUTC(safedt),
        severity, cat: 'konflik', region: 'global', badge: 'KONFLIK',
        title_id: title, title_en: title,
        desc_id: desc || 'Laporan konflik terbaru dari Al Jazeera.',
        desc_en: desc || 'Latest conflict report from Al Jazeera.',
        source: 'Al Jazeera', loc: 'Global',
        url: link || 'https://aljazeera.com',
        updates: [],
      };
    });
}

// ============================================================
// PVMBG / MAGMA — fallback ke ReliefWeb volcano Indonesia
// ============================================================
async function fetchPVMBG() {
  const body = JSON.stringify({
    preset: 'latest', limit: 8,
    filter: { operator: 'AND', conditions: [
      { field: 'disaster_type.name', value: 'Volcano' },
      { field: 'country.name', value: 'Indonesia' },
    ]},
    fields: { include: ['title','date','source','country','url_alias'] },
    sort: ['date:desc'],
  });
  const res = await fetchWithTimeout('https://api.reliefweb.int/v1/reports?appname=crisismonitor', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'CrisisMonitor/1.0',
    },
    body,
  });
  const data = await res.json();
  return (data?.data || []).map(item => {
    const f = item.fields;
    const dt = f.date?.created ? new Date(f.date.created) : new Date();
    return {
      id: `pvmbg-rw-${item.id}`,
      datetime: dt.toISOString(), date: toDateStr(dt), time: toTimeUTC(dt),
      severity: 'warning', cat: 'bencana', region: 'id', badge: 'GUNUNG API',
      title_id: f.title, title_en: f.title,
      desc_id: 'Laporan aktivitas vulkanik Indonesia dari PVMBG / ReliefWeb.',
      desc_en: 'Indonesia volcanic activity report via PVMBG / ReliefWeb.',
      source: 'PVMBG / ReliefWeb', loc: 'Indonesia',
      url: f.url_alias ? `https://reliefweb.int${f.url_alias}` : 'https://magma.esdm.go.id',
      updates: [],
    };
  });
}

// ============================================================
// ACLED — Konflik & perang (butuh API key)
// ============================================================
async function fetchACLED() {
  const key   = process.env.ACLED_API_KEY;
  const email = process.env.ACLED_EMAIL;
  if (!key || !email) throw new Error('ACLED_API_KEY belum diset');
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const url = `https://api.acleddata.com/acled/read?key=${key}&email=${email}&event_date=${since}&event_date_where=>&limit=20&fields=event_date|event_type|actor1|country|location|notes|fatalities&event_type=Battles|Explosions%2FRemote+violence|Violence+against+civilians`;
  const res = await fetchWithTimeout(url);
  const data = await res.json();
  return (data?.data || []).map((ev, i) => {
    const dt = new Date(ev.event_date);
    const fatal = parseInt(ev.fatalities) || 0;
    return {
      id: `acled-${i}-${dt.getTime()}`,
      datetime: dt.toISOString(), date: toDateStr(dt), time: '00:00',
      severity: fatal > 0 ? 'critical' : 'warning',
      cat: 'konflik', region: 'global', badge: 'KONFLIK',
      title_id: `${ev.event_type} — ${ev.location}, ${ev.country}`,
      title_en: `${ev.event_type} — ${ev.location}, ${ev.country}`,
      desc_id: `${ev.notes || '-'}${fatal > 0 ? ` Korban jiwa: ${fatal}.` : ''}`,
      desc_en: `${ev.notes || '-'}${fatal > 0 ? ` Fatalities: ${fatal}.` : ''}`,
      source: 'ACLED', loc: `${ev.location}, ${ev.country}`,
      url: 'https://acleddata.com',
      updates: [],
    };
  });
}

// ============================================================
// UTILS
// ============================================================
async function fetchWithTimeout(url, options = {}, ms = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } finally {
    clearTimeout(timer);
  }
}
function toDateStr(dt) { return dt.toISOString().slice(0, 10); }
function toTimeWIB(dt) {
  return dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta', hour12: false });
}
function toTimeUTC(dt) {
  return dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false });
}
