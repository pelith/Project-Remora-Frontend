import type { Pool, Position } from '../types/vault.types';

export function getMockPrice(symbol: string): number {
	// Using realistic prices based on market data
	if (symbol === 'ETH') return 2138.11; // Match the chart peak price
	if (symbol === 'WBTC') return 45000;
	if (symbol === 'USDC' || symbol === 'USDT') return 1;
	if (symbol === 'UNI') return 10;
	return 0;
}

/**
 * Generate realistic positions that mimic market liquidity distribution
 * Positions are deployed at liquidity peaks to maximize efficiency
 */
export function generateMockPositions(
	totalUSD: number,
	maxPositions: number,
	currentPrice = 2138.11, // Default ETH price matching chart peak
): Position[] {
	// If maxPositions is 0 (Unlimited), default to 5 for the demo
	const k = maxPositions === 0 ? 5 : Math.max(1, maxPositions);

	const positions: Position[] = [];
	const now = Date.now();

	// Strategy: "Market-Aligned Deployment"
	// Deploy positions at market liquidity peaks for optimal capital efficiency

	// Define liquidity peaks (same as market generation logic)
	const mainPeak = {
		center: currentPrice,
		strength: 1.0, // Relative strength
		spread: 25, // Price units
	};

	const secondaryPeaks = [
		{ center: currentPrice * 0.98, strength: 0.35, spread: 18 }, // -2%
		{ center: currentPrice * 1.02, strength: 0.3, spread: 18 }, // +2%
		{ center: currentPrice * 0.96, strength: 0.18, spread: 15 }, // -4%
		{ center: currentPrice * 1.04, strength: 0.15, spread: 15 }, // +4%
	];

	// Small peak at higher price (right side)
	const highPricePeak = {
		center: currentPrice * 1.07, // +7% from current
		strength: 0.12, // Smaller strength
		spread: 12,
	};

	// Combine all peaks and take first k peaks
	// Prioritize: main peak first, then secondary peaks, then high price peak
	const allPeaks = [mainPeak, ...secondaryPeaks, highPricePeak].slice(0, k);

	// Allocate capital based on peak strength
	const totalStrength = allPeaks.reduce((sum, p) => sum + p.strength, 0);

	allPeaks.forEach((peak, idx) => {
		// Capital allocation proportional to peak strength
		const capitalRatio = peak.strength / totalStrength;
		const positionUSD = totalUSD * capitalRatio;

		// Position width: tighter around main peak, wider for satellites
		const isMainPeak = idx === 0;
		const widthBPS = isMainPeak ? 60 : 80; // 0.6% for main, 0.8% for others
		const halfWidthBPS = widthBPS / 2;

		// Calculate tick range relative to current price
		const priceOffset = (peak.center - currentPrice) / currentPrice;
		const tickCenter = priceOffset * 10000; // Convert to BPS

		const tickLower = Math.round(tickCenter - halfWidthBPS);
		const tickUpper = Math.round(tickCenter + halfWidthBPS);

		// Check if current price is in range
		const inRange = Math.abs(tickCenter) <= halfWidthBPS;

		positions.push({
			id: `pos-${now}-${idx}`,
			tickLower,
			tickUpper,
			liquidityUSD: positionUSD,
			inRange,
		});
	});

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

	if (pool.token0.symbol === 'ETH') price0 = 2138.11;
	if (pool.token0.symbol === 'WBTC') price0 = 45000;
	if (pool.token0.symbol === 'USDC' || pool.token0.symbol === 'USDT')
		price0 = 1;
	if (pool.token0.symbol === 'UNI') price0 = 10;

	if (pool.token1.symbol === 'ETH') price1 = 2138.11;
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

/**
 * 將 ETH 價格 (例如 3000) 轉換為 Uniswap V3 Tick
 * 假設池子是 Token0=USDC (6), Token1=WETH (18)
 * @param priceUsdPerEth - ETH 的 USD 價格 (例如 3000)
 * @param decimal0 - Token0 的小數位數 (USDC = 6)
 * @param decimal1 - Token1 的小數位數 (WETH = 18)
 * @returns Tick 值
 */
export function priceToTick(
	priceUsdPerEth: number,
	decimal0 = 6,
	decimal1 = 18,
): number {
	if (priceUsdPerEth === 0) return 887272; // 價格為 0，對應最大 Tick

	// 計算 Raw Price (Uniswap 內部的價格比率)
	// 公式: RawPrice = (1 / PriceHuman) * 10^(Decimal1 - Decimal0)
	const decimalDiff = decimal1 - decimal0;
	const rawPrice = (1 / priceUsdPerEth) * Math.pow(10, decimalDiff);

	// 計算 Tick
	// 公式: tick = log_1.0001(rawPrice) = ln(rawPrice) / ln(1.0001)
	const tick = Math.log(rawPrice) / Math.log(1.0001);

	// 取整數
	return Math.floor(tick);
}

/**
 * 將 Tick 轉換為人類可讀的價格
 * @param tick - Tick 值
 * @param decimal0 - Token0 的小數位數 (USDC = 6)
 * @param decimal1 - Token1 的小數位數 (WETH = 18)
 * @returns ETH 的 USD 價格
 */
export function tickToPrice(
	tick: number,
	decimal0 = 6,
	decimal1 = 18,
): number {
	// 計算 Raw Price
	const rawPrice = Math.pow(1.0001, tick);

	// 轉換為人類可讀價格
	// PriceHuman = 10^(Decimal1 - Decimal0) / RawPrice
	const decimalDiff = decimal1 - decimal0;
	const priceUsdPerEth = Math.pow(10, decimalDiff) / rawPrice;

	return priceUsdPerEth;
}
