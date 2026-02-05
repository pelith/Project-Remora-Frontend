import { useTokenInfoAndBalance } from './use-token-info-and-balance';

interface UseVaultAvailableBalanceProps {
	vaultAddress: string;
	currency0?: string;
	currency1?: string;
	chainId?: number;
}

export function useVaultAvailableBalance({
	vaultAddress,
	currency0,
	currency1,
	chainId,
}: UseVaultAvailableBalanceProps) {
	const currency0Result = useTokenInfoAndBalance(
		vaultAddress,
		currency0 ?? '',
		chainId,
	);
	const currency1Result = useTokenInfoAndBalance(
		vaultAddress,
		currency1 ?? '',
		chainId,
	);
	return {
		currency0: currency0Result,
		currency1: currency1Result,
	};
}
