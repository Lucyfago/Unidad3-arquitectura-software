/* ============================= 3. COMPOSITE: rutas con múltiples paradas ============================= */
(function (App) {
  "use strict";

  class RouteSegment {
    constructor(fromId, toId, result) { this.fromId = fromId; this.toId = toId; this.result = result; }
    getDistance() { return this.result.cost || 0; }
    getSteps() { return this.result.path; }
  }
  class CompositeRoute {
    constructor() { this.children = []; }
    add(component) { this.children.push(component); }
    getDistance() { return this.children.reduce((sum, c) => sum + c.getDistance(), 0); }
    getSteps() { return this.children.flatMap((c, i) => i === 0 ? c.getSteps() : c.getSteps().slice(1)); }
  }

  App.RouteSegment = RouteSegment;
  App.CompositeRoute = CompositeRoute;
})(window.NavOptim = window.NavOptim || {});
