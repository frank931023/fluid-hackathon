# 🦊 MetaMask 完整設定指南

## 問題診斷

你當前遇到的問題：
- ❌ 使用的地址：`0x352ff3cfdb4132bc270abeb3ef80da2c17e483f4`
- ✅ 需要的地址：`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

**原因**：你的 MetaMask 連接的是一個隨機帳戶，而不是 Hardhat 測試帳戶。

---

## 🔧 完整解決方案

### 第一部分：添加 Hardhat Local 網路（如果還沒有）

#### 步驟 1: 打開 MetaMask
點擊瀏覽器右上角的 MetaMask 圖標（🦊）

#### 步驟 2: 打開網路設定
1. 點擊 MetaMask 頂部的**網路名稱**（可能顯示 "Ethereum Mainnet" 或其他）
2. 在下拉選單最底部，點擊「**新增網路**」或「**Add Network**」

#### 步驟 3: 手動添加網路
選擇「**手動新增網路**」或「**Add a network manually**」

#### 步驟 4: 填寫網路資訊

| 欄位 | 值 |
|------|-----|
| **網路名稱 (Network Name)** | `Hardhat Local` |
| **RPC URL** | `http://localhost:8545` |
| **鏈 ID (Chain ID)** | `31337` |
| **貨幣符號 (Currency Symbol)** | `ETH` |
| **區塊瀏覽器 URL (可選)** | 留空 |

#### 步驟 5: 儲存
點擊「**儲存**」或「**Save**」

#### 步驟 6: 切換到 Hardhat Local 網路
- MetaMask 頂部現在應該顯示「**Hardhat Local**」
- 如果沒有，點擊網路選擇器，選擇「Hardhat Local」

---

### 第二部分：匯入 Hardhat Account 0

#### 步驟 1: 開啟帳戶選單
在 MetaMask 中，點擊右上角的**圓形帳戶圖標**

#### 步驟 2: 選擇匯入帳戶
在下拉選單中，點擊「**匯入帳戶**」或「**Import Account**」

#### 步驟 3: 選擇匯入方式
選擇「**私密金鑰**」或「**Private Key**」

#### 步驟 4: 貼上私鑰
複製並貼上以下私鑰（包含開頭的 `0x`）：

```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

⚠️ **重要安全提示**：
- 這是 Hardhat 的**公開測試私鑰**
- **僅用於本地開發**
- **永遠不要**在主網或測試網上使用
- **永遠不要**存入真實的加密貨幣

#### 步驟 5: 完成匯入
點擊「**匯入**」按鈕

#### 步驟 6: 確認匯入成功
- 新帳戶會出現在你的帳戶列表中
- 帳戶名稱可能是 "Account 2" 或類似
- 地址應該是：`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

#### 步驟 7: 確認帳戶資產
你應該看到：
- **ETH**: 約 10,000 ETH
- 這表示你連接到了正確的 Hardhat 帳戶

---

### 第三部分：在前端使用新帳戶

#### 步驟 1: 斷開當前連接
在 FluidPay 前端頁面（http://localhost:5173），點擊「**Disconnect Wallet**」

#### 步驟 2: 重新連接錢包
點擊「**Connect Wallet**」

#### 步驟 3: 選擇正確的帳戶
在 MetaMask 彈窗中：
1. 確保頂部網路是「**Hardhat Local**」
2. **選擇剛導入的帳戶**（地址為 `0xf39F...92266`）
3. 點擊「**下一步**」
4. 點擊「**連接**」

#### 步驟 4: 驗證連接成功
回到前端頁面，點擊「🔍 點擊查看完整地址和診斷信息」

你應該看到：
- ✅ **地址匹配！**
- ✅ **已在白名單**

#### 步驟 5: 查看資產
頁面應該顯示：
- **Total Balance**: ~US$117,000
- **ETH**: 10,000 ETH
- **mUSDC**: 100,000 mUSDC
- **tTSLA**: 100 tTSLA ($170 each)

---

## 🚨 常見問題

### Q1: MetaMask 顯示 "user rejected" 錯誤
**原因**：你使用的帳戶沒有足夠的 ETH 支付 gas

**解決**：不要嘗試用錯誤的帳戶加入白名單，而是導入正確的 Account 0

### Q2: 找不到「匯入帳戶」選項
**位置**：
1. 點擊 MetaMask 右上角的圓形**帳戶圖標**（不是網路選擇器）
2. 在下拉選單中找「匯入帳戶」或「Import Account」
3. 如果還是找不到，嘗試點擊「創建帳戶」旁邊的「...」菜單

### Q3: 匯入後看不到 ETH
**檢查項目**：
1. 確認 MetaMask 頂部網路是「Hardhat Local」
2. 確認 RPC URL 是 `http://localhost:8545`
3. 確認 Chain ID 是 `31337`
4. 確認地址是 `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

### Q4: 網路連接失敗
**檢查**：
```bash
# 在終端機中執行
curl http://localhost:8545
```

應該返回 JSON 錯誤（這是正常的，表示節點在運行）

**如果沒有響應**：
```bash
# 重啟所有服務
cd /Users/weihong/Documents/latest-rwa/fluid-hackathon
./stop-all.sh
./start-all.sh
```

### Q5: 前端顯示「未在白名單」
**可能原因**：
1. 使用了錯誤的帳戶 → 導入 Account 0
2. Hardhat 節點重啟了 → 重新部署合約
3. 瀏覽器緩存 → 按 `Shift + Cmd + R` 硬刷新

---

## ✅ 成功檢查清單

設定完成後，確認以下項目：

- [ ] MetaMask 頂部顯示「Hardhat Local」
- [ ] 當前帳戶地址是 `0xf39Fd...92266`
- [ ] MetaMask 顯示約 10,000 ETH
- [ ] 前端診斷顯示「✅ 地址匹配！」
- [ ] 前端診斷顯示「✅ 已在白名單」
- [ ] 能看到 100,000 mUSDC
- [ ] 能看到 100 tTSLA

全部打勾後，你就可以開始測試借貸功能了！

---

## 📞 如果還有問題

1. 截圖你的 MetaMask 網路設定
2. 截圖你的 MetaMask 帳戶地址
3. 截圖前端的診斷信息
4. 檢查終端中 Hardhat 節點的日誌

---

**記住**：永遠使用 `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` 這個地址進行測試！
