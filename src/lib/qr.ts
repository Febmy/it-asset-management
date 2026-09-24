import QRCode from 'qrcode';

export async function generateQRCodeDataUrl(
    text: string,
    options?: QRCode.QRCodeToDataURLOptions
): Promise<string> {
    const defaultOptions: QRCode.QRCodeToDataURLOptions = {
        width: 160,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: {
            dark: '#0f172a',
            light: '#ffffff',
        },
        ...options,
    };
    return QRCode.toDataURL(text, defaultOptions);
}

export async function generateQRCodeBuffer(text: string): Promise<Buffer> {
    return QRCode.toBuffer(text, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'H',
    });
}
