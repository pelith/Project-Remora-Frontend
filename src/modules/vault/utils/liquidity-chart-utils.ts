import type { Vault, Position } from '../types/vault.types';
import { getMockPrice } from './vault-utils';

export interface AgentPosition {
	tickLower: number;
	tickUpper: number;
	liquidity: number;
}

export interface LiquidityChartData {
	labels: string[];
	rawLabels: number[];
	marketLiquidity: number[];
	agentPositions: AgentPosition[];
	leftYMax: number;
	rightYMax: number;
	currentPriceIndex: number;
	allowedLowerPrice: number;
	allowedUpperPrice: number;
}

/**
 * Calculate smart right axis maximum value
 * Ensures all agent positions don't exceed market liquidity at their corresponding price points
 */
export function calculateSmartRightAxisMax(
	agentPositions: AgentPosition[],
	marketLiquidity: number[],
	priceLabels: number[],
	leftYMax: number,
): number {
	const constraints: number[] = [];

	agentPositions.forEach((position) => {
		const lowerIndex = priceLabels.findIndex((p) => p >= position.tickLower);
		const upperIndex = priceLabels.findIndex((p) => p >= position.tickUpper);

		if (lowerIndex === -1 || upperIndex === -1) return;

		// Find minimum market liquidity in the position range (bottleneck)
		let minMarketInRange = Infinity;
		for (let i = lowerIndex; i <= upperIndex; i++) {
			if (marketLiquidity[i] < minMarketInRange) {
				minMarketInRange = marketLiquidity[i];
			}
		}

		// Calculate required right axis max for this position
		// Formula: rightYMax >= (position.liquidity × leftYMax) / minMarketInRange
		const minRequiredRightYMax =
			(position.liquidity * leftYMax) / minMarketInRange;
		constraints.push(minRequiredRightYMax);
	});

	// Return maximum constraint (strictest limit) to ensure all positions satisfy
	// Add a reasonable upper bound to prevent extreme scaling
	const calculatedMax =
		constraints.length > 0 ? Math.max(...constraints) : 1000;
	const maxLiquidity = Math.max(...agentPositions.map((p) => p.liquidity));
	// Use a multiplier (e.g., 1.2x) of max position liquidity as upper bound
	const reasonableMax = maxLiquidity * 1.5;
	return Math.min(calculatedMax, reasonableMax);
}

/**
 * Generate realistic market liquidity data based on vault configuration
 * Creates liquidity peaks around current price, mimicking real Uniswap v3 pools
 */
function generateMarketLiquidity(
	priceRange: number[],
	currentPrice: number,
): number[] {
	const marketLiquidity: number[] = [];

	// Create more realistic liquidity distribution:
	// 1. Main peak at current price (highest liquidity)
	// 2. Secondary peaks at support/resistance levels
	// 3. Small peak at higher price (right side)
	// 4. Gradual decay away from peaks

	const mainPeak = {
		center: currentPrice,
		strength: 35000 + Math.random() * 5000, // 35K-40K at peak
		spread: 20 + Math.random() * 10, // 20-30 price units spread
	};

	// Secondary peaks at ±2% and ±4% from current price
	const secondaryPeaks = [
		{
			center: currentPrice * 0.98, // -2%
			strength: 12000 + Math.random() * 3000,
			spread: 15 + Math.random() * 5,
		},
		{
			center: currentPrice * 1.02, // +2%
			strength: 10000 + Math.random() * 3000,
			spread: 15 + Math.random() * 5,
		},
		{
			center: currentPrice * 0.96, // -4%
			strength: 6000 + Math.random() * 2000,
			spread: 12 + Math.random() * 5,
		},
		{
			center: currentPrice * 1.04, // +4%
			strength: 5000 + Math.random() * 2000,
			spread: 12 + Math.random() * 5,
		},
	];

	// Small peak at higher price (around +6-8% from current)
	const highPricePeak = {
		center: currentPrice * 1.07, // +7% from current
		strength: 4000 + Math.random() * 2000, // Smaller peak
		spread: 10 + Math.random() * 5, // Narrower spread
	};

	const allPeaks = [mainPeak, ...secondaryPeaks, highPricePeak];

	priceRange.forEach((price) => {
		let totalLiquidity = 0;

		// Sum contributions from all peaks using Gaussian distribution
		allPeaks.forEach((peak) => {
			const distance = Math.abs(price - peak.center);
			const normalizedDistance = distance / peak.spread;
			// Gaussian: exp(-(x/σ)²)
			const contribution =
				peak.strength * Math.exp(-Math.pow(normalizedDistance, 2));
			totalLiquidity += contribution;
		});

		// Add some noise but keep it realistic
		totalLiquidity *= 0.95 + Math.random() * 0.1;

		// Ensure minimum liquidity (even outside peaks)
		const minLiquidity = 500 + Math.random() * 500;
		totalLiquidity = Math.max(totalLiquidity, minLiquidity);

		marketLiquidity.push(totalLiquidity);
	});

	return marketLiquidity;
}

