import type { LiquidityDistributionRequest } from '../services/liquidity-distribution-api';
import type { PoolKey } from '../utils/get-pool-id';

/**
 * Token addresses used in Uniswap v4 pools
 * Note: 0x0000000000000000000000000000000000000000 represents native ETH
 */
export const TOKEN_ADDRESSES = {
	ETH: '0x0000000000000000000000000000000000000000' as const,
	USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const,
	// USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7' as const,
	// WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' as const,
	// DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F' as const,
} as const;

export const TOKEN_METADATA = {
	ETH: {
		symbol: 'ETH',
		name: 'Ethereum',
		decimals: 18,
		img: '/images/tokens/eth.svg',
	},
	USDC: {
		symbol: 'USDC',
		name: 'USD Coin',
		decimals: 6,
		img: '/images/tokens/usdc.svg',
	},
};

/**
 * Zero address for hooks (no hooks)
 */
export const ZERO_HOOKS = '0x0000000000000000000000000000000000000000' as const;

/**
 * Default liquidity distribution request parameters
 */
export const DEFAULT_LIQUIDITY_DISTRIBUTION_PARAMS = {
	binSizeTicks: 100,
	tickRange: 10000,
} as const;

/**
 * Example pool configurations from Postman collection
 */
export const EXAMPLE_POOL_KEYS: Record<string, PoolKey> = {
	ETH_USDC: {
		currency0: TOKEN_ADDRESSES.ETH,
		currency1: TOKEN_ADDRESSES.USDC,
		fee: 3000,
		tickSpacing: 60,
		hooks: ZERO_HOOKS,
	},
	// ETH_USDT: {
	// 	currency0: TOKEN_ADDRESSES.ETH,
	// 	currency1: TOKEN_ADDRESSES.USDT,
	// 	fee: 3000,
	// 	tickSpacing: 60,
	// 	hooks: ZERO_HOOKS,
	// },
	// ETH_WBTC: {
	// 	currency0: TOKEN_ADDRESSES.ETH,
	// 	currency1: TOKEN_ADDRESSES.WBTC,
	// 	fee: 3000,
	// 	tickSpacing: 60,
	// 	hooks: ZERO_HOOKS,
	// },
	// USDC_USDT: {
	// 	currency0: TOKEN_ADDRESSES.USDC,
	// 	currency1: TOKEN_ADDRESSES.USDT,
	// 	fee: 500,
	// 	tickSpacing: 10,
	// 	hooks: ZERO_HOOKS,
	// },
	// ETH_DAI: {
	// 	currency0: TOKEN_ADDRESSES.ETH,
	// 	currency1: TOKEN_ADDRESSES.DAI,
	// 	fee: 3000,
	// 	tickSpacing: 60,
	// 	hooks: ZERO_HOOKS,
	// },
} as const;

/**
 * Example liquidity distribution requests ready to use
 */
export const EXAMPLE_LIQUIDITY_DISTRIBUTION_REQUESTS: Record<
	string,
	LiquidityDistributionRequest
> = {
	ETH_USDC: {
		poolKey: EXAMPLE_POOL_KEYS.ETH_USDC,
		...DEFAULT_LIQUIDITY_DISTRIBUTION_PARAMS,
	},
	// ETH_USDT: {
	// 	poolKey: EXAMPLE_POOL_KEYS.ETH_USDT,
	// 	...DEFAULT_LIQUIDITY_DISTRIBUTION_PARAMS,
	// },
	// ETH_WBTC: {
	// 	poolKey: EXAMPLE_POOL_KEYS.ETH_WBTC,
	// 	...DEFAULT_LIQUIDITY_DISTRIBUTION_PARAMS,
	// },
	// USDC_USDT: {
	// 	poolKey: EXAMPLE_POOL_KEYS.USDC_USDT,
	// 	...DEFAULT_LIQUIDITY_DISTRIBUTION_PARAMS,
	// },
	// ETH_DAI: {
	// 	poolKey: EXAMPLE_POOL_KEYS.ETH_DAI,
	// 	...DEFAULT_LIQUIDITY_DISTRIBUTION_PARAMS,
	// },
} as const;
