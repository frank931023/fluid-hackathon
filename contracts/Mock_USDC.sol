// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Mock_USDC is ERC20 {
    constructor() ERC20("MockUSDC", "mUSDC") {
        // decimals overridden to 6 below
    }

    // Set decimals to 6 like USDC
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Public mint function for testing
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
