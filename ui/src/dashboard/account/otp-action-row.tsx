import { Copy, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { buttonHint, formatUnix, mask } from '../utils';
import { AccountActionRow } from './action-rows';

export type AccountLatestOTP = {
  otp?: string;
  received_at_unix?: number;
};

export function AccountOTPActionRow({ latestOtp, showSecrets, canRefresh, refreshDisabled, refreshHint, onCopy, onRefresh, emptyText = '暂无 OTP' }: {
  latestOtp?: AccountLatestOTP | null;
  showSecrets: boolean;
  canRefresh: boolean;
  refreshDisabled?: boolean;
  refreshHint: string;
  onCopy: (label: string, value: string) => void;
  onRefresh: () => void;
  emptyText?: string;
}) {
  if (!canRefresh && !latestOtp) return null;
  const code = latestOtp?.otp || '';
  return (
    <AccountActionRow label="OTP" contentClassName="detailActionContent">
      <span className={`detailOtpCode${code ? '' : ' empty'}`}>
        <strong>{code ? (showSecrets ? code : mask(code)) : emptyText}</strong>
        {code && <em>{formatUnix(latestOtp?.received_at_unix || 0)}</em>}
        <Button className="copyButton detailOtpCopy" {...buttonHint('复制 OTP')} disabled={!code} onClick={() => onCopy('OTP', code)}>
          <Copy size={14} />
        </Button>
      </span>
      {canRefresh && (
        <Button className="copyButton detailOtpRefresh" {...buttonHint(refreshHint)} disabled={refreshDisabled} onClick={onRefresh}>
          <RefreshCw size={14} />
        </Button>
      )}
    </AccountActionRow>
  );
}
