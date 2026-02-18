# 🤝 AllSign n8n Node — Handover Guide

> **Fecha:** 18 Feb 2026  
> **Repo:** `https://github.com/httpmfs/n8n-nodes-starter.git`  
> **Branch:** `master` (último commit: `ba615a1`)  
> **Contacto:** erikasofia.garciabalderas@gmail.com

---

## 🎯 ¿Qué es esto?

Un **nodo comunitario de n8n** que conecta workflows de automatización con la plataforma **AllSign** de firma electrónica. Permite crear, firmar y gestionar documentos desde n8n usando la API v2 de AllSign.

---

## 📊 Estado Actual

### ✅ Listo (funcional y testeado)

| Componente          | Estado | Detalles                                          |
| ------------------- | ------ | ------------------------------------------------- |
| **AllSign Node**    | ✅     | 31 operaciones en 6 recursos                      |
| **AllSign Trigger** | ✅     | 4 eventos webhook con HMAC-SHA256                 |
| **Credenciales**    | ✅     | API Key + Base URL configurable + test automático |
| **Tests**           | ✅     | 36/36 pasando                                     |
| **Build**           | ✅     | TypeScript compila sin errores                    |
| **README**          | ✅     | Bilingüe EN/ES, documentación completa            |
| **CHANGELOG**       | ✅     | v1.0.0 documentado                                |
| **Codex/SEO**       | ✅     | 28+ aliases para marketplace                      |

### ⏳ Pendiente (necesita dominio externo del backend)

| Operación                          | Bloqueo              | Notas                                   |
| ---------------------------------- | -------------------- | --------------------------------------- |
| Document → Send                    | Necesita dominio     | Envía emails reales                     |
| Document → Invite / Invite Bulk    | Necesita dominio     | Envía invitaciones                      |
| Document → Get by ID               | Bug backend          | orgId mismatch en query                 |
| Document → Get Stats               | Bug backend          | Param 'scope' inesperado                |
| Signer, Signature Field, Signature | Necesita doc válido  | Dependen de Get by ID                   |
| Trigger events                     | Necesita webhook     | Requiere backend accesible              |
| VideoFirma                         | No existe en backend | Solo UI del dashboard, sin campo en API |

---

## 🚀 Cómo Levantar el Proyecto

```bash
# 1. Clonar
git clone https://github.com/httpmfs/n8n-nodes-starter.git n8n-nodes-allsign
cd n8n-nodes-allsign

# 2. Instalar
npm install

# 3. Correr en modo desarrollo (abre n8n en http://localhost:5678)
npm run dev

# 4. Correr tests
npm test

# 5. Build para producción
npm run build
```

---

## 🔑 Credenciales de Prueba

### API Key (cuenta de erikasofia.garciabalderas@gmail.com)

```
allsign_live_sk_kMg9wSccFJVzRB063jsGu1RMqI5Uj8GuZPVn3Mg2NW4
```

### Configurar en n8n:

1. Abrir n8n → Credentials → AllSign API
2. **API Key:** (la de arriba)
3. **Base URL:** `http://127.0.0.1:8000` (local) o el dominio cuando esté listo
4. Guardar → debe decir "Connection tested successfully"

### IDs importantes

| Item      | Valor                                  |
| --------- | -------------------------------------- |
| Tenant ID | `623d9e59-86e0-4f7b-bca2-161e66b81624` |
| User ID   | `fa9c7025-b70d-4a3f-9ea5-cd51e6d682fb` |
| Email     | `erikasofia.garciabalderas@gmail.com`  |

---

## 📂 Estructura del Proyecto

```
n8n-nodes-allsign/
├── credentials/
│   ├── AllSignApi.credentials.ts    ← Credencial (API Key + Base URL)
│   └── allsign.svg                  ← Ícono de la credencial
├── nodes/
│   ├── Allsign/
│   │   ├── Allsign.node.ts          ← NODO PRINCIPAL (31 operaciones)
│   │   ├── Allsign.node.test.ts     ← Tests (36 tests)
│   │   ├── Allsign.node.json        ← Codex/SEO metadata
│   │   └── allsign.svg              ← Ícono del nodo
│   └── AllsignTrigger/
│       ├── AllsignTrigger.node.ts    ← Trigger webhook (4 eventos)
│       ├── AllsignTrigger.node.json  ← Codex del trigger
│       └── allsign.svg              ← Ícono del trigger
├── CHANGELOG.md                     ← Historial de cambios
├── README.md                        ← Documentación principal
├── package.json                     ← Dependencias y config npm
└── tsconfig.json                    ← Config TypeScript
```

---

## 🔧 Operaciones Implementadas (31 total)

### Document (13 ops)

