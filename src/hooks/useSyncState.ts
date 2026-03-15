import { useState, useEffect, useCallback } from 'react';

type SyncState = {
  pdfId: string | null;
  currentSlide: number;
};

const CHANNEL_NAME = 'presentpdf_sync';

export function useSyncState() {
  const [state, setState] = useState<SyncState>({
    pdfId: null,
    currentSlide: 1,
  });
  
  const [channel, setChannel] = useState<BroadcastChannel | null>(null);

  useEffect(() => {
    const bc = new BroadcastChannel(CHANNEL_NAME);
    setChannel(bc);
    
    bc.onmessage = (event) => {
      setState(event.data);
    };
    
    return () => {
      bc.close();
    };
  }, []);

  const setSyncState = useCallback((newState: Partial<SyncState>) => {
    setState((prev) => {
      const updated = { ...prev, ...newState };
      if (channel) {
        channel.postMessage(updated);
      }
      return updated;
    });
  }, [channel]);

  return { state, setSyncState };
}
