import React, { useState, useRef, useEffect } from 'react';
import { Camera, Play, CheckCircle2, RefreshCw, PlusCircle, AlertTriangle } from 'lucide-react';
import { ApiService } from '../../services/api';
import { ISLSign, HandData } from '../../types/isl';

interface SignRecorderProps {
  signs: ISLSign[];
  currentHands: HandData[];
  onSampleRecorded?: () => void;
}

export const SignRecorder: React.FC<SignRecorderProps> = ({
  signs,
  currentHands,
  onSampleRecorded
}) => {
  const [selectedSign, setSelectedSign] = useState<string>('HELLO');
  const [newSignName, setNewSignName] = useState<string>('');
  const [newSignDisplay, setNewSignDisplay] = useState<string>('');
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [targetSamples, setTargetSamples] = useState<number>(30);
  const [collectedCount, setCollectedCount] = useState<number>(0);
  const [isCollecting, setIsCollecting] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isCollectingRef = useRef(false);
  const currentHandsRef = useRef(currentHands);
  currentHandsRef.current = currentHands;

  const handleStartCollection = () => {
    if (currentHands.length === 0) {
      setStatusMessage('Warning: Please place your hand in front of the camera first!');
      return;
    }

    setStatusMessage(null);
    setCountdown(3);

    // 3s countdown before collection begins
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(interval);
        setCountdown(null);
        startCapturingSamples();
      }
    }, 1000);
  };

  const startCapturingSamples = () => {
    setIsCollecting(true);
    isCollectingRef.current = true;
    setCollectedCount(0);

    let samplesCollected = 0;
    const captureInterval = setInterval(async () => {
      if (!isCollectingRef.current || samplesCollected >= targetSamples) {
        clearInterval(captureInterval);
        setIsCollecting(false);
        isCollectingRef.current = false;
        setStatusMessage(`Successfully collected ${samplesCollected} samples for ${selectedSign}!`);
        if (onSampleRecorded) onSampleRecorded();
        return;
      }

      const hands = currentHandsRef.current;
      if (hands && hands.length > 0) {
        try {
          await ApiService.addSample({
            sign_name: selectedSign,
            hand_type: hands.length > 1 ? 'both' : (hands[0].handedness.toLowerCase()),
            hands: hands.map(h => ({ landmarks: h.landmarks, handedness: h.handedness }))
          });
          samplesCollected++;
          setCollectedCount(samplesCollected);
        } catch (e) {
          console.warn('Failed to save sample:', e);
        }
      }
    }, 120); // Capture sample every 120ms
  };

  const handleStopCollection = () => {
    isCollectingRef.current = false;
    setIsCollecting(false);
    setCountdown(null);
  };

  const handleCreateSignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSignName.trim()) return;
    try {
      const created = await ApiService.createSign({
        name: newSignName.toUpperCase().trim(),
        display_name: newSignDisplay.trim() || newSignName.trim(),
        gesture_type: 'static'
      });
      setSelectedSign(created.name);
      setIsCreatingNew(false);
      setNewSignName('');
      setNewSignDisplay('');
      if (onSampleRecorded) onSampleRecorded();
    } catch (err: any) {
      setStatusMessage(`Error creating sign: ${err.message}`);
    }
  };

  const progressPct = Math.round((collectedCount / targetSamples) * 100);

  return (
    <div className="p-6 rounded-3xl glass-panel border border-stone-200/80 space-y-4 shadow-sm">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700 border border-sky-300">
            <Camera className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
            Live Sample Data Collection
          </span>
        </div>

        <button
          onClick={() => setIsCreatingNew(!isCreatingNew)}
          className="flex items-center gap-1.5 text-xs text-sky-700 hover:text-sky-800 transition-colors font-medium cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>{isCreatingNew ? 'Select Existing Sign' : 'Add New Sign'}</span>
        </button>
      </div>

      {/* New Sign Form */}
      {isCreatingNew ? (
        <form onSubmit={handleCreateSignSubmit} className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3 shadow-xs">
          <h4 className="text-xs font-mono font-bold text-sky-800 uppercase">Create New Vocabulary Class</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-600 block mb-1">Sign Key (e.g. WELCOME)</label>
              <input
                type="text"
                value={newSignName}
                onChange={e => setNewSignName(e.target.value.toUpperCase())}
                placeholder="HELLO"
                required
                className="w-full glass-input text-xs px-3 py-2 rounded-xl"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-600 block mb-1">Display Name (e.g. Welcome / Namaste)</label>
              <input
                type="text"
                value={newSignDisplay}
                onChange={e => setNewSignDisplay(e.target.value)}
                placeholder="Welcome Greeting"
                className="w-full glass-input text-xs px-3 py-2 rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className="px-3.5 py-1.5 rounded-xl text-xs bg-stone-100 border border-stone-200 text-slate-700 hover:bg-stone-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl text-xs font-bold glass-btn-primary cursor-pointer"
            >
              Create Sign
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Sign Selection */}
          <div>
            <label className="text-[11px] text-slate-600 block mb-1 font-medium">Target Sign to Record</label>
            <select
              value={selectedSign}
              onChange={e => setSelectedSign(e.target.value)}
              disabled={isCollecting}
              className="w-full glass-input text-xs px-3 py-2 rounded-xl cursor-pointer bg-white text-slate-900 border border-stone-300"
            >
              {signs.map(s => (
                <option key={s.id || s.name} value={s.name} className="bg-white text-slate-900">
                  {s.name} ({s.display_name}) — {s.samples_count} samples
                </option>
              ))}
            </select>
          </div>

          {/* Sample Target Slider */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-600 mb-1 font-medium">
              <span>Samples to Collect</span>
              <span className="font-mono text-sky-700 font-bold">{targetSamples} frames</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={targetSamples}
              onChange={e => setTargetSamples(Number(e.target.value))}
              disabled={isCollecting}
              className="w-full accent-sky-600 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Countdown Overlay or Active Progress */}
      {countdown !== null && (
        <div className="py-6 rounded-2xl bg-white border border-sky-300 text-center space-y-2 shadow-xs">
          <span className="text-xs font-mono text-sky-800 uppercase font-semibold">Get Ready... Hold sign steady</span>
          <div className="text-5xl font-black text-sky-600 animate-ping">
            {countdown}
          </div>
        </div>
      )}

      {isCollecting && (
        <div className="p-4 rounded-2xl bg-white border border-sky-300 space-y-2 shadow-xs">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-sky-800 flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
              Recording "{selectedSign}" Landmarks...
            </span>
            <span className="font-bold text-slate-900">
              {collectedCount} / {targetSamples} ({progressPct}%)
            </span>
          </div>

          <div className="h-3 w-full rounded-full bg-slate-200 border border-slate-300 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-sky-600 transition-all duration-100"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Status Alert */}
      {statusMessage && (
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200 flex items-center gap-2 text-xs shadow-2xs">
          {statusMessage.includes('Warning') || statusMessage.includes('Error') ? (
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          )}
          <span className={statusMessage.includes('Warning') ? 'text-amber-800 font-medium' : 'text-slate-700'}>
            {statusMessage}
          </span>
        </div>
      )}

      {/* Collection Action Button */}
      <div className="pt-2">
        {!isCollecting ? (
          <button
            onClick={handleStartCollection}
            disabled={countdown !== null}
            className="w-full glass-btn-primary flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            <Play className="w-4 h-4 text-white" />
            <span>Start Data Collection ({targetSamples} Samples)</span>
          </button>
        ) : (
          <button
            onClick={handleStopCollection}
            className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-md transition-all cursor-pointer"
          >
            Stop Collection
          </button>
        )}
      </div>

    </div>
  );
};
