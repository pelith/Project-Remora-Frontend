import { isAddress } from 'viem';
import { useReadContract } from 'wagmi';
import { V4_AGENTIC_VAULT_ABI } from '../constants/v4-agentic-vault-abi';
import useAppWriteContract from './use-app-write-contract';

export function useSetAgentPause(vaultAddress: string) {
	const { mutateAsync, ...result } = useAppWriteContract();
	const agentStatus = useReadContract({
		address: vaultAddress as `0x${string}`,
		abi: V4_AGENTIC_VAULT_ABI,
		functionName: 'agentPaused',
		args: [],
		query: {
			enabled: isAddress(vaultAddress),
		},
	});
	return {
		...result,
		agentStatus: agentStatus,
		disabled: agentStatus.isLoading,
		setAgentPause(args: { vaultAddress: string; desiredStatus: boolean }) {
			return mutateAsync({
				address: vaultAddress as `0x${string}`,
				abi: V4_AGENTIC_VAULT_ABI,
				functionName: 'setAgentPaused',
				args: [args.desiredStatus],
			});
		},
	};
}
