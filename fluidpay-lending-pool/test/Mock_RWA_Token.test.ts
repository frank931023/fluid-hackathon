import { expect } from "chai";
import { ethers } from "hardhat";

describe("Mock_RWA_Token", function () {
    let mockRWAToken;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        const Mock_RWA_Token = await ethers.getContractFactory("Mock_RWA_Token");
        [owner, addr1, addr2] = await ethers.getSigners();
        mockRWAToken = await Mock_RWA_Token.deploy();
        await mockRWAToken.deployed();
    });

    describe("Minting", function () {
        it("Should mint tokens to the specified address", async function () {
            await mockRWAToken.mint(addr1.address, ethers.utils.parseUnits("100", 18));
            const balance = await mockRWAToken.balanceOf(addr1.address);
            expect(balance).to.equal(ethers.utils.parseUnits("100", 18));
        });

        it("Should not allow minting to zero address", async function () {
            await expect(mockRWAToken.mint(ethers.constants.AddressZero, ethers.utils.parseUnits("100", 18)))
                .to.be.revertedWith("ERC20: mint to the zero address");
        });
    });

    describe("Whitelist", function () {
        it("Should add an address to the whitelist", async function () {
            await mockRWAToken.addToWhitelist(addr1.address);
            expect(await mockRWAToken.isWhitelisted(addr1.address)).to.be.true;
        });

        it("Should check if an address is whitelisted", async function () {
            await mockRWAToken.addToWhitelist(addr1.address);
            expect(await mockRWAToken.isWhitelisted(addr1.address)).to.be.true;
            expect(await mockRWAToken.isWhitelisted(addr2.address)).to.be.false;
        });
    });
});