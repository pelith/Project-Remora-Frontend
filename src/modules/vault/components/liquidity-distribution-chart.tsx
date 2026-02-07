import type { Chart } from 'chart.js';
import {
	BarElement,
	CategoryScale,
	type ChartData,
	Chart as ChartJS,
	type ChartOptions,
	Legend,
	LinearScale,
	type Plugin,
	Tooltip,
} from 'chart.js';
import { TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { Card } from '@/modules/common/components/ui/card';
import type { LiquidityDistributionResponse } from '@/modules/contracts/services/liquidity-distribution-api';
import type { Vault } from '../types/vault.types';
import { generateLiquidityChartDataFromAPI } from '../utils/liquidity-chart-utils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface LiquidityDistributionChartProps {
	vault: Vault;
	liquidityDistributionData?: LiquidityDistributionResponse | null;
	currentPrice?: number;
}

// Custom plugin to draw agent positions and overlays
function createOverlayPlugin(
	chartData: ReturnType<typeof generateLiquidityChartDataFromAPI>,
): Plugin<'bar'> {
	return {
		id: 'agentPositionsAndOverlays',
		afterDatasetsDraw: (chart) => {
			const ctx = chart.ctx;
			const xAxis = chart.scales.x;
			const yAxisLeft = chart.scales.yLeft;

			const MIN_HEIGHT_PX = 6;

			// Use left axis height for drawing
			const chartHeight = yAxisLeft.bottom - yAxisLeft.top;

			// Step 1: Calculate relative heights based on USD value (preserving relative sizes)
			const maxLiquidityUSD =
				chartData.agentPositions.length > 0
					? Math.max(...chartData.agentPositions.map((p) => p.liquidity))
					: 1;

			// Step 2: For each position, find the minimum market liquidity height in its price range
			// and calculate the maximum allowed height
			const positionConstraints: Array<{
				position: (typeof chartData.agentPositions)[0];
				lowerIndex: number;
				upperIndex: number;
				relativeHeight: number; // Height based on USD value ratio (0-1)
				maxAllowedHeight: number; // Maximum height based on market liquidity
			}> = [];

			chartData.agentPositions.forEach((position) => {
				const lowerIndex = chartData.rawLabels.findIndex(
					(p) => p >= position.tickLower,
				);
				const upperIndex = chartData.rawLabels.findIndex(
					(p) => p >= position.tickUpper,
				);

				if (lowerIndex === -1 || upperIndex === -1) {
					return;
				}

				// Calculate relative height based on USD value (0-1)
				const relativeHeight =
					maxLiquidityUSD > 0 ? position.liquidity / maxLiquidityUSD : 0;

				// Find minimum market liquidity height in this position's price range
				let minMarketHeight = Number.POSITIVE_INFINITY;
				for (
					let i = lowerIndex;
					i <= upperIndex && i < chartData.marketLiquidity.length;
					i++
				) {
					const marketLiquidity = chartData.marketLiquidity[i];
					const marketHeightRatio = marketLiquidity / chartData.leftYMax;
					const marketHeight = chartHeight * marketHeightRatio;
					if (marketHeight < minMarketHeight && marketHeight > 0) {
						minMarketHeight = marketHeight;
					}
				}

				// If no market liquidity found, use a reasonable default (50% of chart height)
				const maxAllowedHeight =
					minMarketHeight !== Number.POSITIVE_INFINITY
						? minMarketHeight
						: chartHeight * 0.5;

				positionConstraints.push({
					position,
					lowerIndex,
					upperIndex,
					relativeHeight,
					maxAllowedHeight,
				});
			});

			// Step 3: Calculate global scale factor
			// Find the position that would exceed its max allowed height the most
			// Scale all positions down by this factor to ensure none exceed their limits
			let maxScaleFactor = 1;
			positionConstraints.forEach((constraint) => {
				// If we scale all positions by relativeHeight, this position would be:
				// height = chartHeight * relativeHeight * scaleFactor
				// We need: height <= maxAllowedHeight
				// So: chartHeight * relativeHeight * scaleFactor <= maxAllowedHeight
				// Therefore: scaleFactor <= maxAllowedHeight / (chartHeight * relativeHeight)
				if (constraint.relativeHeight > 0) {
					const requiredScaleFactor =
						constraint.maxAllowedHeight /
						(chartHeight * constraint.relativeHeight);
					if (requiredScaleFactor < maxScaleFactor) {
						maxScaleFactor = requiredScaleFactor;
					}
				}
			});

			// Ensure scale factor doesn't scale up (only down)
			maxScaleFactor = Math.min(maxScaleFactor, 1);

			// Ensure minimum height is met for smallest position
			if (positionConstraints.length > 0) {
				const minRelativeHeight = Math.min(
					...positionConstraints.map((c) => c.relativeHeight),
				);
				if (minRelativeHeight > 0) {
					const minRequiredHeight =
						maxScaleFactor * chartHeight * minRelativeHeight;
					if (minRequiredHeight < MIN_HEIGHT_PX) {
						// If smallest position would be too small, adjust scale factor
						// But still respect the max allowed height constraint
						const adjustedScaleFactor =
							MIN_HEIGHT_PX / (chartHeight * minRelativeHeight);
						maxScaleFactor = Math.min(adjustedScaleFactor, maxScaleFactor);
					}
				}
			}

			// Step 4: Draw all positions with calculated heights
			positionConstraints.forEach((constraint) => {
				const { lowerIndex, upperIndex, relativeHeight } = constraint;

				// Use index for getPixelForValue (Chart.js category scale accepts index)
				const leftX = xAxis.getPixelForValue(lowerIndex);
				const rightX = xAxis.getPixelForValue(upperIndex);
				const width = rightX - leftX;

				if (width <= 0) {
					return;
				}

				// Calculate final height: base height * scale factor
				const baseHeight = chartHeight * relativeHeight;
				const scaledHeight = baseHeight * maxScaleFactor;
				const finalHeight = Math.max(scaledHeight, MIN_HEIGHT_PX);

				// Ensure height doesn't exceed max allowed
				const constrainedHeight = Math.min(
					finalHeight,
					constraint.maxAllowedHeight,
				);

				// Ensure height is valid
				if (!Number.isFinite(constrainedHeight) || constrainedHeight <= 0) {
					return; // Skip invalid positions
				}

				// Draw from bottom of chart area
				const topY = yAxisLeft.bottom - constrainedHeight;

				ctx.save();

				// Fill with semi-transparent orange
				ctx.fillStyle = 'rgba(255, 152, 0, 0.5)';
				ctx.fillRect(leftX, topY, width, finalHeight);

				// Stroke with solid orange border
				ctx.strokeStyle = 'rgba(255, 152, 0, 1)';
				ctx.lineWidth = 3;
				ctx.shadowColor = 'rgba(255, 152, 0, 0.6)';
				ctx.shadowBlur = 10;
				ctx.strokeRect(leftX, topY, width, finalHeight);

				ctx.restore();
			});

			// Draw Allowed Range Boundaries
			// 数据流：后端 ticks (vault.config.tickLower/tickUpper)
			//      → 在 liquidity-chart-utils.ts 中使用 tickToPrice 转换为价格 (allowedLowerPrice/allowedUpperPrice)
			//      → 在这里使用价格绘制粉红色虚线

			// 获取图表的价格范围（用于计算 X 坐标）
			const priceMin = Math.min(...chartData.rawLabels);
			const priceMax = Math.max(...chartData.rawLabels);
			const priceRange = priceMax - priceMin;

			// 获取 X 轴的像素范围
			const xAxisMin = xAxis.left;
			const xAxisMax = xAxis.right;
			const xAxisWidth = xAxisMax - xAxisMin;

			// 将价格转换为 X 坐标（线性插值）
			const priceToX = (price: number): number => {
				if (priceRange === 0) return xAxisMin;
				const ratio = (price - priceMin) / priceRange;
				return xAxisMin + ratio * xAxisWidth;
			};

			// 使用已转换的价格值计算 X 坐标
			// chartData.allowedLowerPrice 是较小的价格（左边界）
			// chartData.allowedUpperPrice 是较大的价格（右边界）
			const leftBoundaryPrice = chartData.allowedLowerPrice; // 较小的价格 = 左边界
			const rightBoundaryPrice = chartData.allowedUpperPrice; // 较大的价格 = 右边界

			const leftX = priceToX(leftBoundaryPrice);
			const rightX = priceToX(rightBoundaryPrice);

			// 确保 leftX < rightX（左边界在左边，右边界在右边）
			let finalLeftX = Math.min(leftX, rightX);
			let finalRightX = Math.max(leftX, rightX);

			// 边界检查：如果计算出的 X 坐标不在图表显示范围内，则绘制在边界
			// 如果左边界价格在图表范围外，调整到边界
			if (leftBoundaryPrice < priceMin) {
				finalLeftX = xAxisMin; // 画在最左边
			} else if (leftBoundaryPrice > priceMax) {
				finalLeftX = xAxisMax; // 画在最右边
			}

			// 如果右边界价格在图表范围外，调整到边界
			if (rightBoundaryPrice < priceMin) {
				finalRightX = xAxisMin; // 画在最左边
			} else if (rightBoundaryPrice > priceMax) {
				finalRightX = xAxisMax; // 画在最右边
			}

			// 确保 finalLeftX <= finalRightX（如果都在边界外，可能需要调整）
			if (finalLeftX > finalRightX) {
				// 如果两个价格都在同一侧边界外，至少保持最小宽度
				if (leftBoundaryPrice < priceMin && rightBoundaryPrice < priceMin) {
					// 都在左边，画在最左边
					finalLeftX = xAxisMin;
					finalRightX = xAxisMin + 10; // 最小宽度
				} else if (
					leftBoundaryPrice > priceMax &&
					rightBoundaryPrice > priceMax
				) {
					// 都在右边，画在最右边
					finalLeftX = xAxisMax - 10; // 最小宽度
					finalRightX = xAxisMax;
				} else {
					// 交换以确保 left < right
					[finalLeftX, finalRightX] = [finalRightX, finalLeftX];
				}
			}

			// Debug: 显示数据来源和计算结果
			console.log('🎯 Allowed Range Drawing:', {
				数据来源: 'vault.config.tickLower/tickUpper (从后端获取)',
				转换方法: 'BPS to Price: price = currentPrice * (1 + tick / 10000)',
				转换后的价格: {
					左边界价格_较小: leftBoundaryPrice,
					右边界价格_较大: rightBoundaryPrice,
				},
				图表价格范围: {
					min: priceMin,
					max: priceMax,
				},
				原始计算的X坐标: {
					leftX,
					rightX,
				},
				边界检查后的X坐标: {
					finalLeftX,
					finalRightX,
				},
				是否在范围内: {
					左边界在范围内:
						leftBoundaryPrice >= priceMin && leftBoundaryPrice <= priceMax,
					右边界在范围内:
						rightBoundaryPrice >= priceMin && rightBoundaryPrice <= priceMax,
				},
			});

			// 绘制粉红色虚线（如果价格有效）
			if (
				Number.isFinite(finalLeftX) &&
				Number.isFinite(finalRightX) &&
				finalLeftX < finalRightX
			) {
				ctx.save();

				// 半透明粉红色背景
				ctx.fillStyle = 'rgba(255, 51, 133, 0.05)';
				ctx.fillRect(
					finalLeftX,
					yAxisLeft.top,
					finalRightX - finalLeftX,
					yAxisLeft.bottom - yAxisLeft.top,
				);

				// 粉红色虚线边界
				ctx.strokeStyle = 'rgba(255, 51, 133, 0.6)';
				ctx.lineWidth = 2.5;
				ctx.setLineDash([8, 4]);
				ctx.shadowColor = 'rgba(255, 51, 133, 0.5)';
				ctx.shadowBlur = 8;

				// 左边界（较小的价格，在左边）
				ctx.beginPath();
				ctx.moveTo(finalLeftX, yAxisLeft.top);
				ctx.lineTo(finalLeftX, yAxisLeft.bottom);
				ctx.stroke();

				// 右边界（较大的价格，在右边）
				ctx.beginPath();
				ctx.moveTo(finalRightX, yAxisLeft.top);
				ctx.lineTo(finalRightX, yAxisLeft.bottom);
				ctx.stroke();

				ctx.setLineDash([]);
				ctx.shadowBlur = 0;

				// 格式化价格显示（人类可读的格式）
				const formatPrice = (price: number): string => {
					// 确保价格是正数
					if (price <= 0 || !Number.isFinite(price)) {
						return '$0.00';
					}
					// 如果价格很大，使用千位分隔符，保留 2 位小数
					if (price >= 1000) {
						return new Intl.NumberFormat('en-US', {
							style: 'currency',
							currency: 'USD',
							minimumFractionDigits: 0,
							maximumFractionDigits: 2,
						}).format(price);
					}
					// 如果价格较小，保留更多小数位
					return new Intl.NumberFormat('en-US', {
						style: 'currency',
						currency: 'USD',
						minimumFractionDigits: 2,
						maximumFractionDigits: 4,
					}).format(price);
				};

				// 价格标签（显示实际价格值：左边界显示较小价格，右边界显示较大价格）
				ctx.fillStyle = 'rgba(255, 51, 133, 0.8)';
				ctx.font = '600 10px JetBrains Mono';

				// 左边界标签：居中对齐
				ctx.textAlign = 'center';
				ctx.fillText(
					formatPrice(leftBoundaryPrice),
					finalLeftX,
					yAxisLeft.bottom + 9,
				);

				// 右边界标签：如果接近右边缘，使用右对齐避免被裁剪
				const chartWidth = chart.chartArea.right;
				if (finalRightX > chartWidth - 60) {
					ctx.textAlign = 'right';
					ctx.fillText(
						formatPrice(rightBoundaryPrice),
						Math.min(finalRightX, chartWidth - 5),
						yAxisLeft.bottom + 9,
					);
				} else {
					ctx.textAlign = 'center';
					ctx.fillText(
						formatPrice(rightBoundaryPrice),
						finalRightX,
						yAxisLeft.bottom + 9,
					);
				}

				ctx.restore();
			}

			// Draw Current Price Line
			const currentX = xAxis.getPixelForValue(chartData.currentPriceIndex);
			const currentPrice = chartData.currentPrice; // Use actual current price from data

			console.log('🔍 Drawing current price line:', {
				currentPrice,
				currentPriceIndex: chartData.currentPriceIndex,
				priceAtIndex: chartData.rawLabels[chartData.currentPriceIndex],
				currentX,
				fullChartData: {
					hasCurrentPrice: 'currentPrice' in chartData,
					currentPriceValue: chartData.currentPrice,
					allKeys: Object.keys(chartData),
				},
			});

			// Ensure currentPrice is valid
			if (!currentPrice || currentPrice === 0) {
				console.error('❌ currentPrice is 0 or invalid:', currentPrice);
				return; // Don't draw if price is invalid
			}

			const inRange = chartData.agentPositions.some(
				(pos) => currentPrice >= pos.tickLower && currentPrice <= pos.tickUpper,
			);

			ctx.save();
			ctx.strokeStyle = '#4ade80';
			ctx.lineWidth = 2.5;
			ctx.setLineDash([6, 6]);
			ctx.shadowColor = '#4ade80';
			ctx.shadowBlur = inRange ? 20 : 12;
			ctx.beginPath();
			ctx.moveTo(currentX, yAxisLeft.top);
			ctx.lineTo(currentX, yAxisLeft.bottom);
			ctx.stroke();
			ctx.setLineDash([]);
			ctx.restore();

			// Current Price Label
			ctx.save();
			ctx.fillStyle = '#4ade80';
			ctx.shadowColor = '#4ade80';
			ctx.shadowBlur = 10;
			ctx.font = '700 12px JetBrains Mono';

			// 如果当前价格线接近右边缘，使用右对齐避免被裁剪
			const chartWidth = chart.chartArea.right;
			if (currentX > chartWidth - 80) {
				ctx.textAlign = 'right';
				ctx.fillText(
					`$${currentPrice.toLocaleString()}`,
					Math.min(currentX, chartWidth - 5),
					yAxisLeft.top - 6,
				);
			} else {
				ctx.textAlign = 'center';
				ctx.fillText(
					`$${currentPrice.toLocaleString()}`,
					currentX,
					yAxisLeft.top - 6,
				);
			}
			ctx.restore();
		},
	};
}

