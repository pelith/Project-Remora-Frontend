import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { formatUnits, isAddress } from 'viem';
import { useChainId } from 'wagmi';
import { parseToBigNumber } from '@/modules/common/utils/bignumber';
import {
	fetchPositionTokenAmounts,
	type PositionTokenAmountRequest,
} from '../services/position-token-amount-api';
import { useTokenPrice } from './use-token-price';
import { useVault } from './use-user-vault';
import { useVaultAvailableBalance } from './use-vault-available-balance';

interface UseVaultAssetsProps {
	vaultAddress: string;
}

export interface VaultAssetsData {
	token0?: {
		amount: string; // Formatted amount as string (estimated)
		price: number; // Price in USD
		valueUSD: string; // Value in USD as string
		symbol: string;
		decimals: number;
	};
	token1?: {
		amount: string;
		price: number;
		valueUSD: string;
		symbol: string;
		decimals: number;
	};
	totalValueUSD?: string; // Total value in USD as string (only when both tokens have valueUSD)
}

/**
 * Hook to calculate vault assets status
 *
 * This hook combines existing hooks to:
 * 1. Uses useVaultAvailableBalance to get idle balances and token info (no duplication)
 * 2. Fetches position token amounts from API
 * 3. Fetches token prices from Coingecko
 * 4. Calculates total value = token0 * price0 + token1 * price1
 *
 * This hook is designed to be a composition hook that extends useVaultAvailableBalance
 * with position amounts and price calculations, avoiding duplication of token info fetching.
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError } = useVaultAssets({
 *   vaultAddress: '0x...'
 * });
 *
 * if (data) {
 *   console.log(`Token0: ${data.token0.amount} ${data.token0.symbol}`);
 *   console.log(`Token1: ${data.token1.amount} ${data.token1.symbol}`);
 *   console.log(`Total Value: $${data.totalValueUSD}`);
 * }
 * ```
 */
export function useVaultAssets({ vaultAddress }: UseVaultAssetsProps) {
	const chainId = useChainId();
	const isVaultAddress = isAddress(vaultAddress);

	// Get vault info to get token addresses
	const vaultQuery = useVault({ vaultAddress });
	const vaultData = vaultQuery.data;

	const vaultCurrency0 = vaultData?.currency0 as string | undefined;
	const vaultCurrency1 = vaultData?.currency1 as string | undefined;

	// Get available balance (idle funds) and token info from contract
	// This hook already uses useTokenInfoAndBalance internally, so we reuse it
	const availableBalanceData = useVaultAvailableBalance({
		vaultAddress,
		currency0: vaultCurrency0,
		currency1: vaultCurrency1,
		chainId,
	});

	const positionAmountsQuery = useQuery({
		queryKey: ['position-token-amounts', vaultAddress],
		queryFn: () =>
			fetchPositionTokenAmounts({
				vaultAddress,
			} as PositionTokenAmountRequest),
		enabled: isVaultAddress,
		staleTime: 30_000, // 30 seconds
	});

	// Extract token info from availableBalanceData (already fetched by useTokenInfoAndBalance)
	const token0Info = availableBalanceData.currency0 as
		| {
				symbol?: string;
				decimals?: number;
				balanceRaw?: bigint;
		  }
		| undefined;
	const token1Info = availableBalanceData.currency1 as
		| {
				symbol?: string;
				decimals?: number;
				balanceRaw?: bigint;
		  }
		| undefined;

	const token0Price = useTokenPrice(
		{ id: token0Info?.symbol ?? '' },
		{ enabled: Boolean(token0Info?.symbol) },
	);
	const token1Price = useTokenPrice(
		{ id: token1Info?.symbol ?? '' },
		{ enabled: Boolean(token1Info?.symbol) },
	);

	// Calculate total assets - each field can be undefined independently
	const data = useMemo((): VaultAssetsData => {
		const result: VaultAssetsData = {};

		// Calculate token0 data if we have enough info
		if (
			token0Info?.symbol &&
			token0Info.decimals !== undefined &&
			availableBalanceData.currency0
		) {
			const token0Decimals = token0Info.decimals;
			const idleToken0Raw = token0Info.balanceRaw ?? 0n;

			// Get position amount from API (raw amount as string)
			const positionToken0Raw = BigInt(
				positionAmountsQuery.data?.amount0 ?? '0',
			);

			const totalToken0Raw = idleToken0Raw + positionToken0Raw;

			const totalToken0Amount = formatUnits(totalToken0Raw, token0Decimals);

			// If we have price, calculate valueUSD
			if (token0Price.data) {
				const token0ValueUSD = parseToBigNumber(totalToken0Amount).multipliedBy(
					token0Price.data.price,
				);
				result.token0 = {
					amount: totalToken0Amount,
					price: token0Price.data.price,
					valueUSD: token0ValueUSD.toFixed(2),
					symbol: token0Info.symbol,
					decimals: token0Decimals,
				};
			} else {
				// If no price, still return amount info but without valueUSD
				result.token0 = {
					amount: totalToken0Amount,
					price: 0,
					valueUSD: '0',
					symbol: token0Info.symbol,
					decimals: token0Decimals,
				};
			}
		}

		// Calculate token1 data if we have enough info
		if (
			token1Info?.symbol &&
			token1Info.decimals !== undefined &&
			availableBalanceData.currency1
		) {
			const token1Decimals = token1Info.decimals;
			const idleToken1Raw = token1Info.balanceRaw ?? 0n;

			// Get position amount from API (raw amount as string)
			const positionToken1Raw = BigInt(
				positionAmountsQuery.data?.amount1 ?? '0',
			);

			const totalToken1Raw = idleToken1Raw + positionToken1Raw;
			const totalToken1Amount = formatUnits(totalToken1Raw, token1Decimals);

			if (token1Price.data) {
				const token1ValueUSD = parseToBigNumber(totalToken1Amount).multipliedBy(
					token1Price.data.price,
				);

				result.token1 = {
					amount: totalToken1Amount,
					price: token1Price.data.price,
					valueUSD: token1ValueUSD.toFixed(2),
					symbol: token1Info.symbol,
					decimals: token1Decimals,
				};
			} else {
				// If no price, still return amount info but without valueUSD
				result.token1 = {
					amount: totalToken1Amount,
					price: 0,
					valueUSD: '0',
					symbol: token1Info.symbol,
					decimals: token1Decimals,
				};
			}
		}

		// Calculate totalValueUSD only if both tokens have valueUSD
		if (result.token0?.valueUSD && result.token1?.valueUSD) {
			const token0ValueUSD = parseToBigNumber(result.token0.valueUSD);
			const token1ValueUSD = parseToBigNumber(result.token1.valueUSD);
			result.totalValueUSD = token0ValueUSD.plus(token1ValueUSD).toFixed(2);
		}

		return result;
	}, [
		token0Info,
		token1Info,
		availableBalanceData.currency0,
		availableBalanceData.currency1,
		positionAmountsQuery.data,
		token0Price.data,
		token1Price.data,
	]);

	return {
		data,
		isLoading:
			vaultQuery.isLoading ||
			(availableBalanceData.currency0 as { isLoading?: boolean })?.isLoading ||
			(availableBalanceData.currency1 as { isLoading?: boolean })?.isLoading ||
			positionAmountsQuery.isLoading ||
			token0Price.isLoading ||
			token1Price.isLoading,
		isError:
			vaultQuery.isError ||
			positionAmountsQuery.isError ||
			token0Price.isError ||
			token1Price.isError,
	};
}
