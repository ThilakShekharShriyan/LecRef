import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface AudioStreamState {
    isListening: boolean;
    isConnected: boolean;
    transcript: string;
    definitions: any[];
    deepResearchCards: any[];
    takeaways: string[];
    researchQueries: any[];
    summary: string;
    topic: string;
    emphasisLevel: number;
}

const SAMPLE_RATE = 16000;
const BUFFER_SIZE = 4096;

export function useAudioStream(lectureId: string | undefined) {
    const [state, setState] = useState<AudioStreamState>({
        isListening: false,
        isConnected: false,
        transcript: '',
        definitions: [],
        deepResearchCards: [],
        takeaways: [],
        researchQueries: [],
        summary: '',
        topic: 'No active lecture',
        emphasisLevel: 0,
    });

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const connect = useCallback(() => {
        if (!lectureId || wsRef.current) return;

        try {
            const ws = new WebSocket(`ws://localhost:8000/ws/${lectureId}`);

            ws.onopen = () => {
                console.log('✅ WebSocket Connected');
                setState(prev => ({ ...prev, isConnected: true }));
                toast.success('Connected to server');
            };

            ws.onclose = () => {
                console.log('❌ WebSocket Disconnected');
                setState(prev => ({ ...prev, isConnected: false, isListening: false }));
                stopAudio();
            };

            ws.onerror = (error) => {
                console.error('WebSocket Error:', error);
                toast.error('Connection error');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    switch (data.type) {
                        case 'transcript_final':
                            setState(prev => ({
                                ...prev,
                                transcript: prev.transcript + (prev.transcript ? ' ' : '') + data.text
                            }));
                            break;

                        // case 'transcript_interim': 
                        //   // Optional: Handle interim results if you want to show them floating
                        //   break;

                        case 'new_card':
                            if (data.card.type === 'deep_research') {
                                setState(prev => ({
                                    ...prev,
                                    deepResearchCards: [data.card, ...prev.deepResearchCards]
                                }));
                            } else {
                                setState(prev => ({
                                    ...prev,
                                    definitions: [data.card, ...prev.definitions]
                                }));
                            }
                            break;

                        case 'new_takeaway':
                            setState(prev => ({
                                ...prev,
                                takeaways: [...prev.takeaways, data.takeaway.text]
                            }));
                            break;

                        case 'topic_update':
                            setState(prev => ({
                                ...prev,
                                topic: data.topic,
                                emphasisLevel: Math.round(data.emphasis_level * 100)
                            }));
                            break;

                        case 'summary_update':
                            setState(prev => ({
                                ...prev,
                                summary: data.summary
                            }));
                            break;

                        case 'deep_research_result':
                            setState(prev => ({
                                ...prev,
                                deepResearchCards: [data.card, ...prev.deepResearchCards]
                            }));
                            break;
                    }
                } catch (e) {
                    console.error('Error parsing message:', e);
                }
            };

            wsRef.current = ws;
        } catch (e) {
            console.error('Connection failed:', e);
            toast.error('Failed to connect to server');
        }
    }, [lectureId]);

    const disconnect = useCallback(() => {
        stopAudio();
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setState(prev => ({ ...prev, isConnected: false, isListening: false }));
    }, []);

    const processAudio = (inputData: Float32Array) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        // Downsample to 16kHz logic would go here if input was 48kHz
        // However, we set AudioContext to 16kHz, so we just need to convert Float32 to Int16

        // Convert Float32 to Int16
        const output = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        wsRef.current.send(output.buffer);
    };

    const startAudio = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Create AudioContext with specific sample rate
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: SAMPLE_RATE,
            });
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            sourceRef.current = source;

            // Use ScriptProcessor for raw audio access (deprecated but reliable for this)
            // bufferSize, inputChannels, outputChannels
            const processor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                processAudio(inputData);
            };

            source.connect(processor);
            processor.connect(audioContext.destination);

            setState(prev => ({ ...prev, isListening: true }));
            toast.success('Microphone active');

            // Send resume signal if needed
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'resume' }));
            }

        } catch (e) {
            console.error('Microphone error:', e);
            toast.error('Microphone access denied');
        }
    }, []);

    const stopAudio = useCallback(() => {
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        // Send pause signal
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'pause' }));
        }

        setState(prev => ({ ...prev, isListening: false }));
    }, []);

    const toggleListening = useCallback(() => {
        if (state.isListening) {
            stopAudio();
        } else {
            if (!state.isConnected) {
                connect();
                // Wait a bit for connection? Ideally connect first then start audio
                // For simplicity in this UI binding, we'll auto-start audio on connect in a real app,
                // but here let's try to start audio immediately after connect logic triggers
                setTimeout(startAudio, 500);
            } else {
                startAudio();
            }
        }
    }, [state.isListening, state.isConnected, connect, startAudio, stopAudio]);

    const triggerDeepResearch = useCallback((selectedText: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.warn('⚠️ WebSocket not connected, cannot trigger deep research');
            return;
        }
        
        const context = state.transcript.slice(-500); // Last 500 chars for context
        const message = {
            type: 'deep_research',
            selected_text: selectedText,
            context: context
        };
        
        wsRef.current.send(JSON.stringify(message));
        console.log('🔍 Deep research requested for:', selectedText);
    }, [state.transcript]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        }
    }, [disconnect]);

    return {
        ...state,
        connect,
        disconnect,
        toggleListening,
        triggerDeepResearch
    };
}
