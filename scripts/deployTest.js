/* eslint-disable */
const hre = require("hardhat");
const {ethers} = require("hardhat");
const {BigNumber} = require("@ethersproject/bignumber");
const {smock} = require("@defi-wonderland/smock");
const readline = require("readline-sync");

// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
// });

async function main() {
    const [deployer, daofund, devfund] = await hre.ethers.getSigners();

    const seconds = BigNumber.from(1);
    const minutes = seconds.mul(60);
    const hours = minutes.mul(60);
    const days = hours.mul(24);
    const weeks = days.mul(7);
    const years = days.mul(365);

    const onePointTen = BigNumber.from('1100000000000000000');
    const one = BigNumber.from('1000000000000000000');
    const half = BigNumber.from('500000000000000000');
    const ten = BigNumber.from('10000000000000000000');
    const oneHundred = BigNumber.from('100000000000000000000');
    const oneTenth = BigNumber.from('100000000000000000');
    const oneHundredth = BigNumber.from('10000000000000000');
    const zero = BigNumber.from('0');
    const oneMillion = BigNumber.from('1000000000000000000000000');
    const oneBillion = BigNumber.from('1000000000000000000000000000');
    const pTokenPriceCeiling = BigNumber.from('1010000000000000000');
    const period = hours.mul(6);

    // const SpinGame = await hre.ethers.getContractFactory("SpinGame");
    // const spinGame = await SpinGame.deploy(
    //     "0x99aFAf084eBA697E584501b8Ed2c0B37Dd136693", "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed", "0x326C977E6efc84E512bB9C30f76E30c160eD06FB", 100000, 3, 3368, "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f", true
    // );
    // await spinGame.deployed();
    // console.log("- SpinGame deployed to:", spinGame.address);

    const spinGame = await hre.ethers.getContractAt("SpinGame", "0xee573c268d04BE7035e65E0Dcb7F7e33DF12e763")
    await (await spinGame.setVrfSettings(100000, 3, 3368, "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f", true)).wait()
    await (await spinGame.spinOnBehalfOf([[spinGame.address]])).wait();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
