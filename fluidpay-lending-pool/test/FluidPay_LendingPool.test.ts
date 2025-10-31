import { expect } from "chai";
import { ethers } from "hardhat";

describe("FluidPay_LendingPool", function () {
    let lendingPool: any;
    let mockUSDC: any;
    let mockRWA: any;
    let mockPriceOracle: any;

    beforeEach(async function () {
        const MockUSDC = await ethers.getContractFactory("Mock_USDC");
        mockUSDC = await MockUSDC.deploy();
        await mockUSDC.deployed();

        const MockRWA = await ethers.getContractFactory("Mock_RWA_Token");
        mockRWA = await MockRWA.deploy();
        await mockRWA.deployed();

        const MockPriceOracle = await ethers.getContractFactory("Mock_PriceOracle");
        mockPriceOracle = await MockPriceOracle.deploy();
        await mockPriceOracle.deployed();

        const FluidPayLendingPool = await ethers.getContractFactory("FluidPay_LendingPool");
        lendingPool = await FluidPayLendingPool.deploy(mockPriceOracle.address);
        await lendingPool.deployed();
    });

    it("should allow users to deposit USDC", async function () {
        const [owner] = await ethers.getSigners();
        await mockUSDC.mint(owner.address, ethers.utils.parseUnits("1000", 6));
        await mockUSDC.approve(lendingPool.address, ethers.utils.parseUnits("1000", 6));
        
        await lendingPool.fundPool(mockUSDC.address, ethers.utils.parseUnits("1000", 6));
        
        const balance = await mockUSDC.balanceOf(lendingPool.address);
        expect(balance).to.equal(ethers.utils.parseUnits("1000", 6));
    });

    it("should allow users to borrow against collateral", async function () {
        const [owner] = await ethers.getSigners();
        await mockUSDC.mint(owner.address, ethers.utils.parseUnits("1000", 6));
        await mockUSDC.approve(lendingPool.address, ethers.utils.parseUnits("1000", 6));
        
        await lendingPool.fundPool(mockUSDC.address, ethers.utils.parseUnits("1000", 6));
        
        await mockRWA.mint(owner.address, ethers.utils.parseUnits("10", 18));
        await mockRWA.approve(lendingPool.address, ethers.utils.parseUnits("10", 18));
        
        await lendingPool.lockCollateral(mockRWA.address, ethers.utils.parseUnits("10", 18));
        
        await mockPriceOracle.setPrice(mockRWA.address, ethers.utils.parseUnits("100", 8));
        
        await lendingPool.borrow(mockUSDC.address, ethers.utils.parseUnits("500", 6));
        
        const usdcBalance = await mockUSDC.balanceOf(owner.address);
        expect(usdcBalance).to.equal(ethers.utils.parseUnits("500", 6));
    });

    it("should allow users to repay loans", async function () {
        const [owner] = await ethers.getSigners();
        await mockUSDC.mint(owner.address, ethers.utils.parseUnits("1000", 6));
        await mockUSDC.approve(lendingPool.address, ethers.utils.parseUnits("1000", 6));
        
        await lendingPool.fundPool(mockUSDC.address, ethers.utils.parseUnits("1000", 6));
        
        await mockRWA.mint(owner.address, ethers.utils.parseUnits("10", 18));
        await mockRWA.approve(lendingPool.address, ethers.utils.parseUnits("10", 18));
        
        await lendingPool.lockCollateral(mockRWA.address, ethers.utils.parseUnits("10", 18));
        
        await mockPriceOracle.setPrice(mockRWA.address, ethers.utils.parseUnits("100", 8));
        
        await lendingPool.borrow(mockUSDC.address, ethers.utils.parseUnits("500", 6));
        
        await mockUSDC.approve(lendingPool.address, ethers.utils.parseUnits("500", 6));
        await lendingPool.repay(mockUSDC.address, ethers.utils.parseUnits("500", 6));
        
        const usdcBalance = await mockUSDC.balanceOf(owner.address);
        expect(usdcBalance).to.equal(ethers.utils.parseUnits("500", 6));
    });

    it("should allow liquidation of unsafe loans", async function () {
        const [owner, user] = await ethers.getSigners();
        await mockUSDC.mint(owner.address, ethers.utils.parseUnits("1000", 6));
        await mockUSDC.approve(lendingPool.address, ethers.utils.parseUnits("1000", 6));
        
        await lendingPool.fundPool(mockUSDC.address, ethers.utils.parseUnits("1000", 6));
        
        await mockRWA.mint(user.address, ethers.utils.parseUnits("10", 18));
        await mockRWA.connect(user).approve(lendingPool.address, ethers.utils.parseUnits("10", 18));
        
        await lendingPool.connect(user).lockCollateral(mockRWA.address, ethers.utils.parseUnits("10", 18));
        
        await mockPriceOracle.setPrice(mockRWA.address, ethers.utils.parseUnits("50", 8));
        
        await lendingPool.connect(user).borrow(mockUSDC.address, ethers.utils.parseUnits("600", 6));
        
        await mockPriceOracle.setPrice(mockRWA.address, ethers.utils.parseUnits("10", 8));
        
        await lendingPool.liquidate(user.address, mockRWA.address);
        
        const userRwaBalance = await mockRWA.balanceOf(user.address);
        expect(userRwaBalance).to.equal(0);
    });
});