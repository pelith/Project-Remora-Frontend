import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { useCallback, useMemo, useState } from 'react';
import { useController, useForm } from 'react-hook-form';
import { formatEther, formatUnits, parseUnits } from 'viem';
import { useBalance, useReadContract, useWriteContract } from 'wagmi';
import ConnectWalletView from '../components/connect-wallet-view';
import { ERC20_ABI } from '../constants/erc20-abi';
import { USDC_TOKEN } from '../constants/token-metadata';
import type { ConnectWalletFormValues } from '../types/connect-wallet-form.types';

export default function ConnectWalletContainer() {
	const { open } = useAppKit();
	const { address, isConnected } = useAppKitAccount();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { writeContractAsync, isPending: isWritePending } = useWriteContract();

	const { control, handleSubmit, formState } = useForm<ConnectWalletFormValues>(
		{
			mode: 'onSubmit',
			reValidateMode: 'onBlur',
			defaultValues: {
				recipient: '',
				amount: '',
			},
		},
	);

	const { field: recipientField } = useController({
		control,
		name: 'recipient',
		rules: {
			required: 'Recipient is required.',
			pattern: {
				value: /^0x[a-fA-F0-9]{40}$/,
				message: 'Recipient must be a valid address.',
			},
		},
	});

	const { field: amountField } = useController({
		control,
		name: 'amount',
		rules: {
			required: 'Amount is required.',
			validate: (value) => {
				const parsed = Number(value);
				if (Number.isNaN(parsed)) {
					return 'Amount must be a number.';
				}
				if (parsed <= 0) {
					return 'Amount must be greater than 0.';
				}
				return true;
			},
		},
	});

	const handleConnectClick = useCallback(() => {
		open({ view: 'Connect', namespace: 'eip155' });
	}, [open]);

	const handleChangeNetworkClick = useCallback(() => {
		open({ view: 'Networks' });
	}, [open]);

	const { data: ethBalanceData } = useBalance({
		address: address as `0x${string}` | undefined,
		query: {
			enabled: isConnected && Boolean(address),
		},
	});

	const { data: usdcBalanceRaw } = useReadContract({
		address: USDC_TOKEN.address,
		abi: ERC20_ABI,
		functionName: 'balanceOf',
		args: address ? [address as `0x${string}`] : undefined,
		query: {
			enabled: isConnected && Boolean(address),
		},
	});

	const ethBalanceRaw = ethBalanceData?.value;

	const ethBalance = useMemo(() => {
		if (!ethBalanceRaw) {
			return undefined;
		}
		return formatEther(ethBalanceRaw);
	}, [ethBalanceRaw]);

	const usdcBalance = useMemo(() => {
		if (usdcBalanceRaw === undefined) {
			return undefined;
		}
		return formatUnits(usdcBalanceRaw, USDC_TOKEN.decimals);
	}, [usdcBalanceRaw]);

	const onSubmit = useMemo(() => {
		return handleSubmit(async ({ amount, recipient }) => {
			if (!isConnected) {
				return;
			}
			setIsSubmitting(true);
			try {
				const amountRaw = parseUnits(amount, USDC_TOKEN.decimals);
				await writeContractAsync({
					address: USDC_TOKEN.address,
					abi: ERC20_ABI,
					functionName: 'transfer',
					args: [recipient as `0x${string}`, amountRaw],
				});
			} finally {
				setIsSubmitting(false);
			}
		});
	}, [handleSubmit, isConnected, writeContractAsync]);

	return (
		<ConnectWalletView
			address={address}
			ethBalance={ethBalance}
			usdcBalance={usdcBalance}
			isConnected={isConnected}
			isSubmitting={isSubmitting || isWritePending}
			recipient={recipientField.value}
			amount={amountField.value}
			recipientError={formState.errors.recipient?.message}
			amountError={formState.errors.amount?.message}
			onConnectClick={handleConnectClick}
			onChangeNetworkClick={handleChangeNetworkClick}
			onRecipientChange={recipientField.onChange}
			onAmountChange={amountField.onChange}
			onSubmit={onSubmit}
		/>
	);
}
