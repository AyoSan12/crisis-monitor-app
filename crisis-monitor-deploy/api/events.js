// ============================================================
// Crisis Monitor — API handler
// Fetches from: BMKG, USGS, NASA EONET, ReliefWeb
// Runs on Vercel serverless (Node.js)
// ============================================================

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const [bmkg, usgs, eonet, reliefweb] = await Promise.allSettled([
    fetchBMKG(),
    fetchUSGS(),
    fetchEONET(),
    fetchReliefWeb(),
  ]);

  const sources = { bmkg: 'ok', usgs: 'ok', eonet: 'ok', reliefweb: 'ok' };
  if (bmkg.status === 'rejected') sources.bmkg = bmkg.reason?.message || 'error';
  if (usgs.status === 'rejected') sources.usgs = usgs.reason?.message || 'error';
  if (eonet.status === 'rejected') sources.eonet = eonet.reason?.message || 'error';
  if (reliefweb.status === 'rejected') sources.reliefweb = reliefweb.reason?.message || 'error';

  const events = [
    ...(bmkg.status === 'fulfilled' ? bmkg.value : []),
    ...(usgs.status === 'fulfilled' ? usgs.value : []),
    ...(eonet.status === 'fulfilled' ? eonet.value : []),
    ...(reliefweb.status === 'fulfilled' ? reliefweb.value : []),
  ].sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

  res.status(200).json({ events, updated: new Date().toISOString(), sources });
};

// ============================================================
// BMKG — Gempa terkini Indonesia
// ============================================================
async function fetchBMKG() {
  const url = 'https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json';
  const res = await fetchWithTimeout(url);
  const data = await res.json();
  const gempaList = data?.Infogempa?.gempa || [];

  return gempaList.map((g, i) => {
    const mag = parseFloat(g.Magnitude) || 0;
    const severity = mag >= 6.0 ? 'critical' : mag >= 5.0 ? 'warning' : 'info';
    const dt = g.DateTime ? new Date(g.DateTime) : new Date();
    const hasPotensiTsunami = g.Potensi && g.Potensi.toLowerCase().includes('potensi tsunami');

    return {
      id: `bmkg-${i}-${dt.getTime()}`,
      datetime: dt.toISOString(),
      date: toDateStr(dt),
      time: toTimeWIB(dt),
      severity,
      cat: 'gempa',
      region: 'id',
      badge: 'GEMPA',
      title_id: `Gempa M${g.Magnitude} — ${g.Wilayah}`,
      title_en: `M${g.Magnitude} Earthquake — ${g.Wilayah}`,
      desc_id: `Kedalaman ${g.Kedalaman}. ${g.Potensi || ''}. ${g.Dirasakan ? 'Dirasakan: ' + g.Dirasakan : ''}`.trim(),
      desc_en: `Depth ${g.Kedalaman}. ${g.Potensi || ''}`.trim(),
      source: 'BMKG',
      loc: g.Wilayah || 'Indonesia',
      url: 'https://bmkg.go.id/gempabumi/gempabumi-terkini.bmkg',
      updates: hasPotensiTsunami ? [{ time: toTimeWIB(dt), text: '⚠ Potensi tsunami — ikuti arahan BMKG dan BPBD setempat.', border: 'red-border' }] : [],
    };
  });
}

// ============================================================
// USGS — Gempa global M4.5+
// ============================================================
async function fetchUSGS() {
  const url = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=4.5&limit=20&orderby=time';
  const res = await fetchWithTimeout(url);
  const data = await res.json();
  const features = data?.features || [];

  return features.map(f => {
    const p = f.properties;
    const mag = p.mag || 0;
    const severity = mag >= 6.5 ? 'critical' : mag >= 5.5 ? 'warning' : 'info';
    const dt = new Date(p.time);
    const isIndonesia = p.place?.toLowerCase().includes('indonesia') ||
      (f.geometry?.coordinates?.[1] > -11 && f.geometry?.coordinates?.[1] < 6 &&
       f.geometry?.coordinates?.[0] > 95 && f.geometry?.coordinates?.[0] < 141);

    return {
      id: `usgs-${f.id}`,
      datetime: dt.toISOString(),
      date: toDateStr(dt),
      time: toTimeUTC(dt),
      severity,
      cat: 'gempa',
      region: isIndonesia ? 'id' : 'global',
      badge: 'GEMPA',
      title_id: `Gempa M${mag.toFixed(1)} — ${p.place}`,
      title_en: `M${mag.toFixed(1)} Earthquake — ${p.place}`,
      desc_id: `Magnitudo ${mag.toFixed(1)} tercatat oleh USGS. ${p.tsunami ? 'Peringatan tsunami mungkin dikeluarkan.' : 'Tidak ada peringatan tsunami.'}`,
      desc_en: `Magnitude ${mag.toFixed(1)} recorded by USGS. ${p.tsunami ? 'Tsunami warning may be issued.' : 'No tsunami warning issued.'}`,
      source: 'USGS',
      loc: p.place || 'Unknown location',
      url: p.url || 'https://earthquake.usgs.gov',
      updates: [],
    };
  });
}

