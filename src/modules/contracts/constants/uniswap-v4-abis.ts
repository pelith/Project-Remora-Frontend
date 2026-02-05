export const UNISWAP_V4_POSITION_MANAGER_ABI = [
	{
		type: 'function',
		name: 'getPoolAndPositionInfo',
		inputs: [
			{
				name: 'tokenId',
				type: 'uint256',
			},
		],
		outputs: [
			{
				name: 'poolKey',
				type: 'tuple',
				components: [
					{ name: 'currency0', type: 'address' },
					{ name: 'currency1', type: 'address' },
					{ name: 'fee', type: 'uint24' },
					{ name: 'tickSpacing', type: 'int24' },
					{ name: 'hooks', type: 'address' },
				],
			},
			{
				name: 'info',
				type: 'uint256',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'getPositionLiquidity',
		inputs: [
			{
				name: 'tokenId',
				type: 'uint256',
			},
		],
		outputs: [
			{
				name: 'liquidity',
				type: 'uint128',
			},
		],
		stateMutability: 'view',
	},
] as const;

export const UNISWAP_V4_STATE_VIEW_ABI = [
	{
		type: 'function',
		name: 'getSlot0',
		inputs: [
			{
				name: 'key',
				type: 'tuple',
				components: [
					{ name: 'currency0', type: 'address' },
					{ name: 'currency1', type: 'address' },
					{ name: 'fee', type: 'uint24' },
					{ name: 'tickSpacing', type: 'int24' },
					{ name: 'hooks', type: 'address' },
				],
			},
		],
		outputs: [
			{ name: 'sqrtPriceX96', type: 'uint160' },
			{ name: 'tick', type: 'int24' },
			{ name: 'protocolFee', type: 'uint24' },
			{ name: 'lpFee', type: 'uint24' },
		],
		stateMutability: 'view',
	},
] as const;
