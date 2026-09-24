export async function sendTelegramMessage(
    text: string,
    parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<boolean> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // Graceful fallback if Telegram configuration is empty
    if (!token || !chatId) {
        console.log('[Telegram Notification (Simulation)]:\n', text);
        return false;
    }

    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: parseMode,
            }),
        });

        const data = await res.json();
        return Boolean(data.ok);
    } catch (err) {
        console.error('Failed to send Telegram notification:', err);
        return false;
    }
}

export async function sendWarrantyAlert(
    assets: Array<{ asset_tag: string; brand: string; model: string; days_left: number; warranty_expiry: string }>
): Promise<boolean> {
    if (!assets || assets.length === 0) return true;

    const list = assets
        .map(
            (a) =>
                `• <b>${a.asset_tag}</b> (${a.brand} ${a.model})\n  Garansi habis: <code>${a.warranty_expiry}</code> (${a.days_left} hari lagi)`
        )
        .join('\n\n');

    const message = `⚠️ <b>Peringatan Garansi Aset IT</b>\n\nTerdapat ${assets.length} perangkat yang garansinya segera berakhir:\n\n${list}\n\n<i>Harap jadwalkan renewal garansi atau evaluasi unit.</i>`;

    return sendTelegramMessage(message);
}

export async function sendMaintenanceAlert(
    assetTag: string,
    device: string,
    issue: string
): Promise<boolean> {
    const message = `🔧 <b>Tiket Servis Baru</b>\n\nNomor Tag: <b>${assetTag}</b>\nPerangkat: ${device}\nKendala: ${issue}\n\nStatus: <code>In Repair</code>`;
    return sendTelegramMessage(message);
}
