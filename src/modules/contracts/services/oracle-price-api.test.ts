import type { PublicClient } from 'viem';
import { expect, test } from 'vitest';
import { fetchTokenPrice } from './oracle-price-api';

const createMockClient = () =>
	({
		chain: { id: 1 },
		readContract: async ({
			functionName,
		}: {
			functionName: 'decimals' | 'latestRoundData';
		}) => {
			if (functionName === 'decimals') return 8;
			return [1n, 2_000_00000000n, 0n, 1_700_000_000n, 1n];
		},
	}) as unknown as PublicClient;

test('fetchTokenPrice returns parsed oracle price', async () => {
	const price = await fetchTokenPrice(createMockClient(), { id: 'eth' });
	expect(price.price).toBe(2000);
	expect(price.vsCurrency).toBe('usd');
});
