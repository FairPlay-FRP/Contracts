const { ethers } = require('hardhat');
const { expect, assert, should, eventually } = require('chai');
const { smockit } = require('@defi-wonderland/smock');
const { intToBuffer } = require('ethjs-util');
const { BigNumber } = require('@ethersproject/bignumber');
const { smock } = require('@defi-wonderland/smock');
const chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
const { solidity } = require("ethereum-waffle");
chai.use(solidity);
const hre = require("hardhat");
const {setTime, advanceTime} = require("./shared/utilities");
const {getCurrentTimestamp} = require("hardhat/internal/hardhat-network/provider/utils/getCurrentTimestamp");

chai.use(chaiAsPromised);

async function latestBlocktime(provider) {
    const { timestamp } = await provider.getBlock('latest');
    return timestamp;
}
async function latestBlockNumber(provider) {
    const { number } = await provider.getBlock('latest');
    return number;
}

const toBytes32 = (bn) => {
    return ethers.utils.hexlify(ethers.utils.zeroPad(bn.toHexString(), 32));
};

const setStorageAt = async (address, index, value) => {
    await ethers.provider.send("hardhat_setStorageAt", [address, index, value]);
    await ethers.provider.send("evm_mine", []); // Just mines to the next block
};

describe('v1', function () {
    var spinGame;
    var deployer;
    var daofund;
    var devfund;
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
    const oneThousandth = BigNumber.from('1000000000000000');
    const oneTenThousandth = BigNumber.from('100000000000000');
    const zero = BigNumber.from('0');
    const oneBillion = BigNumber.from('1000000000000000000000000000');
    const pTokenPriceCeiling = BigNumber.from('1010000000000000000');
    const period = hours.mul(6);

    beforeEach('test', async () => {
        [deployer, daofund, devfund] = await ethers.getSigners();
        await network.provider.request({
            method: "hardhat_reset",
            params: [
                {
                    forking: {
                        jsonRpcUrl: "https://solemn-white-diagram.matic-testnet.discover.quiknode.pro/5992c5daa3fc204a9b5e0b78b0bf4131972ad418/",
                        //gasPrice: 25000000000,
                        blockNumber: 32129510
                    }
                }
            ]
        });
        spinGame = await hre.ethers.getContractAt("SpinGame", "0xee573c268d04BE7035e65E0Dcb7F7e33DF12e763");
        const SpinGame = await hre.ethers.getContractFactory("SpinGame");
        const spinGameMock = await SpinGame.deploy("0x99aFAf084eBA697E584501b8Ed2c0B37Dd136693", "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed", "0x326C977E6efc84E512bB9C30f76E30c160eD06FB", 100000, 3, 3368, "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f", true);
        await spinGameMock.deployed();
        const code = await hre.network.provider.send("eth_getCode", [
            spinGameMock.address,
        ]);
        await hre.network.provider.send("hardhat_setCode", [
            spinGame.address,
            code,
        ]);

        await setTime(ethers.provider, Math.floor(Date.now() / 1000));
        await ethers.provider.send('evm_mine', []);
    });

    describe('SpinGame', () => {
        // it("admin spinOnBehalfOf SUCCESS", async () => {
        //     //await (await spinGame.spinOnBehalfOf([[spinGame.address]])).wait(); //Just another way of doing the same thing.
        //     await (await spinGame.spinOnBehalfOf([{player: spinGame.address}])).wait();
        //     const request = await spinGame.vrfRequest(0);
        //     console.log(request);
        //     expect(request.fulfilled).to.equal(true);
        //     expect(request.randomWords.length).to.equal(1);
        // });
        it("admin spin SUCCESS", async () => {
            //await (await spinGame.spinOnBehalfOf([[spinGame.address]])).wait(); //Just another way of doing the same thing.
            await (await spinGame.spin()).wait();
            const request = await spinGame.vrfRequest(0);
            console.log(request);
            expect(request.fulfilled).to.equal(true);
        });
    });
});