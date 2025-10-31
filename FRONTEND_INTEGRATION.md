# FluidPay 借貸協議 - 前端整合指南

## 概述

FluidPay 是一個基於 Real World Assets (RWA) 抵押的借貸協議。用戶可以抵押代幣化的真實世界資產（如 tTSLA）來借取穩定幣（mUSDC）。

## 環境設置

### 前置要求
- Node.js >= 16.0.0
- npm 或 yarn
- MetaMask 或其他以太坊錢包

### 1. 安裝依賴
```bash
npm install
```

### 2. 啟動本地區塊鏈節點
```bash
# 在終端機中啟動 Hardhat 本地節點
npx hardhat node
```
這會在 `http://localhost:8545` 啟動一個本地以太坊節點，並自動創建 20 個測試帳戶。

### 3. 部署合約
在新的終端機中執行：
```bash
# 部署所有合約到本地網路
npx hardhat run scripts/deploy.js --network localhost
```

### 4. 生成前端配置檔案
```bash
# 生成包含合約地址和 ABI 的配置檔案
npx hardhat run scripts/generate-contract-config-json.js --network localhost
```
這會生成 `contract-config.json` 檔案，包含所有合約的地址和 ABI。

### 5. MetaMask 設定
1. 添加本地網路：
   - 網路名稱: Localhost 8545
   - RPC URL: http://localhost:8545
   - Chain ID: 31337
   - 貨幣符號: ETH

2. 導入測試帳戶：
   - 從 Hardhat 節點輸出中複製私鑰
   - 在 MetaMask 中導入帳戶

## 合約架構

### 核心合約

1. **FluidPay_LendingPool** - 主要借貸邏輯
2. **Mock_USDC** - 模擬 USDC 穩定幣 (6 位小數)
3. **Mock_RWA_Token** - 模擬 tTSLA 代幣 (18 位小數) + 白名單管理
4. **Mock_PriceOracle** - 價格預言機 (8 位小數精度)

### 白名單機制說明

**目的**: 模擬 ERC-3643 標準，確保只有經過 KYC/AML 驗證的用戶才能持有和交易 RWA 代幣。

**功能**:
- ✅ 檢查用戶是否在白名單中
- ✅ 添加用戶到白名單
- ⚠️ 目前任何人都可以添加白名單（僅限測試環境）

**限制**: 只有白名單用戶才能:
- 進行抵押借款
- 接收 RWA 代幣轉帳
- 參與借貸協議

### 價格預言機說明

**目的**: 提供 RWA 資產的即時價格，用於計算抵押品價值和健康度。

**功能**:
- ✅ 獲取資產當前價格
- ✅ 更新資產價格
- ⚠️ 目前任何人都可以更新價格（僅限測試環境）

**格式**: 價格使用 8 位小數精度（如 Chainlink）

## 可用功能與範例程式碼

### 功能總覽

FluidPay 借貸協議提供以下主要功能：

#### 👥 白名單管理
- ✅ 檢查用戶白名單狀態
- ✅ 添加用戶到白名單  
- ✅ 批量管理白名單
- ❌ 移除白名單（合約未實作）

#### 💰 代幣操作
- ✅ 檢查代幣餘額
- ✅ 鑄造測試代幣（USDC、RWA）
- ✅ 獲取池子餘額和抵押品總額

#### 📊 價格管理
- ✅ 獲取資產價格
- ✅ 更新資產價格
- ✅ 價格監控（輪詢方式）

#### 🏦 借貸操作
- ✅ 抵押借款
- ✅ 還款
- ✅ 解鎖抵押品
- ✅ 為池子注入流動性
- ✅ 清算不健康貸款

#### 📈 資訊查詢
- ✅ 獲取用戶借款資訊
- ✅ 計算健康度
- ✅ 檢查合規性
- ✅ 獲取協議參數

#### ⚠️ 注意事項
- 合約未實作事件機制，需使用輪詢監控狀態變化
- 測試環境中任何人都可以添加白名單和更新價格
- 清算功能要求健康度低於 80%

---

### 連接合約

