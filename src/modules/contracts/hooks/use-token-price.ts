import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import {
	fetchTokenPrice,
	type TokenPriceRequest,
	type TokenPriceResponse,
} from '../services/coingecko-price-api';

export interface UseTokenPriceOptions
	extends Omit<
		UseQueryOptions<TokenPriceResponse, Error, TokenPriceResponse>,
		'queryKey' | 'queryFn'
	> {
	refetchIntervalMs?: number;
}

/**
 * Fetch token price from Coingecko with 30s refresh by default.
 *
 * @example
 * const { data, isLoading, error } = useTokenPrice({ id: 'ethereum' });
 */
export function useTokenPrice(
	request: TokenPriceRequest,
	options?: UseTokenPriceOptions,
) {
	const { refetchIntervalMs = 30_000, enabled, ...queryOptions } =
		options ?? {};
	const vsCurrency = request.vsCurrency ?? 'usd';
	const isEnabled = Boolean(request.id) && (enabled ?? true);

	return useQuery<TokenPriceResponse, Error, TokenPriceResponse>({
		queryKey: ['coingecko-token-price', request.id, vsCurrency],
		queryFn: () => fetchTokenPrice({ ...request, vsCurrency }),
		refetchInterval: refetchIntervalMs,
		enabled: isEnabled,
		...queryOptions,
	});
}
