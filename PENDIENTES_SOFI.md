# 📋 Pendientes AllSign n8n Node — Sofi

> **Fecha:** 26 Feb 2026  
> **Branch:** `mvp/v1-create-send`

---

## 📊 Resumen de estado

| #   | Tarea                        | Prioridad | Estado           |
| --- | ---------------------------- | --------- | ---------------- |
| 1.1 | Quitar Resource              | 🔴 Alta   | ✅ Listo         |
| 1.2 | Quitar Operation             | 🔴 Alta   | ✅ Listo         |
| 2.1 | Grupo: Send Invite Config    | 🟡 Media  | ✅ Listo         |
| 2.2 | Grupo: Signature Validations | 🟡 Media  | ✅ Listo         |
| 2.3 | Tooltip ℹ️ en grupos         | 🟡 Media  | ✅ Listo         |
| 3.1 | Opción Base64 en File Source | 🟢 Media  | ✅ Listo         |
| 3.2 | Binary → base64 automático   | 🟢        | ✅ Ya funcionaba |
| 3.3 | URL → descarga → base64      | 🟢        | ✅ Ya funcionaba |
| 4.1 | All Pages + Page Number      | 🔵 Baja   | ✅ Ya funcionaba |
| 5.1 | Campo Folder Name            | 🟣 Baja   | ✅ Listo         |
| 5.2 | Permissions (al final)       | 🟣 Baja   | ⬜ Pendiente     |

---

## ✅ Implementado en esta sesión

### 1. Quitar Resource y Operation (Simplificación de UI)

- Eliminados los dropdowns de `Resource` y `Operation` que solo tenían una opción cada uno
- El nodo ahora ejecuta directamente "Create & Send" sin selecciones innecesarias
- El `subtitle` ahora muestra "Create & Send Document" estáticamente

### 2. Agrupación visual con tooltips ℹ️

- Creado grupo **"Send Invite Configuration"** con notice informativo:
  - Send Invitations, Send by Email, Send by WhatsApp, Autógrafa
- Creado grupo **"Signature Validations"** con notice informativo:
  - FEA, NOM-151, Video Signature, Confirm Name, Identity Verification

### 3. Opción Base64 en File Source

- Agregada tercera opción "Base64 String" al dropdown de File Source
- Campo de texto multilínea para pegar el contenido base64 directamente
- Validación de contenido vacío con error descriptivo

### 4. Campo Folder Name

- Nuevo campo opcional para especificar carpeta destino del documento
- Se envía como `folderName` en el body del request (solo si tiene valor)

### 5. Tests actualizados

- **26/26 tests pasando** (antes 25/25)
- Tests nuevos: estructura sin resource/operation, notices de sección, base64 + folder

---

## ⬜ Pendiente para siguiente sesión

### Permissions (dejarlo hasta el final)

- Agregar bloque de permisos al request:
  ```json
  {
  	"permissions": {
  		"ownerEmail": "user@example.com",
  		"collaborators": [
  			{
  				"email": "user@example.com",
  				"permissions": ["read"]
  			}
  		],
  		"isPublicRead": false
  	}
  }
  ```
- Implementar como `fixedCollection` con `ownerEmail`, `collaborators` (multipleValues), y `isPublicRead`
