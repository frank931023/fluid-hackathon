// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Mock_RWA_Token is ERC20 {
    // Simple whitelist to emulate ERC-3643 spirit
    mapping(address => bool) public whitelist;
    
    // 事件：當用戶被添加到白名單時觸發
    event WhitelistAdded(address indexed user);

    constructor() ERC20("TokenizedTesla", "tTSLA") {
        // decimals default to 18
        // 自動將部署者加入白名單
        whitelist[msg.sender] = true;
        emit WhitelistAdded(msg.sender);
    }

    /**
     * @notice Add a user to the compliance whitelist (demo only)
     */
    function addWhitelist(address _user) public {
        require(_user != address(0), "Invalid address");
        whitelist[_user] = true;
        emit WhitelistAdded(_user);
    }
    
    /**
     * @notice Add yourself to the whitelist (convenient for testing)
     */
    function addMeToWhitelist() public {
        whitelist[msg.sender] = true;
        emit WhitelistAdded(msg.sender);
    }
    
    /**
     * @notice Batch add multiple users to whitelist
     */
    function batchAddWhitelist(address[] calldata _users) public {
        for (uint256 i = 0; i < _users.length; i++) {
            if (_users[i] != address(0)) {
                whitelist[_users[i]] = true;
                emit WhitelistAdded(_users[i]);
            }
        }
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
