import pkg from "hardhat";
import fs from "fs/promises";
import path from "path";
const { ethers } = pkg;

// Helper function to parse numbers with correct decimals
// 100 USDC (6 decimals) -> 100 * 10**6
const usdc = (n) => ethers.parseUnits(n.toString(), 6);
// 10 tTSLA (18 decimals) -> 10 * 10**18
const rwa = (n) => ethers.parseUnits(n.toString(), 18);
// $170 (8 decimals) -> 170 * 10**8
const price = (n) => ethers.parseUnits(n.toString(), 8);

async function main() {
  // 1. Get the account to use for demo
  const [deployer] = await ethers.getSigners();
  console.log("Using deployer account:", deployer.address);

  // 2. Deploy Mock_USDC
  const Mock_USDC = await ethers.getContractFactory("Mock_USDC");
  const usdcToken = await Mock_USDC.deploy();
  await usdcToken.waitForDeployment();
  console.log("Mock_USDC deployed to:", await usdcToken.getAddress());

  // 3. Deploy Mock_RWA_Token ($tTSLA)
  const Mock_RWA_Token = await ethers.getContractFactory("Mock_RWA_Token");
  const rwaToken = await Mock_RWA_Token.deploy();
  await rwaToken.waitForDeployment();
  console.log(
    "Mock_RWA_Token ($tTSLA) deployed to:",
    await rwaToken.getAddress()
  );

  // 4. Deploy Mock_PriceOracle
  const Mock_PriceOracle = await ethers.getContractFactory("Mock_PriceOracle");
  const oracle = await Mock_PriceOracle.deploy();
  await oracle.waitForDeployment();
  console.log("Mock_PriceOracle deployed to:", await oracle.getAddress());

  // 5. Deploy FluidPay_LendingPool
  const FluidPay_LendingPool = await ethers.getContractFactory(
    "FluidPay_LendingPool"
  );
  const oracleAddress = await oracle.getAddress();
  const rwaAddress = await rwaToken.getAddress();
  const usdcAddress = await usdcToken.getAddress();

  const lendingPool = await FluidPay_LendingPool.deploy(
    oracleAddress,
    rwaAddress,
    usdcAddress
  );

  const lendingPoolAddress = await lendingPool.getAddress();

  await lendingPool.waitForDeployment();
  console.log("FluidPay_LendingPool deployed to:", lendingPoolAddress);

  console.log("\n--- Contracts Deployed ---\n");

  // =================================================================
  // 🚀 步驟 4: 執行「Demo 方便功能」 (Seeding the Demo)
  // =================================================================

  console.log("Seeding demo assets...");

  // A. Whitelist required addresses BEFORE mint/transfer (due to whitelist enforcement in token)
  let tx = await rwaToken.addWhitelist(deployer.address);
  await tx.wait();
  console.log("Whitelisted deployer address");

  tx = await rwaToken.addWhitelist(lendingPoolAddress);
  await tx.wait();
  console.log("Whitelisted LendingPool address");

  // B. Set the price of $tTSLA in the Oracle
  // We'll set it to $170.00 (with 8 decimals)
  tx = await oracle.setPrice(rwaAddress, price(170));
  await tx.wait();
  console.log("Set $tTSLA price to $170");

  // C. Mint $tTSLA and USDC to the deployer's wallet
  tx = await usdcToken.mint(deployer.address, usdc(100000)); // 100,000 mUSDC
  await tx.wait();
  tx = await rwaToken.mint(deployer.address, rwa(100)); // 100 $tTSLA
  await tx.wait();
  console.log("Minted 100,000 mUSDC and 100 $tTSLA to deployer");

  // D. Fund the Lending Pool with 1,000,000 USDC (demo uses 1,000 for speed)
  // First, approve the pool to spend our USDC
  tx = await usdcToken.approve(lendingPoolAddress, usdc(1000000));
  await tx.wait();
  // Then, call the fundPool function
  tx = await lendingPool.fundPool(usdc(1000));
  await tx.wait();
  console.log("Funded Lending Pool with 1,000 mUSDC");

  console.log("\n--- ✅ Demo Environment Ready! ---");
  console.log("Deployer Wallet:", deployer.address);
  console.log(
    "mUSDC Balance:",
    (await usdcToken.balanceOf(deployer.address)).toString()
  );
  console.log(
    "$tTSLA Balance:",
    (await rwaToken.balanceOf(deployer.address)).toString()
  );

  // -------------------------------------------------------------
  // Save deployments for frontend generator
  // -------------------------------------------------------------
  const deploymentsDir = path.resolve("deployments");
  await fs.mkdir(deploymentsDir, { recursive: true });
  const deploymentFile = path.join(deploymentsDir, "local-deployment.json");
  const deploymentData = {
    network: "localhost",
    contracts: {
      Mock_USDC: await usdcToken.getAddress(),
      Mock_RWA_Token: await rwaToken.getAddress(),
      Mock_PriceOracle: await oracle.getAddress(),
      FluidPay_LendingPool: lendingPoolAddress,
    },
  };
  await fs.writeFile(
    deploymentFile,
    JSON.stringify(deploymentData, null, 2),
    "utf8"
  );
  console.log(`Saved deployments to ${deploymentFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
