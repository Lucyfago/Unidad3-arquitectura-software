/* ============================= 1. MODELO DE GRAFO ============================= */
(function (App) {
  "use strict";

  const ROWS = 6, COLS = 8;
  const SPACING_X = 108, SPACING_Y = 92, MARGIN_X = 55, MARGIN_Y = 45;

  function seededRandom(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }
  const rnd = seededRandom(20260927);

  const nodes = {};
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const id = r + "_" + c;
      nodes[id] = { id, r, c, x: MARGIN_X + c * SPACING_X, y: MARGIN_Y + r * SPACING_Y, label: null, kind: "normal" };
    }
  }

  const WAREHOUSE = "5_0";
  nodes[WAREHOUSE].kind = "warehouse";
  nodes[WAREHOUSE].label = "Centro de Distribución";

  const STOPS = [
    { id: "0_7", label: "Tienda Norte" },
    { id: "1_2", label: "Tienda Occidente" },
    { id: "5_7", label: "Tienda Oriente" },
    { id: "3_4", label: "Tienda Centro" }
  ];
  STOPS.forEach(s => { nodes[s.id].kind = "stop"; nodes[s.id].label = s.label; });

  const edges = {};
  const adjacency = {};
  Object.keys(nodes).forEach(id => adjacency[id] = []);

  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  function addEdge(aId, bId) {
    const a = nodes[aId], b = nodes[bId];
    const isAvenida = rnd() < 0.28;
    const roadFactor = isAvenida ? 0.72 : 1.0;
    const baseCost = dist(a, b) * roadFactor;
    const trafficFactor = 1.0 + rnd() * 0.2;
    const edgeId = aId + "|" + bId;
    edges[edgeId] = { id: edgeId, a: aId, b: bId, baseCost, trafficFactor, isAvenida };
    adjacency[aId].push({ to: bId, edgeId });
    adjacency[bId].push({ to: aId, edgeId });
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const id = r + "_" + c;
      if (c < COLS - 1) addEdge(id, r + "_" + (c + 1));
      if (r < ROWS - 1) addEdge(id, (r + 1) + "_" + c);
    }
  }

  function edgeCost(edgeId) { const e = edges[edgeId]; return e.baseCost * e.trafficFactor; }
  const MIN_FACTOR = 0.68; // cota admisible para la heurística de A*

  App.rnd = rnd;
  App.nodes = nodes;
  App.edges = edges;
  App.adjacency = adjacency;
  App.WAREHOUSE = WAREHOUSE;
  App.dist = dist;
  App.edgeCost = edgeCost;
  App.MIN_FACTOR = MIN_FACTOR;
})(window.NavOptim = window.NavOptim || {});
