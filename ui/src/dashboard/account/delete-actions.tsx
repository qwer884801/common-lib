import { Trash2 } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { AccountActionTone } from '../../proto/byte/v/forge/contracts/account/v1/account';
import type { ActionButtonDescriptor } from '../common/actions';
import type { RowActionDescriptor } from '../types';
import { accountCarrierEmail, accountCarrierID, type AccountRecordCarrier } from './carrier';
import type { AccountAction } from './types';

export type AccountIDSetter = Dispatch<SetStateAction<string>>;

export type DeleteAccountCarrierOptions<T extends AccountRecordCarrier> = {
  deleteByID: (accountID: string, carrier: T) => unknown | Promise<unknown>;
  setSelectedID?: AccountIDSetter;
  invalidate?: () => void | Promise<void>;
  confirmMessage?: string | ((carrier: T, accountID: string) => string);
};

export async function deleteAccountCarrier<T extends AccountRecordCarrier>(carrier: T, options: DeleteAccountCarrierOptions<T>) {
  const accountID = accountCarrierID(carrier);
  if (!accountID) throw new Error('account_id is required');
  const message = accountDeleteConfirmMessage(carrier, accountID, options.confirmMessage);
  if (message && typeof window !== 'undefined' && !window.confirm(message)) return false;
  await options.deleteByID(accountID, carrier);
  if (options.setSelectedID) clearSelectedAccountID(options.setSelectedID, accountID);
  await options.invalidate?.();
  return true;
}

export function clearSelectedAccountID(setSelectedID: AccountIDSetter, deleted: string | Iterable<string>) {
  const deletedIDs = typeof deleted === 'string' ? new Set([deleted]) : new Set(Array.from(deleted));
  setSelectedID((prev) => deletedIDs.has(prev) ? '' : prev);
}

export function accountDeleteRowAction(onDelete: () => void | Promise<void>, disabled?: boolean, label = '删除账号'): RowActionDescriptor {
  return {
    label,
    icon: <Trash2 size={14} />,
    onClick: () => void onDelete(),
    disabled,
    kind: 'danger',
  };
}

export function accountDeleteButtonAction(onDelete: () => void | Promise<void>, disabled?: boolean, label = '删除账号'): ActionButtonDescriptor {
  return {
    id: 'delete-account',
    label,
    hint: '删除当前账号记录',
    icon: <Trash2 size={14} />,
    variant: 'destructive',
    disabled,
    onClick: () => void onDelete(),
  };
}

export function accountDeleteCardAction(onDelete: () => void | Promise<void>, disabled?: boolean, label = '删除账号'): AccountAction {
  return {
    action_id: 'delete-account',
    label,
    tone: AccountActionTone.ACCOUNT_ACTION_TONE_DANGER,
    disabled: Boolean(disabled),
    disabled_reason: disabled ? label : '',
    requires_confirmation: true,
    icon: <Trash2 size={14} />,
    onRun: () => void onDelete(),
  };
}

function accountDeleteConfirmMessage<T extends AccountRecordCarrier>(carrier: T, accountID: string, message?: DeleteAccountCarrierOptions<T>['confirmMessage']) {
  if (typeof message === 'function') return message(carrier, accountID);
  if (message !== undefined) return message;
  return `删除账号 ${accountCarrierEmail(carrier) || accountID}？`;
}
