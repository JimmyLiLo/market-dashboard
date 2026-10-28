# Jimmy 市場儀表板

網址：https://jimmylilo.github.io/market-dashboard/

追蹤五個指標：美國10年期公債殖利率、布蘭特原油、富台指期、台股加權指數、美國5年期CDS。

## 數據怎麼更新

- **自動（預設）**：GitHub Actions 每 15 分鐘跑一次 `scripts/fetch.mjs`，抓 Yahoo Finance 和 HiStock 的數字，再重新部署網站。也可以到 repo 的 Actions 頁面按「Run workflow」立刻跑一次。
- **美國5年期CDS**：資料來源 worldgovernmentbonds.com 不允許程式自動抓取，所以要手動更新 `site/data/us_cds5y.csv`（欄位 `date,bps`）。在 GitHub 網頁上直接編輯這個檔案、存檔，網站就會更新。

## 改成「打開網頁就即時抓」（Cloudflare Worker）

1. 註冊免費的 Cloudflare 帳號。
2. 在這個資料夾執行：
   ```bash
   npx wrangler login
   npx wrangler deploy
   ```
3. 把部署後顯示的網址（例如 `https://market-api.xxx.workers.dev`）填進 `site/config.js` 的 `api`，推上 GitHub。

## 新增指標或頁面

- 指標：在 `lib/sources.mjs` 的 `FETCHERS` 加抓取方式，再到 `site/indicators.js` 的 `MK_INDICATORS` 加顯示設定。
- 頁面：在 `site/indicators.js` 的 `MK_PAGES` 加一筆，並在 `site/index.html` 加上 `<section class="page" id="page-頁面id">`。

## 本機預覽

```bash
node scripts/fetch.mjs && python3 -m http.server 8765 -d site
```
