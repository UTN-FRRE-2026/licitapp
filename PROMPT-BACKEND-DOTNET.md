# Prompt: Backend .NET para LicitApp

> Pegá este archivo completo como prompt inicial en una carpeta vacía (un repositorio
> nuevo, separado del front). Es **autocontenido**: incluye todo el dominio, las reglas
> de negocio y los contratos de API que necesitás. No necesitás acceso al código del front.

---

## Contexto del producto

**LicitApp** es un marketplace de licitaciones de materiales de construcción para la
provincia del Chaco (Argentina). Hay dos roles de usuario:

- **`constructor`**: publica **solicitudes** (licitaciones) pidiendo materiales.
- **`corralon`**: ve las solicitudes de su zona y publica **ofertas** (cotizaciones).

El constructor compara las ofertas recibidas y **acepta una**, lo que cierra la
licitación: la oferta ganadora pasa a `WON`, el resto a `LOST`, y se actualizan
estadísticas de ambos usuarios.

El **frontend ya existe**: es una app móvil Expo / React Native (TypeScript) que hoy
usa **Firebase Auth + Firestore**. La autenticación seguirá en **Firebase Auth**
(el front emite el login y obtiene un **ID Token JWT**). **Tu backend NO maneja
contraseñas**: sólo **verifica el ID Token de Firebase** en cada request y sirve los
datos de negocio desde **PostgreSQL**. Migramos los datos de negocio de Firestore a
PostgreSQL; Firebase queda únicamente como proveedor de identidad (y, opcionalmente,
de Storage para adjuntos).

---

## Qué tenés que construir

1. Una **Web API en .NET** (la versión estable/LTS más reciente disponible — verificá
   con `dotnet --list-sdks`; apuntá a **.NET 10 LTS** o superior).
2. **Entity Framework Core** + **Npgsql** como ORM contra **PostgreSQL**.
3. **Las tablas se crean con el ORM** (enfoque *code-first* con **migraciones de EF
   Core**). No escribas SQL DDL a mano: definí las entidades y el `DbContext`, generá
   la migración inicial y aplicala.
4. Un **`docker-compose.yml`** que levante el contenedor de **PostgreSQL** (y un volumen
   persistente). La API puede correr fuera de Docker en desarrollo (`dotnet run`); incluí
   también un `Dockerfile` y el servicio de la API en el compose como opción.
5. **Autenticación por verificación de Firebase ID Tokens** (JWT Bearer).

> **IMPORTANTE sobre versiones:** antes de escribir código, verificá las versiones
> instaladas (`dotnet --list-sdks`, `dotnet ef --version`) y, si tenés acceso, consultá
> la documentación vigente de .NET / EF Core / Npgsql. No asumas APIs de memoria si la
> versión difiere.

---

## Stack y decisiones técnicas

| Aspecto            | Decisión                                                                 |
|--------------------|--------------------------------------------------------------------------|
| Runtime            | .NET 10 (LTS) — ASP.NET Core Web API                                      |
| ORM                | EF Core 10 + `Npgsql.EntityFrameworkCore.PostgreSQL`                      |
| Base de datos      | PostgreSQL 17 (contenedor Docker)                                         |
| Creación de tablas | Migraciones EF Core (code-first). Aplicar con `db.Database.Migrate()` al arrancar |
| Auth               | `Microsoft.AspNetCore.Authentication.JwtBearer` validando tokens de Firebase |
| Mapeo DTOs         | DTOs explícitos (no exponer entidades EF directamente)                   |
| Docs               | Swagger / OpenAPI habilitado en desarrollo                               |
| Validación         | DataAnnotations o FluentValidation                                       |

### Verificación del token de Firebase (clave)

Firebase Auth emite ID Tokens que son **JWT firmados por Google**. No hace falta el
Admin SDK ni un service account sólo para *verificar*: configurá `JwtBearer` apuntando
al emisor de Firebase, que expone su JWKS público.

- **Project ID de Firebase:** `licitapp-e1841`
- **Authority / Issuer:** `https://securetoken.google.com/licitapp-e1841`
- **Audience:** `licitapp-e1841`
- El **`sub`** (subject) del token es el **Firebase UID** del usuario → es la clave
  primaria de tu tabla `users`.

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var projectId = builder.Configuration["Firebase:ProjectId"]; // licitapp-e1841
        options.Authority = $"https://securetoken.google.com/{projectId}";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = $"https://securetoken.google.com/{projectId}",
            ValidateAudience = true,
            ValidAudience = projectId,
            ValidateLifetime = true,
        };
    });
