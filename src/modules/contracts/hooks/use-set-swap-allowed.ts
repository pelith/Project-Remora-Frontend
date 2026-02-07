import { encodeFunctionData } from 'viem';
import { V4_AGENTIC_VAULT_ABI } from '../constants/v4-agentic-vault-abi';
import useAppWriteContract from './use-app-write-contract';

export function useSetSwapAllowed({ vaultAddress }: { vaultAddress: string }) {
	const { mutateAsync, ...rest } = useAppWriteContract();

	return {
		...rest,
		setSwapAllowed: async (swapAllowed: boolean) => {
			await mutateAsync({
				address: vaultAddress as `0x${string}`,
				abi: V4_AGENTIC_VAULT_ABI,
				functionName: 'setSwapAllowed',
				args: [swapAllowed],
			});
		},
	prepareSetSwapAllowedCallData: (swapAllowed: boolean) => {
		return {
			target: vaultAddress as `0x${string}`,
			allowFailure: false,
			callData: encodeFunctionData({
				abi: V4_AGENTIC_VAULT_ABI,
				functionName: 'setSwapAllowed',
				args: [swapAllowed],
			}),
		} as const;
	},
	};
}
