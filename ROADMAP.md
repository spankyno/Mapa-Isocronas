# Hoja de ruta — Mapa Isocronas

## Corto plazo
- Capa CARTO con clave opcional (hecho) o migrar a vector tiles (MapLibre) sin clave en otros proveedores.
- Mover los ajustes de estilo a un panel lateral con vista previa en vivo en móvil.
- Presets de estilo (claro, satélite, impresión) y guardar/importar ajustes en JSON.
- Exportar con leyenda, título y escala incrustados en el PNG; exportar GeoJSON/KML/SVG.
- Rate limiting y restricción de origen (CORS) en el proxy.

## Medio plazo
- Varios orígenes y comparación de isócronas (unión/intersección, solapamientos).
- Perfiles de transporte: camión (driving-hgv), bici, a pie.
- Área y población alcanzada (atributo `area` + datos INE/GHSL).
- Compartir escenario por URL (origen, tiempos, estilo en el hash).
- Geocodificador más robusto (autocompletado, Photon/Geoapify) y geolocalización del usuario.
- Isócronas por distancia además de tiempo.

## Largo plazo
- Instancia propia de ORS/Valhalla con perfil de velocidades personalizable (velocidad media real).
- Tráfico por franja horaria (hora punta) con datos externos.
- Cuentas de usuario, escenarios guardados y proyectos compartidos.
- Informes PDF automáticos y API pública para integrar isócronas.
- Pruebas automáticas (Vitest + Playwright) y CI en el despliegue.

## Cuentas (siguiente)
- Cobro del plan Pro con Clerk Billing/Stripe en lugar de metadata manual.
- Cuota en Upstash/Vercel KV (atómica, sin depender de la API de Clerk) y panel de uso.
