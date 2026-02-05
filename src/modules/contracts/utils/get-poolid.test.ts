import { test, expect, describe } from 'vitest';
import { computePoolId } from './get-pool-id';

describe('getPoolId', () => {
	test('should return the correct pool id', () => {
		const poolId = computePoolId({
			currency0: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3',
			currency1: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
			fee: 500,
			tickSpacing: 60,
			hooks: '0x1234567890123456789012345678901234567890',
		});
		expect(poolId).toBe(
			'0x63bb22f47c7ede6578a25c873e77eb782ec8e4c19778e36ce64d37877b5bd1e7',
		);
	});
});