```

Helper para extraer el UID del usuario autenticado en cada endpoint:
`User.FindFirstValue("user_id")` o `User.FindFirstValue(ClaimTypes.NameIdentifier)` (el
claim `sub`). El email viene en el claim `email`.

> El **registro** sigue ocurriendo en Firebase (el front crea el usuario con
> `createUserWithEmailAndPassword`). Tu backend expone un endpoint **`POST /api/users/sync`**
> (o `/me`) que, con un token válido, hace **upsert** del perfil en PostgreSQL (crea la
> fila la primera vez con los datos del registro: rol, nombre, teléfono, zona, etc.).

---

## Modelo de dominio (portado del front)

Estos son los tipos del frontend. Convertilos en entidades EF Core. Mantené los nombres
de campos en la **forma que el front espera en el JSON** (camelCase en la API; en la base
podés usar snake_case con la convención de Npgsql).

### Enums

```
UserRole       = constructor | corralon
SolicitudStatus = OPEN | CLOSED | CANCELLED | EXPIRED
ShippingType    = FREE | CHARGED | FIXED_PRICE
OfertaStatus    = ACTIVE | WON | LOST | EXPIRED | WITHDRAWN
NotificationType = NEW_OFFER | DEADLINE_NEAR | OFFER_WON | OFFER_LOST | NEW_REQUEST
```

Mapealos como enums de C#. En PostgreSQL podés guardarlos como **texto** (recomendado por
legibilidad y compatibilidad con el front) o como enums nativos de PG. Usá conversión de
EF (`.HasConversion<string>()`).

### Entidades

**User** (tabla `users`) — PK = `Uid` (Firebase UID, `string`):

| Campo               | Tipo        | Notas                                  |
|---------------------|-------------|----------------------------------------|
| Uid                 | string PK   | Firebase UID (claim `sub`)             |
| Email               | string      |                                        |
| FullName            | string      |                                        |
| Role                | UserRole    |                                        |
| Phone               | string      |                                        |
| Zone                | string      | una de las zonas (ver constantes)      |
| BusinessName        | string?     | nullable (sólo corralones lo usan)     |
| Verified            | bool        | default false                          |
| PushToken           | string?     | token de Expo Notifications            |
| CreatedAt           | DateTime    | UTC, default ahora                     |
| Stats.TotalLicitaciones | int     | owned type o columnas planas           |
| Stats.TotalOfertas  | int         |                                        |
| Stats.TotalCierres  | int         |                                        |

`Stats` puede modelarse como **owned entity** (`stats_total_licitaciones`, etc.) o como
tres columnas. El front lo consume como objeto anidado `stats: { totalLicitaciones, totalOfertas, totalCierres }`.

**Solicitud** (tabla `solicitudes`) — PK = `Id` (Guid):

| Campo                   | Tipo            | Notas                                      |
|-------------------------|-----------------|--------------------------------------------|
| Id                      | Guid PK         |                                            |
| ConstructorId           | string FK→users | el dueño                                   |
| ConstructorName         | string          | denormalizado (nombre del constructor)     |
| Title                   | string          |                                            |
| DeliveryZone            | string          |                                            |
| Deadline                | DateTime        | UTC                                        |
| Notes                   | string?         |                                            |
| AttachmentUrl           | string?         |                                            |
| Status                  | SolicitudStatus | default OPEN                               |
| WinningOfferId          | Guid?           | la oferta ganadora                         |
| OfertasCount            | int             | contador denormalizado                     |
| CorralonesNotifiedCount | int             |                                            |
| CreatedAt               | DateTime        | UTC                                        |
| Materiales              | List\<Material> | relación 1→N                               |
| Ofertas                 | List\<Oferta>   | relación 1→N                               |

**Material** (tabla `materiales`) — PK = `Id` (Guid):

| Campo       | Tipo              | Notas                  |
|-------------|-------------------|------------------------|
| Id          | Guid PK           |                        |
| SolicitudId | Guid FK→solicitudes | cascade delete       |
| Name        | string            |                        |
| Quantity    | decimal           |                        |
| Unit        | string            | ver `MATERIAL_UNITS`   |

**Oferta** (tabla `ofertas`) — PK = `Id` (Guid):

| Campo            | Tipo            | Notas                                          |
|------------------|-----------------|------------------------------------------------|
| Id               | Guid PK         |                                                |
| SolicitudId      | Guid FK→solicitudes |                                            |
| CorralonId       | string FK→users |                                                |
| CorralonName     | string          | denormalizado                                  |
| CorralonRating   | double?         | opcional                                       |
| TotalPrice       | decimal         |                                                |
| ShippingType     | ShippingType    |                                                |
| ShippingPrice    | decimal?        | sólo si CHARGED / FIXED_PRICE                  |
| DeliveryHours    | int             |                                                |
| ValidUntil       | DateTime        | UTC                                            |
| Comment          | string?         |                                                |
| Status           | OfertaStatus    | default ACTIVE                                 |
| IsBestPrice      | bool            | badge: es la oferta más barata (ver reglas)    |
| IsFastDelivery   | bool            | badge: entrega ≤ 24 h                          |
| CreatedAt        | DateTime        | UTC                                            |

El front consume también campos **desnormalizados** en listas del corralón:
`solicitudTitle` y `solicitudDeadline`. Podés exponerlos en el DTO de Oferta vía join
con la Solicitud (preferido) o persistirlos como columnas. Documentá la decisión.

**Notification** (tabla `notifications`) — PK = `Id` (Guid):

| Campo       | Tipo             | Notas                |
|-------------|------------------|----------------------|
| Id          | Guid PK          |                      |
| UserId      | string FK→users  | destinatario         |
| Type        | NotificationType |                      |
| Title       | string           |                      |
| Body        | string           |                      |
| SolicitudId | Guid?            |                      |
| OfertaId    | Guid?            |                      |
| Read        | bool             | default false        |
| CreatedAt   | DateTime         | UTC                  |

> **Fechas:** usá siempre **UTC** (`timestamptz` en PostgreSQL). Con Npgsql, los
> `DateTime` deben ser `DateTimeKind.Utc`. El front envía/espera fechas ISO 8601.

---

## Reglas de negocio a portar (críticas)

El front hoy resuelve esto con transacciones de Firestore. Replicalas con
**transacciones de EF Core** (`BeginTransactionAsync`) para garantizar atomicidad.

### 1. Crear solicitud (`POST /api/solicitudes`)
- Crea la `Solicitud` (status `OPEN`, contadores en 0) **y todos sus `Material`** en una
  sola transacción.
- `ConstructorId` y `ConstructorName` salen del usuario autenticado.

### 2. Crear oferta (`POST /api/solicitudes/{id}/ofertas`)
En una transacción:
1. Verificar que la solicitud existe y está **`OPEN`**; si no, rechazar con error de
   negocio (409/400): *"Esta licitación ya no está activa."*
2. Recalcular badge **`isBestPrice`**: la nueva oferta es mejor precio si su `totalPrice`
   es `<=` al mínimo de las ofertas **`ACTIVE`** existentes (o si no hay ofertas). Si la
   nueva pasa a ser mejor precio, **quitarle el badge** a la que lo tenía.
3. `isFastDelivery` = `deliveryHours <= 24`.
4. Insertar la oferta (`ACTIVE`) e **incrementar `ofertasCount`** en la solicitud.
- `CorralonId` / `CorralonName` salen del usuario autenticado (debe tener rol `corralon`).

### 3. Aceptar oferta (`POST /api/solicitudes/{id}/accept`)
En una transacción:
1. Verificar que la solicitud está **`OPEN`** (sino: *"Esta licitación ya no está disponible."*).
2. Verificar que quien acepta es el **constructor dueño**.
3. La oferta elegida → `WON`; el resto de las `ACTIVE` → `LOST`.
4. Solicitud → `CLOSED`, `WinningOfferId` = oferta ganadora.
5. **Incrementar `stats.totalCierres`** del constructor **y** del corralón ganador.

### 4. Editar oferta (`PUT /api/solicitudes/{id}/ofertas/{ofertaId}`)
- Sólo permitido si la solicitud sigue **`OPEN`** y el corralón es el dueño de la oferta.
- Campos editables: `totalPrice`, `shippingType`, `shippingPrice`, `deliveryHours`, `comment`.

### 5. Retirar oferta (`POST /api/solicitudes/{id}/ofertas/{ofertaId}/withdraw`)
- La oferta pasa a `WITHDRAWN`. Sólo el corralón dueño.

### 6. Resumen de competencia (`GET /api/solicitudes/{id}/ofertas/resumen`)
- Devuelve `{ count, bestPrice }` sobre las ofertas **`ACTIVE`** (cantidad y precio mínimo,
  o `null` si no hay).

---

## Contratos de API (mínimo a implementar)

Todos los endpoints (salvo el health-check) requieren `Authorization: Bearer <firebase_id_token>`.
Respuestas en **camelCase**. Devolvé DTOs, no entidades.

### Usuarios
| Método | Ruta                 | Descripción                                              |
|--------|----------------------|----------------------------------------------------------|
| POST   | `/api/users/sync`    | Upsert del perfil del usuario autenticado (registro/login). Body con rol, nombre, phone, zone, businessName. |
| GET    | `/api/users/me`      | Perfil del usuario autenticado (incluye `stats`).        |
| PUT    | `/api/users/me`      | Actualizar perfil (incluye `pushToken`).                 |

### Solicitudes
| Método | Ruta                                | Descripción                                          |
|--------|-------------------------------------|------------------------------------------------------|
| POST   | `/api/solicitudes`                  | Crear solicitud + materiales (rol constructor).      |
| GET    | `/api/solicitudes/mine`             | Mis solicitudes (constructor), orden `createdAt desc`.|
| GET    | `/api/solicitudes/{id}`             | Detalle con `materiales`.                            |
| GET    | `/api/solicitudes?zone=&status=OPEN`| Feed del corralón por zona, orden `deadline asc`.    |

### Ofertas
| Método | Ruta                                                | Descripción                                  |
|--------|-----------------------------------------------------|----------------------------------------------|
| POST   | `/api/solicitudes/{id}/ofertas`                     | Crear oferta (reglas arriba).                |
| GET    | `/api/solicitudes/{id}/ofertas`                     | Ofertas `ACTIVE` de la solicitud, `totalPrice asc`. |
| GET    | `/api/solicitudes/{id}/ofertas/resumen`             | `{ count, bestPrice }`.                      |
| GET    | `/api/ofertas/mine`                                 | Mis ofertas (corralón), `createdAt desc`.    |
| GET    | `/api/solicitudes/{id}/ofertas/{ofertaId}`          | Una oferta.                                  |
| PUT    | `/api/solicitudes/{id}/ofertas/{ofertaId}`          | Editar oferta.                               |
| POST   | `/api/solicitudes/{id}/ofertas/{ofertaId}/withdraw` | Retirar.                                     |
| POST   | `/api/solicitudes/{id}/accept`                      | Aceptar oferta ganadora (body: `ofertaId`).  |

### Notificaciones (opcional, segunda iteración)
| Método | Ruta                            | Descripción                |
|--------|---------------------------------|----------------------------|
| GET    | `/api/notifications`            | Del usuario autenticado.   |
| POST   | `/api/notifications/{id}/read`  | Marcar como leída.         |

### Health
| Método | Ruta        | Descripción                |
|--------|-------------|----------------------------|
| GET    | `/health`   | Liveness (sin auth).       |

---

## Autorización por rol

- `constructor`: crea solicitudes, acepta ofertas, ve sus solicitudes y las ofertas de
  ellas.
- `corralon`: ve el feed por zona, crea/edita/retira ofertas, ve sus ofertas.
- Validá el rol contra el perfil en PostgreSQL (no confíes sólo en el token, que no trae
  el rol). Devolvé `403` si el rol no corresponde, `404` si el recurso no existe, `409`
  para conflictos de estado (licitación cerrada, etc.).

---

## docker-compose (PostgreSQL)

Incluí un `docker-compose.yml` con PostgreSQL 17 y volumen persistente. Ejemplo de
referencia (ajustá credenciales y movélas a `.env`):

```yaml
services:
  db:
    image: postgres:17
    container_name: licitapp-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: licitapp
      POSTGRES_PASSWORD: licitapp_dev
      POSTGRES_DB: licitapp
    ports:
      - "5432:5432"
    volumes:
      - licitapp_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U licitapp -d licitapp"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Opcional: la API también dockerizada
  # api:
  #   build: .
  #   depends_on:
  #     db:
  #       condition: service_healthy
  #   environment:
  #     ConnectionStrings__Default: "Host=db;Port=5432;Database=licitapp;Username=licitapp;Password=licitapp_dev"
  #     Firebase__ProjectId: "licitapp-e1841"
  #   ports:
  #     - "8080:8080"

