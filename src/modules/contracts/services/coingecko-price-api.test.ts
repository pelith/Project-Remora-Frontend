import { expect, test } from 'vitest';
import { fetchTokenPrice } from './coingecko-price-api';

test('fetchTokenPrice', async () => {
	const price = await fetchTokenPrice({ id: 'bitcoin' });
	console.log(price);
	expect(price).toBeDefined();
});
