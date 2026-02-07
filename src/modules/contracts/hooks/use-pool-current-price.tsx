import { useMemo } from 'react';
import { type Address, isAddress } from 'viem';
import { useReadContract } from 'wagmi';
import { UNISWAP_V4_STATE_VIEW_ABI } from '@/modules/contracts/constants/uniswap-v4-abis';
import { UNISWAP_V4_ADDRESSES } from '@/modules/contracts/constants/uniswap-v4-addresses';

export interface PoolKey {
	currency0: Address;
	currency1: Address;
	fee: number;
	tickSpacing: number;
	hooks: Address;
}

export interface UsePoolCurrentPriceProps {
	poolKey: PoolKey | undefined;
	token0Decimals: number;
	token1Decimals: number;
	chainId: number;
}

export interface PoolPriceData {
	token1PerToken0: number;
	token0PerToken1: number;
	sqrtPriceX96: string;
	tick: number;
	rawPrice: number;
}

export function usePoolCurrentPrice({
	poolKey,
	token0Decimals,
	token1Decimals,
	chainId,
}: UsePoolCurrentPriceProps) {
	const stateView = UNISWAP_V4_ADDRESSES[chainId]?.stateView;

	const isPoolKeyValid =
		poolKey !== undefined &&
		isAddress(poolKey.currency0) &&
		isAddress(poolKey.currency1) &&
		isAddress(poolKey.hooks);

	const slot0Query = useReadContract({
		address: stateView as Address,
		abi: UNISWAP_V4_STATE_VIEW_ABI,
		functionName: 'getSlot0',
		args: poolKey ? [poolKey] : ([] as unknown as [PoolKey]),
		chainId,
		query: {
			enabled: Boolean(stateView) && isPoolKeyValid && poolKey !== undefined,
		},
	});

	const priceData = useMemo((): PoolPriceData | undefined => {
		if (!slot0Query.data) return undefined;

		// slot0 returns: [sqrtPriceX96, tick, protocolFee, lpFee]
		const [sqrtPriceX96, tick] = slot0Query.data as [
			bigint,
			number,
			number,
			number,
		];

		const Q96 = 2n ** 96n;
		const sqrtPrice = Number(sqrtPriceX96) / Number(Q96);
		const rawPrice = sqrtPrice ** 2;

		const decimalAdjustment = 10 ** (token0Decimals - token1Decimals);
		const token1PerToken0 = rawPrice * decimalAdjustment;

		return {
			token1PerToken0,
			token0PerToken1: 1 / token1PerToken0,
			sqrtPriceX96: sqrtPriceX96.toString(),
			tick,
			rawPrice,
		};
	}, [slot0Query.data, token0Decimals, token1Decimals]);

	// If poolKey is undefined or query is disabled, don't show loading
	const isQueryEnabled =
		Boolean(stateView) && isPoolKeyValid && poolKey !== undefined;

	return {
		data: priceData,
		isLoading: isQueryEnabled ? slot0Query.isLoading : false,
		isError: isQueryEnabled ? slot0Query.isError : false,
		error: isQueryEnabled ? slot0Query.error : undefined,
	};
}
