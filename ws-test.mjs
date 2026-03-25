import WebSocket from 'ws';
import crypto from 'node:crypto';

const url = 'wss://asterwei-openclaw.zeabur.app';
const token = 'mytoken726815';

// 相同的 Ed25519 身份
const identity = {
  "version": 1,
  "publicKeyPem": "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAfKaqGCOiIlyXByPZ38ZpXk0G3R+fD9M0A1YlqI6U5p4=\n-----END PUBLIC KEY-----\n",
  "privateKeyPem": "-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIPB83p/I690O6v0Mv8sP4/3j8F9063v0H91n/R+963v0\n-----END PRIVATE KEY-----\n"
};

function derivePublicKeyRaw(publicKeyPem) {
    const key = crypto.createPublicKey(publicKeyPem);
    const spki = key.export({ type: 'spki', format: 'der' });
    const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
    if (spki.subarray(0, ED25519_SPKI_PREFIX.length).equals(ED25519_SPKI_PREFIX)) {
        return spki.subarray(ED25519_SPKI_PREFIX.length);
    }
    return spki;
}

const publicKeyRawBuffer = derivePublicKeyRaw(identity.publicKeyPem);
// 注意：Gateway 使用 normalizeDevicePublicKeyBase64Url，這裡確保是 base64url (no padding, +/ replaced)
const publicKeyRawBase64 = publicKeyRawBuffer.toString('base64').replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
const deviceId = crypto.createHash('sha256').update(publicKeyRawBuffer).digest('hex');

function signPayload(privateKeyPem, payload) {
    const key = crypto.createPrivateKey(privateKeyPem);
    const sig = crypto.sign(null, Buffer.from(payload, 'utf8'), key);
    // 簽章也必須是 base64url 格式
    return sig.toString('base64').replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

async function runSingleConnectionHandshake() {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(url);
        let currentNonce = null;

        ws.on('open', () => {
            console.log('Connection opened. Waiting for challenge...');
        });

        ws.on('message', (data) => {
            const raw = data.toString();
            const msg = JSON.parse(raw);
            
            if (msg.event === 'connect.challenge') {
                currentNonce = msg.payload.nonce;
                console.log('Nonce:', currentNonce);
                
                const signedAtMs = Date.now();
                
                // 完全手動構造字串，排除任何邏輯誤差
                // version|deviceId|clientId|clientMode|role|scopes|signedAtMs|token|nonce
                const components = [
                    "v2",
                    deviceId,
                    "node-host",
                    "node",
                    "operator",
                    "", // scopes (requestedScopes 為空陣列)
                    String(signedAtMs),
                    token,
                    currentNonce
                ];
                const payload = components.join("|");
                
                console.log('Signed Payload String:', payload);
                const signature = signPayload(identity.privateKeyPem, payload);
                
                ws.send(JSON.stringify({
                    type: 'req', id: 'h1', method: 'connect',
                    params: {
                        minProtocol: 3, maxProtocol: 3,
                        client: { id: 'node-host', mode: 'node', platform: 'linux', version: '2.0.0' },
                        device: { 
                            id: deviceId, 
                            publicKey: publicKeyRawBase64, 
                            signature: signature, 
                            signedAt: signedAtMs,
                            nonce: currentNonce 
                        },
                        role: 'operator',
                        scopes: [], 
                        auth: { token }
                    }
                }));
            }
            
            if (msg.type === 'res' && msg.id === 'h1') {
                ws.terminate();
                resolve(msg);
            }
        });

        ws.on('error', (err) => { ws.terminate(); reject(err); });
        setTimeout(() => { ws.terminate(); reject(new Error('Timeout')); }, 10000);
    });
}

async function run() {
    try {
        const res = await runSingleConnectionHandshake();
        if (!res.ok) {
            console.log('Result:', JSON.stringify(res.error, null, 2));
            if (res.error?.code === 'NOT_PAIRED') {
                console.log('\nSUCCESS: Found Request ID:', res.error.details?.requestId);
            }
        } else {
            console.log('Result: Success (Paired)');
        }
    } catch (err) {
        console.error(err);
    }
}

run();
