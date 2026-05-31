import { ActionButtonGroup, type ActionButtonDescriptor } from '../common/actions';
import { AccountActionTone } from '../../proto/byte/v/forge/contracts/account/v1/account';
import type { AccountAction, AccountRecord } from './types';

export function AccountActionBar({ account, actions }: { account: AccountRecord; actions: AccountAction[] }) {
  return <div onClick={(event) => event.stopPropagation()}><ActionButtonGroup actions={actions.map((action) => toButton(account, action))} /></div>;
}

function toButton(account: AccountRecord, action: AccountAction): ActionButtonDescriptor {
  return {
    id: action.action_id,
    label: action.label,
    icon: action.icon,
    visible: action.visible,
    disabled: action.disabled,
    hint: action.disabled_reason || action.label,
    variant: action.tone === AccountActionTone.ACCOUNT_ACTION_TONE_DANGER ? 'destructive' : undefined,
    onClick: () => runAction(account, action),
  };
}

function runAction(account: AccountRecord, action: AccountAction) {
  if (action.requires_confirmation && typeof window !== 'undefined' && !window.confirm(action.label)) return;
  void action.onRun?.(account);
}
