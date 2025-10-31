import { expect } from "chai";
import { ethers } from "hardhat";

describe("Mock_PriceOracle", function () {
    let priceOracle: any;

    beforeEach(async function () {
        const PriceOracle = await ethers.getContractFactory("Mock_PriceOracle");
        priceOracle = await PriceOracle.deploy();
        await priceOracle.deployed();
    });

    it("should set and get the price of a token", async function () {
        const tokenAddress = ethers.utils.getAddress("0x0000000000000000000000000000000000000001");
        const price = ethers.utils.parseUnits("100", 8); // 100 USD with 8 decimals

        await priceOracle.setPrice(tokenAddress, price);

        const retrievedPrice = await priceOracle.getPrice(tokenAddress);
        expect(retrievedPrice).to.equal(price);
    });

    it("should revert when getting price for an unset token", async function () {
        const tokenAddress = ethers.utils.getAddress("0x0000000000000000000000000000000000000002");
        
        await expect(priceOracle.getPrice(tokenAddress)).to.be.revertedWith("Price not set");
    });
});