```javascript
import { ethers } from 'ethers';
import contractConfig from './contract-config.json';

// 連接到 MetaMask
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// 初始化合約實例
const lendingPool = new ethers.Contract(
  contractConfig.FluidPay_LendingPool.address,
  contractConfig.FluidPay_LendingPool.abi,
  signer
);

const usdcToken = new ethers.Contract(
  contractConfig.Mock_USDC.address,
  contractConfig.Mock_USDC.abi,
  signer
);

const rwaToken = new ethers.Contract(
  contractConfig.Mock_RWA_Token.address,
  contractConfig.Mock_RWA_Token.abi,
  signer
);

const priceOracle = new ethers.Contract(
  contractConfig.Mock_PriceOracle.address,
  contractConfig.Mock_PriceOracle.abi,
  signer
);
```

### 1. 白名單管理

白名單的目的是符合 **ERC-3643 標準精神**，模擬真實世界資產代幣的合規要求。只有通過 KYC/AML 驗證的用戶才能持有和交易 RWA 代幣。

#### 檢查白名單狀態
```javascript
async function checkWhitelist(userAddress) {
  try {
    const isWhitelisted = await rwaToken.isWhitelisted(userAddress);
    return isWhitelisted;
  } catch (error) {
    console.error('檢查白名單失敗:', error);
    return false;
  }
}
```

#### 添加用戶到白名單
```javascript
async function addToWhitelist(userAddress) {
  try {
    const tx = await rwaToken.addWhitelist(userAddress);
    await tx.wait();
    console.log(`用戶 ${userAddress} 已加入白名單`);
    return tx.hash;
  } catch (error) {
    console.error('添加白名單失敗:', error);
    throw error;
  }
}
```

#### 批量管理白名單
```javascript
async function batchAddToWhitelist(userAddresses) {
  const results = [];
  for (const address of userAddresses) {
    try {
      const tx = await rwaToken.addWhitelist(address);
      await tx.wait();
      results.push({ address, success: true, txHash: tx.hash });
    } catch (error) {
      results.push({ address, success: false, error: error.message });
    }
  }
  return results;
}
```

**注意**: 目前的合約設計中，任何人都可以調用 `addWhitelist`。在生產環境中，這個功能應該只有管理員才能執行。

### 2. 檢查代幣餘額

```javascript
async function getBalances(userAddress) {
  try {
    const usdcBalance = await usdcToken.balanceOf(userAddress);
    const rwaBalance = await rwaToken.balanceOf(userAddress);
    
    return {
      usdc: ethers.formatUnits(usdcBalance, 6), // USDC 使用 6 位小數
      rwa: ethers.formatUnits(rwaBalance, 18)   // RWA 使用 18 位小數
    };
  } catch (error) {
    console.error('獲取餘額失敗:', error);
    return { usdc: '0', rwa: '0' };
  }
}
```

### 3. 價格管理

價格預言機允許更新資產價格，模擬真實市場價格波動。

#### 獲取資產價格
```javascript
async function getAssetPrice(tokenAddress) {
  try {
    const price = await priceOracle.getPrice(tokenAddress);
    return ethers.formatUnits(price, 8); // 價格使用 8 位小數
  } catch (error) {
    console.error('獲取價格失敗:', error);
    return '0';
  }
}
```

#### 更新資產價格
```javascript
async function updateAssetPrice(tokenAddress, newPriceUSD) {
  try {
    // 將美元價格轉換為 8 位小數格式
    // 例如: $200.50 -> 20050000000 (200.50 * 10^8)
    const priceWith8Decimals = ethers.parseUnits(newPriceUSD.toString(), 8);
    
    const tx = await priceOracle.setPrice(tokenAddress, priceWith8Decimals);
    await tx.wait();
    
    console.log(`資產 ${tokenAddress} 價格已更新為 $${newPriceUSD}`);
    return tx.hash;
  } catch (error) {
    console.error('更新價格失敗:', error);
    throw error;
  }
}
```

#### 獲取所有資產價格
```javascript
async function getAllAssetPrices() {
  try {
    const tTSLAPrice = await getAssetPrice(contractConfig.Mock_RWA_Token.address);
    
    return {
      tTSLA: {
        address: contractConfig.Mock_RWA_Token.address,
        price: tTSLAPrice,
        symbol: 'tTSLA'
      }
    };
  } catch (error) {
    console.error('獲取所有價格失敗:', error);
    return {};
  }
}
```

