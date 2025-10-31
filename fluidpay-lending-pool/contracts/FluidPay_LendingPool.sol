// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IPriceOracle.sol";
import "./libraries/MathUtils.sol";

contract FluidPay_LendingPool {
    using MathUtils for uint256;

    // Constants
    uint256 public constant LTV = 75; // Loan-To-Value ratio in percentage
    uint256 public constant LIQUIDATION_THRESHOLD = 80; // Liquidation threshold in percentage

    // State variables
    address public owner;
    IPriceOracle public priceOracle;

    struct Loan {
        uint256 amount;
        uint256 collateralAmount;
        address collateralToken;
        bool isActive;
    }

    mapping(address => Loan) public loans;

    event LoanCreated(address indexed borrower, uint256 amount, uint256 collateralAmount, address collateralToken);
    event LoanRepaid(address indexed borrower, uint256 amount);
    event LoanLiquidated(address indexed borrower, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    constructor(address _priceOracle) {
        owner = msg.sender;
        priceOracle = IPriceOracle(_priceOracle);
    }

    function fundPool(uint256 amount, address token) external {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
    }

    function createLoan(uint256 amount, uint256 collateralAmount, address collateralToken) external {
        require(collateralAmount > 0, "Collateral must be greater than zero");
        require(amount > 0, "Loan amount must be greater than zero");

        uint256 collateralValue = priceOracle.getPrice(collateralToken) * collateralAmount / 1e8; // Assuming price has 8 decimals
        require(collateralValue >= (amount * 100) / LTV, "Insufficient collateral");

        loans[msg.sender] = Loan(amount, collateralAmount, collateralToken, true);
        emit LoanCreated(msg.sender, amount, collateralAmount, collateralToken);
    }

    function repayLoan() external {
        Loan storage loan = loans[msg.sender];
        require(loan.isActive, "No active loan");

        IERC20(loan.collateralToken).transferFrom(msg.sender, address(this), loan.amount);
        loan.isActive = false;

        emit LoanRepaid(msg.sender, loan.amount);
    }

    function liquidateLoan(address borrower) external {
        Loan storage loan = loans[borrower];
        require(loan.isActive, "No active loan");

        uint256 collateralValue = priceOracle.getPrice(loan.collateralToken) * loan.collateralAmount / 1e8;
        require(collateralValue < (loan.amount * 100) / LIQUIDATION_THRESHOLD, "Loan is safe");

        loan.isActive = false;
        emit LoanLiquidated(borrower, loan.amount);
    }

    function unlockCollateral() external {
        Loan storage loan = loans[msg.sender];
        require(!loan.isActive, "Loan is still active");

        IERC20(loan.collateralToken).transfer(msg.sender, loan.collateralAmount);
        delete loans[msg.sender];
    }
}