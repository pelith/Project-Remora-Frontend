import {
	type Address,
	erc20Abi,
	formatUnits,
	isAddress,
	zeroAddress,
} from 'viem';
import { useBalance, useReadContracts } from 'wagmi';
export function useTokenInfoAndBalance(
	address: string,
	tokenAddress: string,
	chainId?: number,
) {
	const isNative = tokenAddress.toLowerCase() === zeroAddress;
	const { data: tokenInfo, isSuccess } = useTokenInfo(tokenAddress, chainId);
	const erc20Result = useReadContracts({
		contracts: [
			{
				abi: erc20Abi,
				address: tokenAddress as Address,
				functionName: 'balanceOf',
				args: [address as Address],
				chainId: chainId,
			},
		] as const,
		query: {
			enabled: isAddress(address) && isSuccess && !isNative,
			select(data) {
				const [balance] = data;
				const { decimals, symbol, name } = tokenInfo!;
				if (balance.status === 'failure') return undefined;
				return {
					balanceRaw: balance.result,
					decimals: decimals,
					symbol: symbol,
					name: name,
					balance: formatUnits(balance.result, decimals),
				};
			},
		},
	});
	const nativeResult = useBalance({
		address: address as Address,
		chainId: chainId,
		query: {
			enabled: isNative && isAddress(address),
			select(data) {
				return {
					balanceRaw: data.value,
					decimals: 18,
					symbol: 'ETH',
					name: 'Ethereum',
					balance: formatUnits(data.value, 18),
				};
			},
		},
	});
	return isNative
		? {
				...nativeResult.data,
				isLoading: nativeResult.isLoading,
			}
		: {
				...erc20Result.data,
				isLoading: erc20Result.isLoading,
			};
}

export function useTokenInfo(tokenAddress: string, chainId?: number) {
	const isNative = tokenAddress.toLowerCase() === zeroAddress;
	const result = useReadContracts({
		contracts: [
			{
				abi: erc20Abi,
				address: tokenAddress as Address,
				functionName: 'decimals',
				args: [],
				chainId: chainId,
			},
			{
				abi: erc20Abi,
				address: tokenAddress as Address,
				functionName: 'symbol',
				args: [],
				chainId: chainId,
			},
			{
				abi: erc20Abi,
				address: tokenAddress as Address,
				functionName: 'name',
				args: [],
				chainId: chainId,
			},
		] as const,
		query: {
			enabled: isAddress(tokenAddress) && !isNative,
			staleTime: Number.POSITIVE_INFINITY,
			refetchOnMount: false,
			refetchOnWindowFocus: false,
			refetchOnReconnect: false,
			refetchInterval: false,
			refetchIntervalInBackground: false,
			select(data) {
				const [decimals, symbol, name] = data;
				if (
					decimals.status === 'failure' ||
					symbol.status === 'failure' ||
					name.status === 'failure'
				)
					return undefined;
				return {
					decimals: decimals.result,
					symbol: symbol.result,
					name: name.result,
				};
			},
		},
	});
	if (isNative) {
		return {
			...result,
			isSuccess: true,
			isLoading: false,
			data: {
				decimals: 18,
				symbol: 'ETH',
				name: 'Ethereum',
			},
		};
	}
	return result;
}
