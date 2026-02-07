import { useQuery } from '@tanstack/react-query';
import { Ether, Token } from '@uniswap/sdk-core';
import { Pool } from '@uniswap/v4-sdk';
import { useMemo } from 'react';
import { type Address, isAddress, zeroAddress } from 'viem';
import { useChainId } from 'wagmi';
import { useTokenInfo } from './use-token-info-and-balance';
import { useTokenPrice } from './use-token-price';

export interface UseUniswapPoolTvlProps {
	poolKey: {
		currency0: Address;
		currency1: Address;
		fee: number;
		tickSpacing: number;
		hooks: Address;
	};
	chainId?: number;
	subgraphUrl?: string;
}

function getCoingeckoId(symbol?: string) {
	if (!symbol) return undefined;
	const normalized = symbol.toLowerCase();
	const map: Record<string, string> = {
		eth: 'ethereum',
		weth: 'weth',
		wbtc: 'wrapped-bitcoin',
		usdc: 'usd-coin',
		usdt: 'tether',
		uni: 'uniswap',
	};
	return map[normalized];
}

const SUBGRAPH_POOL_TVL_QUERY = `
	query PoolTvl($id: ID!) {
		pool(id: $id) {
			id
			totalValueLockedUSD
			totalValueLockedToken0
			totalValueLockedToken1
		}
	}
`;

async function fetchPoolTvlFromSubgraph(
	url: string,
	poolId: string,
): Promise<{
	tvlUSD?: number;
	token0Amount?: number;
	token1Amount?: number;
}> {
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			query: SUBGRAPH_POOL_TVL_QUERY,
			variables: { id: poolId.toLowerCase() },
		}),
	});

	if (!response.ok) {
		throw new Error(`Subgraph request failed: ${response.status}`);
	}

	const payload = (await response.json()) as {
		data?: {
			pool?: {
				totalValueLockedUSD?: string;
				totalValueLockedToken0?: string;
				totalValueLockedToken1?: string;
			};
		};
		errors?: unknown[];
	};

	if (payload.errors?.length) {
		throw new Error('Subgraph returned errors.');
	}

	const pool = payload.data?.pool;
	if (!pool) return {};

	const tvlUSD = pool.totalValueLockedUSD
		? Number.parseFloat(pool.totalValueLockedUSD)
		: undefined;
	const token0Amount = pool.totalValueLockedToken0
		? Number.parseFloat(pool.totalValueLockedToken0)
		: undefined;
	const token1Amount = pool.totalValueLockedToken1
		? Number.parseFloat(pool.totalValueLockedToken1)
		: undefined;

	return { tvlUSD, token0Amount, token1Amount };
}

export function useUniswapPoolTvl({
	poolKey,
	chainId: chainIdProp,
	subgraphUrl,
}: UseUniswapPoolTvlProps) {
	const fallbackChainId = useChainId();
	const chainId = chainIdProp ?? fallbackChainId;

	const isPoolKeyValid =
		isAddress(poolKey.currency0) &&
		isAddress(poolKey.currency1) &&
		isAddress(poolKey.hooks);

	const isNative0 = poolKey.currency0.toLowerCase() === zeroAddress;
	const isNative1 = poolKey.currency1.toLowerCase() === zeroAddress;

	const token0Info = useTokenInfo(isNative0 ? '' : poolKey.currency0, chainId);
	const token1Info = useTokenInfo(isNative1 ? '' : poolKey.currency1, chainId);

	const poolId = useMemo(() => {
		if (!chainId || !isPoolKeyValid) return undefined;
		if (!isNative0 && !token0Info.data) return undefined;
		if (!isNative1 && !token1Info.data) return undefined;
		const token0 = isNative0
			? Ether.onChain(chainId)
			: new Token(
					chainId,
					poolKey.currency0,
					token0Info.data!.decimals,
					token0Info.data!.symbol,
					token0Info.data!.name,
				);
		const token1 = isNative1
			? Ether.onChain(chainId)
			: new Token(
					chainId,
					poolKey.currency1,
					token1Info.data!.decimals,
					token1Info.data!.symbol,
					token1Info.data!.name,
				);
		return Pool.getPoolId(
			token0,
			token1,
			poolKey.fee,
			poolKey.tickSpacing,
			poolKey.hooks,
		);
	}, [
		chainId,
		isPoolKeyValid,
		isNative0,
		isNative1,
		poolKey.currency0,
		poolKey.currency1,
		poolKey.fee,
		poolKey.tickSpacing,
		poolKey.hooks,
		token0Info.data,
		token1Info.data,
	]);

	const subgraphQuery = useQuery({
		queryKey: ['uniswap-v4-pool-tvl', subgraphUrl, poolId],
		queryFn: () =>
			fetchPoolTvlFromSubgraph(subgraphUrl as string, poolId as string),
		enabled: Boolean(subgraphUrl && poolId),
		staleTime: 60_000,
	});

	const token0Price = useTokenPrice(
		{ id: getCoingeckoId(token0Info.data?.symbol) ?? '' },
		{ enabled: Boolean(getCoingeckoId(token0Info.data?.symbol)) },
	);
	const token1Price = useTokenPrice(
		{ id: getCoingeckoId(token1Info.data?.symbol) ?? '' },
		{ enabled: Boolean(getCoingeckoId(token1Info.data?.symbol)) },
	);

	const dataWithValue = useMemo(() => {
		const token0Symbol =
			token0Info.data?.symbol ?? (isNative0 ? 'ETH' : undefined);
		const token1Symbol =
			token1Info.data?.symbol ?? (isNative1 ? 'ETH' : undefined);
		const subgraphData = subgraphQuery.data;
		if (subgraphData?.tvlUSD !== undefined) {
			return {
				token0Amount: subgraphData.token0Amount ?? 0,
				token1Amount: subgraphData.token1Amount ?? 0,
				token0Symbol,
				token1Symbol,
				tvlUSD: subgraphData.tvlUSD,
				source: 'subgraph' as const,
			};
		}
	}, [
		isNative0,
		isNative1,
		subgraphQuery.data,
		token0Price.data?.price,
		token1Price.data?.price,
	]);

	return {
		data: dataWithValue,
		isLoading:
			token0Info.isLoading ||
			token1Info.isLoading ||
			token0Price.isLoading ||
			token1Price.isLoading ||
			subgraphQuery.isLoading,
		isError:
			token0Info.isError ||
			token1Info.isError ||
			token0Price.isError ||
			token1Price.isError ||
			subgraphQuery.isError,
	};
}
