import { Button } from '@/modules/common/components/ui/button';
import { Input } from '@/modules/common/components/ui/input';
import { Label } from '@/modules/common/components/ui/label';
import { useCreateVaultContext } from '../../contexts/create-vault-context';

export function CreateVaultStep3Container() {
	const { formData, token0, token1, token0Balance, token1Balance, updateData } =
		useCreateVaultContext();

	if (!token0 || !token1) return null;

	return (
		<div className='space-y-6 py-4'>
			<div className='space-y-4'>
				<div className='space-y-2'>
					<div className='flex justify-between text-xs'>
						<Label>Deposit {token0.symbol}</Label>
						<span className='text-text-muted'>
							Available: {token0Balance.display ?? '-'}
						</span>
					</div>
					<div className='flex gap-2'>
						<Input
							type='number'
							placeholder='0.00'
							value={formData.depositAmount.token0}
							onChange={(e) =>
								updateData({
									depositAmount: {
										...formData.depositAmount,
										token0: e.target.value,
									},
								})
							}
						/>
						<Button
							variant='outline'
							onClick={() =>
								updateData({
									depositAmount: {
										...formData.depositAmount,
										token0: token0Balance.max ?? '',
									},
								})
							}
							disabled={!token0Balance.max || token0Balance.isLoading}
						>
							Max
						</Button>
					</div>
				</div>

				<div className='space-y-2'>
					<div className='flex justify-between text-xs'>
						<Label>Deposit {token1.symbol}</Label>
						<span className='text-text-muted'>
							Available: {token1Balance.display ?? '-'}
						</span>
					</div>
					<div className='flex gap-2'>
						<Input
							type='number'
							placeholder='0.00'
							value={formData.depositAmount.token1}
							onChange={(e) =>
								updateData({
									depositAmount: {
										...formData.depositAmount,
										token1: e.target.value,
									},
								})
							}
						/>
						<Button
							variant='outline'
							onClick={() =>
								updateData({
									depositAmount: {
										...formData.depositAmount,
										token1: token1Balance.max ?? '',
									},
								})
							}
							disabled={!token1Balance.max || token1Balance.isLoading}
						>
							Max
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
