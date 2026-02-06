import { useAppKitAccount } from '@reown/appkit/react';
import { useAtom } from 'jotai';
import { atomWithReset, useResetAtom } from 'jotai/utils';
import {
	createContext,
	type ReactNode,
	useContext,
	useMemo,
	useState,
} from 'react';
import { toast } from 'sonner';
import { zeroAddress } from 'viem';
import formatValueToStandardDisplay from '@/modules/common/utils/formatValueToStandardDisplay';
import {
	EXAMPLE_POOL_KEYS,
	TOKEN_ADDRESSES,
} from '@/modules/contracts/constants/pool-examples';
import { useTokenInfoAndBalance } from '@/modules/contracts/hooks/use-token-info-and-balance';
import { useCreateVault } from '@/modules/contracts/hooks/use-user-vault';
import type { CreateVaultFormData, Pool, Token } from '../types/vault.types';

type BalanceInfo = {
	display?: string;
	max?: string;
	isLoading: boolean;
};

type CreateVaultContextValue = {
	step: number;
	formData: CreateVaultFormData;
	availablePools: Pool[];
	lastLimit: string;
	isLoading: boolean;
	isConnected: boolean;
	token0?: Token;
	token1?: Token;
	currentBasePrice: number;
	token0Balance: BalanceInfo;
	token1Balance: BalanceInfo;
	updateData: (updates: Partial<CreateVaultFormData>) => void;
	setLastLimit: (value: string) => void;
	handleProfileChange: (
		value: 'conservative' | 'standard' | 'aggressive' | 'custom',
	) => void;
	handleNext: () => void;
	handleBack: () => void;
	handleCreate: () => Promise<void>;
	isNextDisabled: () => boolean;
	formatPrice: (price: number) => string;
	getRangeDisplay: (lower: number, upper: number, basePrice: number) => string;
};

const CreateVaultContext = createContext<CreateVaultContextValue | null>(null);

const TOKEN_METADATA: Record<
	string,
	{ symbol: string; name: string; decimals: number }
> = {
	[TOKEN_ADDRESSES.ETH]: {
		symbol: 'ETH',
		name: 'Ethereum',
		decimals: 18,
	},
	[TOKEN_ADDRESSES.USDC]: {
		symbol: 'USDC',
		name: 'USD Coin',
		decimals: 6,
	},
};

const AVAILABLE_POOLS: Pool[] = Object.entries(EXAMPLE_POOL_KEYS).map(
	([key, poolKey]) => {
		const token0 = TOKEN_METADATA[poolKey.currency0] || {
			symbol: 'UNKNOWN',
			name: 'Unknown Token',
			decimals: 18,
		};
		const token1 = TOKEN_METADATA[poolKey.currency1] || {
			symbol: 'UNKNOWN',
			name: 'Unknown Token',
			decimals: 18,
		};

		return {
			id: `pool-${key.toLowerCase()}`,
			token0: { ...token0, address: poolKey.currency0 },
			token1: { ...token1, address: poolKey.currency1 },
			fee: poolKey.fee,
			volume24h: '$0',
			tvl: '$0',
		};
	},
);

const INITIAL_DATA: CreateVaultFormData = {
	selectedPool: null,
	riskProfile: 'standard',
	customRange: { min: '', max: '' },
	maxPositions: '5',
	swapAllowed: true,
	depositAmount: { token0: '', token1: '' },
};

const currentBasePrice = 100;
type CreateVaultProviderProps = {
	children: ReactNode;
	onOpenChange: (open: boolean) => void;
};