export const LiquidityDistributionChart = ({
	vault,
	liquidityDistributionData,
	currentPrice,
}: LiquidityDistributionChartProps) => {
	const chartData = useMemo(() => {
		// 只使用从父层传过来的 currentPrice 和 API 数据
		console.log('🔄 Chart Data Calculation:', {
			hasLiquidityData: !!liquidityDistributionData,
			currentPrice,
			vaultPositionsCount: vault.positions.length,
			vaultId: vault.id,
		});

		if (
			!liquidityDistributionData ||
			currentPrice === undefined ||
			currentPrice === null ||
			typeof currentPrice !== 'number' ||
			Number.isNaN(currentPrice) ||
			currentPrice <= 0
		) {
			console.warn('⚠️ Chart data is null - missing required data');
			return null;
		}

		const result = generateLiquidityChartDataFromAPI(
			liquidityDistributionData,
			vault,
			currentPrice,
		);

		console.log('✅ Chart data generated:', {
			labelsCount: result.labels.length,
			marketLiquidityCount: result.marketLiquidity.length,
			agentPositionsCount: result.agentPositions.length,
			allowedLowerPrice: result.allowedLowerPrice,
			allowedUpperPrice: result.allowedUpperPrice,
			leftYMax: result.leftYMax,
		});

		return result;
	}, [
		vault,
		vault.positions.length,
		vault.agentStatus,
		vault.config.tickLower,
		vault.config.tickUpper,
		liquidityDistributionData,
		currentPrice,
	]);

	// Force chart re-render when vault positions or agent status changes
	const chartKey = useMemo(() => {
		const positionsHash =
			vault.positions.length > 0
				? vault.positions.map((p) => p.id).join('-')
				: 'empty';
		return `chart-${vault.id}-${vault.positions.length}-${vault.agentStatus}-${positionsHash}`;
	}, [vault.id, vault.positions.length, vault.agentStatus, vault.positions]);

	// Prepare Chart.js data
	const chartJsData: ChartData<'bar'> = useMemo(() => {
		const data = {
			labels: chartData?.labels ?? [],
			datasets: [
				{
					label: 'Active Liquidity',
					data: chartData?.marketLiquidity ?? [],
					backgroundColor: 'rgba(14, 165, 233, 0.6)',
					borderWidth: 0,
					barPercentage: 1.0,
					categoryPercentage: 1.0,
					yAxisID: 'yLeft',
				},
			],
		};

		console.log('📊 Chart.js Data Prepared:', {
			labelsCount: data.labels.length,
			dataPointsCount: data.datasets[0].data.length,
			firstFewDataPoints: data.datasets[0].data.slice(0, 5),
			hasChartData: !!chartData,
		});

		return data;
	}, [chartData]);

	const overlayPlugin = useMemo(
		() => (chartData ? createOverlayPlugin(chartData) : null),
		[chartData],
	);

	// Chart options
	const chartOptions: ChartOptions<'bar'> = useMemo(
		() => ({
			responsive: true,
			maintainAspectRatio: false,
			layout: {
				padding: {
					top: 40, // Add padding at top for current price label
					right: 20, // Add padding at right for price labels
					bottom: 30, // Add padding at bottom for price labels
					left: 10, // Add padding at left
				},
			},
			interaction: {
				mode: 'index',
				intersect: false,
			},
			plugins: {
				legend: { display: false },
				tooltip: {
					backgroundColor: 'hsl(0 0% 10%)',
					titleColor: 'hsl(0 0% 95%)',
					bodyColor: 'hsl(0 0% 70%)',
					borderColor: 'rgba(255, 152, 0, 0.4)',
					borderWidth: 1,
					padding: 12,
					callbacks: {
						title: (context) => {
							return `Price: ${context[0].label}`;
						},
						label: (context) => {
							const value = context.parsed.y;
							if (value == null) return 'Active Liquidity: 0';
							const formattedValue =
								value >= 1e18
									? `${(value / 1e18).toFixed(2)}e18`
									: value >= 1e15
										? `${(value / 1e15).toFixed(2)}e15`
										: value >= 1e12
											? `${(value / 1e12).toFixed(2)}e12`
											: value.toLocaleString();
							return `Active Liquidity: ${formattedValue}`;
						},
						afterBody: (context) => {
							if (!chartData) return [];
							const price = chartData.rawLabels[context[0].dataIndex];
							const position = chartData.agentPositions.find(
								(pos) => price >= pos.tickLower && price <= pos.tickUpper,
							);

							if (position) {
								const posIndex = chartData.agentPositions.indexOf(position) + 1;
								return [
									'',
									'━━━━━━━━━━━━━━━━━━━━',
									`Agent Position #${posIndex}`,
									`Liquidity: $${position.liquidity.toLocaleString()}`,
									`Price Range: $${position.tickLower.toFixed(0)} - $${position.tickUpper.toFixed(0)}`,
								];
							}
							return [];
						},
					},
				},
			},
			scales: {
				x: {
					grid: { display: false },
					ticks: {
						maxRotation: 45,
						color: 'hsl(0 0% 50%)',
						font: { size: 10, family: 'JetBrains Mono' },
						maxTicksLimit: 12,
					},
					title: {
						display: true,
						text: `Price Range (${vault.poolKey.token0.symbol}/${vault.poolKey.token1.symbol})`,
						color: 'hsl(0 0% 70%)',
						font: { size: 12, weight: 600 },
					},
				},
				yLeft: {
					type: 'linear',
					position: 'left',
					min: 0,
					max: chartData?.leftYMax ?? 1000,
					grid: { color: 'rgba(14, 165, 233, 0.1)' },
					ticks: {
						color: 'rgba(14, 165, 233, 1)',
						font: { size: 10, family: 'JetBrains Mono' },
						// TODO: check this callback looks good or not
						// callback: (v) => `$${(Number(v) / 1000).toFixed(0)}K`,
						callback: (v) => {
							const value = Number(v);
							if (value === 0) return '0';
							if (value >= 1e18) return `${(value / 1e18).toFixed(2)}e18`;
							if (value >= 1e15) return `${(value / 1e15).toFixed(2)}e15`;
							if (value >= 1e12) return `${(value / 1e12).toFixed(2)}e12`;
							if (value >= 1e9) return `${(value / 1e9).toFixed(2)}e9`;
							if (value >= 1e6) return `${(value / 1e6).toFixed(2)}e6`;
							return value.toLocaleString();
						},
						padding: 8,
					},
					title: {
						display: true,
						text: 'Active Liquidity',
						color: 'rgba(14, 165, 233, 1)',
						font: { size: 12, weight: 600 },
					},
				},
			},
			onHover: (event, activeElements) => {
				const canvas = event.native?.target as HTMLCanvasElement;
				if (canvas) {
					canvas.style.cursor =
						activeElements.length > 0 ? 'pointer' : 'default';
				}
			},
		}),
		[chartData, vault.poolKey],
	);

	// Chart ref to force update
	const chartRef = useRef<Chart<'bar'>>(null);

	// Force chart update when data changes
	useEffect(() => {
		if (chartRef.current && chartData) {
			console.log('🔄 Forcing chart update - data changed');
			// Use 'none' mode for instant update without animation
			chartRef.current.update('none');
		}
	}, [chartData, chartJsData]);

	return (
		<div className='space-y-4'>
			{/* Title Card */}
			<Card className='border-border-default/50 bg-surface-card p-4'>
				<div className='flex items-center gap-2 px-2'>
					<TrendingUp className='h-4 w-4 text-primary' />
					<h3 className='text-sm font-semibold text-text-primary'>
						Liquidity Distribution Chart
					</h3>
				</div>
			</Card>

			{/* Chart Container */}
			<Card className='border-border-default/50 bg-surface-card overflow-hidden'>
				<div className='p-4'>
					<div className='relative h-[500px]'>
						{chartData && overlayPlugin ? (
							<Bar
								ref={chartRef}
								data={chartJsData}
								options={chartOptions}
								plugins={[overlayPlugin]}
								key={chartKey}
								redraw={true}
							/>
						) : (
							<div className='flex items-center justify-center h-full text-text-secondary'>
								Loading chart data...
							</div>
						)}
					</div>

					{/* Legend */}
					<div className='space-y-3'>
						<div className='flex justify-center gap-6 flex-wrap text-xs'>
							<div className='flex items-center gap-2 text-text-secondary'>
								<div
									className='w-5 h-3 rounded'
									style={{ background: 'rgba(14, 165, 233, 0.6)' }}
								/>
								<span>Active Liquidity (Left Axis)</span>
							</div>
							<div className='flex items-center gap-2 text-text-secondary'>
								<div
									className='w-5 h-3 rounded border-2'
									style={{
										background: 'rgba(255, 152, 0, 0.5)',
										borderColor: 'rgba(255, 152, 0, 1)',
									}}
								/>
								<span>Agent Positions (USD Value)</span>
							</div>
							<div className='flex items-center gap-2 text-text-secondary'>
								<div
									className='w-5 h-[2px]'
									style={{ background: '#4ade80' }}
								/>
								<span>Current Price</span>
							</div>
							<div className='flex items-center gap-2 text-text-secondary'>
								<div
									className='w-5 h-3 rounded border-2 border-dashed'
									style={{
										borderColor: 'rgba(255, 51, 133, 0.6)',
										background: 'transparent',
									}}
								/>
								<span>Allowed Range</span>
							</div>
						</div>
					</div>
				</div>
			</Card>
		</div>
	);
};