volumes:
  licitapp_pgdata:
```

Connection string para desarrollo local (API fuera de Docker):
`Host=localhost;Port=5432;Database=licitapp;Username=licitapp;Password=licitapp_dev`

---

## Configuración (appsettings / variables de entorno)

```
ConnectionStrings:Default = Host=localhost;Port=5432;Database=licitapp;Username=licitapp;Password=licitapp_dev
Firebase:ProjectId        = licitapp-e1841
```

No hardcodees secretos: usá `appsettings.Development.json` (gitignored) o variables de
entorno / user-secrets.

---

## Creación de tablas con EF Core (migraciones)

```bash
dotnet tool install --global dotnet-ef        # si no está
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL

# Generar la migración inicial (define el esquema desde las entidades)
dotnet ef migrations add InitialCreate

# Aplicar (o dejar que la app lo haga al arrancar con db.Database.Migrate())
dotnet ef database update
```

En `Program.cs`, aplicá migraciones al arranque:

```csharp
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}
```

Levantá primero la base: `docker compose up -d db`.

---

## Estructura de proyecto sugerida

```
/ (repo backend)
├── docker-compose.yml
├── Dockerfile                      (opcional, para dockerizar la API)
├── .env.example
├── LicitApp.Api/
│   ├── Program.cs
│   ├── appsettings.json
│   ├── appsettings.Development.json (gitignored)
│   ├── Domain/                      (entidades + enums)
│   ├── Data/AppDbContext.cs
│   ├── Migrations/                  (generadas por EF)
│   ├── Dtos/
│   ├── Endpoints/  o  Controllers/
│   ├── Services/                    (lógica de negocio/transacciones)
│   └── Auth/                        (helpers de claims/rol)
└── README.md
```

Podés usar **Minimal APIs** (endpoints agrupados por feature) o **Controllers**; elegí
uno y sé consistente. Para la lógica con transacciones (crear oferta, aceptar), encapsulá
en servicios inyectables, no en los controllers.

---

## CORS

El front Expo corre en web (`expo start --web`, normalmente `http://localhost:8081`) y en
móvil. Configurá CORS permisivo en desarrollo y restringido por origen en producción.

