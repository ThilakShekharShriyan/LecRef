import { useRef, useState, useCallback, useEffect } from 'react';

// Global audio state with better management
interface GlobalAudioState {
  audio: HTMLAudioElement | null;
  cardId: string | null;
  cleanup: () => void;
}

let globalAudio: GlobalAudioState = {
  audio: null,
  cardId: null,
  cleanup: () => {}
};

// Map to store reset state callbacks for each card
// This allows us to notify a card when its audio stops from another card
const cardResetCallbacks = new Map<string, () => void>();

// Logger utility for consistent logging
const logger = {
  info: (msg: string, data?: any) => console.log(`[AudioPlayer] ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.warn(`[AudioPlayer] ${msg}`, data || ''),
  error: (msg: string, data?: any) => console.error(`[AudioPlayer] ${msg}`, data || ''),
};

export interface AudioPlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  cardId: string | null;
}

/**
 * Hook to manage audio playback with support for:
 * - Only one audio playing at a time
 * - Pause/resume functionality
 * - Automatic stopping of other audios
 */
export function useAudioPlayer(cardId: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset state function - used to notify this card when another card takes over
  const resetState = useCallback(() => {
    logger.info(`Resetting state for card: ${cardId}`);
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoading(false);
  }, [cardId]);

  // Register this card's reset callback on mount so other cards can signal us
  useEffect(() => {
    cardResetCallbacks.set(cardId, resetState);
    logger.info(`Registered reset callback for card: ${cardId}`);
    return () => {
      cardResetCallbacks.delete(cardId);
      logger.info(`Unregistered reset callback for card: ${cardId}`);
    };
  }, [cardId, resetState]);

  // Cleanup function to stop any audio
  const stopAllAudio = useCallback(() => {
    if (globalAudio.audio) {
      const previousCardId = globalAudio.cardId;
      logger.info(`Stopping audio from card: ${previousCardId}`);
      globalAudio.audio.pause();
      globalAudio.audio.currentTime = 0;
      
      // Cleanup previous listeners
      if (globalAudio.cleanup) {
        globalAudio.cleanup();
      }

      // Notify the previous card that its audio was stopped
      if (previousCardId && cardResetCallbacks.has(previousCardId)) {
        logger.info(`Notifying card ${previousCardId} to reset state`);
        cardResetCallbacks.get(previousCardId)?.();
      }
    }
    globalAudio = { audio: null, cardId: null, cleanup: () => {} };
  }, []);

  const play = useCallback(
    async (text: string) => {
      logger.info(`Play called for card: ${cardId}`);
      setIsLoading(true);
      try {
        // Stop any other playing audio FIRST
        stopAllAudio();

        logger.info(`Fetching TTS synthesis for card: ${cardId}`, { textLength: text.length });
        
        // Fetch audio from TTS endpoint
        const response = await fetch('http://localhost:8000/api/tts/synthesize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        });

        logger.info(`TTS response status: ${response.status}`, { cardId });

        if (!response.ok) {
          logger.error(`TTS synthesis failed with status: ${response.status}`, { cardId });
          const errorText = await response.text();
          logger.error(`TTS error response: ${errorText}`);
          setIsPlaying(false);
          setIsLoading(false);
          return;
        }

        const blob = await response.blob();
        logger.info(`Got audio blob`, { size: blob.size, type: blob.type, cardId });
        
        const url = URL.createObjectURL(blob);
        logger.info(`Created object URL: ${url.substring(0, 50)}...`, { cardId });

        // Create new audio element
        const audio = new Audio(url);
        audioRef.current = audio;

        // Setup cleanup function
        let isComponentMounted = true;
        const cleanup = () => {
          isComponentMounted = false;
          if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        };

        // Set up event listeners
        const handleEnded = () => {
          if (!isComponentMounted) return;
          logger.info(`Audio ended for card: ${cardId}`);
          setIsPlaying(false);
          setIsPaused(false);
          URL.revokeObjectURL(url);
        };

        const handlePlay = () => {
          if (!isComponentMounted) return;
          logger.info(`Audio playing for card: ${cardId}`);
          setIsPlaying(true);
          setIsPaused(false);
          setIsLoading(false);
        };

        const handlePause = () => {
          if (!isComponentMounted) return;
          logger.info(`Audio paused for card: ${cardId}`);
          setIsPaused(true);
        };

        const handleError = (e: Event) => {
          if (!isComponentMounted) return;
          logger.error(`Audio error for card: ${cardId}`, e);
          setIsPlaying(false);
          setIsPaused(false);
          setIsLoading(false);
        };

        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('error', handleError);

        // Update global audio state
        globalAudio = { audio, cardId, cleanup };

        logger.info(`About to call audio.play() for card: ${cardId}`);
        setIsPlaying(true);
        setIsPaused(false);
        await audio.play();
        logger.info(`audio.play() succeeded for card: ${cardId}`);
      } catch (error) {
        logger.error(`Error in play function for card: ${cardId}`, error);
        setIsPlaying(false);
        setIsPaused(false);
        setIsLoading(false);
      }
    },
    [cardId, stopAllAudio]
  );

  const pause = useCallback(() => {
    logger.info(`Pause called for card: ${cardId}`, { isPlaying, isPaused });
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPaused(true);
      logger.info(`Paused audio for card: ${cardId}`);
    }
  }, [isPlaying, cardId]);

  const resume = useCallback(() => {
    logger.info(`Resume called for card: ${cardId}`, { isPlaying, isPaused });
    if (audioRef.current && isPaused) {
      audioRef.current.play();
      setIsPaused(false);
      logger.info(`Resumed audio for card: ${cardId}`);
    }
  }, [isPaused, cardId]);

  const stop = useCallback(() => {
    logger.info(`Stop called for card: ${cardId}`);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      const url = audioRef.current.src;
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
        logger.info(`Revoked object URL for card: ${cardId}`);
      }
    }
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoading(false);
  }, [cardId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current === globalAudio.audio && globalAudio.cardId === cardId) {
        logger.info(`Cleanup on unmount for card: ${cardId}`);
        stopAllAudio();
      }
    };
  }, [cardId, stopAllAudio]);

  return {
    isPlaying,
    isPaused,
    isLoading,
    play,
    pause,
    resume,
    stop,
    isCurrentCard: globalAudio.cardId === cardId,
  };
}
