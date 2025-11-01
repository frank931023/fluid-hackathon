import { ethers } from 'hardhat';

async function main() {
  // 獲取合約實例
  const [deployer] = await ethers.getSigners();
  console.log('測試帳戶:', deployer.address);

  const lendingPool = await ethers.getContractAt(
    'FluidPay_LendingPool',
    '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'
  );
  const rwaToken = await ethers.getContractAt(
    'Mock_RWA_Token',
    '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
  );
  const usdcToken = await ethers.getContractAt(
    'Mock_USDC',
    '0x5FbDB2315678afecb367f032d93F642f64180aa3'
  );

  console.log('\n=== 測試 lockAndBorrow 參數類型 ===\n');

  // 測試 1: 使用字符串
  const rwaAmountStr = '0.0235'; // 對應 2 USDC 的抵押（$200 tTSLA 價格）
  const usdcAmountStr = '2';

  console.log('1. 輸入參數:');
  console.log('  RWA Amount:', rwaAmountStr, '| Type:', typeof rwaAmountStr);
  console.log('  USDC Amount:', usdcAmountStr, '| Type:', typeof usdcAmountStr);

  const rwaAmountWei = ethers.parseUnits(rwaAmountStr, 18);
  const usdcAmountWei = ethers.parseUnits(usdcAmountStr, 6);

  console.log('\n2. parseUnits 結果:');
  console.log('  RWA Wei:', rwaAmountWei.toString(), '| Type:', typeof rwaAmountWei);
  console.log('  USDC Wei:', usdcAmountWei.toString(), '| Type:', typeof usdcAmountWei);

  // 測試錯誤的方式（傳入 number）
  console.log('\n3. 測試錯誤方式 - 傳入 number:');
  try {
    const wrongWei = ethers.parseUnits(2, 6); // ❌ 這會報錯
    console.log('  ❌ 不應該到這裡');
  } catch (error) {
    console.log('  ✅ 預期錯誤:', error.message);
  }

  // 檢查白名單
  console.log('\n4. 檢查白名單狀態:');
  const isWhitelisted = await rwaToken.isWhitelisted(deployer.address);
  console.log('  是否在白名單:', isWhitelisted);

  if (!isWhitelisted) {
    console.log('  添加到白名單...');
    const tx = await rwaToken.addWhitelist(deployer.address);
    await tx.wait();
    console.log('  ✅ 已添加');
  }

  // 檢查餘額
  console.log('\n5. 檢查餘額:');
  const rwaBalance = await rwaToken.balanceOf(deployer.address);
  const usdcBalance = await usdcToken.balanceOf(deployer.address);
  console.log('  tTSLA:', ethers.formatUnits(rwaBalance, 18));
  console.log('  mUSDC:', ethers.formatUnits(usdcBalance, 6));

  // 執行借款
  console.log('\n6. 執行借款流程:');
  
  // 授權
  console.log('  授權 RWA...');
  const approveTx = await rwaToken.approve(lendingPool.target, rwaAmountWei);
  await approveTx.wait();
  console.log('  ✅ 授權完成');

  // 借款
  console.log('  執行 lockAndBorrow...');
  console.log('  參數類型檢查:');
  console.log('    rwaAmountWei type:', typeof rwaAmountWei);
  console.log('    usdcAmountWei type:', typeof usdcAmountWei);
  
  const borrowTx = await lendingPool.lockAndBorrow(rwaAmountWei, usdcAmountWei);
  await borrowTx.wait();
  console.log('  ✅ 借款成功!');
  console.log('  交易哈希:', borrowTx.hash);

  // 檢查貸款狀態
  console.log('\n7. 檢查貸款狀態:');
  const loan = await lendingPool.loans(deployer.address);
  console.log('  抵押品:', ethers.formatUnits(loan.rwaCollateralAmount, 18), 'tTSLA');
  console.log('  債務:', ethers.formatUnits(loan.stablecoinDebtAmount, 6), 'USDC');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
