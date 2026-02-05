import { useSetAtom } from 'jotai';
import { AlertCircle, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/modules/common/components/ui/alert';
import { Button } from '@/modules/common/components/ui/button';
import { Input } from '@/modules/common/components/ui/input';
import { Label } from '@/modules/common/components/ui/label';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from '@/modules/common/components/ui/sheet';
import { withdrawAtom } from '../stores/vault.store';
import type { Vault } from '../types/vault.types';
import { FullExitDialog } from './full-exit-dialog';

interface WithdrawSheetProps {
	vault: Vault;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultAmounts?: { token0: string; token1: string };
}

export const WithdrawSheet = ({
	vault,
	open,
	onOpenChange,
	defaultAmounts,
}: WithdrawSheetProps) => {
	const withdraw = useSetAtom(withdrawAtom);

	const [amount0, setAmount0] = useState('');
	const [amount1, setAmount1] = useState('');
	const [errors, setErrors] = useState<{ token0?: string; token1?: string }>(
		{},
	);
	const [showFullExitSuggestion, setShowFullExitSuggestion] = useState(false);
	const [isFullExitOpen, setIsFullExitOpen] = useState(false);

	useEffect(() => {
		if (open && defaultAmounts) {
			setAmount0(defaultAmounts.token0);
			setAmount1(defaultAmounts.token1);
		} else if (open) {
			setAmount0('');
			setAmount1('');
			setErrors({});
			setShowFullExitSuggestion(false);
		}
	}, [open, defaultAmounts]);

	const validate = () => {
		const newErrors: { token0?: string; token1?: string } = {};
		const val0 = Number.parseFloat(amount0) || 0;
		const val1 = Number.parseFloat(amount1) || 0;

		// Check available balance
		if (val0 > vault.availableBalance.token0) {
			newErrors.token0 = 'Exceeds available balance';
		}
		if (val1 > vault.availableBalance.token1) {
			newErrors.token1 = 'Exceeds available balance';
		}

		if (val0 < 0) newErrors.token0 = 'Invalid amount';
		if (val1 < 0) newErrors.token1 = 'Invalid amount';

		setErrors(newErrors);

		// Check if user is trying to withdraw more than available but has funds in positions
		const hasMoreInPositions =
			(val0 > vault.availableBalance.token0 &&
				val0 <= vault.availableBalance.token0 + vault.inPositions.token0) ||
			(val1 > vault.availableBalance.token1 &&
				val1 <= vault.availableBalance.token1 + vault.inPositions.token1);

		setShowFullExitSuggestion(hasMoreInPositions);

		return Object.keys(newErrors).length === 0;
	};

	const handleWithdraw = async () => {
		if (!validate()) return;

		if ((Number.parseFloat(amount0) || 0) <= Number.parseFloat(amount1) || 0) {
			toast.error('Please enter an amount to withdraw');
			return;
		}

		try {
			await withdraw(vault.id, amount0, amount1);
			toast.success('Withdrawal successful', {
				description: `Withdrawn ${amount0 || '0'} ${vault.poolKey.token0.symbol} and ${amount1 || '0'} ${vault.poolKey.token1.symbol}`,
			});
			onOpenChange(false);
		} catch (_error) {
			toast.error('Withdrawal failed');
		}
	};

	return (
		<>
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent>
					<SheetHeader>
						<SheetTitle>Withdraw Assets</SheetTitle>
						<SheetDescription>
							Withdraw funds from your available balance to your wallet.
						</SheetDescription>
					</SheetHeader>

					<div className='py-6 space-y-6'>
						<Alert className='bg-surface-elevated border-primary/20'>
							<Info className='h-4 w-4 text-primary' />
							<AlertDescription className='text-xs text-text-secondary'>
								You can only withdraw <strong>idle funds</strong>. Funds
								actively deployed in positions must be recalled first via "Full
								Exit".
							</AlertDescription>
						</Alert>

						<div className='space-y-2'>
							<div className='flex justify-between text-xs'>
								<Label className={cn(errors.token0 && 'text-error')}>
									Amount {vault.poolKey.token0.symbol}
								</Label>
								<span className='text-text-muted'>
									Available: {vault.availableBalance.token0.toFixed(4)}
								</span>
							</div>
							<div className='flex gap-2'>
								<Input
									type='number'
									placeholder='0.00'
									value={amount0}
									onChange={(e) => {
										setAmount0(e.target.value);
										if (errors.token0)
											setErrors((prev) => ({ ...prev, token0: undefined }));
										setShowFullExitSuggestion(false);
									}}
									className={cn(errors.token0 && 'border-error ring-error/20')}
									min='0'
								/>
								<Button
									variant='outline'
									onClick={() => {
										setAmount0(vault.availableBalance.token0.toString());
										if (errors.token0)
											setErrors((prev) => ({ ...prev, token0: undefined }));
									}}
								>
									Max
								</Button>
							</div>
							{errors.token0 && (
								<p className='text-[10px] text-error flex items-center gap-1'>
									<AlertCircle className='w-3 h-3' /> {errors.token0}
								</p>
							)}
						</div>

						<div className='space-y-2'>
							<div className='flex justify-between text-xs'>
								<Label className={cn(errors.token1 && 'text-error')}>
									Amount {vault.poolKey.token1.symbol}
								</Label>
								<span className='text-text-muted'>
									Available: {vault.availableBalance.token1.toFixed(4)}
								</span>
							</div>
							<div className='flex gap-2'>
								<Input
									type='number'
									placeholder='0.00'
									value={amount1}
									onChange={(e) => {
										setAmount1(e.target.value);
										if (errors.token1)
											setErrors((prev) => ({ ...prev, token1: undefined }));
										setShowFullExitSuggestion(false);
									}}
									className={cn(errors.token1 && 'border-error ring-error/20')}
									min='0'
								/>
								<Button
									variant='outline'
									onClick={() => {
										setAmount1(vault.availableBalance.token1.toString());
										if (errors.token1)
											setErrors((prev) => ({ ...prev, token1: undefined }));
									}}
								>
									Max
								</Button>
							</div>
							{errors.token1 && (
								<p className='text-[10px] text-error flex items-center gap-1'>
									<AlertCircle className='w-3 h-3' /> {errors.token1}
								</p>
							)}
						</div>

						{showFullExitSuggestion && (
							<Alert className='bg-warning/10 border-warning/30'>
								<AlertCircle className='h-4 w-4 text-warning' />
								<AlertDescription className='text-xs text-text-secondary'>
									It looks like you're trying to withdraw more than is currently
									available, but you have funds in active positions.
									<Button
										variant='link'
										className='h-auto p-0 text-warning underline ml-1'
										onClick={() => {
											onOpenChange(false);
											setIsFullExitOpen(true);
										}}
									>
										Perform Full Exit instead?
									</Button>
								</AlertDescription>
							</Alert>
						)}
					</div>

					<SheetFooter>
						<Button className='w-full' onClick={handleWithdraw}>
							Confirm Withdraw
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>

			<FullExitDialog
				vault={vault}
				open={isFullExitOpen}
				onOpenChange={setIsFullExitOpen}
				onSuccess={() => {
					// This will be handled by the parent's onSuccess if needed
				}}
			/>
		</>
	);
};
