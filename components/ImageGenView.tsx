
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { SparklesIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const ImageGenView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setGeneratedImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: { aspectRatio: aspectRatio as any }
        }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          setGeneratedImage(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (err) {
      console.error(err);
      alert('Generation failed. Check your API settings.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Visual Studio</h2>
        <p className="text-slate-400">Transform your imagination into high-fidelity imagery.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        {/* Controls */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 h-fit">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Detailed Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic city with bioluminescent flora and sleek chrome transport vessels..."
              className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 focus:ring-2 focus:ring-indigo-600 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Aspect Ratio</label>
            <div className="grid grid-cols-3 gap-2">
              {['1:1', '3:4', '4:3', '9:16', '16:9'].map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`py-2 text-sm rounded-lg border transition-all ${
                    aspectRatio === ratio 
                      ? 'bg-indigo-600 border-indigo-500 text-white' 
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <SparklesIcon className="w-5 h-5" />
            )}
            {isLoading ? 'Synthesizing...' : 'Generate Image'}
          </button>
        </div>

        {/* Display */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden relative min-h-[400px] flex items-center justify-center">
          {generatedImage ? (
            <div className="relative group w-full h-full flex items-center justify-center p-4">
              <img src={generatedImage} alt="Generated" className="max-w-full max-h-full rounded-xl shadow-2xl object-contain" />
              <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <a 
                  href={generatedImage} 
                  download="vertex-gen.png"
                  className="bg-white/10 backdrop-blur-md hover:bg-white/20 p-3 rounded-full text-white transition-colors"
                >
                  <ArrowDownTrayIcon className="w-6 h-6" />
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center p-12">
              <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <PhotoIcon className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-slate-500 text-lg font-medium">Your creation will appear here</p>
              <p className="text-slate-600 text-sm mt-1">Prompt the engine to begin synthesis</p>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-indigo-400 font-bold tracking-widest text-sm animate-pulse">RENDERING ASSET</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PhotoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6.75a1.5 1.5 0 0 0-1.5-1.5H3.75a1.5 1.5 0 0 0-1.5 1.5v12.9a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

export default ImageGenView;
