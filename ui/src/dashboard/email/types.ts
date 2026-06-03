import type {
  EmailInboxMessage,
  EmailSignal,
  FetchMailboxInboxResult,
  FetchMailboxInboxesRequest,
  FetchMailboxInboxesResponse,
  GetMailboxOperationRequest,
  GetMailboxOperationResponse,
  ListMailboxDomainsRequest,
  ListMailboxDomainsResponse,
  ListMailboxInboxRequest,
  ListMailboxInboxResponse,
  ListMailboxOperationsRequest,
  ListMailboxOperationsResponse,
  ListMailboxProviderCapabilitiesRequest,
  ListMailboxProviderCapabilitiesResponse,
  MailboxDomain,
  MailboxCredentialState,
  MailboxOperation,
  MailboxProviderActionCapability,
  MailboxProviderCapabilities,
  RegisterMailboxRequest,
  RegisterMailboxResponse,
  StartMailboxOAuthRequest,
  StartMailboxOAuthResponse,
  SyncMailboxDomainsRequest,
  SyncMailboxDomainsResponse,
  WaitForMailboxEmailRequest,
  WaitForMailboxEmailResponse,
  EmailMailbox
} from '../../proto/byte/v/forge/contracts/mailbox/v1/mailbox';

export {
  MailboxAuthStatus,
  MailboxCredentialKind,
  MailboxOperationAction,
  MailboxOperationStatus,
  MailboxProviderAction
} from '../../proto/byte/v/forge/contracts/mailbox/v1/mailbox';
export type {
  EmailInboxMessage,
  EmailMailbox,
  EmailSignal,
  FetchMailboxInboxResult,
  FetchMailboxInboxesRequest,
  FetchMailboxInboxesResponse,
  GetMailboxOperationRequest,
  GetMailboxOperationResponse,
  ListMailboxDomainsRequest,
  ListMailboxDomainsResponse,
  ListMailboxInboxRequest,
  ListMailboxInboxResponse,
  ListMailboxOperationsRequest,
  ListMailboxOperationsResponse,
  ListMailboxProviderCapabilitiesRequest,
  ListMailboxProviderCapabilitiesResponse,
  MailboxDomain,
  MailboxCredentialState,
  MailboxOperation,
  MailboxProviderActionCapability,
  MailboxProviderCapabilities,
  RegisterMailboxRequest,
  RegisterMailboxResponse,
  StartMailboxOAuthRequest,
  StartMailboxOAuthResponse,
  SyncMailboxDomainsRequest,
  SyncMailboxDomainsResponse,
  WaitForMailboxEmailRequest,
  WaitForMailboxEmailResponse
};

export type Mailbox = EmailMailbox;
export type MailboxProviderCapability = MailboxProviderCapabilities;
export type InboxMessage = EmailInboxMessage & { otp?: string };
export type InboxResult = Omit<FetchMailboxInboxResult, 'mailbox' | 'messages'> & {
  mailbox?: Mailbox;
  messages?: InboxMessage[];
};
export type InboxResponse = Omit<FetchMailboxInboxesResponse, 'operation_id' | 'results'> & {
  operation_id?: string;
  results?: InboxResult[];
};
export type LatestOtp = {
  otp: string;
  subject: string;
  received_at_unix: number;
};
