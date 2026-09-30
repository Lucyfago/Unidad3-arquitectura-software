/* ============================= 4. OBSERVER: monitor de tráfico ============================= */
(function (App) {
  "use strict";

  const { edges, rnd } = App;

  class TrafficMonitor {
    constructor() { this.observers = []; }
    attach(o) { this.observers.push(o); }
    notify(event) { this.observers.forEach(o => o.update(event)); }
    simulateIncident(pathEdgeIds) {
      if (!pathEdgeIds || pathEdgeIds.length === 0) return null;
      const count = Math.min(2, pathEdgeIds.length);
      const chosen = [];
      const pool = [...pathEdgeIds];
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(rnd() * pool.length);
        chosen.push(pool.splice(idx, 1)[0]);
      }
      chosen.forEach(eid => { edges[eid].trafficFactor = 1.6 + rnd() * 1.2; });
      const event = { type: "traffic", edges: chosen };
      this.notify(event);
      return event;
    }
  }

  App.TrafficMonitor = TrafficMonitor;
  App.trafficMonitor = new TrafficMonitor();
})(window.NavOptim = window.NavOptim || {});
