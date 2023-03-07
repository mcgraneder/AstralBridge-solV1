pragma solidity >=0.4.24 
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/upgrades-core/contracts/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "../../libraries/Claimable.sol";
import "../Governance/CanReclaimTokens.sol";
import "./ERC20WithRate.sol";
import "./ERC20Permit.sol";

contract AstralERC20 is
    Initializable,
    ERC20,
    ERC20WithRate,
    ERC20WithPermit,
    Claimable,
    CanReclaimTokens
{
    /* solium-disable-next-line no-empty-blocks */
    function initialize(
        uint256 _chainId,
        address _nextOwner,
        uint256 _initialRate,
        string memory _version,
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) public initializer {
        ERC20.initialize(_name, _symbol, _decimals);
        ERC20WithRate.initialize(_nextOwner, _initialRate);
        ERC20WithPermit.initialize(
            _chainId,
            _version,
            _name,
            _symbol,
            _decimals
        );
        Claimable.initialize(_nextOwner);
        CanReclaimTokens.initialize(_nextOwner);
    }

    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }

    function burn(address _from, uint256 _amount) public onlyOwner {
        _burn(_from, _amount);
    }

    function transfer(address recipient, uint256 amount) public returns (bool) {
        // Disallow sending tokens to the ERC20 contract address - a common
        // mistake caused by the Ethereum transaction's `to` needing to be
        // the token's address.
        require(
            recipient != address(this),
            "RenERC20: can't transfer to token address"
        );
        return super.transfer(recipient, amount);
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public returns (bool) {
        // Disallow sending tokens to the ERC20 contract address (see comment
        // in `transfer`).
        require(
            recipient != address(this),
            "RenERC20: can't transfer to token address"
        );
        return super.transferFrom(sender, recipient, amount);
    }
}
