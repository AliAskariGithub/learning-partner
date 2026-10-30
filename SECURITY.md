# Security & Privacy Architecture

Learning Partner is designed with a defense-in-depth, privacy-first security model. We ensure user API keys, OAuth plan tokens, personal documents, and session data remain safe, confidential, and isolated.

---

## 1. Credentials Encryption at Rest (AES-256-GCM)

All server-side credentials (user API keys, OAuth access tokens, and refresh tokens) are encrypted before insertion into the `connections` and legacy `api_keys` tables in Neon Postgres:

- **Algorithm**: Authenticated Encryption with Associated Data (AEAD) using `AES-256-GCM`.
- **Initialization Vector**: A cryptographically random 12-byte (96-bit) IV generated independently via `crypto.randomBytes(12)` for every single encryption operation. Never reused.
- **Authentication Tag**: A 16-byte GCM authentication tag verifying ciphertext integrity and authenticity prior to decryption.
- **Payload Format**: `ivHex:authTagHex:ciphertextHex`.
- **Key Isolation**: The master 256-bit encryption key (`ENCRYPTION_KEY`) is stored strictly in server environment variables.
- **Data Protection**: Tokens and keys are **never sent to the client**, **never logged**, **never put in URLs or cookies**, and all queries are strictly filtered by authenticated `userId`.

---

## 2. OAuth 2.0 with RFC 7636 PKCE

For OAuth connections (e.g. "Sign in with ChatGPT" and OpenRouter):

- **Proof Key for Code Exchange (PKCE)**: Uses SHA-256 (`S256`) code challenge generation with a cryptographically secure 43–128 character `code_verifier`.
- **State Validation**: State tokens contain HMAC signatures verified using `crypto.timingSafeEqual` to prevent CSRF and timing attacks.
- **Token Refresh Serialization**: Per-connection in-memory mutex promise queues ensure refresh token rotations are strictly serialized, preventing race conditions and invalid grant errors.
- **Proper Revocation**: Disconnecting an OAuth provider triggers the provider's official revocation endpoint before local records are scrubbed.

---

## 3. Server-Side Request Forgery (SSRF) Defense

For custom endpoints and OmniRoute in **Server Mode**:

- **HTTPS Mandatory**: Only `https://` protocols are permitted in production.
- **DNS Resolution & IP Validation**: Target hostnames are resolved to IPv4 and IPv6 addresses before connecting.
- **Forbidden Subnets Blocked**:
  - `0.0.0.0/8` (current network)
  - `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (private RFC 1918 networks)
  - `127.0.0.0/8` and `::1` (loopback / localhost)
  - `169.254.0.0/16` and `fe80::/10` (link-local and cloud provider metadata services, e.g. AWS/GCP/Azure `169.254.169.254`)
  - `100.64.0.0/10` (carrier-grade NAT)
  - `fc00::/7` (IPv6 unique local)
- **Redirect Security**: Redirects are followed with manual re-validation of each hop up to a maximum limit of 3.
- **Safety Limits**: Strict 15-second request timeouts and a 5MB response size limit to prevent Denial of Service.

---

## 4. Browser Mode Key Isolation (Zero-Trust Localhost)

For self-hosted gateways like OmniRoute, Ollama, or LM Studio running on `http://localhost:20128/v1`:

- Hosted servers can never (and should never) attempt to access a user's `localhost`.
- In **Browser Mode**, the gateway authentication key is saved exclusively in the user’s local browser **IndexedDB** (`learningpartner_local_keys`).
- The key is **never transmitted to, processed by, or stored on our servers**.
- The server performs document retrieval and prompt assembly, returning prepared messages for the user's browser to stream directly from their local machine.

---

## 5. Privacy, Cookies & Global Privacy Control (GPC)

- **Zero Third-Party Trackers**: We do not use Google Analytics, Meta Pixel, advertising trackers, or fingerprinting scripts.
- **Global Privacy Control (GPC)**: The application inspects `Sec-GPC` and `navigator.globalPrivacyControl`. When detected, all non-essential cookies and preferences are automatically blocked and disabled.
- **Strictly Necessary Cookies Only**: Without explicit consent, only session authentication (`lp_session`) and consent preference cookies are set.
- **One-Click Data Purge**: Users can withdraw consent at any time to instantly delete all stored non-essential cookies, or export and permanently erase their entire account and all knowledge data.

