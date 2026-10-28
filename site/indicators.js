// 指標與頁面設定。新增指標：在 INDICATORS 加一筆（id 要和 lib/sources.mjs 的 FETCHERS 對上，
// 或用 csv 指向 site/data 裡手動維護的檔案）。新增頁面：在 PAGES 加一筆。
window.MK_GROUPS = [
  {id: 'tw', name: '台股'},
  {id: 'us', name: '美國利率與信用'},
  {id: 'commodity', name: '商品'},
];

window.MK_INDICATORS = [
  {id: 'us10y', name: '美國10年期公債殖利率', short: '美債10年', unit: '%', dp: 3, changeIn: 'bp', group: 'us',
    note: 'CBOE 10年期公債殖利率指數（^TNX），來源 Yahoo Finance。'},
  {id: 'brent', name: '布蘭特原油期貨', short: '布蘭特原油', unit: '美元/桶', dp: 2, group: 'commodity',
    note: 'ICE 布蘭特原油近月期貨（BZ=F），來源 Yahoo Finance。'},
  {id: 'ftse_tw', name: '富台指期（SGX TWN）', short: '富台指', unit: '點', dp: 2, group: 'tw',
    note: '新加坡交易所富時台灣指數期貨，來源 HiStock。2026/7/20 上市，資料自 7/31 起。'},
  {id: 'taiex', name: '台股加權指數', short: '加權指數', unit: '點', dp: 2, group: 'tw',
    note: 'TAIEX（^TWII），來源 Yahoo Finance。'},
  {id: 'us_cds5y', name: '美國5年期CDS', short: '美國5年CDS', unit: 'bp', dp: 2, group: 'us', csv: 'data/us_cds5y.csv',
    note: '美國主權5年期信用違約交換利差，來源 worldgovernmentbonds.com，手動更新 site/data/us_cds5y.csv。'},
];

window.MK_PAGES = [
  {id: 'market', name: '市場總覽'},
];
