import React, { useState, useRef, useCallback, useEffect } from 'react';
import jsQR from 'jsqr';
import {
  FolderOpen,
  QrCode,
  Camera,
  Upload,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Shield,
  User,
  ChevronRight,
} from 'lucide-react';
import { loginWithCredentials, loginWithQR, saveSession, AuthUser } from '../../services/auth';
import { playScanSound } from '../../utils/qrUtils';

type LoginTab = 'qr' | 'credentials';
type QRMode = 'camera' | 'upload';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [tab, setTab] = useState<LoginTab>('qr');
  const [qrMode, setQRMode] = useState<QRMode>('camera');

  // Credentials form
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [credError, setCredError] = useState('');
  const [credLoading, setCredLoading] = useState(false);

  // QR camera
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scanSuccess, setScanSuccess] = useState('');

  // QR upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  // QR error
  const [qrError, setQRError] = useState('');

  // ──────────────────── Camera helpers ────────────────────

  const stopCamera = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const handleQRResult = useCallback(
    async (raw: string) => {
      const result = await loginWithQR(raw);
      if (result.success) {
        playScanSound('success');
        setScanSuccess(`Welcome, ${result.user.name}!`);
        saveSession(result.user);
        setTimeout(() => onLogin(result.user), 700);
      } else {
        playScanSound('error');
        setQRError(result.error);
      }
    },
    [onLogin]
  );

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
      if (code?.data?.trim()) {
        stopCamera();
        handleQRResult(code.data.trim());
        return;
      }
    }
    animRef.current = requestAnimationFrame(scanFrame);
  }, [stopCamera, handleQRResult]);

  const startCamera = useCallback(async () => {
    setCameraError('');
    setQRError('');
    setScanSuccess('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera not supported in this browser.');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        animRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access or switch to "Upload QR" tab.'
          : err.message || 'Unable to open camera.'
      );
    }
  }, [facingMode, scanFrame]);

  // Start camera when tab=qr & mode=camera
  useEffect(() => {
    if (tab === 'qr' && qrMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, qrMode, facingMode]);

  // ──────────────────── Upload QR ────────────────────

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setQRError('');
    setUploadLoading(true);

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (ev) => {
      img.src = ev.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setUploadError('Could not read image.');
        setUploadLoading(false);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      setUploadLoading(false);
      if (code?.data) {
        handleQRResult(code.data.trim());
      } else {
        setUploadError('No QR code detected in the image. Please try a clearer photo.');
      }
    };

    img.onerror = () => {
      setUploadError('Failed to load image.');
      setUploadLoading(false);
    };

    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  // ──────────────────── Credential Login ────────────────────

  const handleCredLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredError('');
    if (!userId.trim() || !password.trim()) {
      setCredError('Please enter both your User ID and password.');
      return;
    }
    setCredLoading(true);
    // Small artificial delay for UX feel
    await new Promise((r) => setTimeout(r, 400));
    const result = await loginWithCredentials(userId, password);
    setCredLoading(false);
    if (result.success) {
      playScanSound('success');
      saveSession(result.user);
      onLogin(result.user);
    } else {
      playScanSound('error');
      setCredError(result.error);
    }
  };

  // ──────────────────── Quick Login hints ────────────────────

  const hints = [
    { label: 'Admin', id: 'ADMIN', pwd: 'admin123', icon: Shield, color: 'indigo' },
    { label: 'Officer', id: 'OFF-001', pwd: 'officer001', icon: User, color: 'sky' },
    { label: 'Attender', id: 'ATT-001', pwd: 'attender001', icon: User, color: 'emerald' },
  ];

  const applyHint = (id: string, pwd: string) => {
    setUserId(id);
    setPassword(pwd);
    setCredError('');
    setTab('credentials');
  };

  // ──────────────────── Render ────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-700/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-700/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Logo / Brand */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/25">
          <FolderOpen className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">File Manager</h1>
        <p className="text-slate-400 text-sm mt-1">Physical File Tracking System</p>
      </div>

      {/* Card */}
      <div className="bg-slate-900/80 backdrop-blur border border-slate-700/60 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Tab Bar */}
        <div className="flex border-b border-slate-800">
          <button
            type="button"
            onClick={() => { setTab('qr'); setQRError(''); setCredError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all cursor-pointer ${
              tab === 'qr'
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Scan QR Badge
          </button>
          <button
            type="button"
            onClick={() => { setTab('credentials'); setQRError(''); setCredError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all cursor-pointer ${
              tab === 'credentials'
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            ID &amp; Password
          </button>
        </div>

        {/* ── QR Tab ── */}
        {tab === 'qr' && (
          <div className="p-6 space-y-4">
            {/* Sub-mode selector */}
            <div className="flex bg-slate-800/60 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => { setQRMode('camera'); setQRError(''); setScanSuccess(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  qrMode === 'camera' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Camera Scan
              </button>
              <button
                type="button"
                onClick={() => { setQRMode('upload'); setQRError(''); setScanSuccess(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  qrMode === 'upload' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload QR Image
              </button>
            </div>

            {/* Camera scanner area */}
            {qrMode === 'camera' && (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-square max-h-72 flex items-center justify-center">
                {scanSuccess ? (
                  <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center gap-2 animate-in zoom-in-95">
                    <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-bounce" />
                    <p className="text-emerald-300 font-bold text-sm">{scanSuccess}</p>
                  </div>
                ) : cameraError ? (
                  <div className="p-6 text-center space-y-2">
                    <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                    <p className="text-slate-300 text-sm font-semibold">Camera unavailable</p>
                    <p className="text-slate-400 text-xs">{cameraError}</p>
                    <button
                      onClick={() => startCamera()}
                      className="mt-2 px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Retry Camera
                    </button>
                  </div>
                ) : (
                  <>
                    <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Reticle */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-10">
                      <div className="w-52 h-52 border-2 border-indigo-400/80 rounded-2xl relative shadow-[0_0_40px_rgba(99,102,241,0.2)]">
                        <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-pulse top-1/2 -translate-y-1/2" />
                        <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
                        <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
                        <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />
                      </div>
                    </div>

                    {/* Camera flip */}
                    <button
                      type="button"
                      onClick={() => { stopCamera(); setFacingMode((p) => (p === 'environment' ? 'user' : 'environment')); }}
                      className="absolute bottom-3 right-3 p-2 bg-slate-800/80 text-white rounded-full border border-slate-600 hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Upload area */}
            {qrMode === 'upload' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                {scanSuccess ? (
                  <div className="rounded-2xl bg-emerald-950/60 border border-emerald-700/40 p-8 flex flex-col items-center gap-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
                    <p className="text-emerald-300 font-bold text-sm">{scanSuccess}</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadLoading}
                    className="w-full rounded-2xl border-2 border-dashed border-slate-600 hover:border-indigo-500 bg-slate-800/40 hover:bg-indigo-500/5 transition-all p-10 flex flex-col items-center gap-3 cursor-pointer group"
                  >
                    {uploadLoading ? (
                      <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                    ) : (
                      <Upload className="w-10 h-10 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    )}
                    <span className="text-sm font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">
                      {uploadLoading ? 'Reading QR code…' : 'Click to upload your QR badge image'}
                    </span>
                    <span className="text-xs text-slate-600">PNG, JPG, WEBP supported</span>
                  </button>
                )}
                {uploadError && (
                  <div className="mt-3 flex items-start gap-2 text-rose-400 text-xs bg-rose-950/40 border border-rose-800/40 rounded-xl px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    {uploadError}
                  </div>
                )}
              </div>
            )}

            {/* QR error */}
            {qrError && (
              <div className="flex items-start gap-2 text-rose-400 text-xs bg-rose-950/40 border border-rose-800/40 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{qrError}</span>
                <button onClick={() => setQRError('')} className="ml-auto cursor-pointer"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            <p className="text-center text-slate-500 text-xs">
              Point your camera at your personal QR badge to log in instantly
            </p>
          </div>
        )}

        {/* ── Credentials Tab ── */}
        {tab === 'credentials' && (
          <form onSubmit={handleCredLogin} className="p-6 space-y-4">
            {/* User ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => { setUserId(e.target.value); setCredError(''); }}
                placeholder="e.g. ADMIN, OFF-001, ATT-002"
                autoComplete="username"
                className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors font-mono"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setCredError(''); }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 pr-11 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {credError && (
              <div className="flex items-start gap-2 text-rose-400 text-xs bg-rose-950/40 border border-rose-800/40 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {credError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={credLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-700/30"
            >
              {credLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick-login demo hints */}
            <div className="pt-2">
              <p className="text-xs text-slate-500 text-center mb-2">Demo quick-login</p>
              <div className="grid grid-cols-3 gap-2">
                {hints.map(({ label, id, pwd, icon: Icon, color }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => applyHint(id, pwd)}
                    className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer
                      ${color === 'indigo' ? 'border-indigo-700/50 bg-indigo-950/40 text-indigo-400 hover:bg-indigo-900/50' : ''}
                      ${color === 'sky' ? 'border-sky-700/50 bg-sky-950/40 text-sky-400 hover:bg-sky-900/50' : ''}
                      ${color === 'emerald' ? 'border-emerald-700/50 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/50' : ''}
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Footer note */}
      <p className="mt-6 text-slate-600 text-xs text-center">
        File Manager · Physical File Tracking System (PFTS) · Dual-QR Matrix
      </p>
    </div>
  );
};
