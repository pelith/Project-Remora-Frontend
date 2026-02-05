import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/modules/common/components/ui/card';
import { useCreateVaultContext } from '../../contexts/create-vault-context';

export function CreateVaultStep1Container() {
	const { availablePools, formData, updateData } = useCreateVaultContext();

	return (
		<div className='space-y-4 py-4'>
			{availablePools.map((pool) => (
				<Card
					key={pool.id}
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
									Fee: {(pool.fee / 10000).toFixed(2)}% • TVL: {pool.tvl}
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
			))}
		</div>
	);
}
