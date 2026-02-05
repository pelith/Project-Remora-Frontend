import { useState } from 'react';
import { useSetAtom } from 'jotai';
import type { Vault } from '../types/vault.types';
import { depositAtom } from '../stores/vault.store';
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
	SheetFooter,
} from '@/modules/common/components/ui/sheet';
import { Button } from '@/modules/common/components/ui/button';
import { Input } from '@/modules/common/components/ui/input';
import { Label } from '@/modules/common/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/modules/common/components/ui/alert';
import { useAppKitAccount } from '@reown/appkit/react';
import { useBalance } from 'wagmi';

interface DepositSheetProps {
	vault: Vault;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export const DepositSheet = ({
	vault,
	open,
	onOpenChange,
}: DepositSheetProps) => {
	const { address, isConnected } = useAppKitAccount();
	const deposit = useSetAtom(depositAtom);

	const [amount0, setAmount0] = useState('');
	const [amount1, setAmount1] = useState('');
	const [errors, setErrors] = useState<{ token0?: string; token1?: string }>(
		{},
	);

	// Get balances from wallet (simplified - in real app would use actual token balances)
	const { data: ethBalance } = useBalance({
		address: address as `0x${string}` | undefined,
		query: {
			enabled: isConnected && Boolean(address),
		},
	});

	// Helper to determine asset type
	const isToken0Eth = ['ETH', 'WBTC', 'UNI'].includes(
		vault.poolKey.token0.symbol,
	);

	// Mock balances for now - in real app would fetch actual token balances
	const avail0 = isToken0Eth
		? ethBalance?.formatted || '0'
		: '10000'; // Mock USDC balance
	const avail1 = isToken0Eth
		? '10000' // Mock USDC balance
		: ethBalance?.formatted || '0';

	const validate = () => {
		const newErrors: { token0?: string; token1?: string } = {};
		const val0 = parseFloat(amount0) || 0;
		const val1 = parseFloat(amount1) || 0;

		// Parse balances (remove commas)
		const max0 = parseFloat(avail0.replace(/,/g, ''));
		const max1 = parseFloat(avail1.replace(/,/g, ''));

		if (val0 > max0) {
			newErrors.token0 = 'Insufficient balance';
		}
		if (val1 > max1) {
			newErrors.token1 = 'Insufficient balance';
		}

		if (val0 < 0) newErrors.token0 = 'Invalid amount';
		if (val1 < 0) newErrors.token1 = 'Invalid amount';

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleDeposit = async () => {
		if (!validate()) return;

		// Ensure at least one amount is > 0
		if ((parseFloat(amount0) || 0) <= 0 && (parseFloat(amount1) || 0) <= 0) {
			toast.error('Please enter an amount to deposit');
			return;
		}

		try {
			await deposit(vault.id, amount0, amount1);
			toast.success('Assets deposited successfully', {
				description: `Deposited ${amount0 || '0'} ${vault.poolKey.token0.symbol} and ${amount1 || '0'} ${vault.poolKey.token1.symbol}`,
			});
			onOpenChange(false);
			setAmount0('');
			setAmount1('');
			setErrors({});
		} catch (error) {
			toast.error('Deposit failed', {
				description: 'Please try again later.',
			});
		}
	};

	// Helper to format display balance
	const formatBalance = (bal: string) => {
		return bal; // Already formatted
	};

	return (
		<Sheet
			open={open}
			onOpenChange={(val) => {
				if (!val) {
					setAmount0('');
					setAmount1('');
					setErrors({});
				}
				onOpenChange(val);
			}}
		>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Deposit Assets</SheetTitle>
					<SheetDescription>
						Add liquidity to your vault. Funds will be available for the Agent
						to deploy.
					</SheetDescription>
				</SheetHeader>

				<div className='py-6 space-y-6'>
					<div className='space-y-2'>
						<div className='flex justify-between text-xs'>
							<Label className={cn(errors.token0 && 'text-error')}>
								Amount {vault.poolKey.token0.symbol}
							</Label>
							<span className='text-text-muted'>
								Wallet: {formatBalance(avail0)}
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
								}}
								className={cn(errors.token0 && 'border-error ring-error/20')}
								min='0'
							/>
							<Button
								variant='outline'
								onClick={() => {
									setAmount0(avail0.replace(/,/g, ''));
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
								Wallet: {formatBalance(avail1)}
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
								}}
								className={cn(errors.token1 && 'border-error ring-error/20')}
								min='0'
							/>
							<Button
								variant='outline'
								onClick={() => {
									setAmount1(avail1.replace(/,/g, ''));
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

					{(errors.token0 || errors.token1) && (
						<Alert variant='destructive' className='py-2'>
							<AlertCircle className='h-4 w-4' />
							<AlertDescription className='text-xs'>
								You cannot deposit more than your wallet balance.
							</AlertDescription>
						</Alert>
					)}
				</div>

				<SheetFooter>
					<Button
						className='w-full'
						onClick={handleDeposit}
						disabled={!isConnected}
					>
						Confirm Deposit
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
};

