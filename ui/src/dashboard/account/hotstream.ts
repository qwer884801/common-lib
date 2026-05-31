import { createHotStreamURL, useHotStreamInvalidation, type HotStreamInvalidationRule } from '../hotstream';

export type AccountEventInvalidationOptions = {
  apiBase: string;
  eventTypes: string[];
  resourceTypes: string[];
  rules: HotStreamInvalidationRule[];
  enabled?: boolean;
};

export function useAccountHotStreamInvalidation({ apiBase, queryKey, sourceService, accountType, enabled = true }: {
  apiBase: string;
  queryKey: HotStreamInvalidationRule['queryKey'];
  sourceService?: string;
  accountType?: string;
  enabled?: boolean;
}) {
  useHotStreamInvalidation({
    enabled,
    url: createHotStreamURL(apiBase, {
      attributes: {
        ...(sourceService ? { source_service: sourceService } : {}),
        ...(accountType ? { account_type: accountType } : {}),
      },
    }),
    rules: [{ queryKey }],
  });
}

export function useAccountEventInvalidation({ apiBase, eventTypes, resourceTypes, rules, enabled = true }: AccountEventInvalidationOptions) {
  useHotStreamInvalidation({
    enabled,
    url: createHotStreamURL(apiBase, { eventTypes, resourceTypes }),
    rules,
  });
}
