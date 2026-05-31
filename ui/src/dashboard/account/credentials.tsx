import { Badge } from '../../components/ui/badge';
import type { AccountRecord } from './types';

export function AccountCredentialChips({ account }: { account: AccountRecord }) {
  const credentials = account.credential_states || [];
  if (credentials.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {credentials.map((credential) => (
        <Badge key={credential.kind} variant={credential.present ? 'default' : 'secondary'} title={credential.status || credential.kind}>
          {credential.kind}{credential.present ? '' : ' missing'}
        </Badge>
      ))}
    </div>
  );
}
