import { TrendingUp } from 'lucide-react';
import { Card } from '@/modules/common/components/ui/card';
import type { Vault } from '../types/vault.types';
import { getMockPrice } from '../utils/vault-utils';

interface LiquidityChartProps {
	vault: Vault;
}

export const LiquidityChart = ({ vault }: LiquidityChartProps) => {
	const hasPositions = vault.positions && vault.positions.length > 0;
	const currentPrice = getMockPrice(vault.poolKey.token0.symbol);

	return (
		<div className='space-y-4'>
			{/* Title Card */}
			<Card className='border-border-default/50 bg-[#121212] p-4 text-white'>
				<div className='flex items-center gap-2 px-2'>
					<TrendingUp className='h-4 w-4 text-primary' />
					<h3 className='text-sm font-semibold text-zinc-100'>
						Liquidity Distribution
					</h3>
				</div>
			</Card>

			{/* Position Status Table */}
			{hasPositions && (
				<Card className='border-border-default/50 bg-[#1a1a1a] overflow-hidden'>
					<div className='overflow-x-auto'>
						<table className='w-full text-left text-xs'>
							<thead>
								<tr className='border-b border-white/5 bg-white/5 text-zinc-400'>
									<th className='py-3 px-4 font-medium w-12'>#</th>
									<th className='py-3 px-4 font-medium'>Type</th>
									<th className='py-3 px-4 font-medium'>
										Range (Lower - Upper)
									</th>
									<th className='py-3 px-4 font-medium text-right'>
										Liquidity
									</th>
									<th className='py-3 px-4 font-medium text-right'>Spread</th>
									<th className='py-3 px-4 font-medium text-center'>Status</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-white/5'>
								{vault.positions.map((pos, idx) => {
									const isCore = idx === 0;

									// Calculate absolute prices from BPS ticks
									const priceLower = currentPrice * (1 + pos.tickLower / 10000);
									const priceUpper = currentPrice * (1 + pos.tickUpper / 10000);

									const realLower = Math.min(priceLower, priceUpper);
									const realUpper = Math.max(priceLower, priceUpper);

									// Check if current price is within range
									const inRange =
										currentPrice >= realLower && currentPrice <= realUpper;

									// Spread percentage
									const spread = (
										(Math.abs(pos.tickUpper - pos.tickLower) / 10000) *
										100
									).toFixed(2);

									return (
										<tr
											key={pos.id}
											className='hover:bg-white/2 transition-colors'
										>
											<td className='py-3 px-4 text-zinc-500'>{idx + 1}</td>
											<td className='py-3 px-4'>
												<span
													className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${
														isCore
															? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
															: 'bg-zinc-800 text-zinc-400 border-zinc-700'
													}`}
												>
													{isCore ? 'CORE' : 'ORDER'}
												</span>
											</td>
											<td className='py-3 px-4 font-mono text-zinc-300'>
												$
												{realLower < 10
													? realLower.toFixed(4)
													: realLower.toFixed(0)}{' '}
												<span className='text-zinc-600 mx-2'>→</span>$
												{realUpper < 10
													? realUpper.toFixed(4)
													: realUpper.toFixed(0)}
											</td>
											<td className='py-3 px-4 text-right font-mono text-zinc-300'>
												${Math.round(pos.liquidityUSD).toLocaleString()}
											</td>
											<td className='py-3 px-4 text-right text-zinc-500'>
												{spread}%
											</td>
											<td className='py-3 px-4 text-center'>
												{inRange ? (
													<div className='flex items-center justify-center gap-1.5 text-green-400'>
														<div className='w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse' />
														<span>Active</span>
													</div>
												) : (
													<div className='flex items-center justify-center gap-1.5 text-zinc-500'>
														<div className='w-1.5 h-1.5 rounded-full border border-zinc-600' />
														<span>Standby</span>
													</div>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</Card>
			)}
		</div>
	);
};
