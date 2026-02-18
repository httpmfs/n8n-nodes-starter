# n8n-nodes-allsign

Nodo comunitario de [n8n](https://n8n.io) para integración con la plataforma **[AllSign](https://allsign.io)**.

Permite firmar y gestionar documentos desde workflows de n8n utilizando la API de AllSign.

---

## 📂 Estructura del proyecto

```
n8n-nodes-allsign/
├── credentials/          # Definiciones de credenciales (API Key, OAuth2)
├── nodes/
│   ├── Allsign/          # ← Nodo principal de AllSign
│   ├── Example/          # Nodo de ejemplo (referencia)
│   └── GithubIssues/     # Nodo de ejemplo declarativo (referencia)
├── icons/                # Íconos del nodo
├── src/                  # Código fuente auxiliar
├── dist/                 # Código compilado (generado)
├── package.json
└── tsconfig.json
```

---

## 🚀 Cómo correr el proyecto

### Prerrequisitos

| Herramienta | Versión mínima | Instalación |
|---|---|---|
| **Node.js** | v22+ | [nvm](https://github.com/nvm-sh/nvm) (recomendado) |
| **npm** | Incluido con Node.js | — |
| **git** | Cualquiera reciente | [git-scm.com](https://git-scm.com/downloads) |

> [!NOTE]
> No necesitas instalar n8n de forma global. El CLI `@n8n/node-cli` (incluido como dependencia de desarrollo) trae n8n integrado.

### 1. Clonar el repositorio

```bash
git clone https://github.com/allsign/n8n-nodes-allsign.git
cd n8n-nodes-allsign
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Iniciar en modo desarrollo

```bash
npm run dev
```

Esto ejecuta `n8n-node dev`, que:

- ✅ Compila el código TypeScript automáticamente
- ✅ Inicia n8n con los nodos cargados
- ✅ Vigila cambios y recompila en caliente (hot reload)
- ✅ Abre n8n en el navegador en **[http://localhost:5678](http://localhost:5678)**

> Ya puedes buscar el nodo **AllSign** dentro de n8n y probarlo en un workflow.

### 4. Compilar para producción

```bash
npm run build
```

Genera el código JavaScript listo para publicar en la carpeta `dist/`.

---

## 📜 Scripts disponibles

| Comando               | Descripción                                                          |
|-----------------------|----------------------------------------------------------------------|
| `npm run dev`         | Inicia n8n con los nodos cargados y hot reload                       |
| `npm run build`       | Compila TypeScript a JavaScript (produce `dist/`)                    |
| `npm run build:watch` | Compila en modo watch (recompila al detectar cambios)                |
| `npm run lint`        | Revisa errores de código y estilo                                    |
| `npm run lint:fix`    | Corrige automáticamente errores de lint                              |
| `npm run release`     | Crea una nueva versión (release)                                     |

---

## 🐛 Solución de problemas

### El nodo no aparece en n8n

1. Verifica que ejecutaste `npm install`
2. Asegúrate de que el nodo esté registrado en `package.json` → `n8n.nodes`
3. Reinicia el servidor de desarrollo con `npm run dev`
4. Revisa la consola por errores

### Errores de TypeScript

- Asegúrate de usar **Node.js v22** o superior
- Ejecuta `npm install` para obtener todas las definiciones de tipo

### Errores de lint

```bash
npm run lint:fix
```

---

## 📚 Recursos

- [Documentación de creación de nodos n8n](https://docs.n8n.io/integrations/creating-nodes/)
- [Documentación del CLI @n8n/node-cli](https://www.npmjs.com/package/@n8n/node-cli)
- [Foro de la comunidad n8n](https://community.n8n.io/)
- [AllSign](https://allsign.io)

## 📄 Licencia

[MIT](LICENSE.md)
