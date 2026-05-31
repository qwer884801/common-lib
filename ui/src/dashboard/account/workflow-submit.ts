import { api } from '../http';
import { accountActionLabel, accountActionStartPath, type AccountActionCatalogLike } from './action-catalog';

export type AccountWorkflowSubmitToast = {
  showError: (value: unknown) => void;
  showToast: (kind: 'error' | 'ok', message: string) => void;
};

export type AccountWorkflowSubmitResponse = {
  job_id?: string;
  error_message?: string;
};

export type AccountWorkflowSubmitOptions<TCatalog extends AccountActionCatalogLike = AccountActionCatalogLike> = {
  catalog?: TCatalog;
  actionID: string;
  fallbackLabel?: string;
  placement?: string;
  pathPrefix?: string;
  payload?: Record<string, unknown>;
  toast?: AccountWorkflowSubmitToast;
  onSuccess?: (response: AccountWorkflowSubmitResponse) => void | Promise<void>;
  successMessage?: (response: AccountWorkflowSubmitResponse, label: string) => string;
  failureMessage?: (response: AccountWorkflowSubmitResponse, label: string) => string;
};

export async function submitAccountWorkflowAction<TCatalog extends AccountActionCatalogLike = AccountActionCatalogLike>(
  options: AccountWorkflowSubmitOptions<TCatalog>,
) {
  const path = workflowSubmitPath(accountActionStartPath(options.catalog, options.actionID, options.placement), options.pathPrefix);
  if (!path) {
    const message = `动作未注册: ${options.actionID}`;
    options.toast?.showError(message);
    return { error_message: message } satisfies AccountWorkflowSubmitResponse;
  }
  try {
    const response = await api<AccountWorkflowSubmitResponse>(path, {
      method: 'POST',
      body: JSON.stringify(options.payload || {}),
    });
    const label = accountActionLabel(options.catalog, options.actionID, options.fallbackLabel || options.actionID, options.placement);
    options.toast?.showToast(
      response.error_message ? 'error' : 'ok',
      response.error_message
        ? workflowSubmitFailureMessage(response, label, options.failureMessage)
        : workflowSubmitSuccessMessage(response, label, options.successMessage),
    );
    if (!response.error_message) await options.onSuccess?.(response);
    return response;
  } catch (error) {
    options.toast?.showError(error);
    return { error_message: errorMessage(error) } satisfies AccountWorkflowSubmitResponse;
  }
}

function workflowSubmitPath(path: string, prefix?: string) {
  path = path.trim();
  prefix = prefix?.trim() || '';
  if (!path || !prefix || path.startsWith(prefix)) return path;
  return `${prefix.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function workflowSubmitSuccessMessage(
  response: AccountWorkflowSubmitResponse,
  label: string,
  messageOf?: (response: AccountWorkflowSubmitResponse, label: string) => string,
) {
  return messageOf?.(response, label) || `${label} 已提交: ${response.job_id || 'ok'}`;
}

function workflowSubmitFailureMessage(
  response: AccountWorkflowSubmitResponse,
  label: string,
  messageOf?: (response: AccountWorkflowSubmitResponse, label: string) => string,
) {
  return messageOf?.(response, label) || response.error_message || `${label} 提交失败`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
