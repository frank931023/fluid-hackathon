# 🔐 FluidPay 白名單處理指南

## 問題說明

白名單是 FluidPay 協議的核心安全機制，符合 ERC-3643 標準，確保只有經過 KYC/AML 驗證的用戶才能持有和交易 RWA 代幣。

## ✅ 解決方案

### 方法 1: 通過前端 UI（推薦）

1. **啟動所有服務**
   ```bash
   ./start-all.sh
   ```

2. **配置 MetaMask**
   - 添加本地網路
     - 網路名稱: `Localhost 8545`
     - RPC URL: `http://localhost:8545`
     - Chain ID: `31337`
     - 貨幣符號: `ETH`

3. **導入測試帳戶**
   - 複製私鑰: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - 在 MetaMask 中選擇「導入帳戶」
   - 貼上私鑰

4. **連接錢包並加入白名單**
   - 訪問 http://localhost:5173
   - 點擊「Connect Wallet」
   - 選擇剛導入的帳戶
   - 會看到橙色的白名單提示卡片
   - 點擊「加入白名單」按鈕
   - 在 MetaMask 中確認交易
   - 等待交易確認（幾秒鐘）
   - 看到綠色的「✓ 已驗證」標記

### 方法 2: 通過 Hardhat Console

如果前端有問題，可以直接通過合約添加白名單：

```bash
# 啟動 Hardhat console
npx hardhat console --network localhost

# 在 console 中執行
const rwaToken = await ethers.getContractAt("Mock_RWA_Token", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512")

# 添加你的地址到白名單
await rwaToken.addWhitelist("YOUR_WALLET_ADDRESS")

# 驗證是否成功
await rwaToken.isWhitelisted("YOUR_WALLET_ADDRESS")
// 應該返回 true
```

### 方法 3: 通過部署腳本

修改部署腳本自動添加多個地址：

```javascript
// 在 scripts/deploy.js 中添加
const addressesToWhitelist = [
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // 已包含
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // 添加更多地址
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
];

for (const addr of addressesToWhitelist) {
  await rwaToken.addWhitelist(addr);
  console.log(`Whitelisted ${addr}`);
}
```

## 🔍 檢查白名單狀態

### 前端檢查
在瀏覽器控制台執行：
```javascript
// 在前端 Vue DevTools 或瀏覽器控制台
const { isWhitelisted } = useWallet();
console.log('白名單狀態:', isWhitelisted.value);
```

### 合約檢查
```bash
npx hardhat console --network localhost

# 檢查地址
const rwaToken = await ethers.getContractAt("Mock_RWA_Token", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512")
await rwaToken.isWhitelisted("YOUR_ADDRESS")
```

## 🚨 常見問題

### 1. 交易失敗：「User not whitelisted」

**原因**: 嘗試操作前未加入白名單

**解決**: 
```bash
# 方法 1: 通過前端 UI 點擊「加入白名單」
# 方法 2: 使用 Hardhat console
npx hardhat console --network localhost
const rwa = await ethers.getContractAt("Mock_RWA_Token", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512")
await rwa.addWhitelist("YOUR_ADDRESS")
```

### 2. 看不到「加入白名單」按鈕

**原因**: 前端未正確載入白名單狀態

**解決**:
1. 刷新頁面
2. 檢查瀏覽器控制台錯誤
3. 確認 Hardhat 節點正在運行
4. 確認合約已部署

### 3. 白名單交易一直 pending

**原因**: Hardhat 節點可能有問題

**解決**:
```bash
# 重啟所有服務
./stop-all.sh
./start-all.sh
```

### 4. MetaMask 顯示「Internal JSON-RPC error」

**原因**: 節點重啟導致 nonce 不同步

**解決**:
1. 在 MetaMask 中點擊帳戶圖標
2. 設置 → 進階 → 清除活動標籤數據
3. 重新連接錢包

## 📊 白名單機制說明

### 為什麼需要白名單？

1. **合規要求**: 符合 ERC-3643 標準，模擬真實的 RWA 代幣 KYC/AML 要求
2. **風險控制**: 確保只有經過驗證的用戶才能持有資產
3. **監管友好**: 便於追蹤和審計交易

### 白名單限制的操作

✅ **允許**（無需白名單）:
- 連接錢包
- 查看資產餘額（ETH、USDC）
- 查看協議資訊

❌ **需要白名單**:
- 接收 tTSLA 代幣
- 轉移 tTSLA 代幣
- 抵押 tTSLA 借款
- 所有涉及 RWA 代幣的操作

### 白名單管理權限

⚠️ **測試環境**: 
- 目前任何人都可以調用 `addWhitelist()`
- 這僅用於測試和演示

🔒 **生產環境應該**:
- 只有合約 owner 或 admin 可以添加白名單
- 實現 role-based access control (RBAC)
- 添加白名單審批流程
- 記錄白名單變更日誌

## 🔧 進階配置

### 批量添加白名單

創建腳本 `scripts/add-whitelist.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const addresses = [
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  ];

  const rwaToken = await hre.ethers.getContractAt(
    "Mock_RWA_Token",
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  );

  console.log("Adding addresses to whitelist...");
  
  for (const addr of addresses) {
    const isWhitelisted = await rwaToken.isWhitelisted(addr);
    if (!isWhitelisted) {
      await rwaToken.addWhitelist(addr);
      console.log(`✅ Added: ${addr}`);
    } else {
      console.log(`⏭️  Skipped (already whitelisted): ${addr}`);
    }
  }

  console.log("Done!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

執行:
```bash
npx hardhat run scripts/add-whitelist.js --network localhost
```

## 📝 測試流程

### 完整的白名單測試

1. **準備測試帳戶**
   ```bash
   # Account #1 (未在白名單)
   Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
   Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   ```

2. **測試未白名單的行為**
   - 導入 Account #1 到 MetaMask
   - 連接前端
   - 應該看到橙色的白名單提示

3. **添加到白名單**
   - 點擊「加入白名單」按鈕
   - 確認交易

4. **驗證白名單功能**
   - 提示應該變為綠色的「✓ 已驗證」
   - 現在可以進行借貸操作

## 🎯 最佳實踐

1. **開發環境**
   - 使用 `./start-all.sh` 啟動所有服務
   - 部署時自動添加部署者到白名單
   - 通過前端 UI 測試白名單流程

2. **測試環境**
   - 準備多個測試帳戶
   - 測試白名單和非白名單用戶的行為差異
   - 驗證所有錯誤處理

3. **生產環境**
   - 實現嚴格的白名單管理權限
   - 添加白名單審批流程
   - 記錄所有白名單操作
   - 定期審計白名單狀態

## 📞 獲取幫助

如果遇到白名單相關問題:

1. 檢查 Hardhat 節點是否運行: `curl http://localhost:8545`
2. 檢查合約是否部署: 查看 `contract-config.json`
3. 查看瀏覽器控制台錯誤
4. 查看 Hardhat 節點日誌: `tail -f hardhat-node.log`
5. 查看前端日誌: `tail -f frontend-dev.log`

---

**記住**: 白名單是 FluidPay 的核心安全機制，確保所有用戶在操作前都已加入白名單！🔐
