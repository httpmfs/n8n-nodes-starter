# Changelog

All notable changes to `n8n-nodes-allsign` will be documented in this file.

## [1.0.0] — 2026-02-18

### 🎉 Initial Release

#### AllSign Node (31 operations across 6 resources)

**Document**

- Create — Upload a new PDF document for signing
- Get — Retrieve a document by ID
- Get Many — List documents with pagination
- Download — Download the signed PDF
- Send — Send a document for signing with signers
- Update — Rename, move to folder, or update config
- Delete — Delete a document
- Void — Cancel/void a signing process
- Invite — Invite a participant to sign
- Invite Bulk — Invite multiple participants at once
- Get Stats — Document statistics (total, by type, recent)
- Update Signature Validations — Configure: Autógrafa, FEA, NOM-151, eIDAS, Biométrica
- Update Signature State — Change the signing workflow state

**Signer**

- Add — Add a signer to a document

**Signature Field**

- Add — Place a signature field on a PDF page
- Add Multiple — Place multiple fields at once
- Update — Reposition or resize a field
- Delete — Remove a signature field

**Signature**

- Delete — Remove a signature from a document

**Folder**

- Create — Create a new folder
- Get — Retrieve a folder by ID
- Get Many — List all folders in tree structure
- Update — Rename or move a folder
- Delete — Delete a folder
- Get Documents — List documents inside a folder

**Contact**

- Create — Create a new contact
- Get — Retrieve a contact by ID
- Get Many — List all contacts
- Update — Update contact details
- Delete — Delete a contact
- Get Documents — List documents for a contact

#### AllSign Trigger (4 webhook events)

- `document.completed` — All signers have signed
- `document.sent` — Document was sent for signing
- `document.signed` — Individual signer completed
- `document.voided` — Document was voided/cancelled
- HMAC-SHA256 signature validation support

#### Credentials

- API Key authentication (Bearer token)
- Configurable Base URL (production or custom)
- Built-in connection test via `/v2/test/security`
