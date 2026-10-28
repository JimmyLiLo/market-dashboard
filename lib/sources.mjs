// 抓資料的共用程式：GitHub Actions 的排程爬蟲（scripts/fetch.mjs）和 Cloudflare Worker（worker/index.mjs）都用這支。
// 新增指標：在 FETCHERS 加一筆，再到 site/indicators.js 加上顯示設定。

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const ymd = (ms, offsetSec = 0) => new Date(ms + offsetSec * 1000).toISOString().slice(0, 10);

// Yahoo Finance 一年日線，並把盤中最新價放進今天那一筆
async function yahoo(symbol, dp) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d`;
  // Yahoo 對完整的瀏覽器 User-Agent 會回 429，用簡短的就正常
  const res = await fetch(url, {headers: {'User-Agent': 'Mozilla/5.0'}});
  if (!res.ok) throw new Error(`Yahoo ${symbol} HTTP ${res.status}`);
  const r = (await res.json()).chart?.result?.[0];
  if (!r) throw new Error(`Yahoo ${symbol} 沒有資料`);
  const off = r.meta.gmtoffset ?? 0;
  const closes = r.indicators.quote[0].close;
  const byDate = new Map();
  r.timestamp.forEach((t, i) => {
    if (closes[i] != null) byDate.set(ymd(t * 1000, off), +closes[i].toFixed(dp));
  });
  const price = r.meta.regularMarketPrice, time = r.meta.regularMarketTime;
  if (price != null && time) byDate.set(ymd(time * 1000, off), +price.toFixed(dp));
  return {
    rows: [...byDate].sort((a, b) => (a[0] < b[0] ? -1 : 1)),
    asOf: time ? new Date(time * 1000).toISOString() : null,
  };
}

// HiStock 富台期（TWN）頁面裡的日K資料
async function histockTWN() {
  const res = await fetch('https://histock.tw/index-tw/TWN', {headers: {'User-Agent': UA}});
  if (!res.ok) throw new Error(`HiStock HTTP ${res.status}`);
  const html = await res.text();
  // OHLC 那組資料每筆有 5 個數字：[時間, 開, 高, 低, 收]
  const m = [...html.matchAll(/data:\s*(\[\[\d{13}(?:,[\d.]+){4}\][\s\S]*?\]\])/g)][0];
  if (!m) throw new Error('HiStock 頁面格式改了，找不到富台期日K');
  const arr = JSON.parse(m[1]);
  const rows = arr.map((a) => [ymd(a[0], 8 * 3600), a[4]]);
  return {rows, asOf: null};
}

export const FETCHERS = {
  us10y: () => yahoo('^TNX', 3),
  brent: () => yahoo('BZ=F', 2),
  taiex: () => yahoo('^TWII', 2),
  ftse_tw: () => histockTWN(),
};

// 抓全部指標；單一來源失敗不影響其他
export async function fetchAll() {
  const out = {updatedAt: new Date().toISOString(), series: {}, errors: {}};
  await Promise.all(Object.entries(FETCHERS).map(async ([id, fn]) => {
    try {
      out.series[id] = await fn();
    } catch (e) {
      out.errors[id] = String(e.message || e);
    }
  }));
  return out;
}
