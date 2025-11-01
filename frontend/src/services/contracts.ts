// @ts-nocheck
import { ethers } from "ethers";
import contractConfigData from "../contract-config.json";

// 合約配置
const contractConfig = contractConfigData as {
  addresses: {
    Mock_USDC: string;
    Mock_RWA_Token: string;
    Mock_PriceOracle: string;
    FluidPay_LendingPool: string;
  };
  abis: {
    Mock_USDC: any[];
    Mock_RWA_Token: any[];
    Mock_PriceOracle: any[];
    FluidPay_LendingPool: any[];
  };
};

// 合約地址
export const CONTRACT_ADDRESSES = contractConfig.addresses;

// 合約 ABI
export const CONTRACT_ABIS = contractConfig.abis;

// 合約實例緩存
let providerCache: ethers.BrowserProvider | null = null;
let signerCache: ethers.JsonRpcSigner | null = null;
let contractsCache: {
  lendingPool?: ethers.Contract;
  usdcToken?: ethers.Contract;
  rwaToken?: ethers.Contract;
  priceOracle?: ethers.Contract;
} = {};

function assertConfigured() {
  const entries = Object.entries(CONTRACT_ADDRESSES || {});
  for (const [name, addr] of entries) {
    if (!addr || typeof addr !== "string" || !ethers.isAddress(addr)) {
      throw new Error(
        `Contract address not configured for ${name}. ` +
          `Please run deployment + generate-contract-config-json and copy it to frontend/src/. ` +
          `Current value: ${JSON.stringify(addr)}`
      );
    }
  }
}

/**
 * 獲取 Provider
 */
export async function getProvider(): Promise<ethers.BrowserProvider> {
  if (!window.ethereum) {
    throw new Error("請安裝 MetaMask 或其他 Web3 錢包");
  }

  if (!providerCache) {
    providerCache = new ethers.BrowserProvider(window.ethereum);
  }

  return providerCache;
}

/**
 * 確保當前網路為本地 Hardhat (chainId 31337)
 */
async function assertCorrectNetwork() {
  const provider = await getProvider();
  const net = await provider.getNetwork();
  // ethers v6 chainId 是 bigint
  if (net?.chainId !== 31337n) {
    // 嘗試自動切換或新增本地網路
    await trySwitchToLocalhost();
    const recheck = await provider.getNetwork();
    if (recheck?.chainId !== 31337n) {
      throw new Error(
        `Wrong network: please switch MetaMask to Localhost 8545 (chainId 31337). ` +
          `Current chainId: ${recheck?.chainId?.toString?.()}`
      );
    }
  }
}

async function trySwitchToLocalhost() {
  if (!window.ethereum?.request) return;
  const CHAIN_ID_HEX = "0x7A69"; // 31337
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_ID_HEX }],
    });
  } catch (switchErr: any) {
    // 錯誤碼 4902: 未添加此鏈
    if (switchErr?.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: CHAIN_ID_HEX,
              chainName: "Localhost 8545",
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              rpcUrls: ["http://127.0.0.1:8545"],
              blockExplorerUrls: [],
            },
          ],
        });
        // 添加後再嘗試切換
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: CHAIN_ID_HEX }],
        });
      } catch (addErr) {
        console.warn("Failed to add/switch to Localhost 8545:", addErr);
      }
    } else {
      console.warn("Switch chain rejected or failed:", switchErr);
    }
  }
}

/**
 * 獲取 Signer
 */
export async function getSigner(): Promise<ethers.JsonRpcSigner> {
  if (!signerCache) {
    const provider = await getProvider();
    signerCache = await provider.getSigner();
    // 檢查網路是否正確（導致使用者在 Ethereum Mainnet 時不會誤送交易）
    await assertCorrectNetwork();
  }

  return signerCache;
}

/**
 * 清除合約緩存
 */
export function clearCache() {
  console.log("🧹 清除合約緩存");
  providerCache = null;
  signerCache = null;
  contractsCache = {};
}

/**
 * 獲取 LendingPool 合約實例
 */
