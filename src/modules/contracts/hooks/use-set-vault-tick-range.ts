import { encodeFunctionData } from 'viem';
import { V4_AGENTIC_VAULT_ABI } from '../constants/v4-agentic-vault-abi';
import useAppWriteContract from './use-app-write-contract';

export function useSetVaultTickRange({
	vaultAddress,
}: {
	vaultAddress: string;
}) {
	const { mutateAsync, ...rest } = useAppWriteContract();

	return {
		...rest,
		setVaultTickRange: async (tickLower: number, tickUpper: number) => {
			await mutateAsync({
				address: vaultAddress as `0x${string}`,
				abi: V4_AGENTIC_VAULT_ABI,
				functionName: 'setAllowedTickRange',
				args: [tickLower, tickUpper],
			});
		},
		prepareSetVaultTickRangeCallData: (
			tickLower: number,
			tickUpper: number,
		) => {
			return {
				target: vaultAddress as `0x${string}`,
				allowFailure: false,
				callData: encodeFunctionData({
					abi: V4_AGENTIC_VAULT_ABI,
					functionName: 'setAllowedTickRange',
					args: [tickLower, tickUpper],
				}),
			} as const;
		},
	};
}
