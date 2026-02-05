import { useMemo } from 'react';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Tooltip,
	Legend,
	type ChartOptions,
	type ChartData,
	type Plugin,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { Vault } from '../types/vault.types';
import { generateLiquidityChartData } from '../utils/liquidity-chart-utils';
import { Card } from '@/modules/common/components/ui/card';
import { TrendingUp } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface LiquidityDistributionChartProps {
	vault: Vault;
}

// Custom plugin to draw agent positions and overlays
function createOverlayPlugin(
	chartData: ReturnType<typeof generateLiquidityChartData>,
): Plugin<'bar'> {
	return {
		id: 'agentPositionsAndOverlays',
		afterDatasetsDraw: (chart) => {
			const ctx = chart.ctx;
			const xAxis = chart.scales.x;
			const yAxisRight = chart.scales.yRight;
			const yAxisLeft = chart.scales.yLeft;

			const MIN_HEIGHT_PX = 20;

			// Draw Agent Position Boxes
			chartData.agentPositions.forEach((position, idx) => {
				const lowerIndex = chartData.rawLabels.findIndex(
					(p) => p >= position.tickLower,
				);
				const upperIndex = chartData.rawLabels.findIndex(
					(p) => p >= position.tickUpper,
				);

				if (lowerIndex === -1 || upperIndex === -1) {
					console.warn(`Position ${idx}: Could not find indices`, {
						tickLower: position.tickLower,
						tickUpper: position.tickUpper,
						priceRange: [
							chartData.rawLabels[0],
							chartData.rawLabels[chartData.rawLabels.length - 1],
						],
					});
					return;
				}

				// Use index for getPixelForValue (Chart.js category scale accepts index)
				const leftX = xAxis.getPixelForValue(lowerIndex);
				const rightX = xAxis.getPixelForValue(upperIndex);
				const width = rightX - leftX;

				if (width <= 0) {
					console.warn(`Position ${idx}: Invalid width`, {
						leftX,
						rightX,
						width,
					});
					return;
				}

				const chartHeight = yAxisRight.bottom - yAxisRight.top;

				// Calculate height based on right axis
				// Use a more reasonable scaling: ensure positions are visible
				const maxPositionLiquidity = Math.max(
					...chartData.agentPositions.map((p) => p.liquidity),
					position.liquidity,
				);
				// Scale based on max position, not rightYMax (which might be too large)
				const effectiveMax = Math.max(
					chartData.rightYMax,
					maxPositionLiquidity * 1.2,
				);
				const heightRatio =
					effectiveMax > 0 ? position.liquidity / effectiveMax : 0;
				const calculatedHeight = chartHeight * heightRatio;

				// Find minimum market liquidity height in range (for constraint)
				let minMarketHeightInRange = Infinity;
				for (
					let i = lowerIndex;
					i <= upperIndex && i < chartData.marketLiquidity.length;
					i++
				) {
					const marketHeightRatio =
						chartData.marketLiquidity[i] / chartData.leftYMax;
					const marketHeight = chartHeight * marketHeightRatio;
					if (marketHeight < minMarketHeightInRange && marketHeight > 0) {
						minMarketHeightInRange = marketHeight;
					}
				}

				// Apply constraints: calculated height, min height, max market height
				// But prioritize visibility - ensure at least MIN_HEIGHT_PX
				let finalHeight = Math.max(calculatedHeight, MIN_HEIGHT_PX);

				// Only constrain by market height if it's reasonable (not too restrictive)
				if (
					minMarketHeightInRange !== Infinity &&
					minMarketHeightInRange > MIN_HEIGHT_PX
				) {
					finalHeight = Math.min(finalHeight, minMarketHeightInRange);
				}

				// Ensure height is valid and visible
				if (finalHeight <= 0 || !Number.isFinite(finalHeight)) {
					console.warn(`Position ${idx}: Invalid height, using minimum`, {
						calculatedHeight,
						minMarketHeightInRange,
						liquidity: position.liquidity,
						rightYMax: chartData.rightYMax,
						effectiveMax,
						heightRatio,
					});
					finalHeight = MIN_HEIGHT_PX; // Fallback to minimum
				}

				// Debug log for first position
				if (idx === 0) {
					console.log('Position rendering debug:', {
						position: position,
						lowerIndex,
						upperIndex,
						leftX,
						rightX,
						width,
						chartHeight,
						calculatedHeight,
						finalHeight,
						heightRatio,
						rightYMax: chartData.rightYMax,
						effectiveMax,
					});
				}

				const topY = yAxisRight.bottom - finalHeight;

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
			const allowedLowerIndex = chartData.rawLabels.findIndex(
				(p) => p >= chartData.allowedLowerPrice,
			);
			const allowedUpperIndex = chartData.rawLabels.findIndex(
				(p) => p >= chartData.allowedUpperPrice,
			);

			if (allowedLowerIndex !== -1 && allowedUpperIndex !== -1) {
				const leftX = xAxis.getPixelForValue(allowedLowerIndex);
				const rightX = xAxis.getPixelForValue(allowedUpperIndex);

				ctx.save();

				// Semi-transparent pink background
				ctx.fillStyle = 'rgba(255, 51, 133, 0.05)';
				ctx.fillRect(
					leftX,
					yAxisLeft.top,
					rightX - leftX,
					yAxisLeft.bottom - yAxisLeft.top,
				);

				// Pink dashed boundary lines
				ctx.strokeStyle = 'rgba(255, 51, 133, 0.6)';
				ctx.lineWidth = 2.5;
				ctx.setLineDash([8, 4]);
				ctx.shadowColor = 'rgba(255, 51, 133, 0.5)';
				ctx.shadowBlur = 8;

				// Left boundary
				ctx.beginPath();
				ctx.moveTo(leftX, yAxisLeft.top);
				ctx.lineTo(leftX, yAxisLeft.bottom);
				ctx.stroke();

				// Right boundary
				ctx.beginPath();
				ctx.moveTo(rightX, yAxisLeft.top);
				ctx.lineTo(rightX, yAxisLeft.bottom);
				ctx.stroke();

				ctx.setLineDash([]);
				ctx.shadowBlur = 0;

				// Price labels
				ctx.fillStyle = 'rgba(255, 51, 133, 0.8)';
				ctx.font = '600 10px JetBrains Mono';
				ctx.textAlign = 'center';
				ctx.fillText(
					`$${chartData.allowedLowerPrice.toLocaleString()}`,
					leftX,
					yAxisLeft.bottom + 9,
				);
				ctx.fillText(
					`$${chartData.allowedUpperPrice.toLocaleString()}`,
					rightX,
					yAxisLeft.bottom + 9,
				);

				ctx.restore();
			}

			// Draw Current Price Line
			const currentX = xAxis.getPixelForValue(chartData.currentPriceIndex);
			const currentPrice = chartData.rawLabels[chartData.currentPriceIndex];
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
			ctx.textAlign = 'center';
			ctx.fillText(
				`$${currentPrice.toLocaleString()}`,
				currentX,
				yAxisLeft.top - 6,
			);
			ctx.restore();
		},
	};
}

export const LiquidityDistributionChart = ({
	vault,
}: LiquidityDistributionChartProps) => {
	const chartData = useMemo(() => {
		const data = generateLiquidityChartData(vault);
		// Debug: Log positions data
		if (data.agentPositions.length === 0) {
			console.log('No agent positions - chart will show empty state');
		} else {
			console.log('Agent positions for chart:', data.agentPositions);
		}
		return data;
	}, [vault, vault.positions.length, vault.agentStatus]);

	const overlayPlugin = useMemo(
		() => createOverlayPlugin(chartData),
		[chartData],
	);

	// Force chart re-render when vault positions or agent status changes
	// Using key prop to ensure chart updates when data changes
	// Include positions count, agent status, and a hash of position IDs
	const chartKey = useMemo(() => {
		const positionsHash =
			vault.positions.length > 0
				? vault.positions.map((p) => p.id).join('-')
				: 'empty';
		return `chart-${vault.id}-${vault.positions.length}-${vault.agentStatus}-${positionsHash}`;
	}, [vault.id, vault.positions.length, vault.agentStatus, vault.positions]);

	// Prepare Chart.js data
	const chartJsData: ChartData<'bar'> = useMemo(
		() => ({
			labels: chartData.labels,
			datasets: [
				{
					label: 'Market Liquidity',
					data: chartData.marketLiquidity,
					backgroundColor: 'rgba(14, 165, 233, 0.6)',
					borderWidth: 0,
					barPercentage: 1.0,
					categoryPercentage: 1.0,
					yAxisID: 'yLeft',
				},
			],
		}),
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
							return 'Price: ' + context[0].label;
						},
						label: (context) => {
							const value = context.parsed.y;
							if (value == null) return 'Market Liquidity: $0';
							return 'Market Liquidity: $' + value.toLocaleString();
						},
						afterBody: (context) => {
							const price = chartData.rawLabels[context[0].dataIndex];
							const position = chartData.agentPositions.find(
								(pos) => price >= pos.tickLower && price <= pos.tickUpper,
							);

							if (position) {
								const posIndex = chartData.agentPositions.indexOf(position) + 1;
								const maxAgentLiquidity = Math.max(
									...chartData.agentPositions.map((p) => p.liquidity),
								);
								const pctOfMax = (
									(position.liquidity / maxAgentLiquidity) *
									100
								).toFixed(0);
								const marketAtPoint =
									chartData.marketLiquidity[context[0].dataIndex];
								const marketShare = (
									(position.liquidity / marketAtPoint) *
									100
								).toFixed(1);

								return [
									'',
									'━━━━━━━━━━━━━━━━━━━━',
									`Agent Position #${posIndex}`,
									`Liquidity: $${position.liquidity.toLocaleString()}`,
									`Price Range: $${position.tickLower.toFixed(0)} - $${position.tickUpper.toFixed(0)}`,
									`% of Max Position: ${pctOfMax}%`,
									`% of Market: ${marketShare}%`,
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
					grid: { color: 'rgba(14, 165, 233, 0.1)' },
					ticks: {
						color: 'rgba(14, 165, 233, 1)',
						font: { size: 10, family: 'JetBrains Mono' },
						callback: (v) => '$' + (Number(v) / 1000).toFixed(0) + 'K',
						padding: 8,
					},
					title: {
						display: true,
						text: 'Market Liquidity',
						color: 'rgba(14, 165, 233, 1)',
						font: { size: 12, weight: 600 },
					},
				},
				yRight: {
					type: 'linear',
					position: 'right',
					min: 0,
					// Use max position liquidity * 1.2 for better visibility
					max:
						chartData.agentPositions.length > 0
							? Math.max(...chartData.agentPositions.map((p) => p.liquidity)) *
								1.2
							: chartData.rightYMax,
					grid: { drawOnChartArea: false },
					ticks: {
						color: 'rgba(255, 152, 0, 1)',
						font: { size: 10, family: 'JetBrains Mono' },
						callback: (v) => '$' + (Number(v) / 1000).toFixed(1) + 'K',
						padding: 8,
					},
					title: {
						display: true,
						text: 'Agent Positions',
						color: 'rgba(255, 152, 0, 1)',
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
						<Bar
							data={chartJsData}
							options={chartOptions}
							plugins={[overlayPlugin]}
							key={chartKey}
						/>
					</div>

					{/* Legend */}
					<div className='flex justify-center gap-6 flex-wrap mt-4 text-xs'>
						<div className='flex items-center gap-2 text-text-secondary'>
							<div
								className='w-5 h-3 rounded'
								style={{ background: 'rgba(14, 165, 233, 0.6)' }}
							/>
							<span>Market Liquidity (Left Axis)</span>
						</div>
						<div className='flex items-center gap-2 text-text-secondary'>
							<div
								className='w-5 h-3 rounded border-2'
								style={{
									background: 'rgba(255, 152, 0, 0.5)',
									borderColor: 'rgba(255, 152, 0, 1)',
								}}
							/>
							<span>Agent Positions (Right Axis)</span>
						</div>
						<div className='flex items-center gap-2 text-text-secondary'>
							<div className='w-5 h-[2px]' style={{ background: '#4ade80' }} />
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
			</Card>
		</div>
	);
};