export async function getLendingPoolContract(): Promise<ethers.Contract> {
  assertConfigured();
  if (!contractsCache.lendingPool) {
    const signer = await getSigner();
    contractsCache.lendingPool = new ethers.Contract(
      CONTRACT_ADDRESSES.FluidPay_LendingPool,
      CONTRACT_ABIS.FluidPay_LendingPool,
      signer
    );
  }
  return contractsCache.lendingPool;
}

/**
 * 獲取 USDC Token 合約實例
 */
export async function getUSDCContract(): Promise<ethers.Contract> {
  assertConfigured();
  if (!contractsCache.usdcToken) {
    const signer = await getSigner();
    contractsCache.usdcToken = new ethers.Contract(
      CONTRACT_ADDRESSES.Mock_USDC,
      CONTRACT_ABIS.Mock_USDC,
      signer
    );
  }
  return contractsCache.usdcToken;
}

/**
 * 獲取 RWA Token 合約實例
 */
export async function getRWAContract(): Promise<ethers.Contract> {
  assertConfigured();
  if (!contractsCache.rwaToken) {
    const signer = await getSigner();
    contractsCache.rwaToken = new ethers.Contract(
      CONTRACT_ADDRESSES.Mock_RWA_Token,
      CONTRACT_ABIS.Mock_RWA_Token,
      signer
    );
  }
  return contractsCache.rwaToken;
}

/**
 * 獲取 Price Oracle 合約實例
 */
export async function getPriceOracleContract(): Promise<ethers.Contract> {
  assertConfigured();
  if (!contractsCache.priceOracle) {
    const signer = await getSigner();
    contractsCache.priceOracle = new ethers.Contract(
      CONTRACT_ADDRESSES.Mock_PriceOracle,
      CONTRACT_ABIS.Mock_PriceOracle,
      signer
    );
  }
  return contractsCache.priceOracle;
}

// ============= 錢包相關函數 =============

/**
 * 連接錢包
 * @param forceSelect - 強制顯示帳戶選擇器（用於切換帳戶）
 */
export async function connectWallet(forceSelect = false): Promise<string> {
  const provider = await getProvider();

  // 如果需要強制選擇帳戶，先請求權限
  if (forceSelect && window.ethereum?.request) {
    try {
      // 使用 wallet_requestPermissions 強制顯示帳戶選擇器
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
    } catch (error) {
      console.log("User cancelled account selection");
      // 如果用戶取消，繼續使用當前帳戶
    }
  }

  const accounts = await provider.send("eth_requestAccounts", []);

  // 清除舊的 signer 緩存
  signerCache = null;
  contractsCache = {};

  return accounts[0];
}

/**
 * 獲取當前連接的地址
 */
export async function getCurrentAddress(): Promise<string | null> {
  try {
    const signer = await getSigner();
    return await signer.getAddress();
  } catch {
    return null;
  }
}

/**
 * 獲取代幣餘額
 */
export async function getTokenBalance(
  tokenAddress: string,
  userAddress: string
): Promise<string> {
  const provider = await getProvider();
  const tokenContract = new ethers.Contract(
    tokenAddress,
    [
      "function balanceOf(address) view returns (uint256)",
      "function decimals() view returns (uint8)",
    ],
    provider
  );

  const balance = (await tokenContract.balanceOf(userAddress)) as bigint;
  const decimals = (await tokenContract.decimals()) as number;

  return ethers.formatUnits(balance, decimals);
}

/**
 * 獲取 USDC 餘額
 */
export async function getUSDCBalance(userAddress: string): Promise<string> {
  const usdcContract = await getUSDCContract();
  const balance = await usdcContract.balanceOf(userAddress);
  return ethers.formatUnits(balance, 6); // USDC 使用 6 位小數
}

/**
 * 獲取 RWA 餘額
 */
export async function getRWABalance(userAddress: string): Promise<string> {
  const rwaContract = await getRWAContract();
  const balance = await rwaContract.balanceOf(userAddress);
  return ethers.formatUnits(balance, 18); // RWA 使用 18 位小數
}

/**
 * 獲取 ETH 餘額
 */
export async function getETHBalance(userAddress: string): Promise<string> {
  const provider = await getProvider();
  const balance = await provider.getBalance(userAddress);
  return ethers.formatEther(balance);
}

// ============= 白名單相關函數 =============

/**
 * 檢查用戶是否在白名單中
 */
