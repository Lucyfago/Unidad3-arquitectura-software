/* ============================= 6. ESTADO DE LA APLICACIÓN ============================= */
(function (App) {
  "use strict";

  App.currentStrategyKey = "dijkstra";
  App.mode = "simple"; // "simple" | "composite"
  App.selectedDest = null;
  App.selectedStops = [];
  App.state = { activePath: [], activeEdgeIds: [], compositeSegments: null, lastOrigin: null, lastDestChain: null };

  const dashboardObserver = { update(event) {
    if (event.type === "traffic") App.log("traffic", "DashboardUI", "Se detectó congestión en " + event.edges.length + " tramo(s) de la ruta activa.");
  }};
  const vehicleTrackerObserver = { update(event) {
    if (event.type === "traffic") {
      App.log("traffic", "VehicleTracker", "Recalculando ruta con la estrategia " + App.strategies[App.currentStrategyKey].name + "…");
      const previous = JSON.parse(JSON.stringify(App.state));
      const cmd = new App.CalculateRouteCommand(() => {
        if (App.mode === "simple") App.runSimple(App.state.lastOrigin, App.state.lastDestChain[0], true);
        else App.runComposite(App.state.lastOrigin, App.state.lastDestChain, true);
      }, previous);
      App.navController.executeCommand(cmd);
      App.updateUndoButton();
    }
  }};

  App.trafficMonitor.attach(dashboardObserver);
  App.trafficMonitor.attach(vehicleTrackerObserver);
})(window.NavOptim = window.NavOptim || {});
