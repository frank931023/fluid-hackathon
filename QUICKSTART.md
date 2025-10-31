# 🚀 FluidPay 快速啟動指南

## 一鍵啟動（3 個終端）

### 終端 1: 啟動區塊鏈節點
```bash
npx hardhat node
```
保持運行，不要關閉。

### 終端 2: 部署合約
```bash
# 部署合約到本地節點
npx hardhat run scripts/deploy.js --network localhost

# 生成前端配置（如果還沒有）
npx hardhat run scripts/generate-contract-config-json.js --network localhost

# 複製配置到前端（如果還沒有）
cp contract-config.json frontend/src/
```

### 終端 3: 啟動前端
```bash
cd frontend
npm run dev
```

## ⚡ 首次使用設置

### 1. 配置 MetaMask

#### 添加本地網路
1. 打開 MetaMask
2. 點擊網路下拉選單
3. 點擊 "添加網路" → "手動添加網路"
4. 填寫以下資訊：
   - **網路名稱**: Localhost 8545
   - **RPC URL**: `http://localhost:8545`
   - **Chain ID**: `31337`
   - **貨幣符號**: `ETH`
5. 點擊 "保存"

#### 導入測試帳戶
從終端 1（Hardhat 節點）複製其中一個帳戶的私鑰：
```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

1. 在 MetaMask 中點擊帳戶圖標
2. 選擇 "導入帳戶"
3. 貼上私鑰
4. 點擊 "導入"

### 2. 連接應用

1. 打開瀏覽器訪問 `http://localhost:5173`
2. 點擊 "Connect Wallet"
3. 在 MetaMask 中選擇剛導入的帳戶
4. 點擊 "連接"

### 3. 加入白名單

首次使用時會看到橙色提示：
1. 點擊 "加入白名單" 按鈕
2. 在 MetaMask 中確認交易
3. 等待交易完成（幾秒鐘）
4. 看到綠色的 "✓ 已驗證" 標記

## 💡 基本操作

### 獲取測試代幣（如需要）

部署腳本已經給部署帳戶鑄造了代幣，如果使用其他帳戶需要手動鑄造：

```bash
# 在終端 2 中啟動 Hardhat console
npx hardhat console --network localhost

# 執行以下命令
const rwa = await ethers.getContractAt("Mock_RWA_Token", "YOUR_RWA_ADDRESS")
const usdc = await ethers.getContractAt("Mock_USDC", "YOUR_USDC_ADDRESS")

// 鑄造 100 tTSLA
await rwa.mint("YOUR_WALLET_ADDRESS", ethers.parseUnits("100", 18))

// 鑄造 10000 USDC
await usdc.mint("YOUR_WALLET_ADDRESS", ethers.parseUnits("10000", 6))
```

### 抵押借款

1. 進入 **Loan** 頁面
2. 填寫：
   - Merchant address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`（或任意地址）
   - Amount: `1000`（要借的 USDC）
   - Asset: 選擇 "Tokenized Tesla Stock (tTSLA)"
3. 點擊 "Borrow & Pay"
4. 確認 MetaMask 的兩筆交易：
   - 第一筆：授權 tTSLA
   - 第二筆：執行借款
5. 等待交易完成

### 查看貸款

1. 進入 **Payment** 頁面
2. 自動顯示您的活躍貸款
3. 點擊貸款卡片查看詳情：
   - 抵押品數量和價值
   - 借款金額
   - 健康度指標
   - 價格歷史圖表

### 還款

1. 在 **Payment** 頁面找到您的貸款
2. 點擊 "Repay Now"
3. 輸入還款金額（可點擊 MAX 還清全部）
4. 點擊 "Confirm Repayment"
5. 確認 MetaMask 的兩筆交易：
   - 第一筆：授權 USDC
   - 第二筆：執行還款
6. 等待交易完成

## 🎯 功能演示流程

### 完整借貸週期（5 分鐘）

1. **連接錢包** (30 秒)
   - Connect Wallet → 選擇帳戶 → 連接

2. **加入白名單** (30 秒)
   - 點擊加入白名單 → 確認交易 → 等待

3. **查看資產** (10 秒)
   - 進入 Wallet 頁面
   - 查看 ETH、mUSDC、tTSLA 餘額

4. **抵押借款** (1 分鐘)
   - 進入 Loan 頁面
   - 填寫表單
   - 確認兩筆交易
   - 查看成功訊息

5. **查看貸款** (1 分鐘)
   - 進入 Payment 頁面
   - 查看貸款詳情
   - 展開查看風險指標

6. **部分還款** (1 分鐘)
   - 點擊 Repay Now
   - 輸入部分金額
   - 確認兩筆交易
   - 查看更新後的貸款

7. **完全還款** (1 分鐘)
   - 再次點擊 Repay Now
   - 點擊 MAX 按鈕
   - 確認交易
   - 貸款消失

## 🔍 故障排除

### 無法連接錢包
```bash
# 檢查清單：
✓ MetaMask 已安裝
✓ MetaMask 已解鎖
✓ 切換到 Localhost 8545 網路
✓ 刷新頁面
```

### 交易失敗
```bash
# 常見原因：
1. 未加入白名單 → 先加入白名單
2. 餘額不足 → 檢查代幣餘額
3. Gas 不足 → 檢查 ETH 餘額
4. 授權不足 → 重新授權
```

### 看不到貸款數據
```bash
# 解決方案：
1. 等待 10 秒（自動刷新）
2. 刷新頁面
3. 檢查控制台錯誤
4. 確認合約地址正確
```

### 合約地址不匹配
```bash
# 重新生成配置：
npx hardhat run scripts/generate-contract-config-json.js --network localhost
cp contract-config.json frontend/src/
# 重啟前端
cd frontend && npm run dev
```

## 📊 健康檢查

運行自動檢查腳本：
```bash
./check-integration.sh
```

應該看到：
```
✅ contract-config.json 存在
✅ frontend/src/contract-config.json 存在
✅ 合約服務層已創建
✅ ethers.js 已安裝
✅ 合約地址配置正確
```

## 🎓 重要概念

### LTV (Loan-to-Value)
- **50%**: 可以借到抵押品價值的一半
- 例如：$2000 的 tTSLA → 可借 $1000 USDC

### 健康度
- **計算**: (抵押品價值 / 債務價值) × 100%
- **安全**: > 150%
- **警告**: 80% - 150%
- **危險**: < 80%（可被清算）

### 清算
- 當健康度 < 80% 時可被清算
- 清算者支付全部債務並獲得全部抵押品
- 包含清算獎勵

## 📚 更多資源

- 📖 [詳細整合說明](frontend/README_INTEGRATION.md)
- 📋 [完整功能總結](INTEGRATION_SUMMARY.md)
- 📝 [後端整合指南](FRONTEND_INTEGRATION.md)
- 🔧 [合約文檔](contracts/)

## 💬 獲取幫助

遇到問題？
1. 查看錯誤訊息（UI 或控制台）
2. 運行 `./check-integration.sh`
3. 查閱文檔
4. 檢查交易記錄

---

**準備好了嗎？** 開始使用 FluidPay！🚀
