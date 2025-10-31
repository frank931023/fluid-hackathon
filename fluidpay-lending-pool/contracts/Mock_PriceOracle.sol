// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Mock_PriceOracle {
    mapping(address => uint256) private prices;

    function setPrice(address token, uint256 price) external {
        prices[token] = price;
    }

    function getPrice(address token) external view returns (uint256) {
        return prices[token];
    }
}