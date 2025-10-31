import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy Mock_USDC
    const MockUSDC = await ethers.getContractFactory("Mock_USDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.deployed();
    console.log("Mock_USDC deployed to:", mockUSDC.address);

    // Deploy Mock_RWA_Token
    const MockRWAToken = await ethers.getContractFactory("Mock_RWA_Token");
    const mockRWAToken = await MockRWAToken.deploy();
    await mockRWAToken.deployed();
    console.log("Mock_RWA_Token deployed to:", mockRWAToken.address);

    // Deploy Mock_PriceOracle
    const MockPriceOracle = await ethers.getContractFactory("Mock_PriceOracle");
    const mockPriceOracle = await MockPriceOracle.deploy();
    await mockPriceOracle.deployed();
    console.log("Mock_PriceOracle deployed to:", mockPriceOracle.address);

    // Deploy FluidPay_LendingPool
    const FluidPayLendingPool = await ethers.getContractFactory("FluidPay_LendingPool");
    const fluidPayLendingPool = await FluidPayLendingPool.deploy(mockPriceOracle.address);
    await fluidPayLendingPool.deployed();
    console.log("FluidPay_LendingPool deployed to:", fluidPayLendingPool.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });