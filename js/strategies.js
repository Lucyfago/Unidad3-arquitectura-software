/* ============================= 2. STRATEGY: algoritmos de ruteo ============================= */
(function (App) {
  "use strict";

  const { nodes, adjacency, edgeCost, dist, MIN_FACTOR } = App;

  // Interfaz común: calculateRoute(originId, destId) -> {path, cost, nodesExplored, timeMs}

  function frontierSearch(originId, destId, priorityMode) {
    const t0 = performance.now();
    const g = { [originId]: 0 };
    const prev = {};
    const visited = new Set();
    const open = new Map([[originId, 0]]);
    const heuristic = (id) => dist(nodes[id], nodes[destId]) * MIN_FACTOR;
    let nodesExplored = 0;

    while (open.size > 0) {
      let curId = null, curP = Infinity;
      for (const [id, p] of open) { if (p < curP) { curP = p; curId = id; } }
      open.delete(curId);
      if (visited.has(curId)) continue;
      visited.add(curId);
      nodesExplored++;
      if (curId === destId) break;

      for (const link of adjacency[curId]) {
        if (visited.has(link.to)) continue;
        const newG = g[curId] + edgeCost(link.edgeId);
        if (g[link.to] === undefined || newG < g[link.to]) {
          g[link.to] = newG;
          prev[link.to] = curId;
          let priority;
          if (priorityMode === "dijkstra") priority = newG;
          else if (priorityMode === "astar") priority = newG + heuristic(link.to);
          else priority = heuristic(link.to); // vecino más cercano (greedy best-first)
          open.set(link.to, priority);
        }
      }
    }
    const t1 = performance.now();
    const path = [];
    if (g[destId] !== undefined) {
      let cur = destId;
      while (cur !== undefined) { path.unshift(cur); cur = prev[cur]; }
    }
    return { path, cost: g[destId], nodesExplored, timeMs: Math.max(t1 - t0, 0.02) };
  }

  const strategies = {
    dijkstra: {
      name: "Dijkstra",
      color: "var(--dijkstra)",
      desc: "Explora por costo real acumulado. Garantiza la ruta óptima.",
      calculateRoute: (o, d) => frontierSearch(o, d, "dijkstra")
    },
    astar: {
      name: "A*",
      color: "var(--astar)",
      desc: "Usa una heurística de distancia para explorar menos nodos sin perder optimalidad.",
      calculateRoute: (o, d) => frontierSearch(o, d, "astar")
    },
    nn: {
      name: "Vecino más cercano",
      color: "var(--nn)",
      desc: "Avanza siempre hacia el nodo geográficamente más cercano al destino. Es rápido pero no garantiza la ruta más corta.",
      calculateRoute: (o, d) => frontierSearch(o, d, "greedy")
    }
  };

  App.strategies = strategies;
})(window.NavOptim = window.NavOptim || {});
