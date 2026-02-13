
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { MicrophoneIcon, StopIcon, WavesIcon } from './Icons';

const LiveVoiceView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [status, setStatus] = useState('Ready to chat');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('Voice Link Established');
            setIsActive(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscription(prev => [...prev, `AI: ${text}`]);
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Session error:', e);
            setStatus('Connection Interrupted');
            setIsActive(false);
          },
          onclose: () => {
            setIsActive(false);
            setStatus('Link Closed');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: 'You are a highly advanced AI assistant in the Vertex workspace. Speak naturally and helpfuly.',
          outputAudioTranscription: {}
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setStatus('Failed to access microphone');
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      // Assuming session might have a close method if implemented in SDK
      try { (sessionRef.current as any).close(); } catch {}
    }
    setIsActive(false);
    setStatus('Ready to chat');
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
  };

  return (
    <div className="h-full flex flex-col p-8 max-w-4xl mx-auto">
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-black text-white mb-4">Live Interaction</h2>
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-sm font-medium gap-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
          {status}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className={`
          w-64 h-64 rounded-full flex items-center justify-center transition-all duration-700 relative
          ${isActive ? 'bg-indigo-600/20 scale-110 shadow-[0_0_100px_rgba(79,70,229,0.3)]' : 'bg-slate-900'}
        `}>
          {isActive && (
            <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-ping"></div>
          )}
          <button
            onClick={isActive ? stopSession : startSession}
            className={`
              w-48 h-48 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95
              ${isActive ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}
            `}
          >
            {isActive ? <StopIcon className="w-20 h-20" /> : <MicrophoneIcon className="w-20 h-20" />}
          </button>
        </div>

        <div className="mt-16 w-full max-w-2xl bg-slate-900/50 backdrop-blur border border-slate-800 rounded-3xl p-6 h-64 overflow-y-auto space-y-3">
          {transcription.length === 0 ? (
            <p className="text-slate-600 text-center italic mt-12">Conversation transcript will appear here...</p>
          ) : (
            transcription.map((t, i) => (
              <div key={i} className="text-slate-300 text-sm animate-fadeIn">
                <span className="font-mono text-indigo-400 mr-2 opacity-50">[{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}]</span>
                {t}
              </div>
            ))
          )}
        </div>
      </div>
      
      <p className="mt-8 text-center text-slate-500 text-sm">
        Click the sphere to toggle neural voice link. Uses ultra-low latency PCM streaming.
      </p>
    </div>
  );
};

export default LiveVoiceView;
