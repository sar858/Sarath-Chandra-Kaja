
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { Message } from '../types';
import { PaperAirplaneIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/solid';

const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', content: "Welcome to Vertex Explorer Chat. I'm powered by Gemini 3 Pro. How can I assist you today?" }
  ]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() && !image) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, image: image || undefined };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setImage(null);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      let contents: any;
      if (userMsg.image) {
        const base64Data = userMsg.image.split(',')[1];
        contents = {
          parts: [
            { inlineData: { mimeType: 'image/png', data: base64Data } },
            { text: userMsg.content || 'Analyze this image' }
          ]
        };
      } else {
        contents = userMsg.content;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents,
        config: {
          thinkingConfig: { thinkingBudget: 32768 }
        }
      });

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response.text || 'Sorry, I encountered an issue processing that.'
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: 'err', role: 'model', content: "I'm having trouble connecting to the neural network. Please check your configuration." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto px-4 py-8">
      <div className="flex-1 overflow-y-auto space-y-6 pb-24 scroll-smooth">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
            }`}>
              {m.image && (
                <img src={m.image} alt="Upload" className="mb-3 rounded-lg max-h-64 object-cover border border-indigo-400/30" />
              )}
              <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 text-slate-400 italic flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-150"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-300"></span>
              Gemini is thinking...
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="fixed bottom-8 left-64 right-0 px-8">
        <div className="max-w-5xl mx-auto bg-slate-900 border border-slate-700 p-3 rounded-2xl shadow-2xl flex flex-col gap-3">
          {image && (
            <div className="relative w-20 h-20 group">
              <img src={image} className="w-full h-full object-cover rounded-lg border border-slate-600" />
              <button 
                onClick={() => setImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <TrashIcon className="w-3 h-3 text-white" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-3">
            <label className="cursor-pointer hover:bg-slate-800 p-2 rounded-xl transition-colors">
              <PhotoIcon className="w-6 h-6 text-slate-400" />
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-slate-100 resize-none h-12 py-3"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || (!input.trim() && !image)}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-3 rounded-xl transition-all shadow-lg"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
