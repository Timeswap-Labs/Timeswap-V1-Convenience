import  {HardhatRuntimeEnvironment} from 'hardhat/types';
import type {DeployFunction} from 'hardhat-deploy/types';
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;
  
    const {convenienceDeployer,wethAddress,factoryAddress} = await getNamedAccounts();
    
  await deploy('TimeswapConvenience', {
    from: convenienceDeployer,
    args: [factoryAddress,wethAddress],
    log: true,
  });
};
export default func;