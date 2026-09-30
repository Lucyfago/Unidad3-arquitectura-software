/* ============================= 8. LÓGICA DE UI ============================= */
(function (App) {
  "use strict";

  const {
    nodes, strategies, WAREHOUSE, svg,
    pathToEdgeIds, drawBaseMap, drawRoute, drawCompositeRoute, refreshTrafficColors,
    trafficMonitor, navController, CalculateRouteCommand, RouteSegment, CompositeRoute
  } = App;

  const strategyListEl = document.getElementById("strategyList");
  Object.entries(strategies).forEach(([key, s]) => {
    const wrap = document.createElement("label");
    wrap.className = "strategy-opt" + (key === App.currentStrategyKey ? " active" : "");
    wrap.style.color = s.color;
    wrap.innerHTML = '<input type="radio" name="strategy" value="' + key + '" ' + (key === App.currentStrategyKey ? "checked" : "") + '>' +
      '<span class="dot" style="background:' + s.color + '"></span>' +
      '<span class="txt"><strong style="color:var(--text)">' + s.name + '</strong><span>' + s.desc + '</span></span>';
    wrap.querySelector("input").addEventListener("change", () => {
      App.currentStrategyKey = key;
      document.querySelectorAll(".strategy-opt").forEach(el => el.classList.remove("active"));
      wrap.classList.add("active");
    });
    strategyListEl.appendChild(wrap);
  });

  const modeSimpleBtn = document.getElementById("modeSimple");
  const modeCompositeBtn = document.getElementById("modeComposite");
  const simpleField = document.getElementById("simpleField");
  const compositeField = document.getElementById("compositeField");

  modeSimpleBtn.addEventListener("click", () => setMode("simple"));
  modeCompositeBtn.addEventListener("click", () => setMode("composite"));

  function setMode(m) {
    App.mode = m;
    modeSimpleBtn.classList.toggle("active", m === "simple");
    modeCompositeBtn.classList.toggle("active", m === "composite");
    simpleField.style.display = m === "simple" ? "block" : "none";
    compositeField.style.display = m === "composite" ? "block" : "none";
    resetSelection();
  }

  function onStopClicked(nodeId) {
    if (App.mode === "simple") {
      App.selectedDest = nodeId;
      document.getElementById("destValue").textContent = "🏬 " + nodes[nodeId].label;
      document.querySelectorAll("#map circle[data-node-id]").forEach(c => c.style.filter = "");
      const el = svg.querySelector('circle[data-node-id="' + nodeId + '"]');
      if (el) el.style.filter = "drop-shadow(0 0 4px var(--dijkstra))";
      document.querySelectorAll("[id^=order-]").forEach(t => t.textContent = "");
      calcBtn.disabled = false;
    } else {
      const idx = App.selectedStops.indexOf(nodeId);
      if (idx >= 0) {
        App.selectedStops.splice(idx, 1);
      } else if (App.selectedStops.length < 4) {
        App.selectedStops.push(nodeId);
      }
      renderStopBadges();
      calcBtn.disabled = App.selectedStops.length < 2;
    }
  }

  function renderStopBadges() {
    document.querySelectorAll("[id^=order-]").forEach(t => t.textContent = "");
    const list = document.getElementById("stopsList");
    list.innerHTML = "";
    App.selectedStops.forEach((id, i) => {
      const badgeEl = document.getElementById("order-" + id);
      if (badgeEl) badgeEl.textContent = (i + 1);
      const chip = document.createElement("div");
      chip.className = "stop-chip";
      chip.innerHTML = '<span><span class="badge">' + (i + 1) + '</span>' + nodes[id].label + '</span>';
      list.appendChild(chip);
    });
  }

  const calcBtn = document.getElementById("calcBtn");
  const trafficBtn = document.getElementById("trafficBtn");
  const undoBtn = document.getElementById("undoBtn");
  const resetBtn = document.getElementById("resetBtn");

  resetBtn.addEventListener("click", resetSelection);
  function resetSelection() {
    App.selectedDest = null; App.selectedStops = [];
    document.getElementById("destValue").textContent = "Haz clic en una tienda del mapa";
    renderStopBadges();
    calcBtn.disabled = true;
  }

  calcBtn.addEventListener("click", () => {
    const previous = JSON.parse(JSON.stringify(App.state));
    let applyFn;
    if (App.mode === "simple") applyFn = () => runSimple(WAREHOUSE, App.selectedDest, false);
    else applyFn = () => runComposite(WAREHOUSE, [...App.selectedStops], false);
    const cmd = new CalculateRouteCommand(applyFn, previous);
    navController.executeCommand(cmd);
    updateUndoButton();
  });

  trafficBtn.addEventListener("click", () => {
    trafficMonitor.simulateIncident(App.state.activeEdgeIds);
    refreshTrafficColors();
  });

  undoBtn.addEventListener("click", () => {
    const cmd = navController.undoLast();
    if (cmd) log("undo", "NavigationController", "Se deshizo la última acción de navegación.");
    updateUndoButton();
  });

  function updateUndoButton() { undoBtn.disabled = navController.history.length <= 1; }

  function runSimple(originId, destId, isRecalc) {
    const results = {};
    Object.entries(strategies).forEach(([key, s]) => { results[key] = s.calculateRoute(originId, destId); });
    const chosen = results[App.currentStrategyKey];
    App.state = {
      activePath: chosen.path, activeEdgeIds: pathToEdgeIds(chosen.path),
      compositeSegments: null, lastOrigin: originId, lastDestChain: [destId]
    };
    drawBaseMap();
    drawRoute(chosen.path, strategies[App.currentStrategyKey].color.replace("var(", "").replace(")", "") ? strategies[App.currentStrategyKey].color : "#3465d4", true);
    renderMetricsTable(results);
    document.getElementById("compositeBreakdown").innerHTML = "";
    trafficBtn.disabled = false;
    if (App.selectedDest) {
      const el = svg.querySelector('circle[data-node-id="' + destId + '"]');
      if (el) el.style.filter = "drop-shadow(0 0 4px " + strategies[App.currentStrategyKey].color + ")";
    }
    log("route", "RouteEngine", (isRecalc ? "Ruta recalculada" : "Ruta calculada") + " con <b>" + strategies[App.currentStrategyKey].name + "</b>: " +
      nodes[originId].label + " → " + nodes[destId].label + " (costo " + chosen.cost.toFixed(0) + ")");
  }

  function runComposite(originId, stopIds, isRecalc) {
    const strategy = strategies[App.currentStrategyKey];
    const chain = [originId, ...stopIds];
    const composite = new CompositeRoute();
    const rows = [];
    for (let i = 0; i < chain.length - 1; i++) {
      const r = strategy.calculateRoute(chain[i], chain[i + 1]);
      const seg = new RouteSegment(chain[i], chain[i + 1], r);
      composite.add(seg);
      rows.push({ from: nodes[chain[i]].label, to: nodes[chain[i + 1]].label, cost: r.cost, nodes: r.nodesExplored });
    }
    const fullPath = composite.getSteps();
    App.state = {
      activePath: fullPath, activeEdgeIds: pathToEdgeIds(fullPath),
      compositeSegments: composite.children, lastOrigin: originId, lastDestChain: stopIds
    };
    drawBaseMap();
    drawCompositeRoute(composite.children);
    document.getElementById("metricsTable").querySelector("tbody").innerHTML =
      '<tr><td colspan="4" style="color:var(--text-dim); font-style:italic;">Modo multi-parada: ver desglose por tramo abajo</td></tr>';
    renderCompositeBreakdown(rows, composite.getDistance());
    App.selectedStops.forEach((id, i) => { const b = document.getElementById("order-" + id); if (b) b.textContent = i + 1; });
    trafficBtn.disabled = false;
    log("route", "RouteEngine", (isRecalc ? "Ruta compuesta recalculada" : "Ruta compuesta calculada") + " con <b>" + strategy.name +
      "</b>: " + chain.map(id => nodes[id].label).join(" → ") + " (total " + composite.getDistance().toFixed(0) + ")");
  }

  function renderMetricsTable(results) {
    const tbody = document.getElementById("metricsTable").querySelector("tbody");
    tbody.innerHTML = "";
    const minCost = Math.min(...Object.values(results).map(r => r.cost));
    Object.entries(results).forEach(([key, r]) => {
      const tr = document.createElement("tr");
      if (Math.abs(r.cost - minCost) < 0.01) tr.classList.add("best");
      if (key === App.currentStrategyKey) tr.style.fontWeight = "600";
      tr.innerHTML = "<td>" + strategies[key].name + "</td><td>" + r.cost.toFixed(0) + "</td><td>" + r.nodesExplored + "</td><td>" + r.timeMs.toFixed(2) + " ms</td>";
      tbody.appendChild(tr);
    });
  }

  function renderCompositeBreakdown(rows, total) {
    const el = document.getElementById("compositeBreakdown");
    let html = '<table class="metrics composite-table"><thead><tr><th>Tramo</th><th>Costo</th><th>Nodos</th></tr></thead><tbody>';
    rows.forEach(r => { html += "<tr><td>" + r.from + " → " + r.to + "</td><td>" + r.cost.toFixed(0) + "</td><td>" + r.nodes + "</td></tr>"; });
    html += '<tr style="font-weight:700;"><td>Total ruta compuesta</td><td>' + total.toFixed(0) + '</td><td>—</td></tr></tbody></table>';
    el.innerHTML = html;
  }

  function renderState(snapshot) {
    App.state = snapshot;
    drawBaseMap();
    if (snapshot.compositeSegments) {
      const segs = snapshot.compositeSegments.map(s => Object.assign(new RouteSegment(s.fromId, s.toId, s.result), s));
      drawCompositeRoute(segs);
    } else if (snapshot.activePath && snapshot.activePath.length) {
      drawRoute(snapshot.activePath, strategies[App.currentStrategyKey].color, false);
    }
    trafficBtn.disabled = !(snapshot.activeEdgeIds && snapshot.activeEdgeIds.length);
  }

  function log(type, actor, message) {
    const panel = document.getElementById("logPanel");
    const entry = document.createElement("div");
    entry.className = "log-entry " + type;
    const ts = new Date().toLocaleTimeString("es-CO", { hour12: false });
    entry.innerHTML = '<span class="ts">' + ts + '</span><b>' + actor + ':</b> ' + message;
    panel.prepend(entry);
    while (panel.children.length > 40) panel.removeChild(panel.lastChild);
  }

  document.getElementById("themeToggle").addEventListener("click", () => {
    const root = document.documentElement;
    const cur = root.getAttribute("data-theme");
    if (cur === "dark") { root.setAttribute("data-theme", "light"); document.getElementById("themeToggle").textContent = "Modo oscuro"; }
    else { root.setAttribute("data-theme", "dark"); document.getElementById("themeToggle").textContent = "Modo claro"; }
  });

  App.onStopClicked = onStopClicked;
  App.runSimple = runSimple;
  App.runComposite = runComposite;
  App.renderState = renderState;
  App.updateUndoButton = updateUndoButton;
  App.log = log;

  /* ============================= 9. INICIO ============================= */
  drawBaseMap();
  log("route", "Sistema", "Mapa vial generado. Selecciona una estrategia y un destino para comenzar.");
})(window.NavOptim = window.NavOptim || {});
