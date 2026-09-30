import { useState, useRef, useEffect, useCallback } from 'react';

export interface CameraState {
  isActive: boolean;
  isPaused: boolean;
  isLoading: boolean;
  error: string | null;
  fps: number;
  isLowLight: boolean;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
}

export function useCamera(resolution: '480p' | '720p' | '1080p' = '720p') {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const fpsIntervalRef = useRef<any>(null);

  const [state, setState] = useState<CameraState>({
    isActive: false,
    isPaused: false,
    isLoading: false,
    error: null,
    fps: 0,
    isLowLight: false,
    devices: [],
    selectedDeviceId: '',
  });

  // Get resolution constraints
  const getConstraints = useCallback((deviceId?: string) => {
    let width = 1280;
    let height = 720;
    if (resolution === '480p') { width = 640; height = 480; }
    else if (resolution === '1080p') { width = 1920; height = 1080; }

    return {
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        width: { ideal: width },
        height: { ideal: height },
        facingMode: deviceId ? undefined : 'user',
        frameRate: { ideal: 30, max: 30 }
      },
      audio: false
    };
  }, [resolution]);

  // Enumerate devices
  const enumerateDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      setState(prev => ({
        ...prev,
        devices: videoDevices,
        selectedDeviceId: prev.selectedDeviceId || (videoDevices[0]?.deviceId || '')
      }));
    } catch (e) {
      console.warn('Failed to enumerate video devices:', e);
    }
  }, []);

  // Start Camera
  const startCamera = useCallback(async (deviceId?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const constraints = getConstraints(deviceId || state.selectedDeviceId);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState(prev => ({
        ...prev,
        isActive: true,
        isPaused: false,
        isLoading: false,
        error: null,
        selectedDeviceId: deviceId || prev.selectedDeviceId
      }));

      await enumerateDevices();
    } catch (err: any) {
      let errorMsg = 'Failed to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission was denied. Please allow camera access in browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No compatible camera device found on this system.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = 'Camera is already in use by another application.';
      }

      setState(prev => ({
        ...prev,
        isActive: false,
        isLoading: false,
        error: errorMsg
      }));
    }
  }, [getConstraints, state.selectedDeviceId, enumerateDevices]);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState(prev => ({
      ...prev,
      isActive: false,
      isPaused: false,
      fps: 0
    }));
  }, []);

  // Pause / Resume
  const togglePause = useCallback(() => {
    if (!videoRef.current || !streamRef.current) return;
    if (state.isPaused) {
      videoRef.current.play();
      setState(prev => ({ ...prev, isPaused: false }));
    } else {
      videoRef.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
    }
  }, [state.isPaused]);

  // FPS & Lighting Monitor
  useEffect(() => {
    if (!state.isActive || state.isPaused) {
      if (fpsIntervalRef.current) clearInterval(fpsIntervalRef.current);
      return;
    }

    fpsIntervalRef.current = setInterval(() => {
      const now = performance.now();
      const delta = (now - lastTimeRef.current) / 1000;
      const calculatedFps = Math.round(frameCountRef.current / delta);
      
      setState(prev => ({ ...prev, fps: isNaN(calculatedFps) ? 0 : calculatedFps }));
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }, 1000);

    return () => {
      if (fpsIntervalRef.current) clearInterval(fpsIntervalRef.current);
    };
  }, [state.isActive, state.isPaused]);

  const onFrame = useCallback(() => {
    frameCountRef.current++;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    state,
    startCamera,
    stopCamera,
    togglePause,
    onFrame,
    enumerateDevices,
  };
}