---

## Constantes de referencia (del front)

**Zonas** (campo `zone` / `deliveryZone`):
```
Resistencia, Chaco · Fontana, Chaco · Barranqueras, Chaco · Vilelas, Chaco ·
Puerto Tirol, Chaco · Presidencia Roque Sáenz Peña, Chaco · Villa Ángela, Chaco ·
Quitilipi, Chaco · Las Breñas, Chaco · General San Martín, Chaco
```

**Unidades de material** (campo `unit`):
```
bolsas · unidades · barras · m² · m³ · kg · litros · metros · paquetes · rollos · chapas · tablas
```

---

## Fuera de alcance (mencionar, no implementar salvo que se pida)

- **Tiempo real:** el front hoy usa listeners de Firestore (`onSnapshot`) para el feed y
  el detalle. Equivalente en .NET sería **SignalR**. Dejalo como punto de extensión; en
  esta primera versión, el front puede usar polling / refetch con React Query.
- **Storage de adjuntos:** hoy va a Firebase Storage. Opciones futuras: endpoint
  `POST /api/files` (multipart) hacia disco / S3 / MinIO. Por ahora el front puede seguir
  subiendo a Firebase Storage y mandar sólo la `attachmentUrl`.
- **Push notifications:** la generación de notificaciones (NEW_OFFER, OFFER_WON, etc.) y
  el envío vía Expo Push se pueden modelar como un servicio posterior; por ahora basta con
  persistir las `Notification`.

