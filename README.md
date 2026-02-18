# n8n-nodes-allsign

![AllSign](https://img.shields.io/badge/AllSign-E--Signature-6C5CE7?style=for-the-badge)
![n8n](https://img.shields.io/badge/n8n-Community%20Node-FF6D5A?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

[n8n](https://n8n.io) community node for the **[AllSign](https://allsign.io)** e-signature platform.

Create, sign, and manage documents from n8n workflows using the AllSign API v2.

> **🇲🇽 Español:** Nodo comunitario de n8n para firma electrónica con AllSign. Permite crear, firmar y gestionar documentos, contactos y carpetas desde workflows de n8n.

---

## ✨ Features / Características

### 📄 Document (6 resources, 31 operations)

| Resource            | Operations                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Document**        | Create, Get, Get Many, Download, Send, Update, Delete, Void, Invite, Invite Bulk, Get Stats, Update Signature Validations, Update Signature State |
| **Signer**          | Add                                                                                                                                               |
| **Signature Field** | Add, Add Multiple, Update, Delete                                                                                                                 |
| **Signature**       | Delete                                                                                                                                            |
| **Folder**          | Create, Get, Get Many, Update, Delete, Get Documents                                                                                              |
| **Contact**         | Create, Get, Get Many, Update, Delete, Get Documents                                                                                              |

### 🔔 Triggers (4 events)

| Event                | Description                          |
| -------------------- | ------------------------------------ |
| `document.completed` | All signers have signed the document |
| `document.sent`      | Document was sent for signing        |
| `document.signed`    | A signer has signed the document     |
| `document.voided`    | Document was voided/cancelled        |

### 🔐 Signature Types

- **Autógrafa** — Handwritten digital signature
- **FEA** — Firma Electrónica Avanzada (Mexico)
- **NOM-151** — NOM-151-SCFI certification (Mexico)
- **eIDAS** — EU electronic signature standard
- **Biométrica** — Biometric signature (selfie/proof of life)
- **SynthID (AI Verification)** — Verifies signer is not AI-generated
- **Confirm Name to Finish** — Requires signer to type their full name

---

## 🚀 Getting Started / Cómo empezar

### Prerequisites / Prerrequisitos

| Tool        | Version  | Install                              |
| ----------- | -------- | ------------------------------------ |
| **Node.js** | v22+     | [nvm](https://github.com/nvm-sh/nvm) |
| **npm**     | Included | —                                    |

### 1. Clone & Install

```bash
git clone https://github.com/allsign/n8n-nodes-allsign.git
cd n8n-nodes-allsign
npm install
```

### 2. Development Mode

```bash
npm run dev
```

This starts n8n with the AllSign nodes loaded, hot reload enabled, and opens the editor at **[http://localhost:5678](http://localhost:5678)**.

### 3. Configure Credentials

1. In n8n, go to **Credentials → Create Credential → AllSign API**
2. Enter your **API Key** (get one from [dashboard.allsign.io](https://dashboard.allsign.io))
3. Set the **Base URL** (default: `https://api.allsign.io`)
4. Click **Save** — the connection test will validate your key

### 4. Build for Production

```bash
npm run build
```

---

## 📂 Project Structure

```
n8n-nodes-allsign/
├── credentials/
│   └── AllSignApi.credentials.ts    # API Key + Base URL credential
├── nodes/
│   ├── Allsign/
│   │   ├── Allsign.node.ts          # Main node (31 operations)
│   │   ├── Allsign.node.json        # Codex metadata & SEO
│   │   ├── Allsign.node.test.ts     # Unit tests
│   │   └── allsign.svg              # Node icon
│   └── AllsignTrigger/
│       ├── AllsignTrigger.node.ts    # Webhook trigger (4 events)
│       ├── AllsignTrigger.node.json  # Trigger codex metadata
│       └── allsign.svg              # Trigger icon
├── package.json
├── tsconfig.json
└── jest.config.js
```

---

## 📜 Scripts

| Command               | Description                  |
| --------------------- | ---------------------------- |
| `npm run dev`         | Start n8n with hot reload    |
| `npm run build`       | Compile TypeScript → `dist/` |
| `npm run build:watch` | Compile in watch mode        |
| `npm run test`        | Run unit tests               |
| `npm run lint`        | Check code style             |
| `npm run lint:fix`    | Auto-fix lint issues         |

---

## 🐛 Troubleshooting

| Problem                      | Solution                                   |
| ---------------------------- | ------------------------------------------ |
| Node doesn't appear in n8n   | Run `npm install` then `npm run dev`       |
| TypeScript errors            | Ensure Node.js v22+, run `npm install`     |
| Connection test fails        | Verify API Key and Base URL in credentials |
| "Service refused connection" | Check the Base URL matches your backend    |

---

## 📚 Resources / Recursos

- [AllSign Platform](https://allsign.io)
- [AllSign API Docs](https://docs.allsign.io)
- [n8n Node Development Guide](https://docs.n8n.io/integrations/creating-nodes/)
- [n8n Community Forum](https://community.n8n.io/)

## 📄 License / Licencia

[MIT](LICENSE.md)
