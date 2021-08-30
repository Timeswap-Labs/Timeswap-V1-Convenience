import  {HardhatRuntimeEnvironment} from 'hardhat/types';
import type {DeployFunction} from 'hardhat-deploy/types';
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;
  
    const {convenienceDeployer} = await getNamedAccounts();
    const wethAddress = 0x3928d461c09aC30E10b1A8757eD8240E8d72675C;
    const factoryAddress = 0x3928d461c09aC30E10b1A8757eD8240E8d72675C;
    
  await deploy('Convenience', {
    from: convenienceDeployer,
    args: [factoryAddress,wethAddress],
    log: true,
  });
};
export default func;