export async function isWhitelisted(userAddress: string): Promise<boolean> {
  try {
    // 確保在正確的本地網路上
    await assertCorrectNetwork();
    // 使用 provider 而不是 signer 進行只讀操作
    const provider = await getProvider();
    // 先檢查合約是否真的部署在當前網路
    const code = await provider.getCode(CONTRACT_ADDRESSES.Mock_RWA_Token);
    if (!code || code === "0x") {
      throw new Error(
        `Contract not found on current network. Please switch to Localhost 8545 (31337) and redeploy if needed. Address: ${CONTRACT_ADDRESSES.Mock_RWA_Token}`
      );
    }
    const rwaContract = new ethers.Contract(
      CONTRACT_ADDRESSES.Mock_RWA_Token,
      CONTRACT_ABIS.Mock_RWA_Token,
      provider
    );

    console.log("📝 RWA 合約地址:", await rwaContract.getAddress());
    console.log("🔍 檢查地址:", userAddress);

    const result = await rwaContract.isWhitelisted(userAddress);
    console.log("📊 合約返回結果:", result);

    return Boolean(result);
  } catch (error) {
    console.error("❌ isWhitelisted 函數錯誤:", error);
    // 針對常見錯誤提供更友善訊息
    if ((error as any)?.code === "CALL_EXCEPTION") {
      throw new Error(
        "呼叫失敗：請確認 MetaMask 已切換到 Localhost 8545 (chainId 31337)，且合約已在該網路部署。"
      );
    }
    throw error;
  }
}

/**
 * 添加用戶到白名單
 */
export async function addToWhitelist(
  userAddress: string
): Promise<ethers.TransactionReceipt> {
  const rwaContract = await getRWAContract();
  const tx = await rwaContract.addWhitelist(userAddress);
  return await tx.wait();
}

/**
 * 添加自己到白名單（使用新的 addMeToWhitelist 函數）
 */
export async function addMeToWhitelist(): Promise<ethers.TransactionReceipt> {
  const rwaContract = await getRWAContract();
  const tx = await rwaContract.addMeToWhitelist();
  return await tx.wait();
}

// ============= 價格相關函數 =============

/**
 * 獲取資產價格（返回美元價格，已格式化）
 */
export async function getAssetPrice(tokenAddress: string): Promise<string> {
  const oracleContract = await getPriceOracleContract();
  const price = await oracleContract.getPrice(tokenAddress);
  return ethers.formatUnits(price, 8); // 價格使用 8 位小數
}

/**
 * 獲取 RWA 代幣價格
 */
export async function getRWAPrice(): Promise<string> {
  return await getAssetPrice(CONTRACT_ADDRESSES.Mock_RWA_Token);
}

/**
 * 更新資產價格
 */
export async function updateAssetPrice(
  tokenAddress: string,
  newPriceUSD: string
): Promise<ethers.TransactionReceipt> {
  const oracleContract = await getPriceOracleContract();
  const priceWith8Decimals = ethers.parseUnits(newPriceUSD, 8);
  const tx = await oracleContract.setPrice(tokenAddress, priceWith8Decimals);
  return await tx.wait();
}

// ============= 借貸相關函數 =============

/**
 * 獲取用戶的借款資訊
 */
export async function getUserLoan(userAddress: string): Promise<{
  collateralAmount: string;
  debtAmount: string;
}> {
  const lendingPool = await getLendingPoolContract();
  const loan = await lendingPool.loans(userAddress);

  return {
    collateralAmount: ethers.formatUnits(loan.rwaCollateralAmount, 18),
    debtAmount: ethers.formatUnits(loan.stablecoinDebtAmount, 6),
  };
}

/**
 * 抵押借款
 * @param rwaAmount - RWA 代幣數量（已格式化的字符串）
 * @param usdcAmount - 要借的 USDC 數量（已格式化的字符串）
 */
