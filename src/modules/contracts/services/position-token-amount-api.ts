import { env } from '@/env';

export interface PositionTokenAmountRequest {
	vaultAddress: string;
}

export interface Position {
	tokenId: string;
	tickLower: number;
	tickUpper: number;
	liquidity: string;
	amount0: string; // Raw amount as string
	amount1: string; // Raw amount as string
}

export interface PositionTokenAmountResponse {
	amount0: string; // Raw amount0 as string (total from all positions)
	amount1: string; // Raw amount1 as string (total from all positions)
	positions: Position[];
}

/**
 * Fetch position token amounts from API
 * @param request The request containing vaultAddress
 * @returns Promise resolving to position token amounts
 * @throws Error if the API request fails
 */
export async function fetchPositionTokenAmounts(
	request: PositionTokenAmountRequest,
): Promise<PositionTokenAmountResponse> {
	const baseUrl = env.VITE_API_BASE_URL;
	const url = `${baseUrl}/v1/vaults/${request.vaultAddress}/positions`;

	const response = await fetch(url, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) {
		const errorText = await response.text().catch(() => 'Unknown error');
		throw new Error(
			`Failed to fetch position token amounts: ${response.status} ${response.statusText}. ${errorText}`,
		);
	}

	const data = await response.json();

	// API returns data in format: { amount0: string, amount1: string, positions: Position[] }
	return {
		amount0: data.amount0 ?? '0',
		amount1: data.amount1 ?? '0',
		positions: data.positions ?? [],
	};
}