| Operación                    | Endpoint                                          |   Verificada   |
| ---------------------------- | ------------------------------------------------- | :------------: |
| Create                       | `POST /v2/documents`                              |       ⏳       |
| Get                          | `GET /v2/documents/{id}`                          | ⚠️ bug backend |
| Get Many                     | `GET /v2/documents`                               |       ✅       |
| Download                     | `GET /v2/documents/{id}/download`                 |       ⏳       |
| Send                         | `POST /v2/documents/{id}/send`                    |       ⏳       |
| Update                       | `PATCH /v2/documents/{id}`                        |       ⏳       |
| Delete                       | `DELETE /v2/documents/{id}`                       |       ⏳       |
| Void                         | `POST /v2/documents/{id}/void`                    |       ⏳       |
| Invite                       | `POST /v2/documents/{id}/invite`                  |       ⏳       |
| Invite Bulk                  | `POST /v2/documents/{id}/invite/bulk`             |       ⏳       |
| Get Stats                    | `GET /v2/documents/stats`                         | ⚠️ bug backend |
| Update Signature Validations | `PATCH /api/documents/{id}/signature-validations` |       ⏳       |
| Update Signature State       | `PATCH /api/documents/{id}/signature-state`       |       ⏳       |

### Signer (1 op)

| Operación | Endpoint                          | Verificada |
| --------- | --------------------------------- | :--------: |
| Add       | `POST /v2/documents/{id}/signers` |     ⏳     |

### Signature Field (4 ops)

| Operación    | Endpoint                                               | Verificada |
| ------------ | ------------------------------------------------------ | :--------: |
| Add          | `POST /v2/documents/{id}/signature-fields`             |     ⏳     |
| Add Multiple | `POST /v2/documents/{id}/signature-fields/bulk`        |     ⏳     |
| Update       | `PUT /v2/documents/{id}/signature-fields/{fieldId}`    |     ⏳     |
| Delete       | `DELETE /v2/documents/{id}/signature-fields/{fieldId}` |     ⏳     |

### Signature (1 op)

| Operación | Endpoint                                       | Verificada |
| --------- | ---------------------------------------------- | :--------: |
| Delete    | `DELETE /v2/documents/{id}/signatures/{sigId}` |     ⏳     |

### Folder (6 ops)

| Operación     | Endpoint                         |      Verificada      |
| ------------- | -------------------------------- | :------------------: |
| Create        | `POST /v2/folders`               |          ✅          |
| Get           | `GET /v2/folders/{id}`           |          ✅          |
| Get Many      | `GET /v2/folders`                |          ✅          |
| Update        | `PATCH /v2/folders/{id}`         |          ✅          |
| Delete        | `DELETE /v2/folders/{id}`        |          ✅          |
| Get Documents | `GET /v2/folders/{id}/documents` | ⚠️ esquema diferente |

### Contact (6 ops)

| Operación     | Endpoint                          |     Verificada     |
| ------------- | --------------------------------- | :----------------: |
| Create        | `POST /v2/contacts`               |         ✅         |
| Get           | `GET /v2/contacts/{id}`           |         ✅         |
| Get Many      | `GET /v2/contacts`                |         ✅         |
| Update        | `PATCH /v2/contacts/{id}`         | ⚠️ respuesta vacía |
| Delete        | `DELETE /v2/contacts/{id}`        |         ✅         |
| Get Documents | `GET /v2/contacts/{id}/documents` |         ⏳         |

---

## 🔐 7 Tipos de Firma Soportados

1. **Autógrafa** → `autografa` (default: ON)
2. **FEA** → `FEA`
3. **NOM-151** → `nom151`
4. **eIDAS** → `eIDAS`
5. **Firma Biométrica** → `firmaBiometrica`
6. **AI Verification (SynthID)** → `aiVerification`
7. **Confirm Name to Finish** → `confirmNameToFinish`

---

## 🐛 Bugs Conocidos del Backend

1. **`GET /v2/documents/{id}`** → 404 aunque el doc exista. El backend filtra por `orgId` de forma inconsistente con `GET /v2/documents`.
2. **`GET /v2/documents/stats`** → 500 con error `get_document_stats() got an unexpected keyword argument 'scope'`.
3. **`PATCH /v2/contacts/{id}`** → Actualiza pero devuelve respuesta sin los campos actualizados.

> ⚠️ Estos son bugs del **backend FastAPI**, no del nodo n8n.

---

## 📋 Próximos Pasos

1. **Conseguir dominio externo** para el backend FastAPI → actualizar Base URL en credenciales
2. **Probar operaciones de firma** (Send, Invite, Signer, Signature Fields)
3. **Corregir bugs del backend** (Get by ID, Get Stats, Contact Update)
4. **Publicar en npm** cuando todo esté verificado: `npm publish`
5. **Agregar VideoFirma** cuando el backend lo soporte en `DocumentValidationSettings`

---

## 📚 Referencias

- [AllSign Platform](https://allsign.io)
- [AllSign API Docs](https://docs.allsign.io)
- [n8n Node Development](https://docs.n8n.io/integrations/creating-nodes/)
- [n8n Community Forum](https://community.n8n.io/)
