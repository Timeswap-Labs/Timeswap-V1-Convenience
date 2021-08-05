import '@typechain/hardhat'
import '@nomiclabs/hardhat-waffle'
import { HardhatUserConfig } from 'hardhat/types'
import * as dotenv from 'dotenv'

dotenv.config()

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID
const RINKEBY_PRIVATE_KEY = process.env.PRIVATE_KEY

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.1',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${RINKEBY_PRIVATE_KEY}`],
    },
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
    alwaysGenerateOverloads: true,
  },
}

export default config
