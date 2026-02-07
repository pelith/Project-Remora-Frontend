import type { Address } from 'viem';

export interface UniswapV4Addresses {
	poolManager: Address;
	positionManager: Address;
	stateView: Address;
}

export const UNISWAP_V4_ADDRESSES: Record<number, UniswapV4Addresses> = {
	11155111: {
		// Sepolia
		poolManager: '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543',
		positionManager: '0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4',
		stateView: '0xe1dd9c3fa50edb962e442f60dfbc432e24537e4c',
	},
	1301: {
		// Unichain Sepolia
		poolManager: '0x00b036b58a818b1bc34d502d3fe730db729e62ac',
		positionManager: '0xf969aee60879c54baaed9f3ed26147db216fd664',
		stateView: '0xc199f1072a74d4e905aba1a84d9a45e2546b6222',
	},
};
