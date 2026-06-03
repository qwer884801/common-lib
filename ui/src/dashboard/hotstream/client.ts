import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { HotStreamControlKind } from '../../proto/byte/v/forge/contracts/observability/v1/hotstream';
import type { HotStreamControlEvent, HotStreamEvent } from '../../proto/byte/v/forge/contracts/observability/v1/hotstream';

export type HotStreamFilters = {
  eventTypes?: string[];
  resourceTypes?: string[];
  resourceIds?: string[];
  scopes?: string[];
  attributes?: Record<string, string>;
};

export type HotStreamSubscriptionOptions = {
  enabled?: boolean;
  url: string;
  eventName?: string;
  controlEventName?: string;
  onEvent?: (event: HotStreamEvent, queryClient: QueryClient) => void;
  onControl?: (event: HotStreamControlEvent, queryClient: QueryClient) => void;
  onError?: (event: Event, queryClient: QueryClient) => void;
};

export type HotStreamInvalidationRule = {
  queryKey: QueryKey;
  eventTypes?: string[];
  resourceTypes?: string[];
  resourceIds?: string[];
  scopes?: string[];
};

export type HotStreamInvalidationOptions = Omit<HotStreamSubscriptionOptions, 'onEvent'> & {
  rules: HotStreamInvalidationRule[];
  onEvent?: (event: HotStreamEvent, queryClient: QueryClient) => void;
};

const defaultEventName = 'hotstream';
const defaultControlEventName = 'hotstream.control';

export function useHotStreamSubscription(options: HotStreamSubscriptionOptions) {
  const queryClient = useQueryClient();
  const latest = useRef(options);
  latest.current = options;
  const enabled = options.enabled !== false;
  const eventName = options.eventName || defaultEventName;
  const controlEventName = options.controlEventName || defaultControlEventName;

  useEffect(() => {
    if (!enabled || !options.url) return;
    const source = new EventSource(options.url);
    const eventHandler = (message: Event) => {
      const event = parseMessage<HotStreamEvent>(message);
      if (event) latest.current.onEvent?.(event, queryClient);
    };
    const controlHandler = (message: Event) => {
      const event = parseMessage<HotStreamControlEvent>(message);
      if (event) latest.current.onControl?.(event, queryClient);
    };
    const errorHandler = (event: Event) => latest.current.onError?.(event, queryClient);
    source.addEventListener(eventName, eventHandler);
    source.addEventListener(controlEventName, controlHandler);
    source.addEventListener('error', errorHandler);
    return () => {
      source.removeEventListener(eventName, eventHandler);
      source.removeEventListener(controlEventName, controlHandler);
      source.removeEventListener('error', errorHandler);
      source.close();
    };
  }, [enabled, eventName, controlEventName, options.url, queryClient]);
}

export function useHotStreamInvalidation(options: HotStreamInvalidationOptions) {
  useHotStreamSubscription({
    ...options,
    onEvent: (event, queryClient) => {
      for (const rule of options.rules) {
        if (matchesRule(event, rule)) queryClient.invalidateQueries({ queryKey: rule.queryKey });
      }
      options.onEvent?.(event, queryClient);
    },
    onControl: (event, queryClient) => {
      if (event.kind === HotStreamControlKind.HOT_STREAM_CONTROL_KIND_RESYNC_REQUIRED) {
        for (const rule of options.rules) queryClient.invalidateQueries({ queryKey: rule.queryKey });
      }
      options.onControl?.(event, queryClient);
    },
    onError: (event, queryClient) => {
      for (const rule of options.rules) queryClient.invalidateQueries({ queryKey: rule.queryKey });
      options.onError?.(event, queryClient);
    },
  });
}

export function createHotStreamURL(apiBase: string, filters: HotStreamFilters = {}) {
  const params = new URLSearchParams();
  appendAll(params, 'event_type', filters.eventTypes);
  appendAll(params, 'resource_type', filters.resourceTypes);
  appendAll(params, 'resource_id', filters.resourceIds);
  appendAll(params, 'scope', filters.scopes);
  for (const [key, value] of Object.entries(filters.attributes || {})) {
    if (key.trim() && value.trim()) params.append(`attr.${key.trim()}`, value.trim());
  }
  const query = params.toString();
  return `${apiBase.replace(/\/$/, '')}/streams/state${query ? `?${query}` : ''}`;
}

function parseMessage<T>(message: Event): T | null {
  try {
    return JSON.parse((message as MessageEvent<string>).data) as T;
  } catch {
    return null;
  }
}

function matchesRule(event: HotStreamEvent, rule: HotStreamInvalidationRule) {
  return includes(rule.eventTypes, event.metadata?.type) &&
    includes(rule.resourceTypes, event.resource_type) &&
    includes(rule.resourceIds, event.resource_id) &&
    includes(rule.scopes, event.scope);
}

function includes(values: string[] | undefined, value: string | undefined) {
  return !values?.length || values.includes(value || '');
}

function appendAll(params: URLSearchParams, name: string, values?: string[]) {
  for (const value of values || []) {
    const trimmed = value.trim();
    if (trimmed) params.append(name, trimmed);
  }
}
