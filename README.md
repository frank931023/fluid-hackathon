> 📦 **Latest Version:** Final release available on the `weihong` branch  
> 本專案的最終版本已完成並更新於 `weihong` 分支，包含所有功能與修正。  
> 建議以此分支為主要版本進行檢視與部署。
# FluidPay - RWA 借貸協議

[![整合狀態](https://img.shields.io/badge/整合狀態-✅_完成-brightgreen)]()
[![前端](https://img.shields.io/badge/前端-Vue_3-42b883)]()
[![智能合約](https://img.shields.io/badge/智能合約-Solidity-363636)]()
[![區塊鏈](https://img.shields.io/badge/區塊鏈-Ethereum-627eea)]()

> 基於真實世界資產（RWA）抵押的去中心化借貸協議

## ✨ 功能特色

- 🏦 **抵押借貸**: 使用代幣化的真實世界資產（tTSLA）作為抵押品借取穩定幣（mUSDC）
- 🔐 **白名單管理**: 符合 ERC-3643 標準的 KYC/AML 合規要求
- 📊 **健康度監控**: 實時計算和顯示貸款健康度，預防清算風險
- ⚡ **即時交易**: 基於智能合約的自動化借貸流程
- 💰 **清算機制**: 80% 清算門檻保護協議安全
- 🎨 **現代 UI**: 基於 Vue 3 和 Tailwind CSS 的響應式前端

## 🎯 核心參數

- **LTV (Loan-to-Value)**: 50% - 可借到抵押品價值的一半
- **清算門檻**: 80% - 健康度低於 80% 時可被清算
- **支持資產**: tTSLA (Tokenized Tesla Stock) 作為抵押品
- **借貸代幣**: mUSDC (Mock USDC) 穩定幣

## 🚀 快速開始

### 前置要求
- Node.js >= 16
- npm 或 yarn
- MetaMask 瀏覽器擴展

### 三步啟動

1. **啟動區塊鏈節點**（終端 1）
   ```bash
   npx hardhat node
   ```

2. **部署合約**（終端 2）
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

3. **啟動前端**（終端 3）
   ```bash
   cd frontend && npm run dev
   ```

訪問 http://localhost:5173 開始使用！

📖 **詳細指南**: 查看 [快速啟動指南](QUICKSTART.md)

## 📚 文檔

- 🚀 [快速啟動指南](QUICKSTART.md) - 5 分鐘快速上手
- 📖 [前端整合說明](frontend/README_INTEGRATION.md) - 詳細的使用和開發指南
- 📋 [整合完成總結](INTEGRATION_SUMMARY.md) - 技術架構和實現細節
- ✅ [整合檢查清單](INTEGRATION_CHECKLIST.md) - 功能完成度檢查
- 🔧 [後端整合指南](FRONTEND_INTEGRATION.md) - 合約 API 參考

## 🏗️ 技術架構

```
┌─────────────────────────────────────────┐
│          Vue 3 前端應用                  │
│  ┌──────────┬──────────┬──────────┐    │
│  │ Wallet   │  Loan    │ Payment  │    │
│  │  View    │  View    │  View    │    │
│  └────┬─────┴────┬─────┴────┬─────┘    │
│       │          │          │           │
│  ┌────┴──────────┴──────────┴─────┐    │
│  │      Composables (業務邏輯)      │    │
│  │  useWallet  │  useLoans         │    │
│  └────────────┬──────────┬─────────┘    │
│               │          │               │
│  ┌────────────┴──────────┴─────────┐    │
│  │   Services (合約交互層)          │    │
│  │   contracts.ts (ethers.js)      │    │
│  └────────────┬──────────┬─────────┘    │
└───────────────┼──────────┼─────────────┘
                │          │
┌───────────────┴──────────┴─────────────┐
│       Ethereum Smart Contracts          │
│  ┌──────────┬──────────┬──────────┐    │
│  │  USDC    │   RWA    │  Oracle  │    │
│  │  Token   │  Token   │          │    │
│  └──────────┴──────────┴──────────┘    │
│  ┌──────────────────────────────┐      │
│  │   FluidPay Lending Pool      │      │
│  └──────────────────────────────┘      │
└─────────────────────────────────────────┘
```

## 💡 主要功能

### 1. 錢包管理
- 連接 MetaMask
- 查看 ETH、mUSDC、tTSLA 餘額
- 自動刷新資產數據

### 2. 白名單驗證
- KYC/AML 合規檢查
- 一鍵加入白名單
- 狀態可視化提示

### 3. 抵押借款
- 自動計算所需抵押品
- 餘額驗證
- 兩步交易確認（授權 + 執行）

### 4. 貸款管理
- 實時顯示貸款數據
- 健康度監控
- 風險指標展示
- 價格歷史圖表

### 5. 還款功能
- 部分還款
- 完全還款
- 餘額檢查
- 一鍵最大化

### 6. 清算機制
- 自動識別不健康貸款
- 清算獎勵機制
- 健康度預警

## 🛠️ 技術棧

### 智能合約
- Solidity ^0.8.27
- Hardhat 開發框架
- OpenZeppelin 合約庫
- ERC-20 代幣標準
- ERC-3643 合規標準

### 前端
- Vue 3 (Composition API)
- TypeScript
- Tailwind CSS 4
- ethers.js v6
- Vue Router
- Pinia (狀態管理)

### 開發工具
- Hardhat
- Vite
- ESLint
- TypeScript Compiler

## 📊 合約地址（本地測試網）

部署後地址示例（每次部署會變化）:
- Mock_USDC: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- Mock_RWA_Token: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
- Mock_PriceOracle: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
- FluidPay_LendingPool: `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`

## 🧪 測試

### 運行合約測試
```bash
npx hardhat test
```

### 驗證整合
```bash
./check-integration.sh
```

## 📈 使用流程

1. **連接錢包** → 選擇 MetaMask 帳戶
2. **加入白名單** → 點擊加入白名單按鈕
3. **查看資產** → 在 Wallet 頁面查看餘額
4. **抵押借款** → 在 Loan 頁面執行借款
5. **監控貸款** → 在 Payment 頁面查看健康度
6. **執行還款** → 點擊 Repay Now 還款

## 🔒 安全特性

- ✅ 白名單準入控制
- ✅ 健康度檢查機制
- ✅ 輸入驗證和餘額檢查
- ✅ 兩步授權流程
- ✅ 清算保護機制
- ✅ Gas 估算和優化

## 🌟 未來路線圖

- [ ] 支持多種 RWA 資產
- [ ] 整合 Chainlink 價格預言機
- [ ] Layer 2 部署
- [ ] 移動端應用
- [ ] 清算機器人
- [ ] DAO 治理
- [ ] 跨鏈橋接

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

MIT License

---

## 開發者說明 — 如何啟動此專案、部署合約，並讓前端使用合約資料

下面內容針對 Windows / PowerShell，說明如何從零到有啟動本地 Hardhat 節點、部署合約、產生前端專用的 `contract-config.js`，以及前端可以呼叫的主要函式與使用範例。

## 先決條件
- Node.js (16+ 建議)
- npm
- 建議在專案根目錄使用 PowerShell

## 1) 安裝相依套件
在專案根目錄執行：

```powershell
npm install
```

（package.json 已列出 `hardhat`、`@nomicfoundation/hardhat-toolbox`、`@openzeppelin/contracts` 等開發依賴。）

## 2) 本地編譯合約
編譯會在 `artifacts/` 產生 ABI 與 bytecode：

```powershell
npx hardhat compile
```

## 3) 啟動本地節點（Hardhat node）
在一個 terminal 執行本地節點（保留此視窗打開以模擬區塊鏈）：

```powershell
npx hardhat node
```

Hardhat node 會暴露 RPC: http://127.0.0.1:8545 並載入測試帳號（可匯入到 MetaMask 測試）。

## 4) 部署合約並建立 Demo 環境
部署合約並執行自動化的「seed」步驟（設定 oracle 價格、mint、whitelist、fund pool）：

```powershell
npx hardhat run scripts/deploy.js --network localhost
```

部署完成後，部署腳本會在 console 印出所有合約地址。

## 5) 產生前端設定檔（contract-config.js）
我們提供自動化腳本會從 `artifacts/` 與 `deployments/local-deployment.json`（若存在）擷取 ABI 與地址，產生 `contract-config.js`：

```powershell
node scripts/generate-contract-config.mjs
```

檔案: `contract-config.js`（ESM）會 export 下列內容：
- USDC_ADDRESS, RWA_TOKEN_ADDRESS, ORACLE_ADDRESS, LENDING_POOL_ADDRESS
- USDC_ABI, RWA_TOKEN_ABI, ORACLE_ABI, LENDING_POOL_ABI

把這個 `contract-config.js` 複製到你的前端專案（或直接 import 專案內的檔案）即可使用。

## 前端如何使用（簡短範例，ethers v6）
範例展示如何連 MetaMask、建立合約 instance、以及常用操作（approve / fundPool / lockAndBorrow / repay）：

```javascript
// 範例：src/eth.js
import { ethers } from 'ethers';
import {
  USDC_ADDRESS, USDC_ABI,
  RWA_TOKEN_ADDRESS, RWA_TOKEN_ABI,
  ORACLE_ADDRESS, ORACLE_ABI,
  LENDING_POOL_ADDRESS, LENDING_POOL_ABI
} from './contract-config.js';

export async function connectWallet() {
  if (!window.ethereum) throw new Error('Please install MetaMask');
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  const signer = await provider.getSigner();
  return { provider, signer };
}

export function getContracts(signerOrProvider) {
  const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signerOrProvider);
  const rwa = new ethers.Contract(RWA_TOKEN_ADDRESS, RWA_TOKEN_ABI, signerOrProvider);
  const oracle = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, signerOrProvider);
  const pool = new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, signerOrProvider);
  return { usdc, rwa, oracle, pool };
}

// 轉換單位 helper
export const toUSDC = (n) => ethers.parseUnits(n.toString(), 6);
export const toRWA = (n) => ethers.parseUnits(n.toString(), 18);

// 範例：approve + fundPool
export async function approveAndFund(signer, amountFloat) {
  const { usdc, pool } = getContracts(signer);
  const amount = toUSDC(amountFloat);
  await (await usdc.approve(LENDING_POOL_ADDRESS, amount)).wait();
  await (await pool.fundPool(amount)).wait();
}

// 範例：鎖定抵押並借款
export async function lockAndBorrow(signer, rwaAmountFloat, usdcAmountFloat) {
  const { rwa, pool } = getContracts(signer);
  const rwaAmount = toRWA(rwaAmountFloat);
  const usdcAmount = toUSDC(usdcAmountFloat);
  await (await rwa.approve(LENDING_POOL_ADDRESS, rwaAmount)).wait();
  await (await pool.lockAndBorrow(rwaAmount, usdcAmount)).wait();
}

// 範例：還款
export async function repay(signer, usdcAmountFloat) {
  const { usdc, pool } = getContracts(signer);
  const amount = toUSDC(usdcAmountFloat);
  await (await usdc.approve(LENDING_POOL_ADDRESS, amount)).wait();
  await (await pool.repay(amount)).wait();
}
```

## 合約可用的主要函式（前端可呼叫）
- Mock_USDC: mint(to, amount), approve, transfer, balanceOf, decimals
- Mock_RWA_Token (tTSLA): mint(to, amount), addWhitelist(user), isWhitelisted(user), approve, transfer
- Mock_PriceOracle: setPrice(token, newPrice) (price 有 8 decimals)、getPrice(token)
- FluidPay_LendingPool:
  - fundPool(usdcAmount) — 從 caller pull USDC 到 pool
  - lockAndBorrow(rwaAmountToLock, stablecoinAmountToBorrow) — pull tTSLA, transfer USDC out, update loan
  - repay(amountToRepay) — pull USDC to reduce debt
  - unlockCollateral(rwaAmountToUnlock) — transfer tTSLA back (並檢查健康度)
  - liquidate(user) — 任何人可呼叫，支付 user 的 debt，獲得該 user 的抵押

注意單位：tTSLA = 18 decimals；mUSDC = 6 decimals；oracle price = 8 decimals。請用 `ethers.parseUnits` / `ethers.formatUnits` 做正確換算。

## 常見問題 & 調試
- 如果前端呼叫交易 revert：先用 `provider.getCode(address)` 確認合約地址是否正確，並在 Hardhat console 看錯誤訊息。
- 如果遇到 allowance / balance revert：請先 `approve` 並確認 token decimals 與數值。
- 每次重新部署後，請重新執行 `node scripts/generate-contract-config.mjs` 更新 `contract-config.js`。