#### 價格監控
```javascript
// 注意：目前的 Mock_PriceOracle 合約沒有實作事件
// 如需監控價格變化，可以使用輪詢方式
async function monitorPriceChanges(intervalMs = 5000) {
  let lastPrice = await getAssetPrice(contractConfig.Mock_RWA_Token.address);
  
  setInterval(async () => {
    try {
      const currentPrice = await getAssetPrice(contractConfig.Mock_RWA_Token.address);
      if (currentPrice !== lastPrice) {
        console.log('價格變化偵測:', {
          token: contractConfig.Mock_RWA_Token.address,
          oldPrice: lastPrice,
          newPrice: currentPrice,
          timestamp: new Date().toISOString()
        });
        lastPrice = currentPrice;
      }
    } catch (error) {
      console.error('監控價格失敗:', error);
    }
  }, intervalMs);
}
```

**注意**: 目前的價格預言機合約允許任何人更新價格。在生產環境中，這個功能應該只有授權的價格提供者才能執行。

### 4. 抵押借款

```javascript
async function lockAndBorrow(rwaAmount, usdcAmount) {
  try {
    // 1. 檢查白名單
    const userAddress = await signer.getAddress();
    const isWhitelisted = await checkWhitelist(userAddress);
    if (!isWhitelisted) {
      throw new Error('用戶未在白名單中');
    }

    // 2. 授權 RWA 代幣給借貸池
    const rwaAmountWei = ethers.parseUnits(rwaAmount, 18);
    const approveTx = await rwaToken.approve(
      contractConfig.FluidPay_LendingPool.address,
      rwaAmountWei
    );
    await approveTx.wait();

    // 3. 執行抵押借款
    const usdcAmountWei = ethers.parseUnits(usdcAmount, 6);
    const borrowTx = await lendingPool.lockAndBorrow(
      rwaAmountWei,
      usdcAmountWei
    );
    await borrowTx.wait();

    console.log('抵押借款成功');
    return borrowTx.hash;
  } catch (error) {
    console.error('抵押借款失敗:', error);
    throw error;
  }
}
```

### 5. 還款

```javascript
async function repayLoan(repayAmount) {
  try {
    // 1. 授權 USDC 給借貸池
    const repayAmountWei = ethers.parseUnits(repayAmount, 6);
    const approveTx = await usdcToken.approve(
      contractConfig.FluidPay_LendingPool.address,
      repayAmountWei
    );
    await approveTx.wait();

    // 2. 執行還款
    const repayTx = await lendingPool.repay(repayAmountWei);
    await repayTx.wait();

    console.log('還款成功');
    return repayTx.hash;
  } catch (error) {
    console.error('還款失敗:', error);
    throw error;
  }
}
```

### 6. 解鎖抵押品

```javascript
async function unlockCollateral(rwaAmount) {
  try {
    const rwaAmountWei = ethers.parseUnits(rwaAmount, 18);
    const unlockTx = await lendingPool.unlockCollateral(rwaAmountWei);
    await unlockTx.wait();

    console.log('解鎖抵押品成功');
    return unlockTx.hash;
  } catch (error) {
    console.error('解鎖抵押品失敗:', error);
    throw error;
  }
}
```

### 8. 獲取用戶借款資訊

```javascript
async function getUserLoan(userAddress) {
  try {
    const loan = await lendingPool.loans(userAddress);
    return {
      collateralAmount: ethers.formatUnits(loan.rwaCollateralAmount, 18),
      debtAmount: ethers.formatUnits(loan.stablecoinDebtAmount, 6)
    };
  } catch (error) {
    console.error('獲取借款資訊失敗:', error);
    return { collateralAmount: '0', debtAmount: '0' };
  }
}
```

### 9. 為借貸池注入流動性

```javascript
async function fundPool(usdcAmount) {
  try {
    // 1. 授權 USDC 給借貸池
    const usdcAmountWei = ethers.parseUnits(usdcAmount, 6);
    const approveTx = await usdcToken.approve(
      contractConfig.FluidPay_LendingPool.address,
      usdcAmountWei
    );
    await approveTx.wait();

    // 2. 注入流動性
    const fundTx = await lendingPool.fundPool(usdcAmountWei);
    await fundTx.wait();

    console.log('流動性注入成功');
    return fundTx.hash;
  } catch (error) {
    console.error('注入流動性失敗:', error);
    throw error;
  }
}
```

