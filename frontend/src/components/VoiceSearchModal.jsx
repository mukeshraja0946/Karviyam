import React, { useState, useEffect } from 'react';
import { Mic, MicOff, X, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VoiceSearchModal({ isOpen, onClose }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      setIsListening(false);
      setTranscript('');
    }
  }, [isOpen]);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setTranscript('Voice recognition is not supported in this browser. Please type your search.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('Listening... Speak now...');
    };

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const resultText = event.results[current][0].transcript;
      setTranscript(resultText);
      if (event.results[current].isFinal) {
        setIsListening(false);
        setTimeout(() => {
          onClose();
          navigate(`/shop?search=${encodeURIComponent(resultText)}`);
        }, 1000);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setTranscript('Could not detect speech. Click microphone to try again.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl border border-slate-200 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-display font-bold text-xl text-slate-900 mb-2">Voice Search</h3>
        <p className="text-xs text-slate-500 mb-8">Say a product name, brand, or category (e.g. "Oversized Tee", "Sneakers")</p>

        {/* Pulsing Mic Button */}
        <div className="relative inline-flex items-center justify-center mb-6">
          {isListening && (
            <span className="absolute w-24 h-24 bg-red-500/20 rounded-full animate-ping pointer-events-none" />
          )}
          <button
            onClick={startListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all ${
              isListening
                ? 'bg-gradient-to-tr from-[#D32F2F] to-[#B71C1C] scale-105'
                : 'bg-slate-800 hover:bg-[#B71C1C]'
            }`}
          >
            {isListening ? <Mic className="w-8 h-8 animate-bounce" /> : <MicOff className="w-8 h-8" />}
          </button>
        </div>

        <p className="text-sm font-semibold text-[#B71C1C] min-h-[40px]">
          {transcript}
        </p>

        {transcript && !isListening && (
          <button
            onClick={() => {
              onClose();
              navigate(`/shop?search=${encodeURIComponent(transcript)}`);
            }}
            className="mt-4 inline-flex items-center gap-2 bg-[#B71C1C] hover:bg-[#900C0C] text-white px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-md"
          >
            <Search className="w-4 h-4" />
            <span>Search "{transcript}"</span>
          </button>
        )}
      </div>
    </div>
  );
}
