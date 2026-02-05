import type { Vault } from '../types/vault.types';
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from '@/modules/common/components/ui/card';
import { Badge } from '@/modules/common/components/ui/badge';
import { Layers } from 'lucide-react';
import { getMockPrice } from '../utils/vault-utils';

interface PositionsTableProps {
	vault: Vault;
}

export const PositionsTable = ({ vault }: PositionsTableProps) => {
	const currentPrice = getMockPrice(vault.poolKey.token0.symbol);

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 2,
		}).format(price);
	};

	// Convert relative BPS tick (mock data) to price
	const getPriceFromRelativeTick = (relativeTickBps: number) => {
		// Formula: Price = CurrentPrice * (1 + tickBps/10000)
		return currentPrice * (1 + relativeTickBps / 10000);
	};

	// Sort positions by price (tick) ascending: Lowest Price -> Highest Price
	const sortedPositions = [...vault.positions].sort(
		(a, b) => a.tickLower - b.tickLower,
	);

	if (vault.positions.length === 0) {
		return (
			<Card className='h-full flex flex-col border-border-default/50 bg-surface-card/50'>
				<CardHeader className='py-3 px-4 border-b border-border-default/40'>
					<CardTitle className='text-sm font-medium'>Active Positions</CardTitle>
				</CardHeader>
				<CardContent className='flex-1 flex flex-col items-center justify-center text-center text-text-muted p-4'>
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
		<Card className='h-full border-border-default/50 bg-surface-card/50 backdrop-blur-sm'>
			<CardHeader className='px-4 py-3 border-b border-border-default/40'>
				<div className='flex items-center justify-between'>
					<CardTitle className='text-sm font-medium'>Active Positions</CardTitle>
					<Badge
						variant='secondary'
						className='font-mono text-[10px] h-5 px-2 bg-surface-elevated border-border-default/50'
					>
						{vault.positions.length} ACTIVE
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
								const priceLower = getPriceFromRelativeTick(pos.tickLower);
								const priceUpper = getPriceFromRelativeTick(pos.tickUpper);

								return (
									<tr
										key={pos.id}
										className='group hover:bg-surface-elevated/30 transition-all duration-200'
									>
										<td className='px-4 py-2 font-mono text-xs text-text-secondary group-hover:text-text-primary transition-colors'>
											<div className='flex flex-col gap-0.5'>
												<span className='font-medium text-text-primary'>
													{formatPrice(priceLower)} -{' '}
													{formatPrice(priceUpper)}
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

