import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import {
	fetchLiquidityDistribution,
	type LiquidityDistributionRequest,
	type LiquidityDistributionResponse,
} from '../services/liquidity-distribution-api';

/**
 * Hook for fetching liquidity distribution data
 *
 * @example
 * ```tsx
 * const { mutate, data, isPending, error } = useLiquidityDistribution();
 *
 * mutate({
 *   poolKey: {
 *     currency0: '0x0000000000000000000000000000000000000000',
 *     currency1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *     fee: 3000,
 *     tickSpacing: 60,
 *     hooks: '0x0000000000000000000000000000000000000000'
 *   },
 *   binSizeTicks: 100,
 *   tickRange: 10000
 * });
 * ```
 */
export function useLiquidityDistribution(
	options?: Omit<
		UseMutationOptions<
			LiquidityDistributionResponse,
			Error,
			LiquidityDistributionRequest
		>,
		'mutationFn'
	>,
) {
	return useMutation<
		LiquidityDistributionResponse,
		Error,
		LiquidityDistributionRequest
	>({
		mutationFn: fetchLiquidityDistribution,
		...options,
	});
}