export function CreateVaultProvider({
	children,
	onOpenChange,
}: CreateVaultProviderProps) {
	const formDataAtom = useMemo(
		() => atomWithReset<CreateVaultFormData>(INITIAL_DATA),
		[],
	);
	const { address, isConnected } = useAppKitAccount();
	const chainId = 1;

	const [step, setStep] = useState(1);
	const [formData, setFormData] = useAtom(formDataAtom);
	const resetFormData = useResetAtom(formDataAtom);
	const [lastLimit, setLastLimit] = useState('5');

	const token0 = formData.selectedPool?.token0;
	const token1 = formData.selectedPool?.token1;
	const token0Address = token0?.address ?? '';
	const token1Address = token1?.address ?? '';

	const token0Erc20 = useTokenInfoAndBalance(
		address ?? '',
		token0Address,
		chainId,
	);
	const token1Erc20 = useTokenInfoAndBalance(
		address ?? '',
		token1Address,
		chainId,
	);

	console.log(token0Erc20, token1Erc20);

	const token0BalanceInfo = token0Erc20;
	const token1BalanceInfo = token1Erc20;

	const token0Balance = useMemo<BalanceInfo>(() => {
		return {
			display: token0BalanceInfo
				? formatValueToStandardDisplay(token0BalanceInfo.balance ?? '0')
				: undefined,
			max: token0BalanceInfo?.balance ?? '0',
			isLoading: token0Erc20.isLoading,
		};
	}, [token0BalanceInfo, token0Erc20.isLoading]);

	const token1Balance = useMemo<BalanceInfo>(() => {
		return {
			display: token1BalanceInfo
				? formatValueToStandardDisplay(token1BalanceInfo.balance ?? '0')
				: undefined,
			max: token1BalanceInfo?.balance ?? '0',
			isLoading: token1Erc20.isLoading,
		};
	}, [token1BalanceInfo, token1Erc20.isLoading]);

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0,
		}).format(price);
	};

	const getPriceFromTick = (tick: number, basePrice: number) => {
		return basePrice * (1 + tick / 10000);
	};

	const getRangeDisplay = (lower: number, upper: number, basePrice: number) => {
		const p1 = getPriceFromTick(lower, basePrice);
		const p2 = getPriceFromTick(upper, basePrice);
		return `${formatPrice(p1)} - ${formatPrice(p2)}`;
	};

	const getTickFromPrice = (price: number, basePrice: number) => {
		if (basePrice === 0) return 0;
		return Math.round((price / basePrice - 1) * 10000);
	};

	const updateData = (updates: Partial<CreateVaultFormData>) => {
		setFormData((prev) => ({ ...prev, ...updates }));
	};

	const handleProfileChange = (
		value: 'conservative' | 'standard' | 'aggressive' | 'custom',
	) => {
		updateData({ riskProfile: value });
		if (value !== 'custom') {
			updateData({ customRange: { min: '', max: '' } });
		}
	};

	const handleNext = () => setStep((prev) => prev + 1);
	const handleBack = () => setStep((prev) => prev - 1);

	const isNextDisabled = () => {
		if (step === 1) return !formData.selectedPool;
		if (step === 3) {
			const val0 = Number.parseFloat(formData.depositAmount.token0);
			const val1 = Number.parseFloat(formData.depositAmount.token1);
			return (
				(Number.isNaN(val0) || val0 <= 0) && (Number.isNaN(val1) || val1 <= 0)
			);
		}
		return false;
	};

	const { createVault, isPending: isCreatingVault } = useCreateVault();

	const handleCreate = async () => {
		try {
			const finalData = { ...formData };

			if (formData.riskProfile === 'custom') {
				const minPrice = Number.parseFloat(formData.customRange.min);
				const maxPrice = Number.parseFloat(formData.customRange.max);

				if (!Number.isNaN(minPrice) && !Number.isNaN(maxPrice)) {
					finalData.customRange = {
						min: getTickFromPrice(minPrice, currentBasePrice).toString(),
						max: getTickFromPrice(maxPrice, currentBasePrice).toString(),
					};
				}
			} else {
				let tickLower = 0;
				let tickUpper = 0;
				if (formData.riskProfile === 'conservative') {
					tickLower = -5000;
					tickUpper = 5000;
				} else if (formData.riskProfile === 'standard') {
					tickLower = -2000;
					tickUpper = 2000;
				} else if (formData.riskProfile === 'aggressive') {
					tickLower = -1000;
					tickUpper = 1000;
				}
				finalData.customRange = {
					min: tickLower.toString(),
					max: tickUpper.toString(),
				};
			}
			// build relative vault data with api

			await createVault({
				poolKey: {
					currency0: token0Address as `0x${string}`,
					currency1: token1Address as `0x${string}`,
					fee: formData.selectedPool?.fee ?? 0,
					tickSpacing: 60,
					hooks: zeroAddress,
				},
				// should update to bot agent.
				agent: address as `0x${string}`,
				allowedTickLower: Number(finalData.customRange.min),
				allowedTickUpper: Number(finalData.customRange.max),
				swapAllowed: finalData.swapAllowed,
				maxPositionsK: BigInt(finalData.maxPositions),
			});
			// toast.success('Vault Created', {
			// 	description: `${formData.selectedPool?.token0.symbol}/${formData.selectedPool?.token1.symbol} vault is ready.`,
			// });
			onOpenChange(false);
			setTimeout(() => {
				setStep(1);
				resetFormData();
			}, 300);
		} catch (_error) {
			toast.error('Failed to create vault');
		}
	};

	const value: CreateVaultContextValue = {
		step,
		formData,
		availablePools: AVAILABLE_POOLS,
		lastLimit,
		isLoading: isCreatingVault,
		isConnected,
		token0,
		token1,
		currentBasePrice,
		token0Balance,
		token1Balance,
		updateData,
		setLastLimit,
		handleProfileChange,
		handleNext,
		handleBack,
		handleCreate,
		isNextDisabled,
		formatPrice,
		getRangeDisplay,
	};

	return (
		<CreateVaultContext.Provider value={value}>
			{children}
		</CreateVaultContext.Provider>
	);
}

export function useCreateVaultContext() {
	const context = useContext(CreateVaultContext);
	if (!context) {
		throw new Error(
			'useCreateVaultContext must be used within CreateVaultProvider',
		);
	}
	return context;
}
