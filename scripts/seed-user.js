import pkg from "hardhat";
import fs from "fs/promises";
import path from "path";
const { ethers } = pkg;

// helpers
const usdc = (n) => ethers.parseUnits(n.toString(), 6);
const rwa = (n) => ethers.parseUnits(n.toString(), 18);

async function main() {
  const user = process.argv[2] || process.env.SEED_USER;
  if (!user || !/^0x[a-fA-F0-9]{40}$/.test(user)) {
    console.error("Usage: node scripts/seed-user.js <USER_ADDRESS>");
    process.exit(1);
  }

  const deploymentsFile = path.resolve("deployments/local-deployment.json");
  const raw = await fs.readFile(deploymentsFile, "utf8");
  const d = JSON.parse(raw);
  const addresses = d.contracts || {};

  // Basic validations
  if (!addresses.Mock_USDC || !addresses.Mock_RWA_Token) {
    console.error(
      "Missing contract addresses in deployments/local-deployment.json"
    );
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  console.log("Using deployer:", deployer.address);
  console.log("Seeding user:", user);

  const usdcToken = await ethers.getContractAt(
    "Mock_USDC",
    addresses.Mock_USDC
  );
  const rwaToken = await ethers.getContractAt(
    "Mock_RWA_Token",
    addresses.Mock_RWA_Token
  );

  // Ensure we are connected to the correct network and contracts actually exist
  const provider = ethers.provider;
  const codeUSDC = await provider.getCode(addresses.Mock_USDC);
  const codeRWA = await provider.getCode(addresses.Mock_RWA_Token);
  if (codeUSDC === "0x" || codeRWA === "0x") {
    console.error(
      "Contracts not found on current network. Make sure the Hardhat node is running and run this script with --network localhost."
    );
    console.error("USDC address:", addresses.Mock_USDC, "code:", codeUSDC);
    console.error("RWA  address:", addresses.Mock_RWA_Token, "code:", codeRWA);
    process.exit(1);
  }

  // 1) Fund user with ETH for gas
  console.log("Sending 25 ETH to user for gas...");
  let tx = await deployer.sendTransaction({
    to: user,
    value: ethers.parseEther("25"),
  });
  await tx.wait();

  // 2) Whitelist user BEFORE mint/transfer
  console.log("Whitelisting user in tTSLA...");
  tx = await rwaToken.addWhitelist(user);
  await tx.wait();

  // 3) Mint demo tokens to user
  console.log("Minting 20,000 mUSDC to user...");
  tx = await usdcToken.mint(user, usdc(20000));
  await tx.wait();

  console.log("Minting 200 tTSLA to user...");
  tx = await rwaToken.mint(user, rwa(200));
  await tx.wait();

  console.log("\n✅ Seeding complete!");
  try {
    console.log("USDC:", (await usdcToken.balanceOf(user)).toString());
    console.log("tTSLA:", (await rwaToken.balanceOf(user)).toString());
  } catch (e) {
    console.warn(
      "Warning: Failed to read balances. This usually means the script was not connected to the same network as the deployed contracts.",
      e
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
