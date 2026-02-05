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
	const calculatedMax = constraints.length > 0 ? Math.max(...constraints) : 1000;
	const maxLiquidity = Math.max(...agentPositions.map(p => p.liquidity));
	// Use a multiplier (e.g., 1.2x) of max position liquidity as upper bound
	const reasonableMax = maxLiquidity * 1.5;
	return Math.min(calculatedMax, reasonableMax);
}

/**
 * Generate mock market liquidity data based on vault configuration
 * Creates liquidity peaks around key price points
 */
function generateMarketLiquidity(
	priceRange: number[],
	currentPrice: number,
): number[] {
	const marketLiquidity: number[] = [];

	// Create liquidity peaks around current price and nearby levels
	const liquidityPeaks = [
		{
			center: currentPrice * 0.95, // -5% from current
			strength: 16000,
			spread: 25,
		},
		{
			center: currentPrice, // Current price
			strength: 28000,
			spread: 30,
		},
		{
			center: currentPrice * 1.05, // +5% from current
			strength: 11000,
			spread: 35,
		},
	];

	priceRange.forEach((price) => {
		let totalLiquidity = 0;
		liquidityPeaks.forEach((peak) => {
			const distance = Math.abs(price - peak.center);
			totalLiquidity +=
				peak.strength * Math.exp(-Math.pow(distance / peak.spread, 2));
		});
		totalLiquidity *= 0.9 + Math.random() * 0.2;

		const isInPeakRegion = liquidityPeaks.some(
			(p) => Math.abs(price - p.center) < p.spread * 1.5,
		);
		if (!isInPeakRegion) totalLiquidity *= 0.2;

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
	const currentPriceIndex = priceRange.findIndex(
		(p) => p >= currentPrice,
	);

	// Calculate allowed price range
	const allowedLowerPrice =
		currentPrice * (1 + vault.config.tickLower / 10000);
	const allowedUpperPrice =
		currentPrice * (1 + vault.config.tickUpper / 10000);

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

