import { Layers } from 'lucide-react';
import { useMemo } from 'react';
import { formatUnits } from 'viem';
import { Badge } from '@/modules/common/components/ui/badge';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/modules/common/components/ui/card';
import { parseToBigNumber } from '@/modules/common/utils/bignumber';
import type { VaultAssetsData } from '@/modules/contracts/hooks/use-vault-assets';
import type { Position } from '@/modules/contracts/services/position-token-amount-api';
import { tickToPrice } from '../utils/vault-utils';

interface PositionsTableProps {
	positions: Position[];
	vaultAssets?: VaultAssetsData;
}

export const PositionsTable = ({
	positions,
	vaultAssets,
}: PositionsTableProps) => {
	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 2,
		}).format(price);
	};

	const token0Decimals = vaultAssets?.token0?.decimals ?? 18;
	const token1Decimals = vaultAssets?.token1?.decimals ?? 6;

	// Convert ticks to prices using tickToPrice formula
	const getPriceFromTick = (tick: number) => {
		return tickToPrice(tick, token0Decimals, token1Decimals);
	};

	// Convert API positions to display format with liquidity USD calculation
	const displayPositions = useMemo(() => {
		return positions.map((pos) => {
			// Calculate liquidity USD using token amounts and prices
			const token0Price = vaultAssets?.token0?.price ?? 0;
			const token1Price = vaultAssets?.token1?.price ?? 0;

			// Convert raw amounts to formatted numbers
			const amount0 = parseToBigNumber(
				pos.amount0 ? formatUnits(BigInt(pos.amount0), token0Decimals) : '0',
			);
			const amount1 = parseToBigNumber(
				pos.amount1 ? formatUnits(BigInt(pos.amount1), token1Decimals) : '0',
			);

			// Calculate liquidity USD
			const liquidityUSD = amount0
				.multipliedBy(token0Price)
				.plus(amount1.multipliedBy(token1Price))
				.toNumber();

			// For now, inRange is set to false (will be calculated when price data is available)
			const inRange = false;

			return {
				id: pos.tokenId,
				priceLower: getPriceFromTick(pos.tickLower),
				priceUpper: getPriceFromTick(pos.tickUpper),
				liquidityUSD,
				inRange,
			};
		});
	}, [positions, vaultAssets]);

	// Sort positions by tick ascending: Lowest Price -> Highest Price
	const sortedPositions = [...displayPositions].sort(
		(a, b) => a.priceLower - b.priceLower,
	);

	if (positions.length === 0) {
		return (
			<Card className='min-h-[200px] border-border-default/50 bg-surface-card/50'>
				<CardHeader className='py-3 px-4 border-b border-border-default/40'>
					<CardTitle className='text-sm font-medium'>
						Active Positions
					</CardTitle>
				</CardHeader>
				<CardContent className='flex flex-col items-center justify-center text-center text-text-muted p-4 min-h-[120px]'>
					<div className='h-10 w-10 rounded-full bg-surface-elevated flex items-center justify-center mb-2 border border-border-default/30'>
						<Layers className='h-5 w-5 opacity-50' />
					</div>
					<p className='text-sm font-medium text-text-secondary'>
						No active positions
					</p>
					<p className='text-[10px] mt-1 opacity-70'>
						Start the agent to automatically deploy liquidity.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className='min-h-[200px] border-border-default/50 bg-surface-card/50 backdrop-blur-sm'>
			<CardHeader className='px-4 py-3 border-b border-border-default/40'>
				<div className='flex items-center justify-between'>
					<CardTitle className='text-sm font-medium'>
						Active Positions
					</CardTitle>
					<Badge
						variant='secondary'
						className='font-mono text-[10px] h-5 px-2 bg-surface-elevated border-border-default/50'
					>
						{positions.length} ACTIVE
					</Badge>
				</div>
			</CardHeader>
			<CardContent className='p-0'>
				<div className='overflow-x-auto'>
					<table className='w-full text-sm text-left'>
						<thead className='bg-surface-elevated/40 text-text-muted text-[10px] uppercase tracking-wider font-medium'>
							<tr>
								<th className='px-4 py-2 font-medium'>Price Range</th>
								<th className='px-4 py-2 font-medium text-right'>Liquidity</th>
								<th className='px-4 py-2 font-medium text-center'>Status</th>
							</tr>
						</thead>
						<tbody className='divide-y divide-border-default/30'>
							{sortedPositions.map((pos) => {
								return (
									<tr
										key={pos.id}
										className='group hover:bg-surface-elevated/30 transition-all duration-200'
									>
										<td className='px-4 py-2 font-mono text-xs text-text-secondary group-hover:text-text-primary transition-colors'>
											<div className='flex flex-col gap-0.5'>
												<span className='font-medium text-text-primary'>
													{formatPrice(pos.priceLower)} -{' '}
													{formatPrice(pos.priceUpper)}
												</span>
											</div>
										</td>
										<td className='px-4 py-2 text-right font-mono text-xs font-medium text-text-primary'>
											$
											{pos.liquidityUSD.toLocaleString(undefined, {
												maximumFractionDigits: 0,
											})}
										</td>
										<td className='px-4 py-2 text-center'>
											{pos.inRange ? (
												<div className='inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold tracking-wide bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_10px_-4px_rgba(16,185,129,0.3)]'>
													ACTIVE
												</div>
											) : (
												<div className='inline-flex items-center px-2 py-0.5 rounded text-[9px] font-medium tracking-wide bg-slate-500/10 text-slate-400 border border-slate-500/20'>
													STANDBY
												</div>
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
};
