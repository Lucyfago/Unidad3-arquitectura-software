# NavOptim — Unidad 3, Arquitectura de Software

Prototipo académico de **estrategias de navegación para reparto urbano**: un mapa vial
de 6×8 con un centro de distribución y cuatro tiendas, donde se puede calcular una ruta
de reparto con distintos algoritmos y observar cómo reacciona el sistema ante un
incidente de tráfico en tiempo real.

Cuatro patrones clásicos aplicados sobre el mismo dominio: **Strategy**, **Observer**,
**Command** y **Composite**.

## Cómo ejecutarlo

Abre `index.html` en el navegador. Nada más.

No hay build, ni `npm install`, ni servidor. Son `<script>` clásicos y `<link>` a CSS
relativo, así que funciona con doble clic sobre el archivo (protocolo `file://`).

## Los patrones

| Patrón | Dónde vive | Qué hace |
|---|---|---|
| **Strategy** | `js/strategies.js` | Tres algoritmos intercambiables tras la misma interfaz `calculateRoute(origen, destino)`: **Dijkstra** (óptimo, explora por costo real), **A\*** (heurística de distancia, mismo costo con menos nodos explorados) y **vecino más cercano** (greedy, rápido pero no garantiza la ruta más corta). La tabla de métricas compara los tres en cada cálculo. |
| **Observer** | `js/traffic-monitor.js`, `js/state.js` | `TrafficMonitor` notifica un evento de tráfico a sus suscriptores. `DashboardUI` lo registra en el log; `VehicleTracker` recalcula la ruta activa con la estrategia vigente. |
| **Command** | `js/command.js` | Cada cálculo se envuelve en un `CalculateRouteCommand` con su snapshot previo, así que **Deshacer** restaura el estado anterior. El tráfico también se ejecuta como comando, por lo que es reversible. |
| **Composite** | `js/composite.js` | En modo *multi-parada* (2 a 4 tiendas) cada tramo es un `RouteSegment` y la ruta completa es un `CompositeRoute` que encadena los tramos y consolida costo y pasos. |

## Estructura

```
index.html              markup, sin lógica
css/
  base.css              variables de tema, reset, layout
  components.css        tarjetas, controles, mapa, tablas, log
js/
  graph.js              modelo de grafo determinista (48 nodos, 82 aristas, seed 20260927)
  strategies.js         Strategy: los tres algoritmos de ruteo
  composite.js          Composite: segmentos y ruta compuesta
  traffic-monitor.js    Observer: monitor e incidentes de tráfico
  command.js            Command: historial reversible
  state.js              estado de la aplicación y observadores
  map-render.js         render del SVG (mapa, ruta, animaciones)
  ui.js                 eventos, paneles, estado inicial
```

Los ocho scripts se cargan en ese orden y comparten un único namespace, `NavOptim`.
Cada uno va dentro de su propia IIFE, así que no se filtra ningún global al `window`.
El orden importa: cada módulo lee del namespace lo que necesita de los anteriores.

## Notas de implementación

- **Grafo determinista.** `seededRandom(20260927)` fija costos, también los de tráfico.
  El mismo mapa se dibuja siempre igual, que es lo que hace comparables las métricas.
- **Grafo no dirigido y ponderado.** Las aristas llevan `baseCost` (longitud × factor de
  vía) por `trafficFactor` (congestión). El costo real es el producto de ambos, y es lo
  que leen los tres algoritmos.
- **A\*** usa una heurística de distancia euclidiana escalada por `MIN_FACTOR = 0.68`,
  una cota inferior admisible del factor de vía, para no perder la optimalidad.
- **Sin dependencias.** Ni framework, ni librería de grafos, ni bundler. Los
  `<script>` clásicos se eligieron a propósito: los módulos ES fallan por CORS bajo
  `file://` y este proyecto se abre haciendo doble clic.

## Licencia

Proyecto académico. Unidad 3, Arquitectura de Software.