// ============================================================
// NASA EONET — Bencana aktif (kebakaran, badai, gunung berapi)
// ============================================================
async function fetchEONET() {
  const url = 'https://eonet.gsfc.nasa.gov/api/v3/events?limit=20&status=open&days=7';
  const res = await fetchWithTimeout(url);
  const data = await res.json();
  const evList = data?.events || [];

  return evList.map((ev, i) => {
    const cat = ev.categories?.[0]?.id || '';
    const catMap = {
      wildfires: { cat: 'kebakaran', badge: 'KARHUTLA', severity: 'warning' },
      severeStorms: { cat: 'cuaca', badge: 'BADAI', severity: 'warning' },
      volcanoes: { cat: 'bencana', badge: 'GUNUNG API', severity: 'warning' },
      seaLakeIce: { cat: 'cuaca', badge: 'CUACA', severity: 'info' },
      floods: { cat: 'bencana', badge: 'BANJIR', severity: 'warning' },
      landslides: { cat: 'bencana', badge: 'LONGSOR', severity: 'warning' },
    };
    const mapped = catMap[cat] || { cat: 'bencana', badge: 'BENCANA', severity: 'info' };

    const geo = ev.geometry?.[0];
    const dt = geo?.date ? new Date(geo.date) : new Date();
    const coords = geo?.coordinates || [0, 0];
    const isIndonesia = coords[1] > -11 && coords[1] < 6 && coords[0] > 95 && coords[0] < 141;

    return {
      id: `eonet-${ev.id}`,
      datetime: dt.toISOString(),
      date: toDateStr(dt),
      time: toTimeUTC(dt),
      severity: mapped.severity,
      cat: mapped.cat,
      region: isIndonesia ? 'id' : 'global',
      badge: mapped.badge,
      title_id: ev.title,
      title_en: ev.title,
      desc_id: `Kejadian aktif dipantau NASA EONET. Kategori: ${ev.categories?.[0]?.title || 'Tidak diketahui'}. Koordinat: ${coords[1].toFixed(2)}, ${coords[0].toFixed(2)}.`,
      desc_en: `Active event monitored by NASA EONET. Category: ${ev.categories?.[0]?.title || 'Unknown'}. Coordinates: ${coords[1].toFixed(2)}, ${coords[0].toFixed(2)}.`,
      source: 'NASA EONET',
      loc: `${coords[1].toFixed(1)}°, ${coords[0].toFixed(1)}°`,
      url: ev.link || ev.sources?.[0]?.url || 'https://eonet.gsfc.nasa.gov',
      updates: [],
    };
  });
}

// ============================================================
// ReliefWeb (UN) — Laporan krisis & kemanusiaan global
// ============================================================
async function fetchReliefWeb() {
  const url = 'https://api.reliefweb.int/v1/reports?appname=crisismonitor&profile=list&preset=latest&limit=15&fields[include][]=title&fields[include][]=date&fields[include][]=source&fields[include][]=country&fields[include][]=disaster_type&fields[include][]=url_alias';
  const res = await fetchWithTimeout(url);
  const data = await res.json();
  const items = data?.data || [];

  return items.map(item => {
    const f = item.fields;
    const dt = f.date?.created ? new Date(f.date.created) : new Date();
    const country = f.country?.[0]?.name || 'Global';
    const iso3 = f.country?.[0]?.iso3 || '';
    const isIndonesia = iso3 === 'IDN';
    const disasterType = f.disaster_type?.[0]?.name || '';
    const source = f.source?.map(s => s.name).join(', ') || 'ReliefWeb';

    const catMap = {
      'Flood': { cat: 'bencana', badge: 'BANJIR', severity: 'warning' },
      'Earthquake': { cat: 'gempa', badge: 'GEMPA', severity: 'warning' },
      'Conflict': { cat: 'konflik', badge: 'KONFLIK', severity: 'critical' },
      'Epidemic': { cat: 'wabah', badge: 'WABAH', severity: 'warning' },
      'Tropical Cyclone': { cat: 'cuaca', badge: 'SIKLON', severity: 'critical' },
      'Drought': { cat: 'bencana', badge: 'KEKERINGAN', severity: 'warning' },
      'Landslide': { cat: 'bencana', badge: 'LONGSOR', severity: 'warning' },
      'Volcano': { cat: 'bencana', badge: 'GUNUNG API', severity: 'warning' },
      'Fire': { cat: 'kebakaran', badge: 'KEBAKARAN', severity: 'warning' },
    };
    const mapped = catMap[disasterType] || { cat: 'bencana', badge: 'LAPORAN', severity: 'info' };

    return {
      id: `rw-${item.id}`,
      datetime: dt.toISOString(),
      date: toDateStr(dt),
      time: toTimeUTC(dt),
      severity: mapped.severity,
      cat: mapped.cat,
      region: isIndonesia ? 'id' : 'global',
      badge: mapped.badge,
      title_id: f.title,
      title_en: f.title,
      desc_id: `Laporan dari ${source} mengenai situasi di ${country}. ${disasterType ? 'Tipe bencana: ' + disasterType + '.' : ''}`,
      desc_en: `Report from ${source} on the situation in ${country}. ${disasterType ? 'Disaster type: ' + disasterType + '.' : ''}`,
      source,
      loc: country,
      url: f.url_alias ? `https://reliefweb.int${f.url_alias}` : 'https://reliefweb.int',
      updates: [],
    };
  });
}

// ============================================================
// UTILS
// ============================================================
async function fetchWithTimeout(url, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function toDateStr(dt) {
  return dt.toISOString().slice(0, 10);
}

function toTimeWIB(dt) {
  return dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta', hour12: false });
}

function toTimeUTC(dt) {
  return dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false });
}
