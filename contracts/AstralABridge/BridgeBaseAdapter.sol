pragma solidity >= 0.8.9;
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {AstralERC20Logic} from "./AstralERC20Asset/AstralERC20.sol";
import {TestNativeAssetRegistry} from "./tesNativeAssetRegistry";

interface IToken {
  function mint(address to, uint amount) external;
  function burn(address owner, uint amount) external;
}

contract BridgeBase {

  address public admin;
  IToken public token;
  uint public nonce;
  uint256 mintFee = 0; //for now
  uint256 burnFee = 0; //fornow

  mapping(uint => bool) public processedNonces;

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

  constructor(address _token, address _admin) {
    admin = _admin;
    token = AstralERC20Logic(_token);
  }

  function bridge(
    bytes32 _payloadHash, 
    bytes32 _nonceHash, 
    bytes memory _sig, 
    address to, 
    uint amount, 
    uint otherChainNonce
    string memory bridgeAction
    address token
  ) external {
    bytes32 BridgeAction =  keccak256(bytes(bridgeAction));
    bytes32 mint = keccak256(bytes("MINT"));
    bytes32 burn = keccak256(bytes("BURN"));
    bytes32 lock = keccak256(bytes("LOCK"));
    bytes32 release = keccak256(bytes("RELEASE"));

    bool doesAssetExist = false;
    address[] memory supportedAstralAssets = getAllNaitveERC20Asset();
    for(uint i = 0; i < supportedAstralAssets.length; i++) {
      if(supportedAstralAssets[i] == token) doesAssetExist = true;
      break;
    }
    if (doesAssetExists && BridgeAction == lock) {
      AstralERC20Logic(token).transferFrom(to, transferContract, amount);
      _lock();
    } else if (doesAssetExists && BridgeAction == release) {
      transferContract.transferBackToBridge(address(this), amount);
      _release();
    } else if (!doesAssetExists && BridgeAction == mint) {
       _mint(
        bytes32 _payloadHash, 
        bytes32 _nonceHash, 
        bytes memory _sig, 
        address to, 
        uint amount, 
        uint otherChainNonce
       );
    }else if (!doesAssetExists && BridgeAction == burn) {
       _burn(to, amount);
    }
    }

  }

  function burn(address to, uint amount) external {
    require(msg.sender == admin, 'only admin');
    require(processedNonces[otherChainNonce] == false, 'transfer already processed');

    //mint for user
    token.burn(to, amount);
    //mint fee for admin
    token.butn(admin, amount);

    emit Burn(
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
    address to, 
    uint amount, 
    uint otherChainNonce
  ) external {
    require(msg.sender == admin, 'only admin');
    require(processedNonces[otherChainNonce] == false, 'transfer already processed');
    processedNonces[otherChainNonce] = true;

    bytes32 sigHash = hashForSignature(_pHash, _amount, msg.sender, _nHash);

    require(
      verifySignature(sigHash, _sig), 
      "unauthorized mint: signature does not match request"
    );

    //mint for user
    token.mint(to, amount);
    //mint fee for admin
    token.mint(admin, amount);

    emit MintEvent(
      msg.sender,
      to,
      amount,
      block.timestamp,
      otherChainNonce,
      Step.Mint
    );
  }

  function lock() external {

  }

  function release() external {
    
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
        return admin == ECDSA.recover(_sigHash, _sig);
    }
}