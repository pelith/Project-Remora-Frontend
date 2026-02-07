import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/modules/common/components/ui/card';
import formatValueToStandardDisplay from '@/modules/common/utils/formatValueToStandardDisplay';
import { useUniswapPoolTvl } from '@/modules/contracts';
import { useCreateVaultContext } from '../../contexts/create-vault-context';
import type { Pool } from '../../types/vault.types';

export function CreateVaultStep1Container() {
	const { availablePools } = useCreateVaultContext();

	return (
		<div className='space-y-4 py-4'>
			{availablePools.map((pool) => (
				<PoolCardContainer key={pool.id} pool={pool} />
			))}
		</div>
	);
}

function PoolCardContainer({ pool }: { pool: Pool }) {
	const { formData, updateData } = useCreateVaultContext();
	const { data: poolTvl } = useUniswapPoolTvl({
		poolKey: {
			currency0: pool.token0.address as `0x${string}`,
			currency1: pool.token1.address as `0x${string}`,
			fee: pool.fee,
			tickSpacing: 60,
			hooks: '0x0000000000000000000000000000000000000000',
		},
	});
	const tvl = poolTvl?.tvlUSD ?? 0;
	return (
		<Card
			className={cn(
				'cursor-pointer p-4 transition-all hover:border-primary/50',
				formData.selectedPool?.id === pool.id
					? 'border-primary shadow-[0_0_15px_rgba(255,51,133,0.15)] bg-primary/5'
					: '',
			)}
			onClick={() => updateData({ selectedPool: pool })}
		>
			<div className='flex justify-between items-center'>
				<div className='flex items-center gap-3'>
					<div className='flex -space-x-2'>
						<div className='w-8 h-8 rounded-full bg-surface-elevated border-2 border-surface flex items-center justify-center text-xs font-bold z-10'>
							{pool.token0.symbol[0]}
						</div>
						<div className='w-8 h-8 rounded-full bg-surface-elevated border-2 border-surface flex items-center justify-center text-xs font-bold'>
							{pool.token1.symbol[0]}
						</div>
					</div>
					<div>
						<div className='font-semibold text-text-primary'>
							{pool.token0.symbol}/{pool.token1.symbol}
						</div>
						<div className='text-xs text-text-muted'>
							Fee: {(pool.fee / 10000).toFixed(2)}% • TVL: $
							{formatValueToStandardDisplay(tvl)}
						</div>
					</div>
				</div>
				{formData.selectedPool?.id === pool.id && (
					<div className='h-6 w-6 rounded-full bg-primary flex items-center justify-center'>
						<Check className='h-4 w-4 text-white' />
					</div>
				)}
			</div>
		</Card>
	);
}
