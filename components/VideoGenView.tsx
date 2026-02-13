
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { VideoCameraIcon, FilmIcon, BoltIcon } from '@heroicons/react/24/outline';

const VideoGenView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateVideo = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setStatus('Initializing generation engine...');
    setVideoUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      setStatus('Processing visual data (this may take 1-2 minutes)...');

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
        setStatus(`Synthesizing frames... ${Math.floor(Math.random() * 20 + 40)}% complete`);
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const fetchUrl = `${downloadLink}&key=${process.env.API_KEY}`;
        const response = await fetch(fetchUrl);
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('Requested entity was not found')) {
        setStatus('API Key Error: Please re-select your AI Studio key.');
        if (window.aistudio?.openSelectKey) window.aistudio.openSelectKey();
      } else {
        setStatus('Error during video synthesis. Please try a different prompt.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Motion Lab</h2>
        <p className="text-slate-400">Harness the Veo engine to create cinematic video clips from text.</p>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-indigo-400 mb-2 uppercase tracking-wider">Cinematic Prompt</label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A drone shot flying through a glowing cybernetic forest at dusk..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleGenerateVideo}
              disabled={isLoading || !prompt.trim()}
              className="md:w-48 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              <BoltIcon className="w-6 h-6" />
              {isLoading ? 'Processing' : 'Generate'}
            </button>
          </div>
          
          {isLoading && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-300">{status}</span>
                <span className="text-sm font-bold text-indigo-400 animate-pulse">ESTIMATED: 60-90s</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 animate-[loading_20s_ease-in-out_infinite]"></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl overflow-hidden flex items-center justify-center relative min-h-[400px]">
          {videoUrl ? (
            <video 
              src={videoUrl} 
              controls 
              autoPlay 
              loop 
              className="max-w-full max-h-[600px] w-full h-full object-contain"
            />
          ) : (
            <div className="text-center">
              <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-600">
                <FilmIcon className="w-12 h-12" />
              </div>
              <p className="text-slate-500 text-lg font-medium">Motion Engine Standby</p>
              <p className="text-slate-600 text-sm max-w-xs mx-auto mt-2">
                Enter a cinematic description above to begin high-fidelity temporal synthesis.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes loading {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 95%; }
        }
      `}</style>
    </div>
  );
};

export default VideoGenView;
