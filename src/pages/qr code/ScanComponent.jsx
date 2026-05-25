/**
 * ScanComponent.jsx — Camera/QR Scan Component
 * Full Tailwind CSS version
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MdCameraswitch,
  MdFlashOn,
  MdFlashOff,
  MdPhoto,
  MdStop,
  MdPlayArrow,
  MdErrorOutline,
  MdCameraAlt,
  MdCheckCircle,
  MdQrCodeScanner,
} from "react-icons/md";

/* ── Corner frame pieces ── */
function CornerFrame() {
  return (
    <>
      <span className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-blue-500 rounded-tl-lg z-10 pointer-events-none" />
      <span className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-blue-500 rounded-tr-lg z-10 pointer-events-none" />
      <span className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-blue-500 rounded-bl-lg z-10 pointer-events-none" />
      <span className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-blue-500 rounded-br-lg z-10 pointer-events-none" />
    </>
  );
}

/* ── Camera overlay button ── */
function CamBtn({ onClick, icon: Icon, title, active }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-9 h-9 rounded-xl border border-white/15 backdrop-blur-md flex items-center justify-center cursor-pointer transition-all duration-150
        ${active
          ? "bg-amber-400/20 text-amber-400"
          : "bg-black/45 text-slate-200 hover:bg-black/60"
        }`}
    >
      <Icon size={18} />
    </button>
  );
}

/* ── jsQR lazy loader dengan cache ── */
let jsQRModule = null;
const loadJsQR = async () => {
  if (jsQRModule) return jsQRModule;
  try {
    const mod = await import("jsqr");
    jsQRModule = mod.default || mod;
    return jsQRModule;
  } catch (e) {
    console.warn("jsQR tidak tersedia:", e);
    return null;
  }
};

export default function ScanComponent({ onCapture, onScanResult, isActive, onToggle }) {
  const videoRef           = useRef(null);
  const canvasRef          = useRef(null);
  const offscreenCanvasRef = useRef(null);
  const streamRef          = useRef(null);
  const trackRef           = useRef(null);
  const scanLoopRef        = useRef(null);
  const qrDetectedRef      = useRef(false);
  const barcodeDetectorRef = useRef(null);

  const [cameraReady,    setCameraReady]    = useState(false);
  const [cameraError,    setCameraError]    = useState(null);
  const [facingMode,     setFacingMode]     = useState("environment");
  const [flashOn,        setFlashOn]        = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);
  const [capturedImage,  setCapturedImage]  = useState(null);
  const [qrDetected,     setQrDetected]     = useState(false);

  /* ── Init BarcodeDetector & pre-load jsQR ── */
  useEffect(() => {
    if ("BarcodeDetector" in window) {
      try {
        barcodeDetectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });
      } catch {
        barcodeDetectorRef.current = null;
      }
    }
    void loadJsQR();
  }, []);

  /* ── Start camera ── */
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);
    setQrDetected(false);
    qrDetectedRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      const [track] = stream.getVideoTracks();
      trackRef.current = track;
      const caps = track.getCapabilities?.() || {};
      setFlashSupported(!!caps.torch);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current
            .play()
            .then(() => setCameraReady(true))
            .catch((err) => setCameraError(`Gagal memutar video: ${err.message}`));
        };
      }
    } catch (err) {
      setCameraError(
        err.name === "NotAllowedError"
          ? "Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser."
          : err.name === "NotFoundError"
          ? "Kamera tidak ditemukan pada perangkat ini."
          : `Gagal mengakses kamera: ${err.message}`
      );
    }
  }, [facingMode]);

  /* ── Stop camera ── */
  const stopCamera = useCallback(() => {
    if (scanLoopRef.current) {
      clearInterval(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
    setFlashOn(false);
    setQrDetected(false);
  }, []);

  /* ── Toggle camera aktif/mati ── */
  useEffect(() => {
    qrDetectedRef.current = false;
    const timer = setTimeout(() => {
      isActive ? void startCamera() : stopCamera();
    }, 0);
    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [isActive, facingMode, startCamera, stopCamera]);

  /* ── QR detection loop ── */
  useEffect(() => {
    if (!isActive || !cameraReady || cameraError || capturedImage) return;
    if (!offscreenCanvasRef.current) offscreenCanvasRef.current = document.createElement("canvas");
    const canvas = offscreenCanvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const scanFrame = async () => {
      if (
        qrDetectedRef.current ||
        !videoRef.current ||
        videoRef.current.readyState < 2 ||
        videoRef.current.videoWidth === 0
      ) return;

      const video = videoRef.current;
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Coba BarcodeDetector native (Chrome/Edge)
      if (barcodeDetectorRef.current) {
        try {
          const barcodes = await barcodeDetectorRef.current.detect(video);
          if (barcodes?.[0]?.rawValue) {
            qrDetectedRef.current = true;
            setQrDetected(true);
            onScanResult?.({ type: "qr", rawValue: barcodes[0].rawValue, timestamp: new Date() });
            return;
          }
        } catch { /* fallthrough */ }
      }

      // Fallback jsQR (semua browser)
      try {
        const jsQR = await loadJsQR();
        if (!jsQR) return;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height, {
          inversionAttempts: "dontInvert",
        });
        if (code?.data) {
          qrDetectedRef.current = true;
          setQrDetected(true);
          onScanResult?.({ type: "qr", rawValue: code.data, timestamp: new Date() });
        }
      } catch (e) {
        console.warn("jsQR error:", e);
      }
    };

    scanLoopRef.current = setInterval(scanFrame, 350);
    return () => {
      clearInterval(scanLoopRef.current);
      scanLoopRef.current = null;
    };
  }, [isActive, cameraReady, cameraError, capturedImage, onScanResult]);

  const handleSwitchCamera = () =>
    setFacingMode((p) => (p === "environment" ? "user" : "environment"));

  const handleToggleFlash = async () => {
    if (!trackRef.current || !flashSupported) return;
    const next = !flashOn;
    try {
      await trackRef.current.applyConstraints({ advanced: [{ torch: next }] });
      setFlashOn(next);
    } catch (e) {
      console.warn("Flash failed:", e);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) return;
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);
    onCapture?.(dataUrl);
    onScanResult?.({ type: "image", data: dataUrl, timestamp: new Date() });
  };

  const handleDiscard = () => {
    setCapturedImage(null);
    qrDetectedRef.current = false;
    setQrDetected(false);
  };

  return (
    <div className="w-full">

      {/* ── Viewport ── */}
      <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-[0_8px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]">

        {/* Video */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={[
            "w-full h-full object-cover",
            cameraReady && !capturedImage ? "block" : "hidden",
            facingMode === "user" ? "-scale-x-100" : "",
          ].join(" ")}
        />

        {/* Captured image */}
        {capturedImage && (
          <img src={capturedImage} alt="captured" className="w-full h-full object-cover" />
        )}

        {/* Idle */}
        {!isActive && !capturedImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30">
              <MdCameraAlt size={36} className="text-blue-500" />
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-sm font-semibold">Kamera belum aktif</p>
              <p className="text-slate-500 text-xs mt-1">Tekan tombol Mulai Scan</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {isActive && !cameraReady && !cameraError && !capturedImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-[3px] border-blue-500/20" />
              <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-blue-500 animate-spin" />
            </div>
            <p className="text-slate-400 text-sm">Mengakses kamera…</p>
          </div>
        )}

        {/* Error */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-center">
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30">
              <MdErrorOutline size={28} className="text-red-400" />
            </div>
            <p className="text-red-300 text-sm font-semibold leading-snug">{cameraError}</p>
          </div>
        )}

        {/* Scan overlay */}
        {cameraReady && !capturedImage && (
          <>
            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_70%_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)]" />

            {/* Scan frame */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%] aspect-square">
              <CornerFrame />
              {/* Scan line */}
              <div
                className={[
                  "absolute left-1 right-1 h-0.5 rounded-sm transition-all duration-300",
                  qrDetected
                    ? "top-1/2 bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-[0_0_12px_rgba(34,197,94,0.9)]"
                    : "bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_12px_rgba(59,130,246,0.8)] animate-[scanLine_2s_ease-in-out_infinite]",
                ].join(" ")}
              />
            </div>

            {/* QR detected flash */}
            {qrDetected && (
              <div className="absolute inset-0 pointer-events-none rounded-2xl border-2 border-green-500/40 bg-green-500/5 animate-[qrFlash_0.4s_ease-out]" />
            )}

            {/* Status badge */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80] animate-pulse" />
              <span className="text-slate-200 text-[11px] font-semibold">
                {qrDetected ? "QR Terdeteksi!" : "Menunggu QR Code…"}
              </span>
            </div>

            {/* Camera controls */}
            <div className="absolute top-3.5 right-3.5 flex flex-col gap-2">
              <CamBtn onClick={handleSwitchCamera} icon={MdCameraswitch} title="Ganti kamera" />
              {flashSupported && (
                <CamBtn
                  onClick={handleToggleFlash}
                  icon={flashOn ? MdFlashOff : MdFlashOn}
                  title={flashOn ? "Matikan flash" : "Nyalakan flash"}
                  active={flashOn}
                />
              )}
            </div>
          </>
        )}

        {/* Captured badge */}
        {capturedImage && (
          <div className="absolute inset-0 pointer-events-none bg-black/30 flex items-start justify-start p-4">
            <div className="bg-emerald-500/15 border border-emerald-500/40 backdrop-blur-md rounded-full px-3.5 py-1.5 flex items-center gap-1.5">
              <MdCheckCircle size={14} className="text-emerald-400" />
              <span className="text-emerald-300 text-[11px] font-semibold">Gambar Diambil</span>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas untuk capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── Action buttons ── */}
      <div className="flex gap-2.5 mt-3.5">

        {/* Start / Stop */}
        <button
          onClick={onToggle}
          className={[
            "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white border-none cursor-pointer transition-all duration-200 hover:-translate-y-px active:translate-y-0",
            capturedImage ? "flex-none" : "flex-1",
            isActive
              ? "bg-gradient-to-br from-red-500 to-red-600 shadow-[0_4px_16px_rgba(239,68,68,0.35)]"
              : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_4px_16px_rgba(59,130,246,0.35)]",
          ].join(" ")}
        >
          {isActive
            ? <><MdStop size={16} /> Stop Kamera</>
            : <><MdPlayArrow size={16} /> Mulai Scan</>
          }
        </button>

        {/* Capture */}
        {cameraReady && !capturedImage && (
          <button
            onClick={handleCapture}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold cursor-pointer transition-colors duration-150 hover:bg-slate-50 active:bg-slate-100"
          >
            <MdPhoto size={16} /> Ambil Gambar
          </button>
        )}

        {/* Scan Ulang */}
        {capturedImage && (
          <button
            onClick={handleDiscard}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold cursor-pointer transition-colors duration-150 hover:bg-slate-50 active:bg-slate-100"
          >
            <MdQrCodeScanner size={16} /> Scan Ulang
          </button>
        )}
      </div>

    </div>
  );
}