import { CurrencyAmount, Ether, Token } from '@uniswap/sdk-core';
import { Pool, Position } from '@uniswap/v4-sdk';
import { useMemo } from 'react';
import { type Address, isAddress, zeroAddress } from 'viem';
import { useChainId, useReadContracts } from 'wagmi';
import {
	UNISWAP_V4_POSITION_MANAGER_ABI,
	UNISWAP_V4_STATE_VIEW_ABI,
} from '@/modules/contracts/constants/uniswap-v4-abis';
import { UNISWAP_V4_ADDRESSES } from '@/modules/contracts/constants/uniswap-v4-addresses';
import { V4_AGENTIC_VAULT_ABI } from '@/modules/contracts/constants/v4-agentic-vault-abi';
import { useTokenInfo } from './use-token-info-and-balance';
import { useVault } from './use-user-vault';

interface UseVaultPositionsBalanceProps {
	vaultAddress: string;
}

interface PoolKeyResult {
	currency0: Address;
	currency1: Address;
	fee: number;
	tickSpacing: number;
	hooks: Address;
}

function decodePackedTicks(info: bigint) {
	const rawUpper = Number((info >> 32n) & 0xffffffn);
	const rawLower = Number((info >> 8n) & 0xffffffn);
	const tickUpper = rawUpper >= 0x800000 ? rawUpper - 0x1000000 : rawUpper;
	const tickLower = rawLower >= 0x800000 ? rawLower - 0x1000000 : rawLower;
	return { tickLower, tickUpper };
}

function poolKeyId(poolKey: PoolKeyResult) {
	return [
		poolKey.currency0.toLowerCase(),
		poolKey.currency1.toLowerCase(),
		poolKey.fee,
		poolKey.tickSpacing,
		poolKey.hooks.toLowerCase(),
	].join(':');
}

