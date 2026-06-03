import type { ReactNode } from 'react';
import type {
  AccountActionButton,
  AccountActionCatalog,
  AccountActionDefinition,
  AccountActionWorkflowDefinition,
} from '../../proto/byte/v/forge/contracts/account/v1/account';
import type { ActionButtonDescriptor } from '../common/actions';
import type { RowActionDescriptor } from '../types';
import type { AccountRecord } from './types';

export type AccountActionButtonLike = Partial<AccountActionButton>;
export type AccountActionWorkflowLike = Partial<AccountActionWorkflowDefinition>;
export type AccountActionDefinitionLike = Partial<Omit<AccountActionDefinition, 'engine' | 'ui_buttons' | 'workflow'>> & {
  engine?: unknown;
  ui_buttons?: AccountActionButtonLike[] | undefined;
  workflow?: AccountActionWorkflowLike | undefined;
};
export type AccountActionCatalogLike<TAction extends AccountActionDefinitionLike = AccountActionDefinitionLike> = Partial<Omit<AccountActionCatalog, 'actions'>> & {
  actions?: TAction[] | undefined;
};

export type AccountActionSubjectLike = {
  status?: unknown;
  email?: unknown;
  account_id?: unknown;
  account?: AccountRecord | null;
  key?: AccountRecord['key'];
  subject?: AccountRecord['subject'];
};

export type AccountActionAvailability<TAction extends AccountActionDefinitionLike = AccountActionDefinitionLike> = {
  action?: TAction;
  visible: boolean;
  enabled: boolean;
  reason: string;
};

export type AccountCatalogActionContext<TAccount extends AccountActionSubjectLike, TCatalog extends AccountActionCatalogLike = AccountActionCatalogLike> = {
  catalog: TCatalog | undefined;
  account: TAccount;
  busy: boolean;
  placement: string;
};

export type AccountCatalogActionBase<TAccount extends AccountActionSubjectLike, TActionID extends string = string> = {
  actionID: TActionID;
  fallbackLabel: string;
  icon: ReactNode;
  allowed: (account: TAccount) => boolean;
  disabledReason: string;
  hint: string | ((account: TAccount) => string);
};

export type AccountCatalogActionSpec<TAccount extends AccountActionSubjectLike, TActionID extends string = string> = AccountCatalogActionBase<TAccount, TActionID> & {
  onClick: (account: TAccount) => void | Promise<void>;
};

export type AccountButtonActionSpec<TAccount extends AccountActionSubjectLike, TActionID extends string = string> = AccountCatalogActionSpec<TAccount, TActionID> & {
  id: string;
};

export type AccountRowActionSpec<TAccount extends AccountActionSubjectLike, TActionID extends string = string> = AccountCatalogActionSpec<TAccount, TActionID> & {
  kind?: RowActionDescriptor['kind'];
};

export function accountActionDefinition<TAction extends AccountActionDefinitionLike>(catalog: AccountActionCatalogLike<TAction> | undefined, actionID: string | undefined) {
  return catalog?.actions?.find((item) => item.action_id === actionID);
}

export function accountActionButtonDefinition<TAction extends AccountActionDefinitionLike>(action: TAction | undefined, placement?: string) {
  if (!action) return undefined;
  if (!placement) return action.ui_buttons?.[0];
  return action.ui_buttons?.find((button) => button.placement === placement);
}

export function accountActionAvailability<TAction extends AccountActionDefinitionLike, TAccount extends AccountActionSubjectLike>(
  catalog: AccountActionCatalogLike<TAction> | undefined,
  actionID: string,
  account?: TAccount,
  placement?: string
): AccountActionAvailability<TAction> {
  const action = accountActionDefinition(catalog, actionID);
  if (!action) return { visible: false, enabled: false, reason: '动作未注册' };
  if (placement && !accountActionButtonDefinition(action, placement)) return { action, visible: false, enabled: false, reason: '' };
  if (!account) return { action, visible: true, enabled: true, reason: '' };
  const statusValue = accountActionSubjectStatus(account);
  const status = normalizeActionValue(statusValue);
  const blockedStatuses = action.blocked_account_statuses || [];
  if (blockedStatuses.map(normalizeActionValue).includes(status)) return { action, visible: true, enabled: false, reason: `账号状态不可用：${statusValue || '-'}` };
  const requiredAccountStatuses = action.required_account_statuses || [];
  const requiredStatuses = requiredAccountStatuses.map(normalizeActionValue);
  if (requiredStatuses.length && !requiredStatuses.includes(status)) return { action, visible: true, enabled: false, reason: `需要账号状态：${requiredAccountStatuses.join('/')}` };
  const missing = (action.required_fields || []).filter((field) => !String(accountActionSubjectField(account, field) ?? '').trim());
  if (missing.length) return { action, visible: true, enabled: false, reason: `缺少字段：${missing.join(', ')}` };
  return { action, visible: true, enabled: true, reason: '' };
}

