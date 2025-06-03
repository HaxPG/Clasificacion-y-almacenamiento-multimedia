# Sistema Multimedia Backend

Backend completo para sistema de gestión multimedia compatible con Angular 17.

## Características

- 🔐 Autenticación JWT con roles (Administrador, Periodista, Visualizador)
- 📁 Gestión completa de archivos multimedia
- 🏷️ Sistema de etiquetas y categorías
- 📚 Colecciones y secciones de periódico
- 🔍 Búsqueda avanzada
- 📊 Estadísticas y reportes
- 🛡️ Control de acceso por niveles
- 📤 Subida de archivos con validación

## Instalación

1. Clona el repositorio
2. Instala las dependencias:
   \`\`\`bash
   npm install
   \`\`\`

3. Configura las variables de entorno:
   \`\`\`bash
   cp .env.example .env
   \`\`\`
   Edita el archivo `.env` con tus configuraciones.

4. Configura la base de datos MySQL con el esquema proporcionado.

5. Inicia el servidor:
   \`\`\`bash
   npm run dev
   \`\`\`

## Endpoints Principales

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario (solo admin)

### Archivos
- `GET /api/archivos` - Listar archivos (con paginación y filtros)
- `POST /api/archivos` - Subir archivo
- `GET /api/buscar` - Buscar archivos

### Gestión
- `GET /api/categorias` - Listar categorías
- `POST /api/categorias` - Crear categoría
- `GET /api/tags` - Listar tags
- `POST /api/tags` - Crear tag
- `GET /api/colecciones` - Listar colecciones
- `POST /api/colecciones` - Crear colección

### Administración
- `GET /api/usuarios` - Listar usuarios (solo admin)
- `GET /api/estadisticas` - Estadísticas del sistema (solo admin)

## Roles y Permisos

- **Administrador**: Acceso completo al sistema
- **Periodista**: Puede subir archivos y gestionar contenido
- **Visualizador**: Solo puede ver archivos públicos

## Estructura de Respuestas

Todas las respuestas siguen el formato JSON estándar:

\`\`\`json
{
  "data": {},
  "message": "Operación exitosa",
  "error": null
}
\`\`\`

## Seguridad

- Autenticación JWT
- Validación de tipos de archivo
- Control de acceso basado en roles
- Sanitización de datos de entrada
- Límites de tamaño de archivo

## Tecnologías

- Node.js + Express
- MySQL con mysql2
- JWT para autenticación
- Multer para subida de archivos
- bcryptjs para hash de contraseñas
