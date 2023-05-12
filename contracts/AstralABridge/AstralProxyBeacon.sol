// SPDX-License-Identifier: GPL-3.0

// solhint-disable-next-line
pragma solidity ^0.8.0;

import {UpgradeableBeacon} from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {BeaconProxy} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

contract AstralProxyBeacon is Context {

    UpgradeableBeacon immutable beacon;
    
    address public AstralProxyDeployer;

    constructor(address _AstralProxyDeployer) {
        beacon = new UpgradeableBeacon(_AstralProxyDeployer);
        AstralProxyDeployer = _AstralProxyDeployer;
    }

    function update(address _AstralProxyDeployer) public {
        beacon.upgradeTo(_AstralProxyDeployer);
        AstralProxyDeployer = _AstralProxyDeployer;
    }

    function implementation() public view returns(address) {
        return beacon.implementation();
    }
}

contract AstralAssetProxyBeacon is AstralProxyBeacon {
    string public constant NAME = "AstralAssetProxyBeacon";

    constructor(address implementation) AstralProxyBeacon(implementation) {}
}

contract BridgeBaseAdapterProxyBeacon is AstralProxyBeacon {
    string public constant NAME = "BridgeBaseAdapterProxyBeacon";

    constructor(address implementation) AstralProxyBeacon(implementation) {}
}
