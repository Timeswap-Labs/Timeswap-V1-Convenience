import { run, ethers } from 'hardhat'
import type { TestToken } from '../../typechain/TestToken'
import type { TimeswapConvenience as ConvenienceContract } from '../../typechain/TimeswapConvenience'
import type { TimeswapFactory as FactoryContract } from '../../typechain/TimeswapFactory'
import { Convenience } from './Convenience'
// import { experimentalAddHardhatNetworkMessageTraceHook } from "hardhat/config";

export async function deploy(assetToken: TestToken, collateralToken: TestToken, maturity: bigint) {
  const accounts = await ethers.getSigners()

  const nftSVG = await ethers.getContractFactory('NFTSVG')
  const nftSVGContract = await nftSVG.deploy()
  await nftSVGContract.deployTransaction.wait()

  const nftTokenURI = await ethers.getContractFactory('NFTTokenURIScaffold', {
    libraries: {
      NFTSVG: nftSVGContract.address,
    },
  })
  const nftTokenURIContract = await nftTokenURI.deploy()
  await nftTokenURIContract.deployTransaction.wait()

  const deployLibraryContractAddresses: string[] = []

  const deployERC20 = await ethers.getContractFactory('DeployERC20')
  const deployERC20contract = await deployERC20.deploy()
  await deployERC20contract.deployTransaction.wait()
  deployLibraryContractAddresses.push(deployERC20contract.address)

  const deployERC721 = await ethers.getContractFactory('DeployERC721', {
    libraries: {
      NFTTokenURIScaffold: nftTokenURIContract.address,
    },
  })
  const deployERC721contract = await deployERC721.deploy()
  await deployERC721contract.deployTransaction.wait()
  deployLibraryContractAddresses.push(deployERC721contract.address)

  const libraryNames1 = ['Borrow', 'Lend', 'Mint']
  const libraryContractAddresses1: string[] = []

  for (const library of libraryNames1) {
    const name = await ethers.getContractFactory(library, {
      libraries: {
        DeployERC20: deployLibraryContractAddresses[0],
        DeployERC721: deployLibraryContractAddresses[1],
      },
    })
    const contract = await name.deploy()
    await contract.deployTransaction.wait()
    libraryContractAddresses1.push(contract.address)
  }

  const libraryNames2 = ['Burn', 'Pay', 'Withdraw']
  const libraryContractAddresses2: string[] = []

  for (const library of libraryNames2) {
    const name = await ethers.getContractFactory(library)
    const contract = await name.deploy()
    await contract.deployTransaction.wait()
    libraryContractAddresses2.push(contract.address)
  }

  const Factory = await ethers.getContractFactory('TimeswapFactory')
  const Convenience = await ethers.getContractFactory('TimeswapConvenience', {
    libraries: {
      Borrow: libraryContractAddresses1[0],
      DeployERC20: deployLibraryContractAddresses[0],
      DeployERC721: deployLibraryContractAddresses[1],
      Lend: libraryContractAddresses1[1],
      Mint: libraryContractAddresses1[2],
      Burn: libraryContractAddresses2[0],
      Pay: libraryContractAddresses2[1],
      Withdraw: libraryContractAddresses2[2],
    },
  })
  const WETH9 = await ethers.getContractFactory('WETH9')
  const factoryContract = (await Factory.deploy(accounts[0].address, 100, 50)) as FactoryContract

  await factoryContract.deployTransaction.wait()
  const wethContract = WETH9.attach('0x51ede3ed3921a8152a3401163ba0996cfa8193f9')

  const convenienceContract = (await Convenience.deploy(
    factoryContract.address,
    wethContract.address
  )) as ConvenienceContract
  await convenienceContract.deployTransaction.wait()
  const deployedContracts = {
    factory: factoryContract,
    convenience: convenienceContract,
  }

  return deployedContracts
}
