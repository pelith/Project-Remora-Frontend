import { type Address, isAddress } from 'viem';
import { useReadContract } from 'wagmi';
import { UNISWAP_V4_POSITION_MANAGER_ABI } from '@/modules/contracts/constants/uniswap-v4-abis';

interface UsePositionLiquidityProps {
	positionManager: Address;
	tokenId?: bigint;
	chainId?: number;
}

export function usePositionLiquidity({
	positionManager,
	tokenId,
	chainId,
}: UsePositionLiquidityProps) {
	return useReadContract({
		address: positionManager,
		abi: UNISWAP_V4_POSITION_MANAGER_ABI,
		functionName: 'getPositionLiquidity',
		args: tokenId === undefined ? undefined : [tokenId],
		chainId,
		query: {
			enabled:
				isAddress(positionManager) &&
				tokenId !== undefined &&
				tokenId >= 0n,
		},
	});
}
