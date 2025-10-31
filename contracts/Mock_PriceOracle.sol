// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Mock_PriceOracle {
    // Prices stored with 8 decimals like Chainlink
    mapping(address => uint256) public assetPrices;

    /**
     * @notice Set or update the price of a token (demo only)
     * @param token The token address
     * @param newPrice The new price with 8 decimals (e.g., $170 -> 170 * 10**8)
     */
    function setPrice(address token, uint256 newPrice) public {
        assetPrices[token] = newPrice;
    }

    /**
     * @notice Get the latest price of a token
     */
    function getPrice(address token) public view returns (uint256) {
        return assetPrices[token];
    }
}
