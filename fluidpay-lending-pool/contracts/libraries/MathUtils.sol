// This file contains utility functions for mathematical operations that may be used across the contracts.

pragma solidity ^0.8.0;

library MathUtils {
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a >= b ? a : b;
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    function average(uint256 a, uint256 b) internal pure returns (uint256) {
        return (a & b) + (a ^ b) / 2;
    }

    function safeAdd(uint256 a, uint256 b) internal pure returns (uint256) {
        require(a + b >= a, "MathUtils: addition overflow");
        return a + b;
    }

    function safeSub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "MathUtils: subtraction overflow");
        return a - b;
    }

    function safeMul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }
        require(a * b / a == b, "MathUtils: multiplication overflow");
        return a * b;
    }

    function safeDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "MathUtils: division by zero");
        return a / b;
    }
}