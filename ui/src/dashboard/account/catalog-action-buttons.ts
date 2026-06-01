import type { ActionButtonDescriptor } from '../common/actions';
import type { RowActionDescriptor } from '../types';
import {
  accountActionButton,
  accountRowAction,
  type AccountActionSubjectLike,
  type AccountButtonActionSpec,
  type AccountCatalogActionContext,
  type AccountRowActionSpec,
} from './action-catalog';

export function accountActionButtons<TAccount extends AccountActionSubjectLike>(
  ctx: AccountCatalogActionContext<TAccount>,
  specs: AccountButtonActionSpec<TAccount>[],
): ActionButtonDescriptor[] {
  return specs.map((spec) => accountActionButton(ctx, spec));
}

export function accountRowActions<TAccount extends AccountActionSubjectLike>(
  ctx: AccountCatalogActionContext<TAccount>,
  specs: AccountRowActionSpec<TAccount>[],
): RowActionDescriptor[] {
  return specs
    .map((spec) => accountRowAction(ctx, spec))
    .filter((action): action is RowActionDescriptor => Boolean(action));
}
