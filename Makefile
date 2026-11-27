# Ejecuta Astro dentro de Podman con acceso a los archivos del proyecto.
IMAGE := docker.io/library/node:26.13.0-trixie-slim
CONTAINER := podman run --rm --init --userns=keep-id -e ASTRO_TELEMETRY_DISABLED=1 -v "$(CURDIR):/app:Z" -w /app
RUN := $(CONTAINER) -e HOME=/tmp
PORT ?= 4321

.PHONY: install dev check build format-check

# Instala las versiones del lockfile dentro del contenedor.
install:
	$(RUN) $(IMAGE) npm ci

# Inicia el servidor de Astro en un puerto accesible solo desde este equipo.
dev:
	$(RUN) -p 127.0.0.1:$(PORT):4321 $(IMAGE) npm run dev

# Verifica los tipos de TypeScript y las plantillas de Astro.
check:
	$(RUN) $(IMAGE) npm run check

# Genera archivos estáticos en dist/.
build:
	$(RUN) $(IMAGE) npm run build

# Verifica el formato del código nuevo sin modificarlo.
format-check:
	$(RUN) $(IMAGE) npm run format:check
