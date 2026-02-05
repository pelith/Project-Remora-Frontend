import type { Pool } from '../types/vault.types';

export const MOCK_POOLS: Pool[] = [
	{
		id: 'pool-1',
		token0: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
		token1: { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
		fee: 500, // 0.05%
		volume24h: '$124.5M',
		tvl: '$45.2M',
	},
	{
		id: 'pool-2',
		token0: { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
		token1: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
		fee: 500, // 0.05%
		volume24h: '$89.2M',
		tvl: '$120.5M',
	},
	{
		id: 'pool-3',
		token0: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
		token1: { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
		fee: 3000, // 0.3%
		volume24h: '$210.8M',
		tvl: '$98.4M',
	},
	{
		id: 'pool-4',
		token0: { symbol: 'UNI', name: 'Uniswap', decimals: 18 },
		token1: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
		fee: 3000, // 0.3%
		volume24h: '$45.1M',
		tvl: '$22.8M',
	},
];
