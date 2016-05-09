var Redcaser = Redcaser || {};

Redcaser.ExecutionEvents = (function () {
  'use strict';

  var ExecutionDialog   = Redcaser.ExecutionDialog;
  var EnvironmentDialog = Redcaser.EnvironmentDialog;

  var self = {};

  // build :: Object
  self.attach = function (context) {
    var handlers = this.eventHandlers();

    handlers.forEach(function (element) {
      this.addEventHandler(element, context);
    }.bind(this));
  };

  // eventHandlers :: -> [[String, String, (Event -> *)]]
  self.eventHandlers = function () {
    // [event name, class, handler]
    return [
      ['change', 'execution-select',   this.handleExecutionChange  ],
      ['click',  'execution-create',   this.handleExecutionCreate  ],
      ['click',  'environment-create', this.handleEnvironmentCreate],
    ];
  };

  // addEventHandler :: [String, String, (Event -> *)], Object
  self.addEventHandler = function (config, context) {
    context.root.addEventListener(config[0], function (event, ui) {
      if (event.target.classList.contains(config[1])) {
        if (ui) {
          config[2].bind(this)(event, ui, context);
        } else {
          config[2].bind(this)(event, context);
        }
      }
    }.bind(this))
  };

  self.handleExecutionChange = function (event, context) {
    var executionId = event.target.value;

    var params = {
      id:   executionId,
      done: function (response) {
        context.createExecutionSuiteContent(response);
      },
      fail: function () { console.log('Fail!'); }
    };

    Redcaser.API.executionSuites.show(params);
  };

  // handleExecutionCreate :: Event, Object
  self.handleExecutionCreate = function (event, context) {
    var params = {
      done: function (response) {
        ExecutionDialog.forCreate(context.executionEditDialog, event.target, response);
      },
      fail: function () { console.log('Fail!'); }
    };

    Redcaser.API.executionSuites.new(params);
  };

  // handleEnvironmentCreate :: Event, Object
  self.handleEnvironmentCreate = function (event, context) {
    EnvironmentDialog.forCreate(context.environmentEditDialog, event.target);
  };

  return self;
})();