# Prompt para generar estructura del proyecto

Quiero que actúes como un Staff Software Engineer / Solutions Architect y me ayudes a diseñar la arquitectura inicial de un monorepo SaaS llamado **Demand Radar**.

## Contexto del proyecto

Demand Radar es una plataforma SaaS enfocada en detectar señales de demanda e intención de compra desde fuentes públicas y datos proporcionados por clientes.

El objetivo es encontrar publicaciones, preguntas o conversaciones donde existan personas buscando comprar productos específicos.

Ejemplos:

* “Busco Toyota Hilux 2020 diesel”
* “Busco apartamento en San Pedro Sula”
* “Alguien vende iPhone 15 Pro”
* “Busco laptop gaming usada”

## Verticales iniciales

* Autos usados
* Bienes raíces
* Smartphones
* Laptops / Desktop PCs

## Objetivo MVP

El MVP debe permitir:

* definir keywords o búsquedas guardadas
* recolectar contenido desde múltiples fuentes
* almacenar contenido bruto
* procesarlo con IA
* detectar intención de compra
* clasificar señales
* mostrar resultados en dashboard
* enviar alertas por email o Telegram

---

## Requisito importante

Esta arquitectura debe estar pensada para reutilizarse más adelante en un segundo producto:

## Tender Monitor

Un monitor de licitaciones públicas para Honduras orientado a proveedores del Estado.

Por eso necesito que la arquitectura tenga una capa base reutilizable de:

* collectors
* parsers
* alerts
* enrichment
* search

---

# Stack técnico preferido

Quiero trabajar con:

## Monorepo

* Turborepo

## Frontend

* Next.js
* TypeScript
* TailwindCSS

## API principal

* NestJS

## AI / NLP service

* FastAPI

Este servicio será responsable de:

* intent detection
* summarization
* keyword extraction
* scoring
* entity extraction

## Base de datos

* PostgreSQL

Usar:

* JSONB
* full text search
* pg_trgm
* pgvector

## Cache / queue

* Redis

## ORM

Preferiblemente:

* Prisma

aunque también puedes recomendar alternativa si consideras que encaja mejor.

---

# Qué necesito que me entregues

Quiero una respuesta técnica detallada que incluya:

## 1. Estructura completa de carpetas del monorepo

Ejemplo:

```bash
/apps
/packages
/services
/infrastructure
/scripts
```

Desglosando cada carpeta y su propósito.

---

## 2. Qué responsabilidad tiene cada app o servicio

Ejemplo:

* web
* api
* admin
* ai-worker
* collector-worker
* notifier-worker

---

## 3. Qué paquetes compartidos conviene crear

Ejemplo:

* db
* shared-types
* ui
* config
* logger
* queue
* sdk

---

## 4. Diseño inicial de base de datos

Proponer tablas iniciales como:

* users
* organizations
* sources
* collected_items
* extracted_signals
* alerts
* saved_searches

Con breve explicación por tabla.

---

## 5. Flujo de datos end-to-end

Desde:

```txt
source
→ collector
→ database
→ AI enrichment
→ scoring
→ dashboard
→ alerts
```

Explicando cómo interactúan.

---

## 6. Arquitectura preparada para escalar

Necesito que pienses en:

* nuevos verticales
* nuevos collectors
* nuevos canales de alertas
* multi-tenant SaaS
* background jobs
* rate limiting
* observability
* retries
* deduplication

---

## 7. Recomendaciones de infraestructura local y producción

Por ejemplo:

Desarrollo:

* Docker Compose

Producción:

* Docker containers
* Vercel o VPS para frontend
* DigitalOcean o similar
* managed PostgreSQL
* managed Redis

---

## 8. Bonus

Si lo consideras útil:

* naming conventions
* package boundaries
* recommended environment variables
* CI/CD
* testing strategy

---

# Requisitos de respuesta

* responde como arquitecto senior
* prioriza simplicidad para MVP
* evita overengineering
* pero deja preparado el camino para escalar
* usa TypeScript-first donde tenga sentido
* el diseño debe optimizar velocidad de desarrollo para una sola persona o equipo pequeño

Quiero una propuesta concreta y pragmática, no académica.

---

## Mi recomendación adicional


> “Si tienes que elegir entre complejidad y velocidad de ejecución para el MVP, prioriza velocidad de ejecución.”
