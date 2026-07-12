/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check, Printer, FileText } from 'lucide-react';

interface QRGeneratorProps {
  assetCode: string;
  assetName: string;
  location: string;
  size?: number;
}

export default function QRGenerator({ assetCode, assetName, location, size = 180 }: QRGeneratorProps) {
  const [qrSrc, setQrSrc] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Compute the asset public hash URL
  const publicUrl = `${window.location.origin}${window.location.pathname}#/asset/${assetCode}`;

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(publicUrl, {
      margin: 1,
      width: size,
      color: {
        dark: '#1e293b', // slate-800
        light: '#ffffff' // white
      }
    })
      .then(url => {
        if (active) setQrSrc(url);
      })
      .catch(err => {
        console.error('Error generating QR Code', err);
      });

    return () => {
      active = false;
    };
  }, [publicUrl, size]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    if (!qrSrc) return;
    const link = document.createElement('a');
    link.href = qrSrc;
    link.download = `QR_${assetCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Label - ${assetCode}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: white;
            }
            .label-card {
              border: 3px solid #1e293b;
              padding: 24px;
              border-radius: 12px;
              text-align: center;
              width: 280px;
              background: white;
              box-shadow: none;
            }
            .title {
              font-size: 22px;
              font-weight: 800;
              margin: 0 0 4px 0;
              color: #1e293b;
              letter-spacing: -0.5px;
            }
            .subtitle {
              font-size: 11px;
              font-weight: 600;
              color: #64748b;
              margin-bottom: 16px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .qr-img {
              width: 180px;
              height: 180px;
              margin: 0 auto 16px auto;
              display: block;
            }
            .code-badge {
              display: inline-block;
              background: #f1f5f9;
              color: #1e293b;
              font-family: monospace;
              font-size: 16px;
              font-weight: 700;
              padding: 6px 12px;
              border-radius: 6px;
              border: 1px solid #cbd5e1;
              margin-bottom: 8px;
            }
            .meta {
              font-size: 12px;
              color: #334155;
              font-weight: 500;
              margin: 4px 0;
            }
            .footer-text {
              font-size: 9px;
              color: #94a3b8;
              margin-top: 14px;
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <h1 class="title">MaintainIQ</h1>
            <div class="subtitle">Scan to Report Issue</div>
            <img class="qr-img" src="${qrSrc}" />
            <div class="code-badge">${assetCode}</div>
            <div class="meta"><b>Asset:</b> ${assetName}</div>
            <div class="meta"><b>Loc:</b> ${location}</div>
            <div class="footer-text">Secure Maintenance Tracking System</div>
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

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm max-w-sm">
      {/* Hidden layout for Print/Copy referencing */}
      <div ref={printRef} className="hidden">
        <div className="label-card">
          <h1 className="title">MaintainIQ</h1>
          <div className="subtitle">Scan to Report Issue</div>
          <img className="qr-img" src={qrSrc} alt="Asset QR Code" />
          <div className="code-badge">{assetCode}</div>
          <div className="meta"><b>Asset:</b> {assetName}</div>
          <div className="meta"><b>Loc:</b> {location}</div>
        </div>
      </div>

      <div className="relative group p-3 bg-slate-50 dark:bg-slate-900 rounded-xl mb-4 border border-slate-100 dark:border-slate-800">
        {qrSrc ? (
          <img 
            src={qrSrc} 
            alt={`QR label code for ${assetCode}`} 
            className="w-44 h-44 object-contain transition-transform group-hover:scale-[1.02] duration-300"
          />
        ) : (
          <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
            Generating QR...
          </div>
        )}
      </div>

      <div className="w-full text-center mb-4">
        <h3 className="font-mono text-lg font-bold text-slate-800 dark:text-slate-100">{assetCode}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[240px] mx-auto mt-0.5">{assetName}</p>
        <p className="text-[10px] text-slate-400 truncate max-w-[240px] mx-auto mt-0.5">{location}</p>
      </div>

      {/* Action panel */}
      <div className="grid grid-cols-3 gap-2 w-full">
        <button
          onClick={handleCopy}
          className="flex flex-col items-center justify-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          title="Copy public URL"
        >
          {copied ? (
            <Check className="w-4.5 h-4.5 text-green-500" />
          ) : (
            <Copy className="w-4.5 h-4.5" />
          )}
          <span className="text-[10px] font-medium">{copied ? 'Copied' : 'Copy link'}</span>
        </button>

        <button
          onClick={handleDownload}
          disabled={!qrSrc}
          className="flex flex-col items-center justify-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-50"
          title="Download PNG image"
        >
          <Download className="w-4.5 h-4.5" />
          <span className="text-[10px] font-medium">Download</span>
        </button>

        <button
          onClick={handlePrint}
          disabled={!qrSrc}
          className="flex flex-col items-center justify-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          title="Print physical label card"
        >
          <Printer className="w-4.5 h-4.5" />
          <span className="text-[10px] font-medium">Print Label</span>
        </button>
      </div>
    </div>
  );
}
