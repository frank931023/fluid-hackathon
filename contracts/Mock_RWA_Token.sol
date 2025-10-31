// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Mock_RWA_Token is ERC20 {
    // Simple whitelist to emulate ERC-3643 spirit
    mapping(address => bool) public whitelist;

    constructor() ERC20("TokenizedTesla", "tTSLA") {
        // decimals default to 18
    }

    /**
     * @notice Add a user to the compliance whitelist (demo only)
     */
    function addWhitelist(address _user) public {
        whitelist[_user] = true;
    }

    /**
     * @notice Check if a user is whitelisted
     */
    function isWhitelisted(address _user) public view returns (bool) {
        return whitelist[_user];
    }

    /**
     * @notice Public mint function for demo purposes
     */
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
