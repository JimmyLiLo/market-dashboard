// 排程爬蟲：抓最新數字寫到 site/data/market.json。
// 某個來源這次抓失敗時，沿用上一次成功的資料，網頁不會整塊空掉。
import {readFile, writeFile} from 'node:fs/promises';
import {fetchAll} from '../lib/sources.mjs';

const file = new URL('../site/data/market.json', import.meta.url);

let prev = {series: {}};
try {
  prev = JSON.parse(await readFile(file, 'utf8'));
} catch {}

const next = await fetchAll();
for (const [id, msg] of Object.entries(next.errors)) {
  console.warn(`! ${id}: ${msg}`);
  if (prev.series?.[id]) next.series[id] = {...prev.series[id], stale: true};
}

await writeFile(file, JSON.stringify(next));
for (const [id, s] of Object.entries(next.series)) {
  const last = s.rows.at(-1);
  console.log(`${id}: ${s.rows.length} 筆，最新 ${last?.[0]} = ${last?.[1]}${s.stale ? '（沿用舊資料）' : ''}`);
}
if (Object.keys(next.series).length === 0) process.exit(1);
