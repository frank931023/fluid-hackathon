# FluidPay 前後端整合說明

## 已完成的整合

### 1. 合約服務層 (`src/services/contracts.ts`)
- ✅ 完整的合約交互 API
- ✅ 錢包連接和管理
- ✅ 代幣餘額查詢
- ✅ 白名單管理
- ✅ 價格查詢
- ✅ 借貸操作（抵押、還款、清算）
- ✅ 事件監聽

### 2. Composables
#### `useWallet.ts`
- ✅ 真實的錢包連接（MetaMask）
- ✅ 從鏈上獲取 ETH、mUSDC、tTSLA 餘額
- ✅ 白名單狀態檢查
- ✅ 自動刷新資產
- ✅ 帳戶變更監聽

#### `useLoans.ts`
- ✅ 從鏈上載入用戶貸款數據
- ✅ 執行抵押借款 (`lockAndBorrow`)
- ✅ 執行還款 (`repay`)
- ✅ 執行清算 (`liquidate`)
- ✅ 計算健康度
- ✅ 自動更新貸款狀態

### 3. 頁面整合
#### WalletView
- ✅ 顯示真實的代幣餘額
- ✅ 白名單狀態提示
- ✅ 一鍵加入白名單功能

#### LoanView (Borrow & Collateralize)
- ✅ 真實的抵押借款功能
- ✅ 自動計算所需抵押品數量（基於 50% LTV）
- ✅ 餘額檢查
- ✅ 交易日誌記錄
- ✅ 整合合約地址顯示

#### PaymentView (Active Loans & Repayment)
- ✅ 自動載入用戶的鏈上貸款數據
- ✅ 顯示真實的抵押品和債務金額
- ✅ 健康度計算
- ✅ 每 10 秒自動刷新數據

#### RepaymentModal
- ✅ 真實的還款功能
- ✅ 顯示真實的 USDC 餘額
- ✅ 餘額檢查
- ✅ 交易確認

## 使用流程

### 準備工作
1. **啟動本地區塊鏈**
   ```bash
   npx hardhat node
   ```

2. **部署合約**（在新的終端）
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   npx hardhat run scripts/generate-contract-config-json.js --network localhost
   ```

3. **複製合約配置到前端**（已完成）
   ```bash
   cp contract-config.json frontend/src/
   ```

4. **啟動前端**
   ```bash
   cd frontend
   npm run dev
   ```

### 配置 MetaMask
1. 添加本地網路
   - 網路名稱: Localhost 8545
   - RPC URL: http://localhost:8545
   - Chain ID: 31337
   - 貨幣符號: ETH

2. 導入測試帳戶
   - 從 Hardhat 節點輸出中複製私鑰
   - 在 MetaMask 中導入帳戶

### 使用步驟

#### 1. 連接錢包
- 在任何頁面點擊 "Connect Wallet"
- 選擇 MetaMask 並授權連接

#### 2. 加入白名單（首次使用必須）
- 連接錢包後會看到橙色提示卡片
- 點擊 "加入白名單" 按鈕
- 在 MetaMask 中確認交易
- 等待交易確認

#### 3. 獲取測試代幣（如需要）
您可以在 Hardhat console 中鑄造測試代幣：
```javascript
// 連接到已部署的合約
const rwaToken = await ethers.getContractAt("Mock_RWA_Token", "YOUR_RWA_TOKEN_ADDRESS")
const usdcToken = await ethers.getContractAt("Mock_USDC", "YOUR_USDC_ADDRESS")

// 鑄造代幣
await rwaToken.mint("YOUR_ADDRESS", ethers.parseUnits("100", 18)) // 100 tTSLA
await usdcToken.mint("YOUR_ADDRESS", ethers.parseUnits("10000", 6)) // 10000 USDC
```

#### 4. 抵押借款
- 進入 "Loan" 頁面
- 填寫：
  - Merchant address（可以是任意地址）
  - Amount（要借的 USDC 數量）
  - 選擇 "Tokenized Tesla Stock (tTSLA)"
- 點擊 "Borrow & Pay"
- 在 MetaMask 中確認兩筆交易：
  1. 授權 tTSLA 給借貸池
  2. 執行抵押借款
- 等待交易確認

#### 5. 查看貸款
- 進入 "Payment" 頁面
- 可以看到您的活躍貸款
- 展開貸款可以查看詳細資訊和風險指標

#### 6. 還款
- 在 "Payment" 頁面點擊貸款卡片上的 "Repay Now"
- 輸入還款金額（可點擊 MAX 還清全部）
- 點擊 "Confirm Repayment"
- 在 MetaMask 中確認兩筆交易：
  1. 授權 USDC 給借貸池
  2. 執行還款
- 等待交易確認

## 重要參數

### 協議參數
- **LTV (Loan-to-Value)**: 50%
  - 意思：可以借到抵押品價值的 50%
  - 例如：$1000 的 tTSLA 可以借 $500 USDC

- **清算門檻**: 80%
  - 意思：當健康度低於 80% 時可被清算
  - 計算：健康度 = (抵押品價值 / 債務價值) × 100%

### 代幣精度
- **mUSDC**: 6 位小數
- **tTSLA**: 18 位小數
- **價格**: 8 位小數

### 合約地址
合約地址可以在以下位置找到：
- `contract-config.json` 文件
- Loan 頁面的 "Contract Configuration" 區域

## 故障排除

### 1. 交易失敗
- **檢查白名單**: 確保已加入白名單
- **檢查餘額**: 確保有足夠的代幣餘額
- **檢查授權**: 某些操作需要兩筆交易（授權 + 執行）
- **檢查 Gas**: 確保錢包有足夠的 ETH 支付 Gas

### 2. 無法連接錢包
- 確保已安裝 MetaMask
- 確保 MetaMask 已切換到 localhost 網路
- 重新整理頁面

### 3. 看不到貸款數據
- 確保已連接錢包
- 等待幾秒讓數據載入
- 檢查瀏覽器控制台是否有錯誤

### 4. 合約地址不匹配
- 確保已執行 `generate-contract-config-json.js`
- 確保已將生成的 `contract-config.json` 複製到 `frontend/src/`
- 重啟前端開發伺服器

## 技術細節

### 自動刷新機制
- **資產餘額**: 帳戶變更時自動刷新
- **貸款數據**: 每 10 秒自動刷新
- **白名單狀態**: 連接錢包時檢查

### 錯誤處理
所有合約交互都包含錯誤處理：
- 顯示用戶友好的錯誤訊息
- 記錄詳細錯誤到控制台
- 交易失敗時不會影響 UI 狀態

### 狀態管理
- 使用 Vue 3 的 `ref` 和 `computed` 管理狀態
- Composables 使用單例模式共享狀態
- 自動清理事件監聽器

## 未來改進建議

1. **事件監聽**: 目前使用輪詢，可以改用合約事件監聽
2. **多資產支持**: 擴展支持更多 RWA 資產作為抵押品
3. **價格更新**: 整合 Chainlink 或其他預言機獲取實時價格
4. **清算機器人**: 實現自動清算不健康貸款的機器人
5. **交易歷史**: 記錄和顯示所有歷史交易
6. **通知系統**: 當健康度接近清算門檻時發送通知

## 聯繫資訊

如有問題或建議，請參考：
- 技術文檔: `FRONTEND_INTEGRATION.md`
- 合約文檔: Solidity 合約文件中的註釋
