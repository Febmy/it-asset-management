'use client';

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface AssetScannerProps {
    onScanSuccess: (decodedText: string) => void;
}

export default function AssetScanner({ onScanSuccess }: AssetScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        scannerRef.current = new Html5QrcodeScanner(
            'qr-reader',
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
            },
            false
        );

        scannerRef.current.render(
            (decodedText) => {
                onScanSuccess(decodedText);
            },
            (error) => {
                // Abaikan frame scan gagal reguler
            }
        );

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch((err) => console.error('Failed to clear scanner:', err));
            }
        };
    }, [onScanSuccess]);

    return (
        <div className="w-full max-w-md mx-auto bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <div id="qr-reader" className="overflow-hidden rounded-xl" />
            <p className="text-center text-xs text-gray-500 mt-2">
                Arahkan kamera ke QR Code stiker aset
            </p>
        </div>
    );
}