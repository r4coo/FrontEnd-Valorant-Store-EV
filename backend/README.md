# Valorant Store Backend

Backend REST API para la tienda de figuras de Valorant construido con Java 17, Spring Boot 3.2 y Gradle.

## Características

- Autenticación JWT
- Gestión de usuarios (registro/login)
- Sistema de órdenes y carrito de compras
- Base de datos H2 (en memoria) para desarrollo
- Spring Security
- Validación de datos
- CORS configurado para frontend Next.js

## Requisitos

- Java 17 o superior
- Gradle 8.x

## Instalación y Ejecución

### Usando Gradle Wrapper (recomendado)

\`\`\`bash
# En la carpeta backend
./gradlew bootRun
\`\`\`

En Windows:
\`\`\`bash
gradlew.bat bootRun
\`\`\`

### Construir el proyecto

\`\`\`bash
./gradlew build
\`\`\`

### Ejecutar tests

\`\`\`bash
./gradlew test
\`\`\`

## Endpoints de la API

### Autenticación

**POST** `/api/auth/register`
\`\`\`json
{
  "username": "usuario",
  "email": "usuario@ejemplo.com",
  "password": "password123"
}
\`\`\`

**POST** `/api/auth/login`
\`\`\`json
{
  "username": "usuario",
  "password": "password123"
}
\`\`\`

Respuesta:
\`\`\`json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "username": "usuario",
  "email": "usuario@ejemplo.com"
}
\`\`\`

### Órdenes (requiere autenticación)

**POST** `/api/orders`
\`\`\`json
{
  "items": [
    {
      "agentId": "5f8d3a7f-467b-97f3-062c-13acf203c006",
      "agentName": "Breach",
      "quantity": 1,
      "price": 29.99
    }
  ]
}
\`\`\`

**GET** `/api/orders` - Obtener todas las órdenes del usuario

**GET** `/api/orders/{id}` - Obtener una orden específica

## Autenticación

Para endpoints protegidos, incluye el token JWT en el header:

\`\`\`
Authorization: Bearer {token}
\`\`\`

## Consola H2

Durante el desarrollo, puedes acceder a la consola H2:
- URL: http://localhost:8080/api/h2-console
- JDBC URL: `jdbc:h2:mem:valorantdb`
- Usuario: `sa`
- Password: (dejar vacío)

## Configuración

Edita `src/main/resources/application.properties` para configurar:
- Puerto del servidor
- Base de datos
- JWT secret y expiración
- CORS origins
- Niveles de logging

## Testing con Selenium/Python

El backend está listo para ser probado con Selenium. Ejemplos de pruebas:

\`\`\`python
import requests

# Registro
response = requests.post('http://localhost:8080/api/auth/register', json={
    'username': 'testuser',
    'email': 'test@test.com',
    'password': 'password123'
})
token = response.json()['token']

# Crear orden
headers = {'Authorization': f'Bearer {token}'}
response = requests.post('http://localhost:8080/api/orders', 
    headers=headers,
    json={
        'items': [{'agentId': '123', 'agentName': 'Jett', 'quantity': 1, 'price': 29.99}]
    }
)
\`\`\`

## Estructura del Proyecto

\`\`\`
backend/
├── src/main/java/com/valorant/store/
│   ├── config/          # Configuración de seguridad
│   ├── controller/      # Controladores REST
│   ├── dto/             # Data Transfer Objects
│   ├── model/           # Entidades JPA
│   ├── repository/      # Repositorios JPA
│   ├── security/        # JWT y filtros de seguridad
│   └── service/         # Lógica de negocio
└── src/main/resources/
    └── application.properties
