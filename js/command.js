/* ============================= 5. COMMAND: acciones reversibles ============================= */
(function (App) {
  "use strict";

  class NavigationController {
    constructor() { this.history = []; }
    executeCommand(command) { command.execute(); this.history.push(command); }
    undoLast() {
      const cmd = this.history.pop();
      if (cmd) cmd.undo();
      return cmd;
    }
  }

  class CalculateRouteCommand {
    constructor(applyFn, previousSnapshot) { this.applyFn = applyFn; this.previous = previousSnapshot; }
    execute() { this.applyFn(); }
    undo() { App.renderState(this.previous); }
  }

  App.NavigationController = NavigationController;
  App.CalculateRouteCommand = CalculateRouteCommand;
  App.navController = new NavigationController();
})(window.NavOptim = window.NavOptim || {});
