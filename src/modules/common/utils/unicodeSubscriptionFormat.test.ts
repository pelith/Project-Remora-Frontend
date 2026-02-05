import { expect, test } from 'vitest';
import { unicodeSubscriptionFormat } from './unicodeSubscriptionFormat';

test('format num as expected with unicode subscript format', () => {
	expect(unicodeSubscriptionFormat('1.000000000000000000001')).toBe('1');
	expect(unicodeSubscriptionFormat('1.0000001')).toBe('1');
	expect(unicodeSubscriptionFormat('1.9000001')).toBe('1.9');
	expect(unicodeSubscriptionFormat('100000000999.000000000000005')).toBe(
		'100000000999',
	);
	expect(unicodeSubscriptionFormat('0.000000001')).toBe('0.0₈1');
	expect(unicodeSubscriptionFormat('0.00006784128928958994')).toBe('0.0₄6784');
});
