import type { Vault, Position } from '../types/vault.types';
import type { LiquidityDistributionResponse } from '@/modules/contracts/services/liquidity-distribution-api';
import { getMockPrice, tickToPrice } from './vault-utils';

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
	currentPrice: number; // Actual current price value
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
 * Convert API bins data to market liquidity array
 * Bins represent liquidity ranges, we need to distribute them across price points
 */
function convertBinsToMarketLiquidity(
	bins: LiquidityDistributionResponse['bins'],
	priceRange: number[],
	token0Decimals: number,
	token1Decimals: number,
): number[] {
	const marketLiquidity: number[] = new Array(priceRange.length).fill(0);

	if (bins.length === 0) {
		// If no bins, return empty array with minimum values
		return marketLiquidity.map(() => 100);
	}

	bins.forEach((bin) => {
		// Convert tick to price
		const priceLower = tickToPrice(
			bin.tickLower,
			token0Decimals,
			token1Decimals,
		);
		const priceUpper = tickToPrice(
			bin.tickUpper,
			token0Decimals,
			token1Decimals,
		);

		// Ensure priceLower < priceUpper
		const minPrice = Math.min(priceLower, priceUpper);
		const maxPrice = Math.max(priceLower, priceUpper);

		// Find indices in price range that fall within this bin
		// Use findIndex to get the first price >= minPrice
		let lowerIndex = priceRange.findIndex((p) => p >= minPrice);
		// Use findIndex to get the first price >= maxPrice, then use previous index
		let upperIndex = priceRange.findIndex((p) => p >= maxPrice);
		
		// If upperIndex is -1, use the last index
		if (upperIndex === -1) {
			upperIndex = priceRange.length;
		}

		if (lowerIndex === -1) {
			// Bin is before the price range, skip
			return;
		}

		// Convert liquidity string to number
		// Note: activeLiquidity is in raw liquidity units, may need scaling
		const liquidity = Number.parseFloat(bin.activeLiquidity);

		// Distribute liquidity evenly across the price range in this bin
		const binWidth = upperIndex - lowerIndex;
		if (binWidth > 0) {
			const liquidityPerPoint = liquidity / binWidth;
			for (let i = lowerIndex; i < upperIndex && i < priceRange.length; i++) {
				marketLiquidity[i] += liquidityPerPoint;
			}
		} else if (lowerIndex >= 0 && lowerIndex < priceRange.length) {
			// Single point bin (or very narrow range)
			marketLiquidity[lowerIndex] += liquidity;
		}
	});

	// Return raw liquidity values (keep zeros, don't add artificial minimum)
	return marketLiquidity;
}

/**
 * Generate price range from API bins data
 */
function generatePriceRangeFromBins(
	bins: LiquidityDistributionResponse['bins'],
	currentTick: number,
	token0Decimals: number,
	token1Decimals: number,
	tickLower: number,
	tickUpper: number,
): number[] {
	if (bins.length === 0) {
		// Fallback: use current price and allowed range
		const currentPrice = tickToPrice(currentTick, token0Decimals, token1Decimals);
		const allowedLower = currentPrice * (1 + tickLower / 10000);
		const allowedUpper = currentPrice * (1 + tickUpper / 10000);
		const minPrice = Math.floor(allowedLower * 0.9);
		const maxPrice = Math.ceil(allowedUpper * 1.1);
		
		const priceRange: number[] = [];
		const step = Math.max(1, (maxPrice - minPrice) / 200);
		for (let price = minPrice; price <= maxPrice; price += step) {
			priceRange.push(price);
		}
		return priceRange;
	}

	// Get min and max ticks from bins (only use bins with actual liquidity)
	const binsWithLiquidity = bins.filter(
		(bin) => Number.parseFloat(bin.activeLiquidity) > 0,
	);

	if (binsWithLiquidity.length === 0) {
		// Fallback to all bins if no liquidity
		const allTicks = bins.flatMap((bin) => [bin.tickLower, bin.tickUpper]);
		const minTick = Math.min(...allTicks, currentTick);
		const maxTick = Math.max(...allTicks, currentTick);

		const minPrice = tickToPrice(minTick, token0Decimals, token1Decimals);
		const maxPrice = tickToPrice(maxTick, token0Decimals, token1Decimals);

		// Small buffer (2% on each side)
		const finalMin = minPrice * 0.98;
		const finalMax = maxPrice * 1.02;

		const priceRange: number[] = [];
		const range = finalMax - finalMin;
		const step = Math.max(0.1, range / 250);

		for (let price = finalMin; price <= finalMax; price += step) {
			priceRange.push(Number.parseFloat(price.toFixed(2)));
		}
		return priceRange;
	}

	// Use only bins with liquidity to determine range
	const allTicks = binsWithLiquidity.flatMap((bin) => [
		bin.tickLower,
		bin.tickUpper,
	]);
	const minTick = Math.min(...allTicks);
	const maxTick = Math.max(...allTicks);

	// Convert ticks to prices
	const minPrice = tickToPrice(minTick, token0Decimals, token1Decimals);
	const maxPrice = tickToPrice(maxTick, token0Decimals, token1Decimals);

	// Convert current tick to price to ensure it's included
	const currentPrice = tickToPrice(currentTick, token0Decimals, token1Decimals);

	// Ensure current price is within the range
	const effectiveMin = Math.min(minPrice, currentPrice);
	const effectiveMax = Math.max(maxPrice, currentPrice);

	// Small buffer (2% on each side) to show context
	const finalMin = effectiveMin * 0.98;
	const finalMax = effectiveMax * 1.02;

	// Generate price range with appropriate step size
	// Aim for ~200-300 points for good granularity
	const priceRange: number[] = [];
	const range = finalMax - finalMin;
	const step = Math.max(0.1, range / 250); // More granular steps

	for (let price = finalMin; price <= finalMax; price += step) {
		priceRange.push(Number.parseFloat(price.toFixed(2)));
	}

	return priceRange;
}

