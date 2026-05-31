import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { accountCarrierByID, accountCarrierID, accountCarrierMatchesID, accountRecordFromCarrier, type AccountRecordCarrier } from './carrier';
import type { AccountRecord } from './types';

export type AccountSelectionOptions<T extends AccountRecordCarrier> = {
  selectedID?: string;
  setSelectedID?: Dispatch<SetStateAction<string>>;
  initialSelectedID?: string;
  recordOf?: (carrier: T) => AccountRecord | undefined;
  autoSelectFirst?: boolean;
  clearMissingSelection?: boolean;
  enabled?: boolean;
};

export function useAccountSelection<T extends AccountRecordCarrier>(
  carriers: readonly T[] | undefined | null,
  options: AccountSelectionOptions<T> = {},
) {
  const [internalSelectedID, setInternalSelectedID] = useState(options.initialSelectedID || '');
  const selectedID = options.selectedID ?? internalSelectedID;
  const setSelectedID = options.setSelectedID ?? setInternalSelectedID;
  const recordOf = options.recordOf ?? accountRecordFromCarrier;
  const selected = useMemo(() => accountCarrierByID(carriers, selectedID, recordOf), [carriers, selectedID, recordOf]);
  const firstAccountID = accountCarrierID(carriers?.[0], recordOf);

  useEffect(() => {
    if (options.enabled === false) return;
    if (!selectedID && options.autoSelectFirst && firstAccountID) {
      setSelectedID(firstAccountID);
      return;
    }
    if (selectedID && options.clearMissingSelection && !selected) setSelectedID('');
  }, [firstAccountID, options.autoSelectFirst, options.clearMissingSelection, options.enabled, selected, selectedID, setSelectedID]);

  return {
    selectedID,
    setSelectedID,
    selected,
    selectedAccountID: accountCarrierID(selected, recordOf),
    firstAccountID,
    selectAccount: (carrier: T) => setSelectedID(accountCarrierID(carrier, recordOf)),
    selectFirstAccount: () => setSelectedID(firstAccountID),
    clearSelection: () => setSelectedID(''),
    isSelected: (carrier: T) => accountCarrierMatchesID(carrier, selectedID, recordOf),
  };
}