### 10. 清算不健康的貸款

```javascript
async function liquidateLoan(userAddress) {
  try {
    // 1. 檢查用戶貸款狀態
    const loan = await getUserLoan(userAddress);
    const healthRatio = await calculateHealthRatio(userAddress);
    
    if (healthRatio <= 80) {
      // 2. 授權 USDC 用於償還債務
      const debtAmountWei = ethers.parseUnits(loan.debtAmount, 6);
      const approveTx = await usdcToken.approve(
        contractConfig.FluidPay_LendingPool.address,
        debtAmountWei
      );
      await approveTx.wait();

      // 3. 執行清算
      const liquidateTx = await lendingPool.liquidate(userAddress);
      await liquidateTx.wait();

      console.log('清算成功');
      return {
        txHash: liquidateTx.hash,
        debtPaid: loan.debtAmount,
        collateralReceived: loan.collateralAmount
      };
    } else {
      throw new Error(`貸款健康度 ${healthRatio.toFixed(2)}% > 80%，無法清算`);
    }
  } catch (error) {
    console.error('清算失敗:', error);
    throw error;
  }
}
```

### 11. 鑄造測試代幣

```javascript
// 鑄造 USDC 測試代幣
async function mintUSDC(toAddress, amount) {
  try {
    const amountWei = ethers.parseUnits(amount, 6);
    const tx = await usdcToken.mint(toAddress, amountWei);
    await tx.wait();
    console.log(`已鑄造 ${amount} mUSDC 給 ${toAddress}`);
    return tx.hash;
  } catch (error) {
    console.error('鑄造 USDC 失敗:', error);
    throw error;
  }
}

// 鑄造 RWA 代幣
async function mintRWA(toAddress, amount) {
  try {
    const amountWei = ethers.parseUnits(amount, 18);
    const tx = await rwaToken.mint(toAddress, amountWei);
    await tx.wait();
    console.log(`已鑄造 ${amount} tTSLA 給 ${toAddress}`);
    return tx.hash;
  } catch (error) {
    console.error('鑄造 RWA 失敗:', error);
    throw error;
  }
}
```

### 13. 獲取協議參數

```javascript
// 獲取借貸協議的核心參數
async function getProtocolInfo() {
  try {
    const [ltv, liquidationThreshold, priceOracleAddr, rwaTokenAddr, usdcTokenAddr] = await Promise.all([
      lendingPool.LTV(),
      lendingPool.LIQUIDATION_THRESHOLD(),
      lendingPool.priceOracle(),
      lendingPool.rwaToken(),
      lendingPool.usdcToken()
    ]);

    return {
      loanToValue: ltv.toString(), // 50
      liquidationThreshold: liquidationThreshold.toString(), // 80
      priceOracle: priceOracleAddr,
      rwaToken: rwaTokenAddr,
      usdcToken: usdcTokenAddr
    };
  } catch (error) {
    console.error('獲取協議參數失敗:', error);
    return null;
  }
}
```

### 14. 檢查合規性

```javascript
// 使用借貸池的 checkCompliance 函數檢查用戶白名單狀態
async function checkUserCompliance(userAddress) {
  try {
    const isCompliant = await lendingPool.checkCompliance(userAddress);
    return isCompliant;
  } catch (error) {
    console.error('檢查合規性失敗:', error);
    return false;
  }
}
```

### 15. 獲取池子餘額

```javascript
// 獲取借貸池中的 USDC 餘額
async function getPoolBalance() {
  try {
    const poolAddress = contractConfig.FluidPay_LendingPool.address;
    const balance = await usdcToken.balanceOf(poolAddress);
    return ethers.formatUnits(balance, 6);
  } catch (error) {
    console.error('獲取池子餘額失敗:', error);
    return '0';
  }
}

// 獲取池子中的 RWA 代幣餘額（鎖定的抵押品總額）
async function getPoolCollateralBalance() {
  try {
    const poolAddress = contractConfig.FluidPay_LendingPool.address;
    const balance = await rwaToken.balanceOf(poolAddress);
    return ethers.formatUnits(balance, 18);
  } catch (error) {
    console.error('獲取抵押品餘額失敗:', error);
    return '0';
  }
}
```

