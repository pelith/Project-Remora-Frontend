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
import { useTokenPrice } from '@/modules/contracts/hooks/use-token-price';
import { useCreateVault } from '@/modules/contracts/hooks/use-user-vault';
import type { CreateVaultFormData, Pool, Token } from '../types/vault.types';
import { priceToTick } from '../utils/vault-utils';
import { env } from '@/env';

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

	// 獲取兩個 token 的 USD 價格
	const { data: token0PriceData } = useTokenPrice({
		id: token0?.symbol?.toLowerCase() ?? '',
		vsCurrency: 'usd',
	});
	const { data: token1PriceData } = useTokenPrice({
		id: token1?.symbol?.toLowerCase() ?? '',
		vsCurrency: 'usd',
	});

	const token0Price = token0PriceData?.price ?? 1;
	const token1Price = token1PriceData?.price ?? 1;

	// 判斷哪個是報價 token (價格較高的)
	const isToken0Base = token0Price > token1Price;
	const baseTokenPrice = isToken0Base ? token0Price : token1Price;

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
			maximumFractionDigits: 2,
		}).format(price);
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
			const decimal0 = token0?.decimals ?? 6;
			const decimal1 = token1?.decimals ?? 18;

			let tickLower = 0;
			let tickUpper = 0;

			if (formData.riskProfile === 'custom') {
				// Custom: 用戶輸入的是 base token 的 USD 價格
				const minPrice = Number.parseFloat(formData.customRange.min);
				const maxPrice = Number.parseFloat(formData.customRange.max);

				if (!Number.isNaN(minPrice) && !Number.isNaN(maxPrice)) {
					// 根據哪個 token 是 base token，決定如何轉換
					if (isToken0Base) {
						// token0 是 base (例如 ETH)，價格是 token0 的 USD 價格
						// 需要轉換為 tick (表示 token0/token1 的比率)
						tickLower = priceToTick(minPrice, decimal1, decimal0);
						tickUpper = priceToTick(maxPrice, decimal1, decimal0);
					} else {
						// token1 是 base (例如 ETH)，價格是 token1 的 USD 價格
						tickLower = priceToTick(minPrice, decimal0, decimal1);
						tickUpper = priceToTick(maxPrice, decimal0, decimal1);
					}
				}
			} else {
				// 預設選項：基於當前 base token 價格計算範圍
				let percentage = 0;
				if (formData.riskProfile === 'conservative') {
					percentage = 0.5; // ±50%
				} else if (formData.riskProfile === 'standard') {
					percentage = 0.2; // ±20%
				} else if (formData.riskProfile === 'aggressive') {
					percentage = 0.1; // ±10%
				}

				const minPrice = baseTokenPrice * (1 - percentage);
				const maxPrice = baseTokenPrice * (1 + percentage);

				if (isToken0Base) {
					tickLower = priceToTick(minPrice, decimal1, decimal0);
					tickUpper = priceToTick(maxPrice, decimal1, decimal0);
				} else {
					tickLower = priceToTick(minPrice, decimal0, decimal1);
					tickUpper = priceToTick(maxPrice, decimal0, decimal1);
				}
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
				agent: env.VITE_AGENT_ADDRESS as `0x${string}`,
				allowedTickLower: tickLower,
				allowedTickUpper: tickUpper,
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
