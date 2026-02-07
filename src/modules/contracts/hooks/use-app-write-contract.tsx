import { ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useWriteContract } from 'wagmi';
import { getEtherscanLink, shortenTxId } from '@/modules/contracts/utils';
export default function useAppWriteContract(chainId = 1) {
	return useWriteContract({
		mutation: {
			onSuccess(hash) {
				toast(
					<a
						target='_blank'
						href={getEtherscanLink(chainId, hash, 'transaction')}
						rel='noreferrer noopener'
						className='text-decoration-none text-gray-800'
					>
						{shortenTxId(hash)} <ExternalLink size={16} />
					</a>,
				);
			},
			onError(error) {
				console.error(error);
				if (typeof error !== 'object') return;
				if ('shortMessage' in error) {
					toast.error(<div>{error.shortMessage}</div>, {});
					return;
				}
				toast.error(<div>{error.message}</div>);
			},
		},
	});
}