```javascript
async function calculateHealthRatio(userAddress) {
  try {
    const loan = await getUserLoan(userAddress);
    const price = await getAssetPrice(contractConfig.Mock_RWA_Token.address);
    
    const collateralValue = parseFloat(loan.collateralAmount) * parseFloat(price);
    const debtValue = parseFloat(loan.debtAmount);
    
    if (debtValue === 0) return Infinity; // 無債務
    
    const healthRatio = (collateralValue / debtValue) * 100;
    return healthRatio;
  } catch (error) {
    console.error('計算健康度失敗:', error);
    return 0;
  }
}
```

## 事件監聽

**注意**: 目前的合約沒有實作事件機制，如需監聽狀態變化，建議使用輪詢方式：

```javascript
// 監控用戶借款狀態變化
async function monitorUserLoan(userAddress, intervalMs = 10000) {
  let lastLoan = await getUserLoan(userAddress);
  
  setInterval(async () => {
    try {
      const currentLoan = await getUserLoan(userAddress);
      
      // 檢查抵押品變化
      if (currentLoan.collateralAmount !== lastLoan.collateralAmount) {
        console.log('抵押品變化:', {
          user: userAddress,
          oldCollateral: lastLoan.collateralAmount,
          newCollateral: currentLoan.collateralAmount
        });
      }
      
      // 檢查債務變化
      if (currentLoan.debtAmount !== lastLoan.debtAmount) {
        console.log('債務變化:', {
          user: userAddress,
          oldDebt: lastLoan.debtAmount,
          newDebt: currentLoan.debtAmount
        });
      }
      
      lastLoan = currentLoan;
    } catch (error) {
      console.error('監控借款狀態失敗:', error);
    }
  }, intervalMs);
}
```

## 重要限制與注意事項

### 1. 數值精度
- **USDC**: 6 位小數
- **RWA Token (tTSLA)**: 18 位小數
- **價格**: 8 位小數
- 在前端顯示時務必使用正確的小數位數

### 2. 白名單限制
- **目的**: 符合 ERC-3643 標準，確保只有 KYC/AML 驗證用戶才能參與
- 只有白名單用戶才能進行抵押借款
- 新用戶需要先加入白名單：`await rwaToken.addWhitelist(userAddress)`
- ⚠️ **安全性注意**: 目前任何人都可以調用 `addWhitelist`，生產環境應限制為管理員權限

### 3. 價格管理權限
- **目的**: 提供即時資產價格用於抵押品估值
- 價格影響借款額度和清算門檻
- ⚠️ **安全性注意**: 目前任何人都可以更新價格，生產環境應：
  - 限制為授權的價格提供者
  - 實作價格變動上限保護
  - 加入多重簽名或時間鎖定機制

### 4. 健康度要求
- **貸款價值比 (LTV)**: 最大 50%（合約常數 `LTV = 50`）
- **清算門檻**: 80%（合約常數 `LIQUIDATION_THRESHOLD = 80`）
- 健康度 = (抵押品價值 / 債務價值) × 100%
- 當健康度低於 80% 時，貸款可被清算
- 清算時，清算者支付全部債務並獲得全部抵押品

### 4. 授權要求
- 在轉移代幣前，必須先授權合約使用代幣
- 每次交易都需要用戶確認 MetaMask 交易

### 5. 錯誤處理
常見錯誤：
- `ERC20InsufficientBalance`: 餘額不足
- `ERC20InsufficientAllowance`: 授權額度不足
- `User not whitelisted`: 用戶未在白名單
- `Loan would be unhealthy`: 貸款健康度不符要求

### 6. Gas 費用
- 每筆交易都需要支付 Gas 費用
- 建議在發送交易前估算 Gas：
```javascript
const gasEstimate = await lendingPool.lockAndBorrow.estimateGas(
  rwaAmountWei,
  usdcAmountWei
);
```