export async function lockAndBorrow(
  rwaAmount: string,
  usdcAmount: string
): Promise<ethers.TransactionReceipt> {
  console.log("🔒 開始借貸流程");
  console.log(
    "  原始 RWA 金額:",
    rwaAmount,
    "| Type:",
    typeof rwaAmount,
    "| Value:",
    JSON.stringify(rwaAmount)
  );
  console.log(
    "  原始 USDC 金額:",
    usdcAmount,
    "| Type:",
    typeof usdcAmount,
    "| Value:",
    JSON.stringify(usdcAmount)
  );

  // 強制轉換為字符串，確保類型正確
  const rwaAmountStr = String(rwaAmount);
  const usdcAmountStr = String(usdcAmount);

  console.log("  轉換後 RWA:", rwaAmountStr, "| Type:", typeof rwaAmountStr);
  console.log("  轉換後 USDC:", usdcAmountStr, "| Type:", typeof usdcAmountStr);

  // 驗證參數
  if (!rwaAmountStr || !usdcAmountStr) {
    throw new Error("RWA 金額或 USDC 金額不能為空");
  }

  const rwaContract = await getRWAContract();
  const lendingPool = await getLendingPoolContract();

  console.log("⚡ 準備調用 parseUnits:");
  console.log(
    "  parseUnits(",
    rwaAmountStr,
    ", 18) - Type:",
    typeof rwaAmountStr
  );
  console.log(
    "  parseUnits(",
    usdcAmountStr,
    ", 6) - Type:",
    typeof usdcAmountStr
  );

  const rwaAmountWei = ethers.parseUnits(rwaAmountStr, 18);
  const usdcAmountWei = ethers.parseUnits(usdcAmountStr, 6);

  console.log(
    "  ✅ RWA Wei:",
    rwaAmountWei.toString(),
    "| Type:",
    typeof rwaAmountWei
  );
  console.log(
    "  ✅ USDC Wei:",
    usdcAmountWei.toString(),
    "| Type:",
    typeof usdcAmountWei
  );

  // 1. 授權 RWA 代幣給借貸池
  console.log("📝 步驟 1: 授權 RWA 代幣");
  const approveTx = await rwaContract.approve(
    CONTRACT_ADDRESSES.FluidPay_LendingPool,
    rwaAmountWei
  );
  console.log("  授權交易哈希:", approveTx.hash);
  await approveTx.wait();
  console.log("  ✅ 授權完成");

  // 2. 執行抵押借款
  console.log("📝 步驟 2: 執行抵押借款");
  const borrowTx = await lendingPool.lockAndBorrow(rwaAmountWei, usdcAmountWei);
  console.log("  借款交易哈希:", borrowTx.hash);
  const receipt = await borrowTx.wait();
  console.log("  ✅ 借款完成");

  return receipt;
}

/**
 * 還款
 * @param repayAmount - 要還的 USDC 數量（已格式化的字符串）
 */
export async function repayLoan(
  repayAmount: string
): Promise<ethers.TransactionReceipt> {
  const usdcContract = await getUSDCContract();
  const lendingPool = await getLendingPoolContract();

  const repayAmountWei = ethers.parseUnits(repayAmount, 6);

  // 1. 授權 USDC 給借貸池
  const approveTx = await usdcContract.approve(
    CONTRACT_ADDRESSES.FluidPay_LendingPool,
    repayAmountWei
  );
  await approveTx.wait();

  // 2. 執行還款
  const repayTx = await lendingPool.repay(repayAmountWei);
  return await repayTx.wait();
}

/**
 * 解鎖抵押品
 * @param rwaAmount - 要解鎖的 RWA 數量（已格式化的字符串）
 */
export async function unlockCollateral(
  rwaAmount: string
): Promise<ethers.TransactionReceipt> {
  const lendingPool = await getLendingPoolContract();
  const rwaAmountWei = ethers.parseUnits(rwaAmount, 18);

  const unlockTx = await lendingPool.unlockCollateral(rwaAmountWei);
  return await unlockTx.wait();
}

/**
 * 清算貸款
 */
export async function liquidateLoan(
  userAddress: string
): Promise<ethers.TransactionReceipt> {
  const usdcContract = await getUSDCContract();
  const lendingPool = await getLendingPoolContract();

  // 1. 獲取用戶債務
  const loan = await getUserLoan(userAddress);
  const debtAmountWei = ethers.parseUnits(loan.debtAmount, 6);

  // 2. 授權 USDC
  const approveTx = await usdcContract.approve(
    CONTRACT_ADDRESSES.FluidPay_LendingPool,
    debtAmountWei
  );
  await approveTx.wait();

  // 3. 執行清算
  const liquidateTx = await lendingPool.liquidate(userAddress);
  return await liquidateTx.wait();
}

