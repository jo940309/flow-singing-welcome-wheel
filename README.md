# 流行歌唱社｜社博任務轉盤

這是一個純靜態網頁，不需要資料庫、不需要後端。上傳到 GitHub Pages、Netlify、Cloudflare Pages 等靜態網站服務後，就能直接用網址在手機上玩。

## 你最常需要改的地方

### 1. 改任務、機率、歌名

編輯：`data/tasks.json`

每個任務都有：

- `label`：完整名稱
- `shortLabel`：轉盤上的短名稱，`\n` 代表換行
- `probability`：抽中機率／權重
- `description`：任務說明
- `items`：歌曲、音檔、接歌關鍵字、專輯封面資料

目前機率：20 + 13 + 7 + 10 + 20 + 20 + 10 = 100。
程式其實會自動依總權重計算，所以之後就算沒有剛好加到 100 也能正常抽，只是畫面顯示的 `%` 會照你填的數字。

### 2. 加入「聽前奏猜歌」音檔

把你有權使用的音檔放到：
`assets/audio/`

再到 `data/tasks.json` 找 `guess-intro`，新增：

```json
{
  "title": "歌名",
  "artist": "歌手",
  "audio": "assets/audio/你的檔名.mp3"
}
```

建議使用 `.mp3`、`.wav`、`.m4a` 等瀏覽器常見格式。檔名盡量使用英文、數字、底線，避免空白與特殊符號。

### 3. 加入「模仿專輯封面」圖片

把圖片放到：
`assets/covers/`

再到 `data/tasks.json` 找 `album-cover`，新增：

```json
{
  "title": "專輯名稱",
  "artist": "歌手名稱",
  "image": "assets/covers/cover_01.jpg"
}
```

建議使用正方形 JPG / PNG / WebP。

### 4. 設定入社單連結

在 `data/tasks.json` 最上方找到：

```json
"membershipFormUrl": ""
```

把它改成你的 Google Form 或其他入社表單網址，例如：

```json
"membershipFormUrl": "https://forms.gle/你的連結"
```

## 如何在自己電腦測試

因為網頁會讀取外部 JSON，直接雙擊 `index.html` 可能被瀏覽器擋住。

如果電腦有 Python，可在這個資料夾開終端機：

```bash
python -m http.server 8000
```

然後打開：
`http://localhost:8000`

## 如何變成「一個連結直接玩」

### 方法 A：GitHub Pages

1. 建立 GitHub repository。
2. 把本資料夾內所有檔案上傳到 repository 根目錄。
3. GitHub → Settings → Pages。
4. Source 選 `Deploy from a branch`，Branch 選 `main` / `/root`。
5. 等待部署完成後會得到公開網址。

### 方法 B：Netlify

1. 登入 Netlify。
2. 建立新的 Static site。
3. 上傳整個專案資料夾或連接 GitHub repository。
4. 部署後會自動得到網址。

## 資料夾結構

```text
flow_singing_wheel_game/
├─ index.html
├─ styles.css
├─ app.js
├─ data/
│  └─ tasks.json
└─ assets/
   ├─ audio/
   │  ├─ demo_intro_01.wav
   │  ├─ demo_intro_02.wav
   │  └─ demo_intro_03.wav
   └─ covers/
      ├─ demo_cover_01.svg
      ├─ demo_cover_02.svg
      └─ demo_cover_03.svg
```

## 現場使用建議

- 建議工作人員拿手機先測一次音量、封面顯示與入社單連結。
- 如果怕參加者一直重新抽，可以由工作人員操作「SPIN」；目前仍保留「重新抽一次」按鈕，方便活動現場彈性使用。
- 如果你不想允許重抽，可以直接在 `index.html` 刪掉 `id="reroll-button"` 那顆按鈕，或在 CSS 加 `#reroll-button { display:none; }`。
- 前奏音檔建議只放短片段，頁面載入會更快。

## 網站網址：

https://jo940309.github.io/flow-singing-welcome-wheel/

你現在可以直接用瀏覽器打開這個網址測試。

之後你在本機修改遊戲，只要：

git add .
git commit -m "Update game"
git push origin main

GitHub Pages 就會自動重新部署，不需要重新設定 Pages。
