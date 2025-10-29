import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ImageFile, LightingEffect, SunlightIntensity, SunlightDirection } from './types';
import { applyLightingEffect } from './services/geminiService';
import ImageDisplay from './components/ImageDisplay';

type ActiveProcess = LightingEffect | 'variation' | null;

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeProcess, setActiveProcess] = useState<ActiveProcess>(null);
  const [sunlightIntensity, setSunlightIntensity] = useState<SunlightIntensity>(2);
  const [sunlightDirection, setSunlightDirection] = useState<SunlightDirection>('top');
  const [lastAppliedConfig, setLastAppliedConfig] = useState<{ effect: LightingEffect; intensity: SunlightIntensity; direction: SunlightDirection; } | null>(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isRemoveMenuOpen, setIsRemoveMenuOpen] = useState(false);

  const addMenuRef = useRef<HTMLDivElement>(null);
  const removeMenuRef = useRef<HTMLDivElement>(null);

  const intensityLabels: Record<SunlightIntensity, string> = { 1: 'Normal', 2: 'More', 3: 'Intense' };
  const directionLabels: Record<SunlightDirection, string> = { top: 'Top', left: 'Left', center: 'Center', right: 'Right', bottom: 'Bottom' };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) setIsAddMenuOpen(false);
      if (removeMenuRef.current && !removeMenuRef.current.contains(event.target as Node)) setIsRemoveMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Please upload a valid image file (e.g., JPEG, PNG, WEBP).");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = (e.target?.result as string).split(',')[1];
        setOriginalImage({ base64: base64String, mimeType: file.type, name: file.name });
        setGeneratedImage(null);
        setLastAppliedConfig(null);
        setError(null);
      };
      reader.onerror = () => setError("Failed to read the selected file.");
      reader.readAsDataURL(file);
    }
  };
  
  const handleDownload = () => {
      if (!generatedImage || !originalImage) return;
      const link = document.createElement('a');
      link.href = generatedImage;
      const name = originalImage.name.split('.').slice(0, -1).join('.') || 'image';
      const effectName = lastAppliedConfig?.effect || 'enhanced';
      link.download = `${name}-${effectName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

  const runEffect = useCallback(async (effect: LightingEffect, intensity: SunlightIntensity, direction: SunlightDirection, processType: ActiveProcess) => {
    if (!originalImage) {
      setError("Please upload an image first.");
      return;
    }
    setIsLoading(true);
    setActiveProcess(processType);
    setError(null);
    setGeneratedImage(null); // Clear previous image
    try {
      const result = await applyLightingEffect(originalImage, effect, intensity, direction);
      setGeneratedImage(result);
      if (processType !== 'variation') {
        setLastAppliedConfig({ effect, intensity, direction });
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
      setActiveProcess(null);
    }
  }, [originalImage]);

  const handleEffectClick = (effect: LightingEffect) => {
    setIsAddMenuOpen(false);
    setIsRemoveMenuOpen(false);
    runEffect(effect, sunlightIntensity, sunlightDirection, effect);
  };
  
  const handleVariationClick = () => {
    if (lastAppliedConfig) {
      runEffect(lastAppliedConfig.effect, lastAppliedConfig.intensity, lastAppliedConfig.direction, 'variation');
    }
  };

  const loadingSpinner = (
    <>
      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Generating...
    </>
  );

  const isAdding = useMemo(() => ['sunlight', 'shadows', 'sunlight-and-shadows'].includes(activeProcess || ''), [activeProcess]);
  const isRemoving = useMemo(() => ['remove-sunlight', 'remove-shadows', 'remove-sunlight-and-shadows'].includes(activeProcess || ''), [activeProcess]);

  const loadingText = useMemo(() => {
    switch (activeProcess) {
        case 'sunlight': return `Adding ${intensityLabels[sunlightIntensity].toLowerCase()} sunlight from the ${sunlightDirection}...`;
        case 'shadows': return 'Casting realistic shadows...';
        case 'sunlight-and-shadows': return `Adding ${intensityLabels[sunlightIntensity].toLowerCase()} sunlight from the ${sunlightDirection} and shadows...`;
        case 'remove-sunlight': return 'Removing sunlight for neutral lighting...';
        case 'remove-shadows': return 'Softening shadows for balanced lighting...';
        case 'remove-sunlight-and-shadows': return 'Neutralizing all lighting...';
        case 'variation': return 'Generating a new variation...';
        default: return 'AI is working its magic...';
    }
  }, [activeProcess, sunlightIntensity, sunlightDirection, intensityLabels]);

  const DropdownMenuItem: React.FC<{ onClick: () => void, children: React.ReactNode }> = ({ onClick, children }) => (
    <button onClick={onClick} className="text-left w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 transition-colors rounded-md">{children}</button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col p-4 md:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500">
          Photorealistic Lighting AI
        </h1>
        <p className="mt-2 text-lg text-gray-400 max-w-2xl mx-auto">Upload an image, choose an effect, and generate stunning variations.</p>
      </header>

      <main className="flex-grow flex flex-col gap-8">
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-7xl mx-auto">
          <ImageDisplay title="Original Image" imageSrc={originalImage ? `data:${originalImage.mimeType};base64,${originalImage.base64}` : null} isLoading={false} placeholderText="Upload an image to begin" loadingText="" />
          <ImageDisplay title="AI Enhanced Image" imageSrc={generatedImage} isLoading={isLoading} placeholderText="Your enhanced image will appear here" loadingText={loadingText} onDownload={handleDownload}/>
        </div>
        {error && (<div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center max-w-4xl mx-auto" role="alert"><span className="font-bold">Error:</span><span className="block sm:inline ml-2">{error}</span></div>)}
      </main>

      <footer className="w-full mt-8 py-4 sticky bottom-0 bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-4">
          <label htmlFor="file-upload" className="w-full lg:w-auto shrink-0 cursor-pointer inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-100 bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg">
            {originalImage ? 'Change Image' : 'Upload Image'}
            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
          </label>
          
          <div className="flex flex-col sm:flex-row items-start justify-center gap-4 w-full">
            <div className='flex-1 flex flex-col items-center gap-3 w-full'>
                <div className="relative inline-block text-left w-full sm:w-auto" ref={addMenuRef}>
                    <button onClick={() => setIsAddMenuOpen(!isAddMenuOpen)} disabled={!originalImage || isLoading} className="w-full sm:w-auto flex-grow inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:from-gray-600 transition-all transform hover:scale-105 shadow-lg">
                        {isLoading && isAdding ? loadingSpinner : 'Add Effect'}
                    </button>
                    {isAddMenuOpen && (<div className="origin-bottom-right absolute right-0 bottom-full mb-2 w-56 rounded-md shadow-lg bg-gray-700/90 backdrop-blur-md ring-1 ring-black ring-opacity-5 p-1">
                        <DropdownMenuItem onClick={() => handleEffectClick('sunlight')}>Add Sunlight</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEffectClick('shadows')}>Add Shadows</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEffectClick('sunlight-and-shadows')}>Sunlight + Shadows</DropdownMenuItem>
                    </div>)}
                </div>
                <div className="w-full max-w-xs flex flex-col items-center gap-2 p-2 bg-gray-800/50 rounded-lg">
                    <div className='w-full'>
                        <label htmlFor="sunlight-intensity" className="text-sm text-gray-400 text-center block">Intensity: {intensityLabels[sunlightIntensity]}</label>
                        <input id="sunlight-intensity" type="range" min="1" max="3" step="1" value={sunlightIntensity} onChange={(e) => setSunlightIntensity(Number(e.target.value) as SunlightIntensity)} disabled={!originalImage || isLoading} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"/>
                    </div>
                    <div className='w-full'>
                        <label className="text-sm text-gray-400 text-center block mb-1">Direction</label>
                        <div className="grid grid-cols-5 gap-1">
                            {(Object.keys(directionLabels) as SunlightDirection[]).map(dir => (
                                <button key={dir} onClick={() => setSunlightDirection(dir)} disabled={!originalImage || isLoading} className={`px-2 py-1 text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sunlightDirection === dir ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}`}>
                                    {directionLabels[dir]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative inline-block text-left w-full sm:w-auto" ref={removeMenuRef}>
              <button onClick={() => setIsRemoveMenuOpen(!isRemoveMenuOpen)} disabled={!originalImage || isLoading} className="w-full sm:w-auto flex-grow inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:from-gray-600 transition-all transform hover:scale-105 shadow-lg">
                {isLoading && isRemoving ? loadingSpinner : 'Remove Effect'}
              </button>
              {isRemoveMenuOpen && (<div className="origin-bottom-right absolute right-0 bottom-full mb-2 w-56 rounded-md shadow-lg bg-gray-700/90 backdrop-blur-md ring-1 ring-black ring-opacity-5 p-1">
                  <DropdownMenuItem onClick={() => handleEffectClick('remove-sunlight')}>Remove Sunlight</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEffectClick('remove-shadows')}>Remove Shadows</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEffectClick('remove-sunlight-and-shadows')}>Remove Both</DropdownMenuItem>
              </div>)}
            </div>
            
            <button onClick={handleVariationClick} disabled={!lastAppliedConfig || isLoading} className="w-full sm:w-auto flex-grow self-center inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:from-gray-600 transition-all transform hover:scale-105 shadow-lg">
              {isLoading && activeProcess === 'variation' ? loadingSpinner : 'More Variations'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
