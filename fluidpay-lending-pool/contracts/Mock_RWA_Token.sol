// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Mock_RWA_Token is ERC20 {
    mapping(address => bool) private whitelist;

    constructor() ERC20("TokenizedTesla", "tTSLA") {
        _mint(msg.sender, 1000 * 10 ** decimals()); // Initial supply to deployer
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function addToWhitelist(address user) public {
        whitelist[user] = true;
    }

    function isWhitelisted(address user) public view returns (bool) {
        return whitelist[user];
    }

    function decimals() public view virtual override returns (uint8) {
        return 18;
    }
}