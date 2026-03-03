# 🛍️ GroceryScout

Best grocery prices + coupons across 9 stores, powered by Claude AI.

---

## 🚀 Deploy to GitHub Pages (step by step)

### 1. Install dependencies
```bash
cd groceryscout
npm install
```

### 2. Update vite.config.js with your repo name
Open `vite.config.js` and change `base` to match your GitHub repo name:
```js
base: '/YOUR-REPO-NAME/',
```
For example if your repo is `github.com/yourname/groceryscout`, use `/groceryscout/`.

### 3. Update package.json with your GitHub info
Add a `homepage` field to `package.json`:
```json
"homepage": "https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPO-NAME"
```

### 4. Create a GitHub repo
- Go to github.com → New repository
- Name it `groceryscout` (or whatever you like)
- Keep it public
- Don't add a README (you already have one)

### 5. Push your code
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git push -u origin main
```

### 6. Deploy to GitHub Pages
```bash
npm run deploy
```
This builds the app and pushes it to a `gh-pages` branch automatically.

### 7. Enable GitHub Pages
- Go to your repo on GitHub
- Settings → Pages
- Source: Deploy from branch → `gh-pages` → `/ (root)`
- Click Save

Your app will be live at:
**https://YOUR-USERNAME.github.io/YOUR-REPO-NAME**

(Takes 1-2 minutes to go live the first time.)

---

## 📱 Add to your phone home screen

### iPhone (Safari)
1. Open your app URL in **Safari**
2. Tap the **Share** button (box with arrow)
3. Tap **"Add to Home Screen"**
4. Tap **Add**

### Android (Chrome)
1. Open your app URL in **Chrome**
2. Tap the **3-dot menu**
3. Tap **"Add to Home Screen"**
4. Tap **Add**

The app will appear as a full-screen icon — no browser chrome, just like a native app!

---

## 🔑 API Key
On first launch the app will ask for your Anthropic API key.
Get one at: https://console.anthropic.com/settings/keys

Your key is stored only on your device (localStorage) and sent directly to Anthropic — never to any third party.

---

## 🔄 Updating the app
After making changes:
```bash
npm run deploy
```
That's it — changes go live in ~1 minute.
