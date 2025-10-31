import fs from 'fs/promises';
import path from 'path';

const ARTIFACTS = {
  USDC: 'artifacts/contracts/Mock_USDC.sol/Mock_USDC.json',
  RWA: 'artifacts/contracts/Mock_RWA_Token.sol/Mock_RWA_Token.json',
  ORACLE: 'artifacts/contracts/Mock_PriceOracle.sol/Mock_PriceOracle.json',
  POOL: 'artifacts/contracts/FluidPay_LendingPool.sol/FluidPay_LendingPool.json',
};

const DEPLOYMENTS_FILE = 'deployments/local-deployment.json';
const OUT_FILE = 'contract-config.json';

async function readJson(p) {
  try {
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

async function main() {
  const result = {
    network: 'localhost',
    addresses: {
      Mock_USDC: '',
      Mock_RWA_Token: '',
      Mock_PriceOracle: '',
      FluidPay_LendingPool: '',
    },
    abis: {
      Mock_USDC: [],
      Mock_RWA_Token: [],
      Mock_PriceOracle: [],
      FluidPay_LendingPool: [],
    },
  };

  // Load deployments if present
  const deployments = await readJson(DEPLOYMENTS_FILE);
  if (deployments && deployments.contracts) {
    result.network = deployments.network || result.network;
    result.addresses.Mock_USDC = deployments.contracts.Mock_USDC || '';
    result.addresses.Mock_RWA_Token = deployments.contracts.Mock_RWA_Token || '';
    result.addresses.Mock_PriceOracle = deployments.contracts.Mock_PriceOracle || '';
    result.addresses.FluidPay_LendingPool = deployments.contracts.FluidPay_LendingPool || '';
  }

  // Read ABIs from artifacts
  for (const [key, relPath] of Object.entries(ARTIFACTS)) {
    const p = path.resolve(relPath);
    try {
      const json = await readJson(p);
      if (json && json.abi) {
        // store under the same naming as addresses
        if (key === 'USDC') result.abis.Mock_USDC = json.abi;
        if (key === 'RWA') result.abis.Mock_RWA_Token = json.abi;
        if (key === 'ORACLE') result.abis.Mock_PriceOracle = json.abi;
        if (key === 'POOL') result.abis.FluidPay_LendingPool = json.abi;
      } else {
        console.warn(`ABI not found in artifact ${p}`);
      }
    } catch (err) {
      console.warn(`Failed to read artifact ${p}: ${err.message}`);
    }
  }

  await fs.writeFile(OUT_FILE, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Wrote ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
