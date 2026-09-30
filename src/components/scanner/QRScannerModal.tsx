import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { Camera, X, RefreshCw, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { playScanSound } from '../../utils/qrUtils';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
  title?: string;
  expectedStepDescription?: string;
  subtitle?: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan QR Code',
  expectedStepDescription = 'Point camera at the physical QR code label',
  subtitle,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data && code.data.trim()) {
        const result = code.data.trim();
        setIsScanning(false);
        setLastScanned(result);
        playScanSound('success');
        stopStream();
        setTimeout(() => {
          onScan(result);
          onClose();
        }, 400);
        return;
      }
    }

    if (isScanning) {
      animationFrameId.current = requestAnimationFrame(scanFrame);
    }
  }, [isScanning, onScan, onClose, stopStream]);

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      return;
    }

    setIsScanning(true);
    setCameraError(null);
    setLastScanned(null);

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access not supported on this browser/environment');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
          await videoRef.current.play();
          animationFrameId.current = requestAnimationFrame(scanFrame);
        }
      } catch (err: any) {
        console.warn('Camera initiation issue:', err);
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Camera permission denied. Please allow camera access in browser settings or use manual code entry below.'
            : err.message || 'Unable to open camera stream. You can enter or simulate the code below.'
        );
      }
    };

    startCamera();

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, scanFrame, stopStream]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    playScanSound('success');
    stopStream();
    onScan(manualCode.trim());
    onClose();
  };

  const toggleFacingMode = () => {
    stopStream();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">{title}</h3>
              <p className="text-xs text-slate-400">{subtitle || expectedStepDescription}</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video / Scanner Area */}
        <div className="relative aspect-square max-h-[340px] bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center max-w-sm">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-200 mb-1">Camera Stream Inactive</div>
              <div className="text-xs text-slate-400 mb-4">{cameraError}</div>
              <div className="text-xs text-indigo-400 font-medium">
                Use the manual code entry box below to submit any Shelf, Officer, or File QR code.
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Target HUD Reticle */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                <div className="w-56 h-56 border-2 border-indigo-400/80 rounded-2xl relative shadow-[0_0_50px_rgba(99,102,241,0.25)]">
                  {/* Laser line */}
                  <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_8px_#818cf8] animate-pulse top-1/2 -translate-y-1/2" />
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />
                </div>
              </div>

              {/* Camera Switch button */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="absolute bottom-3 right-3 p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full backdrop-blur-sm transition-colors cursor-pointer border border-slate-600"
                title="Switch Camera (Front/Back)"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </>
          )}

          {lastScanned && (
            <div className="absolute inset-0 bg-emerald-950/80 flex flex-col items-center justify-center p-4 animate-in zoom-in-95">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
              <div className="text-sm font-bold text-white">QR Code Detected!</div>
              <div className="text-xs font-mono text-emerald-200 mt-1">{lastScanned}</div>
            </div>
          )}
        </div>

        {/* Manual Barcode / Text Input Fallback */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="e.g. SHELF-04-02 or FILE:KEEP:FILE-1024 or OFF-001"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Submit
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Scan speed: Real-time (60fps)</span>
            <span>Supports standard QR payloads</span>
          </div>
        </div>
      </div>
    </div>
  );
};
