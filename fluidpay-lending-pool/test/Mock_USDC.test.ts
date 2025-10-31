import { expect } from "chai";
import { ethers } from "hardhat";

describe("Mock_USDC", function () {
    let mockUSDC: any;
    let owner: any;
    let addr1: any;

    beforeEach(async function () {
        const MockUSDC = await ethers.getContractFactory("Mock_USDC");
        [owner, addr1] = await ethers.getSigners();
        mockUSDC = await MockUSDC.deploy();
        await mockUSDC.deployed();
    });

    it("Should mint tokens to the specified address", async function () {
        const mintAmount = ethers.utils.parseUnits("1000", 6);
        await mockUSDC.mint(addr1.address, mintAmount);
        const addr1Balance = await mockUSDC.balanceOf(addr1.address);
        expect(addr1Balance).to.equal(mintAmount);
    });

    it("Should have correct decimals", async function () {
        const decimals = await mockUSDC.decimals();
        expect(decimals).to.equal(6);
    });

    it("Should have correct name and symbol", async function () {
        const name = await mockUSDC.name();
        const symbol = await mockUSDC.symbol();
        expect(name).to.equal("Mock USDC");
        expect(symbol).to.equal("mUSDC");
    });
});