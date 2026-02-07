import { isAddress } from 'viem';
import { useReadContract } from 'wagmi';
import { V4_AGENTIC_VAULT_ABI } from '../constants/v4-agentic-vault-abi';
import useAppWriteContract from './use-app-write-contract';

export function useSetAgentPause(vaultAddress: string) {
	const agentStatus = useReadContract({
		address: vaultAddress as `0x${string}`,
		abi: V4_AGENTIC_VAULT_ABI,
		functionName: 'agentPaused',
		args: [],
		query: {
			enabled: isAddress(vaultAddress),
		},
	});

	const { mutateAsync, ...result } = useAppWriteContract();

	return {
		...result,
		agentStatus: agentStatus,
		disabled: agentStatus.isLoading,
		async setAgentPause(args: {
			vaultAddress: string;
			desiredStatus: boolean;
		}) {
			await mutateAsync({
				address: vaultAddress as `0x${string}`,
				abi: V4_AGENTIC_VAULT_ABI,
				functionName: 'setAgentPaused',
				args: [args.desiredStatus],
			});
			agentStatus.refetch();
		},
	};
}
