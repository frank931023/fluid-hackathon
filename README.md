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


