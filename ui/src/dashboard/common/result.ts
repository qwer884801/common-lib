export type OperationResultLike = {
  success?: boolean;
  error_message?: string | null;
  message?: string | null;
};

export type AccountResultLike<T> = OperationResultLike & {
  account?: T | null;
};

export function operationErrorMessage(result: OperationResultLike | null | undefined) {
  return (result?.error_message || '').trim();
}

export function operationSucceeded(result: OperationResultLike | null | undefined) {
  return !operationErrorMessage(result) && result?.success !== false;
}

export function requireOperationSuccess<T extends OperationResultLike>(result: T, fallback = 'operation failed') {
  const message = operationErrorMessage(result);
  if (message || result.success === false) throw new Error(message || fallback);
  return result;
}

export function requireResultAccount<T>(result: AccountResultLike<T>, fallback = 'account is required') {
  requireOperationSuccess(result, fallback);
  if (!result.account) throw new Error(fallback);
  return result.account;
}

export function operationMessage(result: OperationResultLike | null | undefined, fallback = 'ok') {
  return operationErrorMessage(result) || result?.message?.trim() || fallback;
}
