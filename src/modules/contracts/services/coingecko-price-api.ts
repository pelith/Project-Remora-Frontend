const DEFAULT_COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
export interface TokenPriceRequest {
	id: string;
	vsCurrency?: string;
	include24hrChange?: boolean;
	includeMarketCap?: boolean;
	include24hrVol?: boolean;
	includeLastUpdatedAt?: boolean;
	precision?: number;
}

export interface TokenPriceResponse {
	id: string;
	vsCurrency: string;
	price: number;
	raw: Record<string, unknown>;
}

function getCoingeckoBaseUrl() {
	return DEFAULT_COINGECKO_BASE_URL;
}

export async function fetchTokenPrice(
	request: TokenPriceRequest,
): Promise<TokenPriceResponse> {
	const {
		id,
		vsCurrency = 'usd',
		include24hrChange = false,
		includeMarketCap = false,
		include24hrVol = false,
		includeLastUpdatedAt = false,
		precision,
	} = request;

	if (!id) {
		throw new Error('Token id is required for Coingecko price lookup.');
	}

	const url = new URL('/simple/price', getCoingeckoBaseUrl());
	url.searchParams.set('ids', id);
	url.searchParams.set('vs_currencies', vsCurrency);

	if (include24hrChange) url.searchParams.set('include_24hr_change', 'true');
	if (includeMarketCap) url.searchParams.set('include_market_cap', 'true');
	if (include24hrVol) url.searchParams.set('include_24hr_vol', 'true');
	if (includeLastUpdatedAt)
		url.searchParams.set('include_last_updated_at', 'true');
	if (typeof precision === 'number')
		url.searchParams.set('precision', String(precision));

	const response = await fetch(url.toString(), {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) {
		const errorText = await response.text().catch(() => 'Unknown error');
		throw new Error(
			`Failed to fetch token price: ${response.status} ${response.statusText}. ${errorText}`,
		);
	}

	const data = (await response.json()) as Record<
		string,
		Record<string, unknown>
	>;
	const entry = data[id];
	const price = entry?.[vsCurrency];

	if (typeof price !== 'number') {
		throw new Error(`Token price not found for "${id}" in "${vsCurrency}".`);
	}

	return {
		id,
		vsCurrency,
		price,
		raw: entry ?? {},
	};
}