/**
 * Convert vault positions to agent positions for chart visualization
 */
function convertVaultPositionsToAgentPositions(
	positions: Position[],
	currentPrice: number,
): AgentPosition[] {
	return positions.map((pos) => {
		// Convert tick-based positions to absolute prices
		const priceLower = currentPrice * (1 + pos.tickLower / 10000);
		const priceUpper = currentPrice * (1 + pos.tickUpper / 10000);
		const lower = Math.min(priceLower, priceUpper);
		const upper = Math.max(priceLower, priceUpper);

		return {
			tickLower: lower,
			tickUpper: upper,
			liquidity: pos.liquidityUSD,
		};
	});
}

/**
 * Generate price range based on vault configuration
 */
function generatePriceRange(
	currentPrice: number,
	tickLower: number,
	tickUpper: number,
): number[] {
	// Calculate allowed price range from ticks
	const allowedLower = currentPrice * (1 + tickLower / 10000);
	const allowedUpper = currentPrice * (1 + tickUpper / 10000);

	// Generate price range with 5-unit steps
	const minPrice = Math.floor(allowedLower * 0.9); // 10% buffer below
	const maxPrice = Math.ceil(allowedUpper * 1.1); // 10% buffer above
	const priceRange: number[] = [];

	for (let price = minPrice; price <= maxPrice; price += 5) {
		priceRange.push(price);
	}

	return priceRange;
}

/**
 * Generate complete liquidity chart data from vault
 */
export function generateLiquidityChartData(vault: Vault): LiquidityChartData {
	// Use current price matching the chart peak (2138.11 for ETH/USDC)
	const currentPrice = getMockPrice(vault.poolKey.token0.symbol);

	// Generate price range based on vault config
	const priceRange = generatePriceRange(
		currentPrice,
		vault.config.tickLower,
		vault.config.tickUpper,
	);

	// Generate market liquidity data
	const marketLiquidity = generateMarketLiquidity(priceRange, currentPrice);

	// Convert vault positions to agent positions
	const agentPositions = convertVaultPositionsToAgentPositions(
		vault.positions,
		currentPrice,
	);

	// Calculate axis maximums
	const leftYMax = Math.max(...marketLiquidity);
	const rightYMax = calculateSmartRightAxisMax(
		agentPositions,
		marketLiquidity,
		priceRange,
		leftYMax,
	);

	// Find current price index
	const currentPriceIndex = priceRange.findIndex((p) => p >= currentPrice);

	// Calculate allowed price range
	const allowedLowerPrice = currentPrice * (1 + vault.config.tickLower / 10000);
	const allowedUpperPrice = currentPrice * (1 + vault.config.tickUpper / 10000);

	return {
		labels: priceRange.map((p) => `$${p.toLocaleString()}`),
		rawLabels: priceRange,
		marketLiquidity,
		agentPositions,
		leftYMax,
		rightYMax,
		currentPriceIndex: currentPriceIndex >= 0 ? currentPriceIndex : 0,
		allowedLowerPrice,
		allowedUpperPrice,
	};
}
