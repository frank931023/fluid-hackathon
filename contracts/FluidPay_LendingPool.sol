// User's active file:

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IPriceOracle {
	function getPrice(address token) external view returns (uint256);
}

interface ITokenizedRWA {
	function isWhitelisted(address user) external view returns (bool);
}

contract FluidPay_LendingPool {
	// Constants (percent values)
	uint256 public constant LTV = 50; // 50%
	uint256 public constant LIQUIDATION_THRESHOLD = 80; // 80%

	address public priceOracle;
	address public rwaToken; // tTSLA
	address public usdcToken; // mUSDC

	struct Loan {
		uint256 rwaCollateralAmount; // in token smallest units (18 for tTSLA)
		uint256 stablecoinDebtAmount; // in USDC smallest units (6 decimals)
	}

	mapping(address => Loan) public loans;

	constructor(address _priceOracle, address _rwaToken, address _usdcToken) {
		priceOracle = _priceOracle;
		rwaToken = _rwaToken;
		usdcToken = _usdcToken;
	}

	/**
	 * @notice Fund the pool with USDC to provide liquidity
	 */
	function fundPool(uint256 usdcAmount) public {
		require(IERC20(usdcToken).transferFrom(msg.sender, address(this), usdcAmount), "transfer failed");
	}

	/**
	 * @notice Check compliance/whitelist on the RWA token
	 */
	function checkCompliance(address _user) public view returns (bool) {
		return ITokenizedRWA(rwaToken).isWhitelisted(_user);
	}

	/**
	 * @notice Lock RWA collateral and borrow stablecoin (USDC)
	 */
	function lockAndBorrow(uint256 rwaAmountToLock, uint256 stablecoinAmountToBorrow) public {
		require(checkCompliance(msg.sender), "not whitelisted");

		// Pull RWA from borrower
		require(IERC20(rwaToken).transferFrom(msg.sender, address(this), rwaAmountToLock), "rwa transferFrom failed");

		// Transfer USDC from pool to borrower (will revert if pool lacks funds)
		require(IERC20(usdcToken).transfer(msg.sender, stablecoinAmountToBorrow), "usdc transfer failed");

		// Update loan
		Loan storage loan = loans[msg.sender];
		loan.rwaCollateralAmount += rwaAmountToLock;
		loan.stablecoinDebtAmount += stablecoinAmountToBorrow;

		// Check health after update
		_assertHealthy(loan.rwaCollateralAmount, loan.stablecoinDebtAmount);
	}

	/**
	 * @notice Repay USDC to reduce debt
	 */
	function repay(uint256 amountToRepay) public {
		Loan storage loan = loans[msg.sender];
		require(amountToRepay > 0, "invalid amount");

		require(IERC20(usdcToken).transferFrom(msg.sender, address(this), amountToRepay), "usdc transferFrom failed");

		if (amountToRepay >= loan.stablecoinDebtAmount) {
			loan.stablecoinDebtAmount = 0;
		} else {
			loan.stablecoinDebtAmount -= amountToRepay;
		}
	}

	/**
	 * @notice Unlock RWA collateral (partial or full) if loan remains healthy
	 */
	function unlockCollateral(uint256 rwaAmountToUnlock) public {
		Loan storage loan = loans[msg.sender];
		require(rwaAmountToUnlock > 0, "invalid amount");
		require(loan.rwaCollateralAmount >= rwaAmountToUnlock, "not enough collateral");

		// Tentatively reduce collateral then check health
		uint256 newCollateral = loan.rwaCollateralAmount - rwaAmountToUnlock;

		// If borrower still has debt, ensure health
		if (loan.stablecoinDebtAmount > 0) {
			_assertHealthy(newCollateral, loan.stablecoinDebtAmount);
		}

		// Transfer collateral back to borrower
		require(IERC20(rwaToken).transfer(msg.sender, rwaAmountToUnlock), "rwa transfer failed");

		// Persist reduction
		loan.rwaCollateralAmount = newCollateral;
	}

	/**
	 * @notice Liquidate an unhealthy loan. Liquidator pays the debt in USDC and receives the RWA collateral.
	 */
	function liquidate(address user) public {
		Loan storage loan = loans[user];
		require(loan.rwaCollateralAmount > 0, "no collateral");

		uint256 price = IPriceOracle(priceOracle).getPrice(rwaToken);
		require(price > 0, "price not set");

		// collateral in USDC smallest units = (rwaAmount * price) / 1e20
		// Explanation: rwa has 18 decimals, price has 8 decimals -> divide by 1e26 to get dollars, then scale to USDC (1e6) -> divide by 1e20
		uint256 collateralUSDC = (loan.rwaCollateralAmount * price) / (10**20);
		require(collateralUSDC > 0, "collateral value zero");

		// health ratio = (debt / collateral) * 100
		uint256 healthRatio = (loan.stablecoinDebtAmount * 100) / collateralUSDC;
		require(healthRatio > LIQUIDATION_THRESHOLD, "loan healthy");

		// Liquidator pays the full debt to this contract
		require(IERC20(usdcToken).transferFrom(msg.sender, address(this), loan.stablecoinDebtAmount), "usdc transferFrom failed");

		// Transfer collateral to liquidator
		require(IERC20(rwaToken).transfer(msg.sender, loan.rwaCollateralAmount), "rwa transfer failed");

		// Reset loan
		loan.rwaCollateralAmount = 0;
		loan.stablecoinDebtAmount = 0;
	}

	/* ========== Internal helpers ========== */

	function _assertHealthy(uint256 rwaCollateralAmount, uint256 stablecoinDebtAmount) internal view {
		if (stablecoinDebtAmount == 0) return;

		uint256 price = IPriceOracle(priceOracle).getPrice(rwaToken);
		require(price > 0, "price not set");

		// collateral value in USDC smallest units
		uint256 collateralUSDC = (rwaCollateralAmount * price) / (10**20);

		// max loanable in USDC units
		uint256 maxLoanable = (collateralUSDC * LTV) / 100;

		require(stablecoinDebtAmount <= maxLoanable, "exceeds LTV");
	}
}