### 7. 網路連接
- 確保 MetaMask 連接到正確的網路 (localhost:8545)
- 處理網路切換和帳戶變更事件：
```javascript
window.ethereum.on('chainChanged', () => {
  window.location.reload();
});

window.ethereum.on('accountsChanged', (accounts) => {
  if (accounts.length === 0) {
    // 用戶斷開連接
    console.log('請連接 MetaMask');
  }
});
```

## 測試資料

部署腳本會自動設置以下測試資料：
- tTSLA 價格: $200.00 (20,000,000,000 - 8位小數)
- 部署者帳戶會收到:
  - 1,000,000 mUSDC
  - 1,000 tTSLA
  - 自動加入白名單
- 借貸池會預先注入 1,000,000 mUSDC

## 故障排除

### 合約地址找不到
檢查 `contract-config.json` 是否存在且包含正確的合約地址。

### 交易失敗
1. 檢查 Gas 限制是否足夠
2. 確認帳戶餘額足夠支付 Gas
3. 檢查授權是否充足
4. 驗證白名單狀態

### MetaMask 連接問題
1. 確認 MetaMask 已安裝且已解鎖
2. 檢查網路設定是否正確
3. 重新整理頁面或重啟 MetaMask

## 完整範例應用

```javascript
class FluidPayDApp {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contracts = {};
  }

  async init() {
    // 連接 MetaMask
    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
    
    // 載入合約配置
    const config = await fetch('./contract-config.json').then(r => r.json());
    
    // 初始化合約實例
    Object.keys(config).forEach(contractName => {
      this.contracts[contractName] = new ethers.Contract(
        config[contractName].address,
        config[contractName].abi,
        this.signer
      );
    });
  }

  // 獲取用戶儀表板資訊
  async getUserDashboard() {
    const userAddress = await this.signer.getAddress();
    
    const [balances, loan, isWhitelisted, price] = await Promise.all([
      this.getBalances(userAddress),
      this.getUserLoan(userAddress),
      this.checkWhitelist(userAddress),
      this.getAssetPrice(this.contracts.Mock_RWA_Token.target)
    ]);

    const healthRatio = await this.calculateHealthRatio(userAddress);

    return {
      userAddress,
      balances,
      loan,
      isWhitelisted,
      price,
      healthRatio
    };
  }

  // 白名單管理
  async addToWhitelist(userAddress) {
    const tx = await this.contracts.Mock_RWA_Token.addWhitelist(userAddress);
    return await tx.wait();
  }

  async checkWhitelist(userAddress) {
    return await this.contracts.Mock_RWA_Token.isWhitelisted(userAddress);
  }

  // 價格管理
  async updatePrice(tokenAddress, newPriceUSD) {
    const priceWith8Decimals = ethers.parseUnits(newPriceUSD.toString(), 8);
    const tx = await this.contracts.Mock_PriceOracle.setPrice(tokenAddress, priceWith8Decimals);
    return await tx.wait();
  }

  async getAssetPrice(tokenAddress) {
    const price = await this.contracts.Mock_PriceOracle.getPrice(tokenAddress);
    return ethers.formatUnits(price, 8);
  }

  // 管理員面板功能
  async getAdminDashboard() {
    const tTSLAAddress = this.contracts.Mock_RWA_Token.target;
    const currentPrice = await this.getAssetPrice(tTSLAAddress);
    
    return {
      currentPrice,
      contracts: {
        lendingPool: this.contracts.FluidPay_LendingPool.target,
        rwaToken: tTSLAAddress,
        usdc: this.contracts.Mock_USDC.target,
        oracle: this.contracts.Mock_PriceOracle.target
      }
    };
  }
}

// 使用範例
const app = new FluidPayDApp();
await app.init();

// 用戶操作
const dashboard = await app.getUserDashboard();
console.log('用戶儀表板:', dashboard);

// 管理員操作
const adminData = await app.getAdminDashboard();
console.log('管理員面板:', adminData);

// 添加用戶到白名單
await app.addToWhitelist('0x742...ABC');

// 更新 tTSLA 價格為 $220
await app.updatePrice(app.contracts.Mock_RWA_Token.target, 220);
```

這份文件應該能幫助前端同事快速上手並整合 FluidPay 借貸協議。如有任何問題，請隨時詢問！