/**
 * Generate complete liquidity chart data from API response
 */
export function generateLiquidityChartDataFromAPI(
	apiResponse: LiquidityDistributionResponse,
	vault: Vault,
	currentPrice: number,
): LiquidityChartData {
	const token0Decimals = vault.poolKey.token0.decimals;
	const token1Decimals = vault.poolKey.token1.decimals;

	// Use provided currentPrice (calculated from container)

	// Generate price range from bins
	const priceRange = generatePriceRangeFromBins(
		apiResponse.bins,
		apiResponse.currentTick,
		token0Decimals,
		token1Decimals,
		vault.config.tickLower,
		vault.config.tickUpper,
	);

	// Convert bins to market liquidity array
	let marketLiquidity = convertBinsToMarketLiquidity(
		apiResponse.bins,
		priceRange,
		token0Decimals,
		token1Decimals,
	);

	// Find current price index to ensure it has liquidity data
	let currentPriceIndex = priceRange.findIndex((p) => p >= currentPrice);
	if (currentPriceIndex === -1) {
		// Find the closest price point
		let minDistance = Infinity;
		priceRange.forEach((price, index) => {
			const distance = Math.abs(price - currentPrice);
			if (distance < minDistance) {
				minDistance = distance;
				currentPriceIndex = index;
			}
		});
	}
	if (currentPriceIndex === -1 || currentPriceIndex < 0) {
		currentPriceIndex = Math.floor(priceRange.length / 2);
	}

	// If current price position has zero liquidity, use the pool's total liquidity
	// or find the nearest bin with liquidity
	if (currentPriceIndex >= 0 && currentPriceIndex < marketLiquidity.length) {
		if (marketLiquidity[currentPriceIndex] === 0) {
			// Use the pool's total liquidity at current tick
			const totalLiquidity = Number.parseFloat(apiResponse.liquidity);
			
			// Find the nearest bin with liquidity
			let nearestLiquidity = 0;
			let minDistance = Infinity;
			
			apiResponse.bins.forEach((bin) => {
				const binPriceLower = tickToPrice(
					bin.tickLower,
					token0Decimals,
					token1Decimals,
				);
				const binPriceUpper = tickToPrice(
					bin.tickUpper,
					token0Decimals,
					token1Decimals,
				);
				const binCenter = (binPriceLower + binPriceUpper) / 2;
				const distance = Math.abs(binCenter - currentPrice);
				
				if (distance < minDistance) {
					minDistance = distance;
					nearestLiquidity = Number.parseFloat(bin.activeLiquidity);
				}
			});
			
			// Use the nearest bin's liquidity or total liquidity, whichever is available
			marketLiquidity[currentPriceIndex] = nearestLiquidity > 0 
				? nearestLiquidity 
				: totalLiquidity;
		}
	}

	// Convert vault positions to agent positions
	const agentPositions = convertVaultPositionsToAgentPositions(
		vault.positions,
		currentPrice,
	);

	// Calculate axis maximums
	// Find the maximum liquidity value from the data
	const maxLiquidity = marketLiquidity.length > 0 
		? Math.max(...marketLiquidity) 
		: 0;
	const leftYMax = Math.max(maxLiquidity * 1.1, 1000); // Add 10% padding, ensure minimum
	
	const rightYMax = calculateSmartRightAxisMax(
		agentPositions,
		marketLiquidity,
		priceRange,
		leftYMax,
	);

	// currentPriceIndex was already calculated above, reuse it

	// Calculate allowed price range
	const allowedLowerPrice = currentPrice * (1 + vault.config.tickLower / 10000);
	const allowedUpperPrice = currentPrice * (1 + vault.config.tickUpper / 10000);

	const result = {
		labels: priceRange.map((p) => `$${p.toLocaleString()}`),
		rawLabels: priceRange,
		marketLiquidity,
		agentPositions,
		leftYMax,
		rightYMax,
		currentPriceIndex,
		currentPrice, // Use the actual current price passed in
		allowedLowerPrice,
		allowedUpperPrice,
	};
	
	return result;
}

/**
 * Generate complete liquidity chart data from vault (fallback to mock data)
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
		currentPrice, // Use the actual current price
		allowedLowerPrice,
		allowedUpperPrice,
	};
}
