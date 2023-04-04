// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFV2WrapperInterface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

contract Authorizable is Ownable {
    mapping(address => bool) public authorized;

    modifier onlyAuthorized() {
        require(authorized[msg.sender] || owner() == msg.sender, "Caller is not authorized.");
        _;
    }

    function addAuthorized(address _toAdd) public onlyOwner {
        authorized[_toAdd] = true;
    }

    function removeAuthorized(address _toRemove) public onlyOwner {
        require(_toRemove != msg.sender);
        authorized[_toRemove] = false;
    }
}

contract SpinGameUnoptimized is Authorizable
{
    uint256 public constant maxRequestType = 1;
    struct RequestStatus {
        uint256 requestType;
        uint256 paid; //LINK
        bool fulfilled;
        uint256[] randomWords;
        bytes parameters;
    }

    struct Spin {
        address player;
    }

    //VRF
    mapping(uint256 => RequestStatus) vrfRequests;
    error OnlyCoordinatorCanFulfill(address have, VRFCoordinatorV2Interface want);

    //For direct funding
    VRFV2WrapperInterface immutable public vrfWrapper;

    //For subscription
    VRFCoordinatorV2Interface immutable public vrfCoordinator;
    uint64 public subscriptionId;
    bytes32 public keyHash;

    LinkTokenInterface immutable public LINK;
    uint32 public callbackGasLimit;
    uint16 public requestConfirmations;
    bool public useSubscription;

    //An alternative would be to request multiple sets of randomness all at once, and then randomly pick one unused index from one of the sets using PRNG off-chain, marking the index off as used once done.
    //The upside to the alternative is speed and gas cost.
    //The downside to the alternative is that a player can choose their odds pretty convincingly, and that there is no way to verify that off-chain randomness is not purposefully picking losers/winners.
    event SpinsRequested(uint256 indexed requestId, uint256 len, Spin[] spins);
    event SpinsSucceeded(uint256 indexed requestId, uint256 len, Spin[] spins, uint256[] randomWords);

    //Internal
    constructor(VRFV2WrapperInterface _vrfWrapper, VRFCoordinatorV2Interface _vrfCoordinator, LinkTokenInterface link, uint32 _callbackGasLimit, uint16 _requestConfirmations, uint64 _subscriptionId, bytes32 _keyHash, bool _useSubscription) {
        vrfWrapper = _vrfWrapper;
        vrfCoordinator = _vrfCoordinator;
        LINK = link;
        callbackGasLimit = _callbackGasLimit;
        requestConfirmations = _requestConfirmations;
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        useSubscription = _useSubscription;
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal {
        require(vrfRequests[requestId].paid > 0 && !vrfRequests[requestId].fulfilled, "Request not available.");
        vrfRequests[requestId].fulfilled = true;
        vrfRequests[requestId].randomWords = randomWords; //Provable!

        //        uint256 requestType = vrfRequests[requestId].requestType;
        //        if(requestType == 0)
        //        {
        //For this contract, every request is a spin.
        (Spin[] memory spins) = abi.decode(vrfRequests[requestId].parameters, (Spin[]));
        uint256 len = spins.length;
        require(len == randomWords.length, "Number of spins not equal to number of words. Fix contract!"); //If this is not equal, it is a bug. Fix.
        emit SpinsSucceeded(requestId, len, spins, randomWords);
        //This game is simple and mostly Web2, so we can save gas by doing our calculations on the Web2 side.
        //This is still 100% provable that the RNG is fair and there is no house edge by running our calculations on your own end and comparing it to our results.
        //For this game, the calculation is simple: wheelIndex = randomWords[playerIndex] % wheelSize.
    }

    function requestRandomnessDirect(
        uint32 numWords
    ) internal returns (uint256) {
        LINK.transferAndCall(
            address(vrfWrapper),
            vrfWrapper.calculateRequestPrice(callbackGasLimit),
            abi.encode(callbackGasLimit, requestConfirmations, numWords)
        );
        return vrfWrapper.lastRequestId();
    }

    function requestRandomWordsDirect(uint256 requestType, uint32 numWords, bytes memory parameters) internal returns (uint256 requestId)
    {
        require(numWords > 0 && requestType < maxRequestType, "numWords must be > 0 and requestType must be valid.");
        requestId = requestRandomnessDirect(numWords);
        vrfRequests[requestId] = RequestStatus({
        requestType: requestType,
        paid: vrfWrapper.calculateRequestPrice(callbackGasLimit),
        randomWords: new uint256[](0),
        fulfilled: false,
        parameters: parameters
        });
        //emit RequestSent(requestId, numWords);
        //return requestId;
    }

    function requestRandomnessSubscription(
        uint32 numWords
    ) internal returns (uint256) {
        return vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
    }

    function requestRandomWordsSubscription(uint256 requestType, uint32 numWords, bytes memory parameters) internal returns (uint256 requestId)
    {
        require(numWords > 0 && requestType < maxRequestType, "numWords must be > 0 and requestType must be valid.");
        requestId = requestRandomnessSubscription(numWords);
        vrfRequests[requestId] = RequestStatus({
        requestType: requestType,
        paid: 1, //We don't actually pay directly from the contract for subscriptions. So this acts as a boolean instead,.
        randomWords: new uint256[](0),
        fulfilled: false,
        parameters: parameters
        });
    }

    function requestRandomWords(uint256 requestType, uint32 numWords, bytes memory parameters) internal returns (uint256)
    {
        if(block.chainid == 31337)
        {
            uint256 requestId = 0;
            vrfRequests[requestId] = RequestStatus({
            requestType: requestType,
            paid: 1, //We don't actually pay directly from the contract for subscriptions. So this acts as a boolean instead,.
            randomWords: new uint256[](0),
            fulfilled: false,
            parameters: parameters
            });
            uint256[] memory randomWords = new uint256[](numWords);
            uint256 len = randomWords.length;
            uint256 seed = uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp)));
            for(uint256 i = 0; i < len; i += 1)
            {
                seed = uint256(keccak256(abi.encodePacked(seed, block.difficulty, block.timestamp)));
                randomWords[i] = seed;
            }
            fulfillRandomWords(requestId, randomWords);
            return requestId;
        }
        return useSubscription ? requestRandomWordsSubscription(requestType, numWords, parameters) : requestRandomWordsDirect(requestType, numWords, parameters);
    }

    //External
    //Getters
    function vrfRequest(uint256 requestId) external view returns (RequestStatus memory)
    {
        return vrfRequests[requestId];
    }

    //Setters
    //This supports up to 500 spins on subscription mode, and 10 spins on direct funding mode. The Web2 layer should handle separation.
    function spinOnBehalfOf(Spin[] memory spins) public onlyAuthorized returns (uint256 requestId)
    {
        uint256 len = spins.length;
        require(len <= type(uint32).max, "Spin overflow detected."); //VRF will detect if we're > 500 or > 10, but we have to make sure that we don't go over the bounds of uint32 here.
        requestId = requestRandomWords(0, uint32(len), abi.encode(spins));
        emit SpinsRequested(requestId, len, spins);
    }

    //This can be used to batch the spins greater than the limit into a single transaction.
    //Beware of gas, there is a maximum gas limit per block, and having a higher gas limit leads to being deprioritized in the transaction queue.
    function batchSpinOnBehalfOf(Spin[][] memory spinsBatch) external onlyAuthorized returns(uint256[] memory)
    {
        uint256 len = spinsBatch.length;
        uint256[] memory requestIds = new uint256[](len);
        for(uint256 i = 0; i < len; i += 1)
        {
            requestIds[i] = (spinOnBehalfOf(spinsBatch[i]));
        }
        return requestIds;
    }

    //VRF
    function rawFulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external {
        if (msg.sender != address(vrfCoordinator)) {
            revert OnlyCoordinatorCanFulfill(msg.sender, vrfCoordinator);
        }
        fulfillRandomWords(requestId, randomWords);
    }

    //Admin
    function setVrfSettings(uint32 gas, uint16 confirmations, uint64 subscription, bytes32 key, bool subscribe) external onlyOwner
    {
        callbackGasLimit = gas;
        requestConfirmations = confirmations;
        subscriptionId = subscription;
        keyHash = key;
        useSubscription = subscribe;
    }

    function withdrawLink() external onlyOwner {
        require(
            LINK.transfer(msg.sender, LINK.balanceOf(address(this))),
            "Unable to transfer."
        );
    }

    function withdrawLink(uint256 amount) external onlyOwner {
        require(
            LINK.transfer(msg.sender, amount),
            "Unable to transfer."
        );
    }
}