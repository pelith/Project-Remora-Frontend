import { useAppKitAccount } from '@reown/appkit/react';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { parseUnits } from 'viem';
import { cn } from '@/lib/utils';
import { Button } from '@/modules/common/components/ui/button';
import { Input } from '@/modules/common/components/ui/input';
import { Label } from '@/modules/common/components/ui/label';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/modules/common/components/ui/sheet';
import { parseToBigNumber } from '@/modules/common/utils/bignumber';
import formatValueToStandardDisplay from '@/modules/common/utils/formatValueToStandardDisplay';
import { useSendTokenToVault } from '@/modules/contracts/hooks/use-send-token-to-vault';
import { useTokenInfoAndBalance } from '@/modules/contracts/hooks/use-token-info-and-balance';

interface DepositSheetProps {
	vaultAddress: string;
	token0Address: string;
	token1Address: string;
	trigger: React.ReactNode;
}

export const DepositSheet = ({
	vaultAddress,
	token0Address,
	token1Address,
	trigger,
}: DepositSheetProps) => {
	// Mock wallet connection for demo
	const { isConnected, address } = useAppKitAccount();

	const [amount0, setAmount0] = useState('');
	const [amount1, setAmount1] = useState('');
	const { send: sendToken0, isLoading: isSendingToken0 } = useSendTokenToVault(
		vaultAddress,
		token0Address,
	);
	const { send: sendToken1, isLoading: isSendingToken1 } = useSendTokenToVault(
		vaultAddress,
		token1Address,
	);
	const token0Info = useTokenInfoAndBalance(address ?? '', token0Address);
	const token1Info = useTokenInfoAndBalance(address ?? '', token1Address);
	const [errors, setErrors] = useState<{ token0?: string; token1?: string }>(
		{},
	);

	const handleDepositToken0 = () => {
		// validate isNaN
		const amountBign = parseToBigNumber(amount0);
		if (amountBign.isNaN()) {
			setErrors((prev) => ({ ...prev, token0: 'Invalid amount' }));
			return;
		}
		if (amountBign.lte(0)) {
			setErrors((prev) => ({
				...prev,
				token0: 'Amount must be greater than 0',
			}));
			return;
		}
		if (amountBign.gt(token0Info?.balance ?? 0)) {
			setErrors((prev) => ({ ...prev, token0: 'Insufficient balance' }));
			return;
		}
		setErrors((prev) => ({ ...prev, token0: undefined }));
		sendToken0(parseUnits(amountBign.toString(), token0Info?.decimals ?? 18));
	};
	const handleDepositToken1 = () => {
		// validate isNaN
		const amountBign = parseToBigNumber(amount1);
		if (amountBign.isNaN()) {
			setErrors((prev) => ({ ...prev, token1: 'Invalid amount' }));
			return;
		}
		if (amountBign.lte(0)) {
			setErrors((prev) => ({
				...prev,
				token1: 'Amount must be greater than 0',
			}));
			return;
		}
		if (amountBign.gt(token1Info?.balance ?? 0)) {
			setErrors((prev) => ({ ...prev, token1: 'Insufficient balance' }));
			return;
		}
		setErrors((prev) => ({ ...prev, token1: undefined }));
		sendToken1(parseUnits(amountBign.toString(), token1Info?.decimals ?? 18));
	};

	return (
		<Sheet
			onOpenChange={(val) => {
				if (!val) {
					setAmount0('');
					setAmount1('');
					setErrors({});
				}
			}}
		>
			<SheetTrigger asChild>{trigger}</SheetTrigger>
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
								Amount {token0Info?.symbol}
							</Label>
							<span className='text-text-muted'>
								Wallet:{' '}
								{formatValueToStandardDisplay(token0Info?.balance ?? '0')}
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
									setAmount0(token0Info?.balance ?? '');
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

						<Button
							className='w-full'
							onClick={handleDepositToken0}
							disabled={!isConnected || isSendingToken0}
						>
							Confirm Deposit {token0Info?.symbol}
						</Button>
					</div>

					<div className='space-y-2'>
						<div className='flex justify-between text-xs'>
							<Label className={cn(errors.token1 && 'text-error')}>
								Amount {token1Info?.symbol}
							</Label>
							<span className='text-text-muted'>
								Wallet:{' '}
								{formatValueToStandardDisplay(token1Info?.balance ?? '0')}
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
									setAmount1(token1Info?.balance ?? '');
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

						<Button
							className='w-full'
							onClick={handleDepositToken1}
							disabled={!isConnected || isSendingToken1}
						>
							Confirm Deposit {token1Info?.symbol}
						</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
};
