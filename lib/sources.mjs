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

// 美股：一年日線，加上最近一個交易日的盤前、盤後最後成交價
async function yahooStock(symbol, dp) {
  const [hist, ext] = await Promise.all([yahoo(symbol, dp), extendedHours(symbol, dp)]);
  return {...hist, ext};
}

async function extendedHours(symbol, dp) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m&includePrePost=true`;
  const res = await fetch(url, {headers: {'User-Agent': 'Mozilla/5.0'}});
  if (!res.ok) return null;
  const r = (await res.json()).chart?.result?.[0];
  const period = r?.meta?.currentTradingPeriod;
  if (!r?.timestamp || !period) return null;
  const closes = r.indicators.quote[0].close;
  // 在某個時段內最後一筆有成交的價格
  const lastIn = ({start, end}) => {
    for (let i = r.timestamp.length - 1; i >= 0; i--) {
      const t = r.timestamp[i];
      if (t >= start && t < end && closes[i] != null) {
        return {price: +closes[i].toFixed(dp), time: new Date(t * 1000).toISOString()};
      }
    }
    return null;
  };
  const pre = lastIn(period.pre), post = lastIn(period.post);
  return {
    // 盤前和前一日收盤比，盤後和當日收盤比
    pre: pre && {...pre, base: r.meta.chartPreviousClose},
    post: post && {...post, base: r.meta.regularMarketPrice},
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
  goog: () => yahooStock('GOOG', 2),
  msft: () => yahooStock('MSFT', 2),
  avgo: () => yahooStock('AVGO', 2),
  aapl: () => yahooStock('AAPL', 2),
  nvda: () => yahooStock('NVDA', 2),
  mu: () => yahooStock('MU', 2),
  sox: () => yahoo('^SOX', 2),
  spcx: () => yahooStock('SPCX', 2),
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
