import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import {
  isSpeechRecognitionSupported,
  OneShotDictationHandle,
  startOneShotDictation,
} from '../vr/voiceEngine';

interface VoiceDictationButtonProps {
  onTranscript: (text: string) => void;
  title?: string;
  size?: 'xs' | 'sm';
  accent?: 'gold' | 'cyan';
  onErrorMessage?: (msg: string | null) => void;
  className?: string;
}

export const VoiceDictationButton: React.FC<VoiceDictationButtonProps> = ({
  onTranscript,
  title = 'Dicter au microphone',
  size = 'sm',
  accent = 'cyan',
  onErrorMessage,
  className = '',
}) => {
  const [listening, setListening] = useState(false);
  const handleRef = useRef<OneShotDictationHandle | null>(null);
  const supported = isSpeechRecognitionSupported();

  useEffect(() => {
    return () => {
      handleRef.current?.stop();
      handleRef.current = null;
    };
  }, []);

  if (!supported) {
    return null;
  }

  const toggleDictation = () => {
    if (listening) {
      handleRef.current?.stop();
      handleRef.current = null;
      setListening(false);
      return;
    }

    onErrorMessage?.(null);
    const handle = startOneShotDictation({
      lang: 'fr-FR',
      onStart: () => setListening(true),
      onResult: (finalText) => {
        setListening(false);
        handleRef.current = null;
        onTranscript(finalText);
      },
      onError: (msg) => {
        setListening(false);
        handleRef.current = null;
        onErrorMessage?.(msg);
      },
      onEnd: () => {
        setListening(false);
        handleRef.current = null;
      },
    });
    handleRef.current = handle;
  };

  const padCls = size === 'xs' ? 'p-1.5' : 'p-2';
  const iconCls = size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const idleTone =
    accent === 'gold'
      ? 'border-white/15 bg-white/[0.04] text-amber-300/80 hover:border-amber-300/40 hover:text-amber-200'
      : 'border-white/15 bg-white/[0.04] text-amber-300/80 hover:border-amber-300/40 hover:text-amber-200';

  return (
    <button
      type="button"
      onClick={toggleDictation}
      aria-label={listening ? 'Arrêter la dictée vocale' : title}
      title={listening ? 'Écoute en cours… Cliquer pour arrêter' : title}
      className={`rounded-xl border transition-all duration-300 cursor-pointer shrink-0 ${padCls} ${
        listening
          ? 'border-rose-400 bg-rose-500/25 text-rose-200 animate-pulse'
          : idleTone
      } ${className}`}
    >
      {listening ? <MicOff className={iconCls} /> : <Mic className={iconCls} />}
    </button>
  );
};