export function useVaultPositionsBalance({
	vaultAddress,
}: UseVaultPositionsBalanceProps) {
	const chainId = useChainId();
	const isVaultAddress = isAddress(vaultAddress);
	const vaultQuery = useVault({ vaultAddress });
	const vaultData = vaultQuery.data;
	const posmAddress = vaultData?.posm as Address | undefined;
	const positionsLength = vaultData?.positionsLength ?? 0n;
	const positionsCount = Number(positionsLength ?? 0n);

	const vaultCurrency0 = vaultData?.currency0 as Address | undefined;
	const vaultCurrency1 = vaultData?.currency1 as Address | undefined;
	const isVaultNative0 =
		Boolean(vaultCurrency0) && vaultCurrency0?.toLowerCase() === zeroAddress;
	const isVaultNative1 =
		Boolean(vaultCurrency1) && vaultCurrency1?.toLowerCase() === zeroAddress;

	const token0Info = useTokenInfo(
		isVaultNative0 ? '' : (vaultCurrency0 ?? ''),
		chainId,
	);
	const token1Info = useTokenInfo(
		isVaultNative1 ? '' : (vaultCurrency1 ?? ''),
		chainId,
	);

	const positionIndexes = useMemo(
		() => Array.from({ length: positionsCount }, (_, index) => BigInt(index)),
		[positionsCount],
	);

	const positionIds = useReadContracts({
		contracts: positionIndexes.map((index) => ({
			address: vaultAddress as Address,
			abi: V4_AGENTIC_VAULT_ABI,
			functionName: 'positionIds',
			args: [index],
			chainId,
		})),
		query: {
			enabled: isVaultAddress && positionIndexes.length > 0,
		},
	});

	const tokenIds = useMemo(() => {
		return (
			positionIds.data
				?.map((entry) =>
					entry.status === 'success' ? entry.result : undefined,
				)
				.filter((value): value is bigint => value !== undefined) ?? []
		);
	}, [positionIds.data]);

	const positionDetails = useReadContracts({
		contracts: tokenIds.flatMap((tokenId) => [
			{
				address: posmAddress as Address,
				abi: UNISWAP_V4_POSITION_MANAGER_ABI,
				functionName: 'getPoolAndPositionInfo',
				args: [tokenId],
				chainId,
			},
			{
				address: posmAddress as Address,
				abi: UNISWAP_V4_POSITION_MANAGER_ABI,
				functionName: 'getPositionLiquidity',
				args: [tokenId],
				chainId,
			},
		]),
		query: {
			enabled: Boolean(posmAddress) && tokenIds.length > 0,
		},
	});

	const parsedPositions = useMemo(() => {
		if (!positionDetails.data) return [];
		const items: Array<{
			tokenId: bigint;
			poolKey: PoolKeyResult;
			tickLower: number;
			tickUpper: number;
			liquidity: bigint;
		}> = [];

		for (let index = 0; index < tokenIds.length; index += 1) {
			const infoResult = positionDetails.data[index * 2];
			const liquidityResult = positionDetails.data[index * 2 + 1];

			if (
				!infoResult ||
				infoResult.status !== 'success' ||
				!liquidityResult ||
				liquidityResult.status !== 'success'
			)
				continue;

			const [poolKey, info] = infoResult.result as [PoolKeyResult, bigint];
			const { tickLower, tickUpper } = decodePackedTicks(info);

			items.push({
				tokenId: tokenIds[index],
				poolKey,
				tickLower,
				tickUpper,
				liquidity: liquidityResult.result as bigint,
			});
		}

		return items;
	}, [positionDetails.data, tokenIds]);

	const stateView = UNISWAP_V4_ADDRESSES[chainId]?.stateView;
	const slot0 = useReadContracts({
		contracts: parsedPositions.map((position) => ({
			address: stateView as Address,
			abi: UNISWAP_V4_STATE_VIEW_ABI,
			functionName: 'getSlot0',
			args: [position.poolKey],
			chainId,
		})),
		query: {
			enabled: Boolean(stateView) && parsedPositions.length > 0,
		},
	});

	const data = useMemo(() => {
		if (!chainId || !parsedPositions.length) return undefined;

		const token0Address = parsedPositions[0]?.poolKey.currency0;
		const token1Address = parsedPositions[0]?.poolKey.currency1;
		if (!token0Address || !token1Address) return undefined;

		const isNative0 = token0Address.toLowerCase() === zeroAddress;
		const isNative1 = token1Address.toLowerCase() === zeroAddress;

		if (!isNative0 && !token0Info.data) return undefined;
		if (!isNative1 && !token1Info.data) return undefined;

		const token0 = isNative0
			? Ether.onChain(chainId)
			: new Token(
					chainId,
					token0Address,
					token0Info.data!.decimals,
					token0Info.data!.symbol,
					token0Info.data!.name,
				);

		const token1 = isNative1
			? Ether.onChain(chainId)
			: new Token(
					chainId,
					token1Address,
					token1Info.data!.decimals,
					token1Info.data!.symbol,
					token1Info.data!.name,
				);

		const slot0Map = new Map<string, { sqrtPriceX96: bigint; tick: number }>();
		slot0.data?.forEach((entry, index) => {
			if (entry.status !== 'success') return;
			const [sqrtPriceX96, tick] = entry.result as [
				bigint,
				number,
				number,
				number,
			];
			const key = poolKeyId(parsedPositions[index].poolKey);
			slot0Map.set(key, { sqrtPriceX96, tick });
		});

		let total0 = CurrencyAmount.fromRawAmount(token0, 0);
		let total1 = CurrencyAmount.fromRawAmount(token1, 0);

		for (const position of parsedPositions) {
			const slot0Data = slot0Map.get(poolKeyId(position.poolKey));
			if (!slot0Data) continue;

			const pool = new Pool(
				token0,
				token1,
				position.poolKey.fee,
				position.poolKey.tickSpacing,
				position.poolKey.hooks,
				slot0Data.sqrtPriceX96.toString(),
				0,
				slot0Data.tick,
				[],
			);
			const sdkPosition = new Position({
				pool,
				tickLower: position.tickLower,
				tickUpper: position.tickUpper,
				liquidity: position.liquidity.toString(),
			});

			total0 = total0.add(sdkPosition.amount0);
			total1 = total1.add(sdkPosition.amount1);
		}

		return {
			token0: Number(total0.toExact()),
			token1: Number(total1.toExact()),
		};
	}, [chainId, parsedPositions, slot0.data, token0Info.data, token1Info.data]);

	return {
		data,
		isLoading:
			vaultQuery.isLoading ||
			positionIds.isLoading ||
			positionDetails.isLoading ||
			slot0.isLoading ||
			token0Info.isLoading ||
			token1Info.isLoading,
		isError:
			vaultQuery.isError ||
			positionIds.isError ||
			positionDetails.isError ||
			slot0.isError ||
			token0Info.isError ||
			token1Info.isError,
	};
}
