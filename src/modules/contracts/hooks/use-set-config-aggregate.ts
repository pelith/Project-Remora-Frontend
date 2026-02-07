import { type Hex, multicall3Abi } from 'viem';
import { usePublicClient } from 'wagmi';
import useAppWriteContract from './use-app-write-contract';

const multicall3AggregateAddress = '0xca11bde05977b3631167028862be2a173976ca11';

export type Call3 = {
	target: `0x${string}`;
	allowFailure: boolean;
	callData: Hex;
};

export function useSetConfigAggregate() {
	const { mutateAsync, ...rest } = useAppWriteContract();
	const publicClient = usePublicClient();

	return {
		...rest,
		setConfigAggregate: async (calls: Call3[]) => {
			const gas = await publicClient?.estimateContractGas({
				address: multicall3AggregateAddress as `0x${string}`,
				abi: multicall3Abi,
				functionName: 'aggregate3',
				args: [calls],
			});
			await mutateAsync({
				address: multicall3AggregateAddress as `0x${string}`,
				abi: multicall3Abi,
				functionName: 'aggregate3',
				args: [calls],
				gas,
			});
		},
	};
}
