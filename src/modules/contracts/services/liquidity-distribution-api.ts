import { env } from '@/env';
import type { PoolKey } from '../utils/get-pool-id';

/**
 * Request payload for liquidity distribution API
 */
export interface LiquidityDistributionRequest {
	poolKey: PoolKey;
	binSizeTicks: number;
	tickRange: number;
}

/**
 * Response type for liquidity distribution API
 * Note: Update this type based on the actual API response structure
 */
export interface LiquidityDistributionResponse {
	// TODO: Define the actual response structure based on API documentation
	// Example structure (update as needed):
	distribution?: Array<{
		tick: number;
		liquidity: string;
		[key: string]: unknown;
	}>;
	[key: string]: unknown;
}

/**
 * Fetch liquidity distribution data from the API
 * @param request The request payload containing poolKey, binSizeTicks, and tickRange
 * @returns Promise resolving to the liquidity distribution response
 * @throws Error if the API request fails
 */
export async function fetchLiquidityDistribution(
	request: LiquidityDistributionRequest,
): Promise<LiquidityDistributionResponse> {
	const response = await fetch(
		`${env.VITE_API_BASE_URL}/v1/liquidity/distribution`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(request),
		},
	);

	if (!response.ok) {
		const errorText = await response.text().catch(() => 'Unknown error');
		throw new Error(
			`Failed to fetch liquidity distribution: ${response.status} ${response.statusText}. ${errorText}`,
		);
	}

	return response.json();
}
