# FluidPay Lending Pool

FluidPay Lending Pool is a decentralized lending platform that allows users to lend and borrow assets in a secure and efficient manner. This project includes several mock contracts for testing and development purposes, as well as the main lending pool contract.

## Contracts

- **Mock_USDC.sol**: An ERC20 token representing a mock version of USDC with minting capabilities.
- **Mock_RWA_Token.sol**: An ERC20 token representing a mock version of a real-world asset (TokenizedTesla) with minting and whitelisting functionalities.
- **Mock_PriceOracle.sol**: A mock price oracle that allows setting and retrieving token prices in USD.
- **FluidPay_LendingPool.sol**: The main contract for managing the lending pool, including functionalities for funding, borrowing, and liquidating loans.

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd fluidpay-lending-pool
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` and fill in the required values.

## Deployment

To deploy the contracts, you can use the provided deployment scripts:

- For deploying to a blockchain network:
  ```
  npx hardhat run scripts/deploy.ts --network <network-name>
  ```

- For deploying to a local blockchain environment:
  ```
  npx hardhat run scripts/deploy_local.ts
  ```

## Testing

To run the tests for the contracts, use the following command:
```
npx hardhat test
```

## Usage

Once deployed, users can interact with the FluidPay Lending Pool to lend assets, borrow against collateral, and manage their loans through the provided functions in the `FluidPay_LendingPool` contract.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.