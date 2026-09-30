import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Copy, Download, Printer, Check } from 'lucide-react';

interface QRCodeViewProps {
  value: string;
  size?: number;
  label?: string;
  subLabel?: string;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'blue' | 'indigo' | 'purple' | 'rose' | 'slate';
  showActions?: boolean;
  className?: string;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  size = 160,
  label,
  subLabel,
  badge,
  badgeColor = 'slate',
  showActions = true,
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(value, {
      width: size * 2, // 2x for sharp retina rendering
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (isMounted) setDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate QR code', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `QR-${(label || value).replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Label - ${label || value}</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fff; }
            .card { border: 2px dashed #334155; padding: 24px; text-align: center; border-radius: 12px; width: 280px; }
            .badge { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; background: #e2e8f0; color: #0f172a; margin-bottom: 12px; }
            .qr-img { width: 180px; height: 180px; margin: 0 auto; display: block; }
            .label { font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 10px; }
            .sub { font-size: 12px; color: #64748b; margin-top: 4px; word-break: break-all; font-family: monospace; }
            .hint { font-size: 10px; color: #94a3b8; margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="card">
            ${badge ? `<div class="badge">${badge}</div>` : ''}
            <img class="qr-img" src="${dataUrl}" alt="QR Code" />
            <div class="label">${label || ''}</div>
            <div class="sub">${subLabel || value}</div>
            <div class="hint">Physical File Tracking System • QR Token</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const badgeColorClasses = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  }[badgeColor];

  return (
    <div
      ref={containerRef}
      className={`bg-white rounded-xl border border-slate-200/90 shadow-sm p-3.5 flex flex-col items-center text-center transition-all hover:shadow-md ${className}`}
    >
      {badge && (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase border mb-2 ${badgeColorClasses}`}
        >
          {badge}
        </span>
      )}

      <div className="relative bg-white p-2 rounded-lg border border-slate-100 shadow-inner">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={label || value}
            style={{ width: size, height: size }}
            className="rounded"
          />
        ) : (
          <div
            style={{ width: size, height: size }}
            className="flex items-center justify-center bg-slate-100 animate-pulse rounded text-xs text-slate-400"
          >
            Generating QR...
          </div>
        )}
      </div>

      {label && <div className="mt-2.5 font-bold text-sm text-slate-800 tracking-tight">{label}</div>}
      {subLabel && (
        <div className="text-[11px] text-slate-500 font-mono mt-0.5 break-all max-w-[200px]">
          {subLabel}
        </div>
      )}

      {showActions && (
        <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100 w-full justify-center">
          <button
            type="button"
            onClick={handleCopy}
            title="Copy QR Payload"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            title="Download QR Image"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handlePrint}
            title="Print Physical Label"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
