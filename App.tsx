
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AppView } from './types';
import ChatView from './components/ChatView';
import ImageGenView from './components/ImageGenView';
import VideoGenView from './components/VideoGenView';
import LiveVoiceView from './components/LiveVoiceView';
import { 
  ChatBubbleLeftRightIcon, 
  PhotoIcon, 
  VideoCameraIcon, 
  MicrophoneIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [apiKeySelected, setApiKeySelected] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      // Mock checking if AI Studio key is selected for Veo/Imagen 3 if needed
      if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeySelected(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setApiKeySelected(true); // Assume success as per instructions
    }
  };

  return (
    <HashRouter>
      <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-64 border-r border-slate-800 flex flex-col bg-slate-900/50 backdrop-blur-xl">
          <div className="p-6">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              Vertex Explorer
            </h1>
          </div>
          
          <div className="flex-1 px-4 space-y-2 mt-4">
            <NavItem to="/chat" icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />} label="Chat Hub" />
            <NavItem to="/image-gen" icon={<PhotoIcon className="w-5 h-5" />} label="Visual Studio" />
            <NavItem to="/video-gen" icon={<VideoCameraIcon className="w-5 h-5" />} label="Motion Lab" />
            <NavItem to="/live-voice" icon={<MicrophoneIcon className="w-5 h-5" />} label="Live Interaction" />
          </div>

          <div className="p-4 border-t border-slate-800">
            {!apiKeySelected ? (
              <button 
                onClick={handleSelectKey}
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                Connect API Key
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-green-400">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                Vertex Engine Active
              </div>
            )}
            <div className="mt-4 text-[10px] text-slate-500 text-center uppercase tracking-widest font-bold">
              Powered by Gemini 2.5 / 3.0
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
          <Routes>
            <Route path="/chat" element={<ChatView />} />
            <Route path="/image-gen" element={<ImageGenView />} />
            <Route path="/video-gen" element={<VideoGenView />} />
            <Route path="/live-voice" element={<LiveVoiceView />} />
            <Route path="/" element={<Navigate to="/chat" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `
      flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group
      ${isActive ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 shadow-[0_0_15px_-5px_rgba(79,70,229,0.4)]' : 'hover:bg-slate-800/50 text-slate-400'}
    `}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="font-medium">{label}</span>
    </div>
    <ChevronRightIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
  </NavLink>
);

export default App;
