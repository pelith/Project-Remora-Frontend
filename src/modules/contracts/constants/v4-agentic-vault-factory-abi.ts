export const V4_AGENTIC_VAULT_FACTORY_ABI = [
	{
		type: 'constructor',
		inputs: [
			{
				name: '_posm',
				type: 'address',
				internalType: 'address',
			},
			{
				name: '_universalRouter',
				type: 'address',
				internalType: 'address',
			},
			{
				name: '_permit2',
				type: 'address',
				internalType: 'address',
			},
		],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'computeVaultAddress',
		inputs: [
			{
				name: 'creator',
				type: 'address',
				internalType: 'address',
			},
			{
				name: 'poolKey',
				type: 'tuple',
				internalType: 'struct PoolKey',
				components: [
					{
						name: 'currency0',
						type: 'address',
						internalType: 'Currency',
					},
					{
						name: 'currency1',
						type: 'address',
						internalType: 'Currency',
					},
					{
						name: 'fee',
						type: 'uint24',
						internalType: 'uint24',
					},
					{
						name: 'tickSpacing',
						type: 'int24',
						internalType: 'int24',
					},
					{
						name: 'hooks',
						type: 'address',
						internalType: 'contract IHooks',
					},
				],
			},
			{
				name: 'nonce',
				type: 'uint256',
				internalType: 'uint256',
			},
			{
				name: 'agent',
				type: 'address',
				internalType: 'address',
			},
			{
				name: 'allowedTickLower',
				type: 'int24',
				internalType: 'int24',
			},
			{
				name: 'allowedTickUpper',
				type: 'int24',
				internalType: 'int24',
			},
			{
				name: 'swapAllowed',
				type: 'bool',
				internalType: 'bool',
			},
			{
				name: 'maxPositionsK',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'address',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'createVault',
		inputs: [
			{
				name: 'poolKey',
				type: 'tuple',
				internalType: 'struct PoolKey',
				components: [
					{
						name: 'currency0',
						type: 'address',
						internalType: 'Currency',
					},
					{
						name: 'currency1',
						type: 'address',
						internalType: 'Currency',
					},
					{
						name: 'fee',
						type: 'uint24',
						internalType: 'uint24',
					},
					{
						name: 'tickSpacing',
						type: 'int24',
						internalType: 'int24',
					},
					{
						name: 'hooks',
						type: 'address',
						internalType: 'contract IHooks',
					},
				],
			},
			{
				name: 'agent',
				type: 'address',
				internalType: 'address',
			},
			{
				name: 'allowedTickLower',
				type: 'int24',
				internalType: 'int24',
			},
			{
				name: 'allowedTickUpper',
				type: 'int24',
				internalType: 'int24',
			},
			{
				name: 'swapAllowed',
				type: 'bool',
				internalType: 'bool',
			},
			{
				name: 'maxPositionsK',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		outputs: [
			{
				name: 'vault',
				type: 'address',
				internalType: 'address',
			},
		],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'creatorNonce',
		inputs: [
			{
				name: '',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [
			{
				name: '',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'getAllVaults',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address[]',
				internalType: 'address[]',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'getNextNonce',
		inputs: [
			{
				name: 'creator',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [
			{
				name: '',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'getVaultsCreatedBy',
		inputs: [
			{
				name: 'creator',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [
			{
				name: '',
				type: 'address[]',
				internalType: 'address[]',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'isVault',
		inputs: [
			{
				name: '',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [
			{
				name: '',
				type: 'bool',
				internalType: 'bool',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'permit2',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'address',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'posm',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'address',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'totalVaults',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'universalRouter',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'address',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'vaults',
		inputs: [
			{
				name: '',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'address',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'vaultsCreatedBy',
		inputs: [
			{
				name: '',
				type: 'address',
				internalType: 'address',
			},
			{
				name: '',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'address',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'event',
		name: 'VaultCreated',
		inputs: [
			{
				name: 'creator',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
			{
				name: 'vault',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
			{
				name: 'poolKey',
				type: 'tuple',
				indexed: false,
				internalType: 'struct PoolKey',
				components: [
					{
						name: 'currency0',
						type: 'address',
						internalType: 'Currency',
					},
					{
						name: 'currency1',
						type: 'address',
						internalType: 'Currency',
					},
					{
						name: 'fee',
						type: 'uint24',
						internalType: 'uint24',
					},
					{
						name: 'tickSpacing',
						type: 'int24',
						internalType: 'int24',
					},
					{
						name: 'hooks',
						type: 'address',
						internalType: 'contract IHooks',
					},
				],
			},
			{
				name: 'agent',
				type: 'address',
				indexed: false,
				internalType: 'address',
			},
			{
				name: 'nonce',
				type: 'uint256',
				indexed: false,
				internalType: 'uint256',
			},
		],
		anonymous: false,
	},
] as const;
