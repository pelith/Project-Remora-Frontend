import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import {
	fetchTokenPrice,
	type TokenPriceRequest,
	type TokenPriceResponse,
} from '../services/oracle-price-api';

export interface UseTokenPriceOptions
	extends Omit<
		UseQueryOptions<TokenPriceResponse, Error, TokenPriceResponse>,
		'queryKey' | 'queryFn'
	> {
	refetchIntervalMs?: number;
}

/**
 * Fetch token price from mainnet oracle with 30s refresh by default.
 *
 * @example
 * const { data, isLoading, error } = useTokenPrice({ id: 'eth' });
 */
export function useTokenPrice(
	request: TokenPriceRequest,
	options?: UseTokenPriceOptions,
) {
	const publicClient = usePublicClient();
	const { refetchIntervalMs = 30_000, enabled, ...queryOptions } =
		options ?? {};
	const vsCurrency = request.vsCurrency ?? 'usd';
	const isEnabled = Boolean(publicClient && request.id) && (enabled ?? true);

	return useQuery<TokenPriceResponse, Error, TokenPriceResponse>({
		queryKey: ['oracle-token-price', request.id, vsCurrency],
		queryFn: () => {
			if (!publicClient) {
				throw new Error('Public client is not ready.');
			}
			return fetchTokenPrice(publicClient, { ...request, vsCurrency });
		},
		refetchInterval: refetchIntervalMs,
		enabled: isEnabled,
		...queryOptions,
	});
}
