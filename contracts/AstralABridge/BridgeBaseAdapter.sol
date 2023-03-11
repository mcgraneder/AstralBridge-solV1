pragma solidity >= 0.8.9;
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {AstralERC20Logic} from "./AstralERC20Asset/AstralERC20.sol";
import {TestNativeAssetRegistry} from "./tesNativeAssetRegistry.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {AstralAssetVault} from "./AstralERC20Asset/AstralAssetValut.sol";
import "hardhat/console.sol";

interface IToken {
  function mint(address to, uint amount) external;
  function burn(address owner, uint amount) external;
}

contract BridgeBase {

  address public admin;
  AstralERC20Logic public token;
  uint public nonce;
  uint256 mintFee = 0; //for now
  uint256 burnFee = 0; //fornow

  mapping(uint => bool) public processedNonces;
  mapping(address => uint256) lockBalance;

  enum Step { Burn, Mint }

  event MintEvent(
    address from,
    address to,
    uint amount,
    uint date,
    uint nonce,
    Step indexed step
  );

  event BurnEvent(
    address from,
    address to,
    uint amount,
    uint date,
    uint nonce,
    Step indexed step
  );

   event AssetLocked(
        address _for,
        uint amount,
        uint256 timestamp
    );
    event AssetReleased(
        address _for,
        uint amount,
        uint256 timestamp
    );

  constructor(address _admin, address _token) {
  
    admin = _admin;
    token = AstralERC20Logic(_token);
  }

  function bridge(
    bytes32 _payloadHash, 
    bytes32 _nonceHash, 
    bytes memory _sig, 
    address to, 
    uint amount, 
    uint otherChainNonce,
    string memory bridgeAction,
    address token
  ) external {
    bytes32 BridgeAction =  keccak256(bytes(bridgeAction));
    bytes32 mint = keccak256(bytes("MINT"));
    bytes32 burn = keccak256(bytes("BURN"));
    bytes32 lock = keccak256(bytes("LOCK"));
    bytes32 release = keccak256(bytes("RELEASE"));

    bool doesAssetExist = false;
    address[2] memory supportedAstralAssets = [address(this), msg.sender];
    for(uint i = 0; i < supportedAstralAssets.length; i++) {
      if(supportedAstralAssets[i] == token) doesAssetExist = true;
      break;
    }
    if (doesAssetExist && BridgeAction == lock) {
      // AstralERC20Logic(token).transferFrom(to, transferContract, amount);
      // lock();
    } else if (doesAssetExist && BridgeAction == release) {
      // transferContract.transferBackToBridge(address(this), amount);
      // release();
    } else if (!doesAssetExist && BridgeAction == mint) {
      //  mint(
      //   bytes32 _payloadHash, 
      //   bytes32 _nonceHash, 
      //   bytes memory _sig, 
      //   address to, 
      //   uint amount, 
      //   uint otherChainNonce
      //  );
    }else if (!doesAssetExist && BridgeAction == burn) {
      //  burn(to, amount);
    
    }
    

  }

  function burn(address to, uint amount) external {
    require(msg.sender == admin, 'only admin');
    // require(processedNonces[otherChainNonce] == false, 'transfer already processed');

    //mint for user
    token.burn(to, amount);
    //mint fee for admin
    token.burn(admin, amount);

    emit BurnEvent(
      msg.sender,
      to,
      amount,
      block.timestamp,
      nonce,
      Step.Mint
    );
  }

  function mint(
    bytes32 _payloadHash, 
    bytes32 _nonceHash, 
    bytes memory _sig, 
    uint _amount, 
    uint otherChainNonce
  ) external {
    require(processedNonces[otherChainNonce] == false, 'transfer already processed');
    processedNonces[otherChainNonce] = true;

    bytes32 sigHash = hashForSignature(_payloadHash, _amount, msg.sender, _nonceHash);
    uint256 tokenFeeRate = token.exchangeRateCurrent();

    require(
      verifySignature(sigHash, _sig), 
      "unauthorized mint: signature does not match request"
    );
    require((_amount * 10000) / 10000 == _amount, "amount too low");

    //get the fee for the admin

    uint tokenFee = (_amount * tokenFeeRate) / 10000;
    console.log("token feeeeeeee", tokenFee);
    //mint for user
    token.mint(msg.sender, _amount - tokenFee);
    //mint fee for admin
    token.mint(admin, tokenFee);

    emit MintEvent(
      msg.sender,
      msg.sender,
      _amount,
      block.timestamp,
      otherChainNonce,
      Step.Mint
    );
  }

  function lock(address regsitryAddress, address lockAsset, uint256 _amount) external {
    TestNativeAssetRegistry registry = TestNativeAssetRegistry(regsitryAddress);
    
    address[] memory assetRegistry = registry.getAllNaitveERC20Asset();
    bool doesAssetExist = false;
    for(uint i = 0; i < assetRegistry.length; i++) {
      if(assetRegistry[i] == lockAsset) doesAssetExist = true;
      break;
    }
    require(doesAssetExist, "lock asset not supported");
    require(_amount > 0, "lock amount must be greater than zero");
    uint256 amountFeeRate = token.exchangeRateCurrent();
    // token.approve(address(this), 10000000000000);
    IERC20(lockAsset).transferFrom(msg.sender, address(this), _amount - amountFeeRate);
    lockBalance[msg.sender] += _amount - amountFeeRate;

    emit AssetLocked(msg.sender, _amount - amountFeeRate, block.timestamp);
    


  }

  function release(    bytes32 _payloadHash, 
    bytes32 _nonceHash, 
    bytes memory _sig, 
    uint _amount, 
    uint otherChainNonce
  ) external {
    require(processedNonces[otherChainNonce] == false, 'transfer already processed');
    processedNonces[otherChainNonce] = true;

    bytes32 sigHash = hashForSignature(_payloadHash, _amount, msg.sender, _nonceHash);
    uint256 tokenFeeRate = token.exchangeRateCurrent();

    require(
      verifySignature(sigHash, _sig), 
      "unauthorized mint: signature does not match request"
    );
    require((_amount * 10000) / 10000 == _amount, "amount too low");

    //get the fee for the admin

    uint tokenFee = (_amount * tokenFeeRate) / 10000;
    console.log("token feeeeeeee", tokenFee);
    //mint for user
    token.transfer(msg.sender, _amount - tokenFee);
    //mint fee for admin
    token.transfer(admin, tokenFee);

    emit MintEvent(
      msg.sender,
      msg.sender,
      _amount,
      block.timestamp,
      otherChainNonce,
      Step.Mint
    );
  }

  function hashForSignature(
        bytes32 _pHash,
        uint256 _amount,
        address _to,
        bytes32 _nHash
    ) public view returns (bytes32) {
        return
            keccak256(abi.encode(_pHash, _amount, address(token), _to, _nHash));
    }

    function verifySignature(bytes32 _sigHash, bytes memory _sig)
    public
    view
    returns (bool) {
       console.log("admin address", admin);
        return admin == ECDSA.recover(_sigHash, _sig);
    }
}