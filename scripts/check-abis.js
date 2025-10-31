import fs from "fs";
import path from "path";

const CONTRACTS = [
  "Mock_USDC",
  "Mock_RWA_Token",
  "Mock_PriceOracle",
  "FluidPay_LendingPool",
];

function checkAbiStructure(abi, name) {
  if (!Array.isArray(abi)) {
    console.error(`❌ ${name}: ABI 應該是陣列，但現在是 ${typeof abi}`);
    return false;
  }

  let hasFunction = false;
  let hasConstructor = false;

  for (const item of abi) {
    if (!item.type) {
      console.error(`❌ ${name}: ABI 條目缺少 "type" 欄位`);
      return false;
    }

    if (item.type === "function") hasFunction = true;
    if (item.type === "constructor") hasConstructor = true;

    // 檢查必要欄位格式
    if (item.type === "function" && !item.name) {
      console.error(`❌ ${name}: function 沒有 name 欄位`);
      return false;
    }
    if (!("inputs" in item) || !("stateMutability" in item)) {
      console.error(`❌ ${name}: 條目缺少 inputs/stateMutability 欄位`);
      return false;
    }
  }

  if (!hasFunction) {
    console.warn(`⚠️ ${name}: 沒有任何 function（可能是 library 或純資料合約）`);
  }

  if (!hasConstructor) {
    console.warn(`⚠️ ${name}: 沒有 constructor`);
  }

  console.log(`✅ ${name}: ABI 結構合理 (${abi.length} 個項目)`);
  return true;
}

async function main() {
  console.log("🔍 開始檢查 ABI 合理性...\n");

  let allPass = true;

  for (const contract of CONTRACTS) {
    const artifactPath = path.join(
      "artifacts/contracts",
      `${contract}.sol`,
      `${contract}.json`
    );

    if (!fs.existsSync(artifactPath)) {
      console.error(`❌ 找不到 ${artifactPath}`);
      allPass = false;
      continue;
    }

    const data = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const abi = data.abi;

    const ok = checkAbiStructure(abi, contract);
    if (!ok) allPass = false;
  }

  console.log("\n====================");
  if (allPass) {
    console.log("✅ 所有 ABI 都合理！");
  } else {
    console.log("❌ 檢查未通過，請修正上列問題");
  }
  console.log("====================\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
