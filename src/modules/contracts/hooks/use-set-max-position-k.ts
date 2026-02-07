import { encodeFunctionData } from 'viem';
import { V4_AGENTIC_VAULT_ABI } from '../constants/v4-agentic-vault-abi';
import useAppWriteContract from './use-app-write-contract';
export function useSetMaxPositionsK({
	vaultAddress,
}: {
	vaultAddress: string;
}) {
	const { mutateAsync, ...rest } = useAppWriteContract();

	return {
		...rest,
		setMaxPositionsK: async (maxPositionsK: bigint) => {
			await mutateAsync({
				address: vaultAddress as `0x${string}`,
				abi: V4_AGENTIC_VAULT_ABI,
				functionName: 'setMaxPositionsK',
				args: [maxPositionsK],
			});
		},
		prepareSetMaxPositionsKCallData: (maxPositionsK: bigint) => {
			return {
				target: vaultAddress as `0x${string}`,
				allowFailure: false,
				callData: encodeFunctionData({
					abi: V4_AGENTIC_VAULT_ABI,
					functionName: 'setMaxPositionsK',
					args: [maxPositionsK],
				}),
			} as const;
		},
	};
}
