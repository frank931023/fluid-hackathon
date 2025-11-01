import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  console.log("🧪 測試合約部署狀態\n");

  const [deployer] = await ethers.getSigners();
  console.log("測試帳戶:", deployer.address);

  // 合約地址
  const USDC_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const RWA_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const ORACLE_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const POOL_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

  // 獲取合約實例
  const usdc = await ethers.getContractAt("Mock_USDC", USDC_ADDRESS);
  const rwa = await ethers.getContractAt("Mock_RWA_Token", RWA_ADDRESS);
  const oracle = await ethers.getContractAt("Mock_PriceOracle", ORACLE_ADDRESS);
  const pool = await ethers.getContractAt("FluidPay_LendingPool", POOL_ADDRESS);

  console.log("\n📊 檢查合約狀態:");
  
  // 檢查 USDC
  const usdcBalance = await usdc.balanceOf(deployer.address);
  console.log(`✅ USDC 餘額: ${ethers.formatUnits(usdcBalance, 6)} mUSDC`);

  // 檢查 RWA
  const rwaBalance = await rwa.balanceOf(deployer.address);
  console.log(`✅ tTSLA 餘額: ${ethers.formatUnits(rwaBalance, 18)} tTSLA`);

  // 檢查白名單
  const isWhitelisted = await rwa.isWhitelisted(deployer.address);
  console.log(`✅ 白名單狀態: ${isWhitelisted ? '已加入' : '未加入'}`);

  // 檢查價格
  const price = await oracle.getPrice(RWA_ADDRESS);
  console.log(`✅ tTSLA 價格: $${ethers.formatUnits(price, 8)}`);

  // 檢查池子餘額
  const poolBalance = await usdc.balanceOf(POOL_ADDRESS);
  console.log(`✅ 借貸池餘額: ${ethers.formatUnits(poolBalance, 6)} mUSDC`);

  console.log("\n✅ 所有檢查完成！合約運行正常。");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
