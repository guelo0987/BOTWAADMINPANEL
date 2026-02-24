# 🤖 BOTWAADMINPANEL

Panel de administración completo para gestionar conversaciones de WhatsApp, citas y clientes. Integrado con bot de WhatsApp para intervención humana.

## 🚀 Características

- **Gestión de Conversaciones**: Intervención humana directa desde el panel, escalación de conversaciones, historial completo
- **Gestión de Citas**: Crear, editar, cancelar y ver todas las citas de tus clientes
- **Gestión de Clientes**: Ver y administrar información de clientes
- **Configuración del Bot**: Configurar servicios, profesionales, horarios y más según el tipo de negocio
- **Dashboard**: Estadísticas en tiempo real, gráficos y métricas importantes

## 🛠️ Tecnologías

- **Next.js 16** - Framework React con Server Components
- **TypeScript** - Tipado estático
- **Prisma** - ORM para base de datos
- **Redis** - Almacenamiento de conversaciones y estados
- **Tailwind CSS** - Estilos
- **Shadcn UI** - Componentes UI
- **WhatsApp Business API** - Integración con WhatsApp

## 📋 Requisitos Previoss

- Node.js 18+ 
- PostgreSQL
- Redis
- Cuenta de WhatsApp Business API con credenciales

## 🔧 Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/BOTWAADMINPANEL.git
cd BOTWAADMINPANEL
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
JWT_SECRET="tu-secret-key"
WHATSAPP_ACCESS_TOKEN="tu-access-token"
WHATSAPP_PHONE_NUMBER_ID="tu-phone-number-id"
WHATSAPP_API_VERSION="v21.0"
REDIS_URL="redis://localhost:6379"
```

4. Configura la base de datos:
```bash
npx prisma generate
npx prisma migrate dev
```

5. Inicia el servidor de desarrollo:
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
├── src/
│   ├── app/                    # Rutas de Next.js
│   │   ├── api/                # API Routes
│   │   │   ├── admin/          # Endpoints de administración
│   │   │   └── appointments/   # Endpoints de citas
│   │   └── dashboard/          # Páginas del panel
│   ├── components/             # Componentes React
│   ├── lib/                    # Utilidades y configuraciones
│   ├── services/               # Servicios (WhatsApp, Redis, etc.)
│   └── types/                  # Tipos TypeScript
├── prisma/
│   └── schema.prisma           # Esquema de base de datos
└── public/                     # Archivos estáticos
```

## 🔑 Funcionalidades Principales

### Conversaciones
- Ver todas las conversaciones activas
- Intervenir en conversaciones (pausar IA)
- Enviar mensajes como humano
- Escalar conversaciones
- Resolver conversaciones y reanudar IA

### Citas
- Crear nuevas citas
- Editar citas existentes
- Cancelar citas
- Ver historial completo
- Filtrar por estado

### Configuración del Bot
- Configurar tipo de negocio (clínica, salón, tienda, general)
- Gestionar servicios
- Gestionar profesionales (para clínicas)
- Configurar horarios y días laborables
- Configurar precios y duraciones

## 🔐 Autenticación

El sistema usa JWT para autenticación. Los usuarios deben iniciar sesión para acceder al panel.

## 📡 API Endpoints

### Conversaciones
- `GET /api/admin/conversations` - Listar conversaciones
- `GET /api/admin/conversations/[customer_id]/history` - Obtener historial
- `POST /api/admin/conversations/[customer_id]/send-message` - Enviar mensaje
- `POST /api/admin/conversations/[customer_id]/escalate` - Escalar conversación
- `POST /api/admin/conversations/[customer_id]/resolve` - Resolver conversación

### Citas
- `GET /api/appointments` - Listar citas
- `POST /api/appointments` - Crear cita
- `PUT /api/appointments/[id]` - Actualizar cita
- `DELETE /api/appointments/[id]` - Eliminar cita
- `PATCH /api/appointments/[id]/cancel` - Cancelar cita

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en Vercel
3. Deploy automático en cada push

### Docker

```bash
docker build -t botwaadminpanel .
docker run -p 3000:3000 botwaadminpanel
```

## 📝 Licencia

Este proyecto es privado y propietario.

## 👥 Contribuidores

- Desarrollado para gestión de bots de WhatsApp

## 🆘 Soporte

Para problemas o preguntas, abre un issue en el repositorio.

---

**Nota**: Asegúrate de tener configuradas correctamente todas las variables de entorno antes de usar el sistema en producción.