---

## Criterios de aceptación

- [ ] `docker compose up -d db` levanta PostgreSQL con healthcheck en verde.
- [ ] `dotnet ef migrations add InitialCreate` + `database update` crean **todas** las
      tablas a partir de las entidades (no hay SQL DDL escrito a mano).
- [ ] La API arranca, aplica migraciones al inicio y expone Swagger en desarrollo.
- [ ] Un request **sin** `Authorization` válido devuelve `401`.
- [ ] Con un Firebase ID Token válido (project `licitapp-e1841`), `POST /api/users/sync`
      crea/actualiza el perfil y `GET /api/users/me` lo devuelve con `stats`.
- [ ] El flujo completo funciona end-to-end: crear solicitud → crear varias ofertas
      (con recálculo de `isBestPrice`) → aceptar una (WON/LOST, solicitud CLOSED, stats
      incrementadas), todo de forma atómica.
- [ ] Errores de negocio devuelven códigos correctos (`403` rol, `404` no existe,
      `409` estado inválido).
- [ ] `README.md` con pasos para levantar todo de cero.

---

## Primer paso recomendado

1. Verificá versiones (`dotnet --list-sdks`) y, si podés, revisá la doc vigente de
   .NET 10 / EF Core 10 / Npgsql.
2. Creá el proyecto Web API, agregá los paquetes, definí entidades + `DbContext`.
3. Escribí el `docker-compose.yml`, levantá la base, generá y aplicá la migración inicial.
4. Configurá JwtBearer con Firebase, implementá `users/sync` + `users/me` y probá el
   ciclo de auth con un token real.
5. Implementá solicitudes y ofertas con sus reglas/transacciones.
6. README + criterios de aceptación.
