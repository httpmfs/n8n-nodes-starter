# n8n-nodes-allsign

![AllSign](https://img.shields.io/badge/AllSign-E--Signature-6C5CE7?style=for-the-badge)
![n8n](https://img.shields.io/badge/n8n-Community%20Node-FF6D5A?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

[n8n](https://n8n.io) community node for the **[AllSign](https://allsign.io)** e-signature platform.

Create, retrieve, and manage documents for electronic signature directly from your n8n workflows using the AllSign API V2.

> **🇲🇽 Español:** Nodo comunitario de n8n para firma electrónica con AllSign. Crea, consulta y gestiona documentos a firmar desde workflows de n8n.

---

## ✨ Features / Características

### 📄 4 Operations / Operaciones

| Operation         | Description                                                    |
| ----------------- | -------------------------------------------------------------- |
| **Create & Send** | Upload a PDF and send it for signing in one step               |
| **Get**           | Retrieve a single document by its ID                           |
| **Get Many**      | List documents with filters (status, date range, search, sort) |
| **Void**          | Cancel a document and all pending signatures                   |

> **🇲🇽** Crea y envía documentos, consulta por ID, lista con filtros, o anula documentos — todo desde n8n.

### 📱 Signers: Email & WhatsApp

Signers can be reached via **email**, **WhatsApp**, or **both**. The system auto-detects the best channel per signer.

- ✅ Email-only signers
- ✅ WhatsApp-only signers (phone number, no email required)
- ✅ Both channels — the backend auto-detects per participant

> **🇲🇽** Los firmantes pueden recibir invitaciones por email, WhatsApp o ambos. El sistema detecta automáticamente el mejor canal.

### 🔐 10 Signature Validations / Validaciones de Firma

| Validation                 | Description                                                          |
| -------------------------- | -------------------------------------------------------------------- |
| **Autógrafa**              | Handwritten digital signature with biometric capture (on by default) |
| **FEA**                    | Firma Electrónica Avanzada (Mexico)                                  |
| **eIDAS**                  | European Electronic Signature — eIDAS compliance                     |
| **NOM-151**                | NOM-151-SCFI certified timestamping (Mexico)                         |
| **Video Signature**        | Recorded video of the signer during the signing process              |
| **Biometric Selfie**       | Face comparison against the signer's government ID                   |
| **SynthID (AI Detection)** | Verifies selfie is from a real person, not AI-generated              |
| **ID Scan**                | Government-issued ID scan (INE, passport, etc.)                      |
| **Identity Verification**  | AI-powered ID + selfie verification pipeline                         |
| **Confirm Name**           | Signer must type their full name as confirmation                     |

### 📥 File Input / Entrada de Archivo

- **Binary Input** — Use a file from a previous node (e.g. Google Drive, HTTP Request, Dropbox)
- **URL** — Provide a public URL to a PDF file

### 📐 Signature Field Placement

Place signature fields precisely on the document:

- **By coordinates** — X, Y position on a specific page (or all pages)
- **By anchor text** — Search for text in the PDF and place the field there

### ⚙️ Additional Options

| Option                  | Description                                                        |
| ----------------------- | ------------------------------------------------------------------ |
| **Folder Name**         | Organize documents into folders automatically                      |
| **Expires At**          | Set an expiration deadline — document auto-expires after this date |
| **Placeholders (DOCX)** | Replace `{{ variables }}` in DOCX templates with dynamic values    |

### 🔔 Trigger Node / Nodo Trigger

Listen for real-time events via webhooks with HMAC signature validation:

| Event                | Description                      |
| -------------------- | -------------------------------- |
| `document.signed`    | A signer has signed the document |
| `document.completed` | All signers have signed          |
| `document.sent`      | Document was sent for signing    |
| `document.voided`    | Document was voided/cancelled    |

### 📋 Get Many — Filters

| Filter               | Description                                                                 |
| -------------------- | --------------------------------------------------------------------------- |
| **Search**           | Full-text search in document name                                           |
| **Signature Status** | RECOLECTANDO_FIRMANTES, ESPERANDO_FIRMAS, TODOS_FIRMARON, EXPIRADO, ANULADO |
| **Created After**    | Filter by creation date range                                               |
| **Created Before**   | Filter by creation date range                                               |
| **Folder ID**        | Filter by folder                                                            |
| **Sort By**          | created_at, updated_at, name                                                |
| **Sort Order**       | Ascending or descending                                                     |

---

## 🚀 Getting Started / Cómo empezar

### Prerequisites / Prerrequisitos

| Tool        | Version  | Install                              |
| ----------- | -------- | ------------------------------------ |
| **Node.js** | v22+     | [nvm](https://github.com/nvm-sh/nvm) |
| **npm**     | Included | —                                    |

### 1. Install in n8n

```bash
# Community nodes (from n8n UI):
# Settings → Community Nodes → Install → n8n-nodes-allsign

# Or install manually:
npm install n8n-nodes-allsign
```

### 2. Configure Credentials

1. In n8n, go to **Credentials → Create Credential → AllSign API**
2. Enter your **API Key** (get one from [dashboard.allsign.io](https://dashboard.allsign.io))
3. Set the **Base URL** (default: `https://api.allsign.io`)
4. Click **Save** — the connection test will validate your key

### 3. Use the Node

1. Add the **AllSign** node to your workflow
2. Select an operation: **Create & Send**, **Get**, **Get Many**, or **Void**
3. For **Create & Send**:
   - Set the document name and file source (URL or Binary)
   - Add signers (name + email and/or WhatsApp number)
   - Toggle the signature validations you need
   - Configure notifications (auto-detected channel per signer)
4. For **Get**: Enter the document ID
5. For **Get Many**: Set the limit and optional filters
6. For **Void**: Enter the document ID and optional reason
7. Execute!

---

## 🛠️ Development / Desarrollo

### Clone & Install

```bash
git clone https://github.com/httpmfs/n8n-nodes-starter.git n8n-nodes-allsign
cd n8n-nodes-allsign
npm install
```

### Scripts

| Command               | Description                  |
| --------------------- | ---------------------------- |
| `npm run dev`         | Start n8n with hot reload    |
| `npm run build`       | Compile TypeScript → `dist/` |
| `npm run build:watch` | Compile in watch mode        |
| `npm test`            | Run unit tests (28 tests)    |
| `npm run lint`        | Check code style             |

### ☁️ Cloudflare Tunnel (Remote Access / Acceso Remoto)

To expose your local n8n instance to the internet (useful for webhook testing with the AllSign backend):

> **🇲🇽** Para exponer tu instancia local de n8n al internet (útil para probar webhooks con el backend de AllSign):

```bash
cloudflared tunnel run --token <YOUR_TUNNEL_TOKEN>
```

> **Note:** Requires `cloudflared` CLI installed. This creates a secure tunnel so external services can reach your `localhost:5678`.

---

## 📂 Project Structure

```
n8n-nodes-allsign/
├── credentials/
│   └── AllSignApi.credentials.ts        # API Key + Base URL credential
├── nodes/
│   ├── Allsign/
│   │   ├── Allsign.node.ts              # Main node (Create, Get, Get Many, Void)
│   │   ├── Allsign.node.json            # Codex metadata & SEO
│   │   ├── Allsign.node.test.ts         # Unit tests (28 tests)
│   │   └── allsign.svg                  # Node icon
│   └── AllsignTrigger/
│       ├── AllsignTrigger.node.ts       # Trigger node (webhooks + HMAC)
│       └── allsign.svg                  # Trigger icon
├── package.json
├── tsconfig.json
└── jest.config.js
```

---

## 🐛 Troubleshooting

| Problem                      | Solution                                   |
| ---------------------------- | ------------------------------------------ |
| Node doesn't appear in n8n   | Run `npm install` then `npm run dev`       |
| TypeScript errors            | Ensure Node.js v22+, run `npm install`     |
| Connection test fails        | Verify API Key and Base URL in credentials |
| "Service refused connection" | Check the Base URL matches your backend    |
| Void returns 400             | Document is already completed or voided    |
| Get returns 404              | Check document ID and API key permissions  |

---

## 📚 Resources / Recursos

- [AllSign Platform](https://allsign.io)
- [AllSign API Docs](https://docs.allsign.io)
- [n8n Node Development Guide](https://docs.n8n.io/integrations/creating-nodes/)
- [n8n Community Forum](https://community.n8n.io/)

## 📄 License / Licencia

[MIT](LICENSE.md)
