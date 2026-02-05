import { Badge } from '@/modules/common/components/ui/badge';
import { useCreateVaultContext } from '../../contexts/create-vault-context';

export function CreateVaultStep4Container() {
	const { formData } = useCreateVaultContext();

	return (
		<div className='space-y-6 py-4'>
			<div className='space-y-4'>
				<h4 className='text-sm font-medium text-text-muted uppercase tracking-wider'>
					Pool
				</h4>
				<div className='flex items-center gap-2'>
					<span className='text-lg font-bold text-white'>
						{formData.selectedPool?.token0.symbol} /{' '}
						{formData.selectedPool?.token1.symbol}
					</span>
					<Badge variant='outline'>
						{(formData.selectedPool!.fee / 10000).toFixed(2)}%
					</Badge>
				</div>

				<h4 className='text-sm font-medium text-text-muted uppercase tracking-wider mt-4'>
					Configuration
				</h4>
				<div className='grid grid-cols-2 gap-4 text-sm'>
					<div>
						<span className='text-text-muted'>Risk Profile:</span>
						<div className='font-medium capitalize'>{formData.riskProfile}</div>
					</div>
					<div>
						<span className='text-text-muted'>Max Positions:</span>
						<div className='font-medium'>
							{formData.maxPositions === '0'
								? 'Unlimited'
								: formData.maxPositions}
						</div>
					</div>
					<div>
						<span className='text-text-muted'>Swap Allowed:</span>
						<div className='font-medium'>
							{formData.swapAllowed ? 'Yes' : 'No'}
						</div>
					</div>
				</div>

				<h4 className='text-sm font-medium text-text-muted uppercase tracking-wider mt-4'>
					Initial Deposit
				</h4>
				<div className='space-y-1 text-sm'>
					<div className='flex justify-between'>
						<span>{formData.selectedPool?.token0.symbol}</span>
						<span className='font-mono'>{formData.depositAmount.token0}</span>
					</div>
					<div className='flex justify-between'>
						<span>{formData.selectedPool?.token1.symbol}</span>
						<span className='font-mono'>{formData.depositAmount.token1}</span>
					</div>
				</div>
			</div>
		</div>
	);
}
