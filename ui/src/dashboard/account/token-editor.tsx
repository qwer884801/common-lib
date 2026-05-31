import { useEffect } from 'react';
import type { ClipboardEvent } from 'react';
import { Copy, Save } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { ControlledInputControl } from '../common/form-fields';
import { buttonHint, formatUnix } from '../utils';
import { useAsyncActionRunner } from '../common/action-runner';
import { useForm } from 'react-hook-form';
import { accountCarrierID, type AccountRecordCarrier } from './carrier';

export function AccountTokenEditor<T extends AccountRecordCarrier>({
  label,
  field,
  account,
  token,
  expiresAtUnix,
  loading,
  showSecrets,
  onCopy,
  onSave,
}: {
  label: string;
  field: string;
  account: T;
  token: string;
  expiresAtUnix: number;
  loading: boolean;
  showSecrets: boolean;
  onCopy: (label: string, value: string) => void;
  onSave: (account: T, token: string) => void | Promise<void>;
}) {
  const runner = useAsyncActionRunner();
  const { control, handleSubmit, reset, watch } = useForm<{ token: string }>({ defaultValues: { token: '' } });
  const value = watch('token');
  const accountID = accountCarrierID(account);

  useEffect(() => reset({ token: showSecrets ? token : '' }), [accountID, field, reset, showSecrets, token]);

  async function save(values: { token: string }) {
    await runner.run(`save:${field}:${accountID}`, () => onSave(account, values.token.trim()));
  }

  function copyFromInput(event: ClipboardEvent<HTMLInputElement>) {
    if (!value.trim()) return;
    event.preventDefault();
    event.clipboardData.setData('text/plain', value);
  }

  return (
    <form className="editLine" onSubmit={handleSubmit(save)}>
      <Label>{label}</Label>
      <ControlledInputControl
        control={control}
        name="token"
        className="mono"
        type={showSecrets ? 'text' : 'password'}
        onCopy={copyFromInput}
        placeholder={tokenPlaceholder(label, showSecrets, loading, token, expiresAtUnix)}
      />
      <Button className="copyButton" {...buttonHint(`复制 ${label}`)} disabled={!showSecrets || !value.trim()} onClick={() => onCopy(label, value)}>
        <Copy size={14} />
      </Button>
      <Button type="submit" {...buttonHint(`保存 ${label}`)} disabled={runner.busy || !value.trim() || value.trim() === token.trim()}>
        <Save size={14} /> 保存
      </Button>
    </form>
  );
}

function tokenPlaceholder(label: string, showSecrets: boolean, loading: boolean, token: string, expiresAtUnix: number) {
  if (!showSecrets) return '敏感信息已隐藏';
  if (loading) return `读取 ${label}...`;
  if (!token.trim()) return `${label} 未保存或已过期`;
  return expiresAtUnix > 0 ? `有效至 ${formatUnix(expiresAtUnix)}` : `${label} 已保存`;
}
