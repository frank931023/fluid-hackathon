import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "dotenv/config";

const { INFURA_PROJECT_ID, ROPSTEN_PRIVATE_KEY } = process.env;

export default {
  solidity: "0.8.0",
  networks: {
    ropsten: {
      url: `https://ropsten.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${ROPSTEN_PRIVATE_KEY}`],
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
};