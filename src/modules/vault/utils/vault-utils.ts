import type { Pool, Position } from '../types/vault.types';

export function getMockPrice(symbol: string): number {
	if (symbol === 'ETH') return 2500;
	if (symbol === 'WBTC') return 45000;
	if (symbol === 'USDC' || symbol === 'USDT') return 1;
	if (symbol === 'UNI') return 10;
	return 0;
}

export function generateMockPositions(
	totalUSD: number,
	maxPositions: number,
): Position[] {
	// If maxPositions is 0 (Unlimited), default to 5 for the demo
	const k = maxPositions === 0 ? 5 : Math.max(1, maxPositions);

	const positions: Position[] = [];
	const now = Date.now();

	// Strategy: "Concentrated Sniper"
	// Instead of wide blocks, we create narrow, high-density liquidity ranges.

	// 1. Core Position (Active Market Making)
	// Very tight range around current price to capture high fees.
	// ~0.6% width (+/- 30 BPS)
	const coreRatio = k === 1 ? 1 : 0.5; // 50% capital in active range
	const coreUSD = totalUSD * coreRatio;
	const coreHalfWidth = 30; // 0.3%

	positions.push({
		id: `pos-${now}-0`,
		tickLower: -coreHalfWidth,
		tickUpper: coreHalfWidth,
		liquidityUSD: coreUSD,
		inRange: true,
	});

	if (k === 1) return positions;

	// 2. Satellite Positions (Limit Orders / Rebalancing Zones)
	// These should be positioned at "Support" and "Resistance" levels, not immediately adjacent.
	const remainingUSD = totalUSD * (1 - coreRatio);
	const remainingCount = k - 1;
	const usdPerPosition = remainingUSD / remainingCount;

	for (let i = 0; i < remainingCount; i++) {
		const isUpper = i % 2 === 0;
		const level = Math.floor(i / 2) + 1;

		// Gap logic: Leave some empty space between positions to show "Ranges"
		// Level 1: +/- 1.5% away
		// Level 2: +/- 3.0% away
		const distanceToMid = 150 * level; // 1.5% steps
		const width = 60; // Narrow 0.6% width for satellites

		let tLower: number;
		let tUpper: number;

		if (isUpper) {
			// Resistance Zone (Sell High)
			// e.g., +150 to +210 BPS
			tLower = distanceToMid;
			tUpper = distanceToMid + width;
		} else {
			// Support Zone (Buy Low)
			// e.g., -210 to -150 BPS
			tLower = -(distanceToMid + width);
			tUpper = -distanceToMid;
		}

		positions.push({
			id: `pos-${now}-${i + 1}`,
			tickLower: tLower,
			tickUpper: tUpper,
			liquidityUSD: usdPerPosition,
			inRange: false,
		});
	}

	return positions;
}

export function calculateInitialTVL(
	amount0: string,
	amount1: string,
	pool: Pool,
): number {
	const val0 = Number.parseFloat(amount0) || 0;
	const val1 = Number.parseFloat(amount1) || 0;

	let price0 = 0;
	let price1 = 0;

	if (pool.token0.symbol === 'ETH') price0 = 2500;
	if (pool.token0.symbol === 'WBTC') price0 = 45000;
	if (pool.token0.symbol === 'USDC' || pool.token0.symbol === 'USDT')
		price0 = 1;
	if (pool.token0.symbol === 'UNI') price0 = 10;

	if (pool.token1.symbol === 'ETH') price1 = 2500;
	if (pool.token1.symbol === 'WBTC') price1 = 45000;
	if (pool.token1.symbol === 'USDC' || pool.token1.symbol === 'USDT')
		price1 = 1;

	return val0 * price0 + val1 * price1;
}

export function formatCurrency(val: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	}).format(val);
}