/**
 * 為借貸池注入流動性
 */
export async function fundPool(
  usdcAmount: string
): Promise<ethers.TransactionReceipt> {
  const usdcContract = await getUSDCContract();
  const lendingPool = await getLendingPoolContract();

  const usdcAmountWei = ethers.parseUnits(usdcAmount, 6);

  // 1. 授權 USDC
  const approveTx = await usdcContract.approve(
    CONTRACT_ADDRESSES.FluidPay_LendingPool,
    usdcAmountWei
  );
  await approveTx.wait();

  // 2. 注入流動性
  const fundTx = await lendingPool.fundPool(usdcAmountWei);
  return await fundTx.wait();
}

/**
 * 計算健康度
 */
export async function calculateHealthRatio(
  userAddress: string
): Promise<number> {
  const loan = await getUserLoan(userAddress);
  const price = await getRWAPrice();

  const collateralValue = parseFloat(loan.collateralAmount) * parseFloat(price);
  const debtValue = parseFloat(loan.debtAmount);

  if (debtValue === 0) return Infinity;

  return (collateralValue / debtValue) * 100;
}

/**
 * 獲取協議參數
 */
export async function getProtocolInfo(): Promise<{
  loanToValue: string;
  liquidationThreshold: string;
  priceOracle: string;
  rwaToken: string;
  usdcToken: string;
}> {
  const lendingPool = await getLendingPoolContract();

  const [
    ltv,
    liquidationThreshold,
    priceOracleAddr,
    rwaTokenAddr,
    usdcTokenAddr,
  ] = await Promise.all([
    lendingPool.LTV(),
    lendingPool.LIQUIDATION_THRESHOLD(),
    lendingPool.priceOracle(),
    lendingPool.rwaToken(),
    lendingPool.usdcToken(),
  ]);

  return {
    loanToValue: ltv.toString(),
    liquidationThreshold: liquidationThreshold.toString(),
    priceOracle: priceOracleAddr,
    rwaToken: rwaTokenAddr,
    usdcToken: usdcTokenAddr,
  };
}

/**
 * 檢查用戶合規性
 */
export async function checkUserCompliance(
  userAddress: string
): Promise<boolean> {
  const lendingPool = await getLendingPoolContract();
  return await lendingPool.checkCompliance(userAddress);
}

/**
 * 獲取池子餘額
 */
export async function getPoolBalance(): Promise<string> {
  const usdcContract = await getUSDCContract();
  const balance = await usdcContract.balanceOf(
    CONTRACT_ADDRESSES.FluidPay_LendingPool
  );
  return ethers.formatUnits(balance, 6);
}

/**
 * 鑄造測試代幣（僅用於測試）
 */
export async function mintUSDC(
  toAddress: string,
  amount: string
): Promise<ethers.TransactionReceipt> {
  const usdcContract = await getUSDCContract();
  const amountWei = ethers.parseUnits(amount, 6);
  const tx = await usdcContract.mint(toAddress, amountWei);
  return await tx.wait();
}

export async function mintRWA(
  toAddress: string,
  amount: string
): Promise<ethers.TransactionReceipt> {
  const rwaContract = await getRWAContract();
  const amountWei = ethers.parseUnits(amount, 18);
  const tx = await rwaContract.mint(toAddress, amountWei);
  return await tx.wait();
}

// ============= 事件監聽 =============

/**
 * 監聽帳戶變更
 */
export function onAccountsChanged(callback: (accounts: string[]) => void) {
  if (window.ethereum) {
    window.ethereum.on("accountsChanged", callback);
  }
}

/**
 * 監聽鏈變更
 */
export function onChainChanged(callback: () => void) {
  if (window.ethereum) {
    window.ethereum.on("chainChanged", callback);
  }
}

/**
 * 移除所有監聽器
 */
export function removeAllListeners() {
  if (window.ethereum) {
    window.ethereum.removeAllListeners("accountsChanged");
    window.ethereum.removeAllListeners("chainChanged");
  }
}

// TypeScript 類型聲明
declare global {
  interface Window {
    ethereum?: any;
  }
}
