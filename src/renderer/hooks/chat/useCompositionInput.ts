import { useRef, useState } from 'react';

/**
 * Shared IME composition event handler hook.
 * Eliminates duplicated IME handling code between the SendBox component and GUID pages.
 */
export const useCompositionInput = () => {
  const isComposing = useRef(false);
  const [isComposingState, setIsComposingState] = useState(false);

  const compositionHandlers = {
    onCompositionStartCapture: () => {
      isComposing.current = true;
      setIsComposingState(true);
    },
    onCompositionEndCapture: () => {
      isComposing.current = false;
      setIsComposingState(false);
    },
  };

  const createKeyDownHandler = (onEnterPress: () => void, onKeyDownIntercept?: (e: React.KeyboardEvent) => boolean) => {
    return (e: React.KeyboardEvent) => {
      if (isComposing.current) return;
      if (onKeyDownIntercept?.(e)) return;
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onEnterPress();
      }
    };
  };

  return {
    isComposing,
    isComposingState,
    compositionHandlers,
    createKeyDownHandler,
  };
};
