// 指標與頁面設定。新增指標：在 INDICATORS 加一筆（id 要和 lib/sources.mjs 的 FETCHERS 對上，
// 或用 csv 指向 site/data 裡手動維護的檔案）。新增頁面：在 PAGES 加一筆。
// 市場總覽裡的分頁
window.MK_TABS = [
  {id: 'macro', name: '總體經濟'},
  {id: 'us', name: '美股'},
];

window.MK_GROUPS = [
  {id: 'tw', name: '台股', tab: 'macro'},
  {id: 'usrates', name: '美國利率與信用', tab: 'macro'},
  {id: 'fx', name: '匯率', tab: 'macro'},
  {id: 'commodity', name: '商品', tab: 'macro'},
  {id: 'semi', name: '半導體', tab: 'us'},
  {id: 'bigtech', name: '科技巨頭', tab: 'us'},
  {id: 'space', name: '太空', tab: 'us'},
];

window.MK_INDICATORS = [
  {id: 'us10y', name: '美國10年期公債殖利率', short: '美債10年', unit: '%', dp: 3, changeIn: 'bp', group: 'usrates',
    note: 'CBOE 10年期公債殖利率指數（^TNX），來源 Yahoo Finance。'},
  {id: 'brent', name: '布蘭特原油期貨', short: '布蘭特原油', unit: '美元/桶', dp: 2, group: 'commodity',
    note: 'ICE 布蘭特原油近月期貨（BZ=F），來源 Yahoo Finance。'},
  {id: 'gold', name: '黃金期貨', short: '黃金', unit: '美元/盎司', dp: 2, group: 'commodity',
    note: 'COMEX 黃金近月期貨（GC=F），來源 Yahoo Finance。'},
  {id: 'dxy', name: '美元指數', short: '美元指數', unit: '點', dp: 3, group: 'fx',
    note: 'ICE 美元指數（DXY，DX-Y.NYB），美元對六種主要貨幣，來源 Yahoo Finance。'},
  {id: 'usdtwd', name: '美元兌台幣', short: '台幣匯率', unit: '台幣', dp: 3, group: 'fx',
    note: '1 美元可換多少台幣（TWD=X），數字上升代表台幣貶值，來源 Yahoo Finance。'},
  {id: 'ftse_tw', name: '富台指期（SGX TWN）', short: '富台指', unit: '點', dp: 2, group: 'tw',
    note: '新加坡交易所富時台灣指數期貨，來源 HiStock。2026/7/20 上市，資料自 7/31 起。'},
  {id: 'taiex', name: '台股加權指數', short: '加權指數', unit: '點', dp: 2, group: 'tw',
    note: 'TAIEX（^TWII），來源 Yahoo Finance。'},
  {id: 'us_cds5y', name: '美國5年期CDS', short: '美國5年CDS', unit: 'bp', dp: 2, group: 'usrates', csv: 'data/us_cds5y.csv',
    note: '美國主權5年期信用違約交換利差，來源 worldgovernmentbonds.com，手動更新 site/data/us_cds5y.csv。'},

  {id: 'sox', name: '費城半導體指數（SOX）', short: '費半', unit: '點', dp: 2, group: 'semi',
    note: 'PHLX 半導體指數（^SOX），來源 Yahoo Finance。指數沒有盤前盤後交易。'},
  {id: 'nvda', name: '輝達（NVDA）', short: '輝達', unit: '美元', dp: 2, group: 'semi', ext: true,
    note: 'NVIDIA，NASDAQ: NVDA，來源 Yahoo Finance。'},
  {id: 'avgo', name: '博通（AVGO）', short: '博通', unit: '美元', dp: 2, group: 'semi', ext: true,
    note: 'Broadcom，NASDAQ: AVGO，來源 Yahoo Finance。'},
  {id: 'mu', name: '美光（MU）', short: '美光', unit: '美元', dp: 2, group: 'semi', ext: true,
    note: 'Micron Technology，NASDAQ: MU，來源 Yahoo Finance。'},
  {id: 'goog', name: 'Alphabet C（GOOG）', short: 'Google', unit: '美元', dp: 2, group: 'bigtech', ext: true,
    note: 'Alphabet Class C，NASDAQ: GOOG，來源 Yahoo Finance。'},
  {id: 'msft', name: '微軟（MSFT）', short: '微軟', unit: '美元', dp: 2, group: 'bigtech', ext: true,
    note: 'Microsoft，NASDAQ: MSFT，來源 Yahoo Finance。'},
  {id: 'aapl', name: '蘋果（AAPL）', short: '蘋果', unit: '美元', dp: 2, group: 'bigtech', ext: true,
    note: 'Apple，NASDAQ: AAPL，來源 Yahoo Finance。'},
  {id: 'spcx', name: 'SpaceX（SPCX）', short: 'SpaceX', unit: '美元', dp: 2, group: 'space', ext: true,
    note: 'Space Exploration Technologies，SPCX，來源 Yahoo Finance。上市未滿一年，資料從上市日開始。'},
];

window.MK_PAGES = [
  {id: 'market', name: '市場總覽'},
];
