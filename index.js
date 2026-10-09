const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');

async function connectBot() {
    // Saves your session so you don't have to rescan the QR code every time it restarts
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, 
        browser: ['GitHub Bot', 'Chrome', '1.0.0']
    });

    // Handle connection drops and restarts
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if(shouldReconnect) {
                console.log('Reconnecting...');
                connectBot();
            }
        } else if(connection === 'open') {
            console.log('Bot is online and ready!');
        }
    });

    // Save authentication credentials when updated
    sock.ev.on('creds.update', saveCreds);

    // Listen for incoming messages
    sock.ev.on('messages.upsert', async (event) => {
        const msg = event.messages[0];
        
        // Ignore blank messages or messages sent by the bot itself
        if(!msg.message || msg.key.fromMe) return;

        // Extract the message text accurately
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        // Check if the message is "hi" (case-insensitive)
        if (text && text.toLowerCase() === 'hi') {
            // Send "hello" back to the chat ID
            await sock.sendMessage(msg.key.remoteJid, { text: 'hello' });
        }
    });
}

connectBot();
