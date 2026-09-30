/* ============================= 7. RENDER: SVG del mapa ============================= */
(function (App) {
  "use strict";

  const { nodes, edges, adjacency } = App;

  const svg = document.getElementById("map");
  const NS = "http://www.w3.org/2000/svg";

  function edgePath(edgeId) {
    const e = edges[edgeId], a = nodes[e.a], b = nodes[e.b];
    return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  }

  function drawBaseMap() {
    svg.innerHTML = "";
    const gEdges = document.createElementNS(NS, "g");
    Object.values(edges).forEach(e => {
      const { x1, y1, x2, y2 } = edgePath(e.id);
      const line = document.createElementNS(NS, "line");
      line.setAttribute("x1", x1); line.setAttribute("y1", y1);
      line.setAttribute("x2", x2); line.setAttribute("y2", y2);
      line.setAttribute("stroke", e.isAvenida ? "var(--avenida)" : "var(--grid-line)");
      line.setAttribute("stroke-width", e.isAvenida ? 4 : 2);
      line.dataset.edgeId = e.id;
      gEdges.appendChild(line);
    });
    svg.appendChild(gEdges);

    const gRoute = document.createElementNS(NS, "g");
    gRoute.setAttribute("id", "routeLayer");
    svg.appendChild(gRoute);

    const gNodes = document.createElementNS(NS, "g");
    Object.values(nodes).forEach(n => {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", n.x); c.setAttribute("cy", n.y);
      c.dataset.nodeId = n.id;
      c.style.cursor = n.kind !== "normal" ? "pointer" : "default";
      if (n.kind === "warehouse") {
        c.setAttribute("r", 11); c.setAttribute("fill", "var(--warehouse)");
        c.setAttribute("stroke", "var(--panel)"); c.setAttribute("stroke-width", 2.5);
      } else if (n.kind === "stop") {
        c.setAttribute("r", 8); c.setAttribute("fill", "#7d8ba0");
        c.setAttribute("stroke", "var(--panel)"); c.setAttribute("stroke-width", 2);
        c.addEventListener("click", () => App.onStopClicked(n.id));
      } else {
        c.setAttribute("r", 3.2); c.setAttribute("fill", "var(--grid-line)");
      }
      gNodes.appendChild(c);

      if (n.label) {
        const t = document.createElementNS(NS, "text");
        t.setAttribute("x", n.x);
        t.setAttribute("y", n.kind === "warehouse" ? n.y + 24 : n.y - 14);
        t.setAttribute("text-anchor", "middle");
        t.setAttribute("font-size", "11");
        t.setAttribute("class", "node-tip");
        t.textContent = n.label;
        gNodes.appendChild(t);
      }
      if (n.kind === "stop") {
        const badge = document.createElementNS(NS, "text");
        badge.setAttribute("x", n.x); badge.setAttribute("y", n.y + 4);
        badge.setAttribute("text-anchor", "middle");
        badge.setAttribute("font-size", "9.5"); badge.setAttribute("fill", "#fff");
        badge.setAttribute("font-family", "IBM Plex Mono, monospace");
        badge.setAttribute("id", "order-" + n.id);
        gNodes.appendChild(badge);
      }
    });
    svg.appendChild(gNodes);
    refreshTrafficColors();
  }

  function refreshTrafficColors() {
    document.querySelectorAll("#map line").forEach(line => {
      const e = edges[line.dataset.edgeId];
      if (e.trafficFactor > 1.5) {
        line.setAttribute("stroke", "var(--traffic)");
        line.setAttribute("stroke-width", e.isAvenida ? 5 : 3.5);
      } else {
        line.setAttribute("stroke", e.isAvenida ? "var(--avenida)" : "var(--grid-line)");
        line.setAttribute("stroke-width", e.isAvenida ? 4 : 2);
      }
    });
  }

  function pathToEdgeIds(path) {
    const ids = [];
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i + 1];
      ids.push((adjacency[a].find(l => l.to === b)).edgeId);
    }
    return ids;
  }

  function drawRoute(path, color, animate) {
    const layer = document.getElementById("routeLayer");
    layer.innerHTML = "";
    if (!path || path.length === 0) return;
    const pts = path.map(id => nodes[id]).map(n => n.x + "," + n.y).join(" ");
    const poly = document.createElementNS(NS, "polyline");
    poly.setAttribute("points", pts);
    poly.setAttribute("fill", "none");
    poly.setAttribute("stroke", color);
    poly.setAttribute("stroke-width", 5);
    poly.setAttribute("stroke-linecap", "round");
    poly.setAttribute("stroke-linejoin", "round");
    poly.setAttribute("opacity", "0.92");
    layer.appendChild(poly);

    const van = document.createElementNS(NS, "circle");
    van.setAttribute("r", 7);
    van.setAttribute("fill", "#fff");
    van.setAttribute("stroke", color);
    van.setAttribute("stroke-width", 3.5);
    van.setAttribute("cx", nodes[path[0]].x);
    van.setAttribute("cy", nodes[path[0]].y);
    layer.appendChild(van);

    if (animate) {
      let i = 0;
      const step = () => {
        if (i >= path.length) return;
        const n = nodes[path[i]];
        van.setAttribute("cx", n.x); van.setAttribute("cy", n.y);
        i++;
        setTimeout(step, Math.max(700 / path.length, 60));
      };
      step();
    }
  }

  function drawCompositeRoute(segments) {
    const layer = document.getElementById("routeLayer");
    layer.innerHTML = "";
    const palette = ["var(--dijkstra)", "var(--astar)", "var(--nn)", "#9b6bd6"];
    segments.forEach((seg, idx) => {
      const path = seg.getSteps();
      const pts = path.map(id => nodes[id]).map(n => n.x + "," + n.y).join(" ");
      const poly = document.createElementNS(NS, "polyline");
      poly.setAttribute("points", pts);
      poly.setAttribute("fill", "none");
      poly.setAttribute("stroke", palette[idx % palette.length]);
      poly.setAttribute("stroke-width", 5);
      poly.setAttribute("stroke-linecap", "round");
      poly.setAttribute("stroke-linejoin", "round");
      layer.appendChild(poly);
    });
  }

  App.svg = svg;
  App.drawBaseMap = drawBaseMap;
  App.refreshTrafficColors = refreshTrafficColors;
  App.pathToEdgeIds = pathToEdgeIds;
  App.drawRoute = drawRoute;
  App.drawCompositeRoute = drawCompositeRoute;
})(window.NavOptim = window.NavOptim || {});