export function accountActionLabel(catalog: AccountActionCatalogLike | undefined, actionID: string, fallback: string, placement?: string) {
  const action = accountActionDefinition(catalog, actionID);
  return accountActionButtonDefinition(action, placement)?.label || action?.display_name || fallback;
}

export function accountActionStartPath(catalog: AccountActionCatalogLike | undefined, actionID: string, placement?: string) {
  const action = accountActionDefinition(catalog, actionID);
  return accountActionButtonDefinition(action, placement)?.start_path || action?.workflow?.start_path || '';
}

export function accountActionHasCapability(catalog: AccountActionCatalogLike | undefined, actionID: string | undefined, capability: string) {
  return !!accountActionDefinition(catalog, actionID)?.capabilities?.includes(capability);
}

export function accountActionsWithCapability(catalog: AccountActionCatalogLike | undefined, capability: string) {
  return catalog?.actions?.filter((action) => action.capabilities?.includes(capability)).map((action) => action.action_id || '').filter(Boolean) || [];
}

export function accountActionButton<TAccount extends AccountActionSubjectLike>(ctx: AccountCatalogActionContext<TAccount>, spec: AccountButtonActionSpec<TAccount>): ActionButtonDescriptor {
  const state = accountActionState(ctx, spec);
  return {
    id: spec.id,
    visible: state.visible,
    label: state.label,
    hint: state.hint,
    icon: spec.icon,
    disabled: state.disabled,
    onClick: () => spec.onClick(ctx.account),
  };
}

export function accountRowAction<TAccount extends AccountActionSubjectLike>(ctx: AccountCatalogActionContext<TAccount>, spec: AccountRowActionSpec<TAccount>): RowActionDescriptor | null {
  const state = accountActionState(ctx, spec);
  if (!state.visible) return null;
  const action: RowActionDescriptor = {
    label: state.label,
    icon: spec.icon,
    disabled: state.disabled,
    onClick: () => spec.onClick(ctx.account),
  };
  if (spec.kind) action.kind = spec.kind;
  return action;
}

function accountActionState<TAccount extends AccountActionSubjectLike>(ctx: AccountCatalogActionContext<TAccount>, spec: AccountCatalogActionSpec<TAccount>) {
  const availability = accountActionAvailability(ctx.catalog, spec.actionID, ctx.account, ctx.placement);
  const allowed = spec.allowed(ctx.account);
  return {
    visible: availability.visible,
    label: accountActionLabel(ctx.catalog, spec.actionID, spec.fallbackLabel, ctx.placement),
    hint: availability.reason || (allowed ? actionHint(spec.hint, ctx.account) : spec.disabledReason),
    disabled: ctx.busy || !availability.enabled || !allowed,
  };
}

function actionHint<TAccount>(hint: string | ((account: TAccount) => string), account: TAccount) {
  return typeof hint === 'function' ? hint(account) : hint;
}

function normalizeActionValue(value: unknown) {
  return String(value || '').trim().toUpperCase();
}

function accountActionSubjectField(account: AccountActionSubjectLike, field: string) {
  const record = accountActionRecord(account);
  switch (field) {
    case 'account_id':
      return record?.key?.account_id;
    case 'email':
      return record?.subject?.email || record?.subject?.display;
    case 'status':
      return accountActionSubjectStatus(account);
    default: {
      const value = (account as Record<string, unknown>)[field];
      if (String(value ?? '').trim()) return value;
      const recordValue = (record as unknown as Record<string, unknown> | undefined)?.[field];
      if (String(recordValue ?? '').trim()) return recordValue;
      return record?.credential_states?.find((credential) => credential.kind.trim() === field && credential.present)?.status || '';
    }
  }
}

function accountActionSubjectStatus(account: AccountActionSubjectLike) {
  const value = account.status;
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object' && 'value' in value) return String((value as { value?: unknown }).value ?? '').trim();
  return accountActionRecord(account)?.status?.value || '';
}

function accountActionRecord(account: AccountActionSubjectLike): AccountRecord | undefined {
  if (account.account) return account.account;
  if (account.key || account.subject) return account as AccountRecord;
  return undefined;
}
