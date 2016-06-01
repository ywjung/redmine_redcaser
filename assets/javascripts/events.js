var Redcaser = Redcaser || {}

Redcaser.Events = (function () {
  'use strict'

  var self = {}

  // build :: Object
  self.attach = function (context) {
    var handlers = this.eventHandlers()

    handlers.forEach(function (element) {
      this.addEventHandler(element, context)
    }.bind(this))
  }

  // addEventHandler :: [String, String, (Event -> *)], Object
  self.addEventHandler = function (config, context) {
    context.root.addEventListener(config[0], function (event, ui) {
      if (event.target.classList.contains(config[1])) {
        config[2].bind(this)(event, context)
      }
    }.bind(this))
  }

  return self
})()

Redcaser.TreeEvents = (function () {
  'use strict'

  var self = $.extend({}, Redcaser.Events)

  // eventHandlers :: -> [[String, String, (Event -> *)]]
  self.eventHandlers = function () {
    // [event name, class, handler]
    return [
      ['click', 'suite-create',         this.handleSuiteCreate  ],
      ['click', 'suite-actions-edit',   this.handleSuiteEdit    ],
      ['click', 'suite-actions-delete', this.handleSuiteDelete  ],
      ['click', 'case-actions-edit',    this.handleCaseEdit     ]
    ]
  }

  // handleSuiteEdit :: Event, Object
  self.handleSuiteEdit = function (event, context) {
    var suiteId = event.target.dataset.id

    var params = {
      id:   suiteId,
      done: function (response) {
        Redcaser.suiteDialog.forUpdate(response, context)
      },
      fail: function (response) { console.log(response) }
    }

    Redcaser.API.testSuites.edit(params)
  }

  // handleCaseEdit :: Event, Object
  self.handleCaseEdit = function (event, context) {
    var issueId = event.target.dataset.issue_id
    var testSuiteId = event.target.dataset.test_suite_id

    location.href = '/issues/' + issueId + '/edit?test_suite_id=' + testSuiteId
  }

    // handleSuiteCreate :: Event, Object
  self.handleSuiteCreate = function (event, context) {
    var params = {
      done: function (response) {
        Redcaser.suiteDialog.forCreate(event, response, context)
      },
      fail: function (response) { console.log(response) }
    }

    Redcaser.API.testSuites.new(params)
  }

  // handleSuiteDelete :: Event, Object
  self.handleSuiteDelete = function (event, context) {
    var id = parseInt(event.target.dataset.id)

    var params = {
      id:   id,
      done: function (response) {
        var node = context.testSuites[id].node

        node.parentNode.removeChild(node)

        delete context.testSuites[id]
      },
      fail: function (response) {
        var errors = response.responseJSON.errors

        alert(errors)
      }
    }

    Redcaser.API.testSuites.destroy(params)
  }

  return self
})()

Redcaser.ExecutionEvents = (function () {
  'use strict'

  var ExecutionDialog   = Redcaser.ExecutionDialog
  var EnvironmentDialog = Redcaser.EnvironmentDialog

  var self = $.extend({}, Redcaser.Events)

  // eventHandlers :: -> [[String, String, (Event -> *)]]
  self.eventHandlers = function () {
    // [event name, class, handler]
    return [
      ['change', 'execution-select',           this.handleExecutionChange],
      ['change', 'list-item-select',           this.handleStatusChange   ],
      ['click',  'case-list-edit',             this.handleSuiteEdit      ],
      ['click',  'case-list-delete',           this.handleSuiteDelete    ],
      ['click',  'case-footer-submit',         this.handlePreviewSubmit  ],
      ['click',  'execution-create',           this.handleExecutionCreate],
      ['click',  'list-item-name',             this.handleListItemClick  ],
      ['click',  'case-footer-related-submit', this.handleRelationCreate ]
    ]
  }

  // handleExecutionChange :: Event, Object
  self.handleExecutionChange = function (event, context) {
    var executionId = event.target.value

    context.loadExecutionSuite(executionId)
  }

  // handleStatusChange :: Event, Object
  self.handleStatusChange = function (event, context) {
    var id = event.target.dataset.id

    var test_case = context.testCases[id]

    var data = {
      test_case_status: {
        execution_suite_id:  context.selectedExecutionSuite.id,
        execution_result_id: event.target.value,
        test_case_id:        id
      }
    }

    var params = {
      data: data,
      done: function (response) {
        this.updateStatusForListItem(response, context)
      }.bind(this),
      fail: function (response) { console.log(response) }
    }

    if (test_case.status) {
      params.id = event.target.dataset.test_case_status_id

      Redcaser.API.testSuiteStatuses.update(params)
    }
    else {
      Redcaser.API.testSuiteStatuses.create(params)
    }
  }

  self.handleSuiteEdit = function (event, context) {
    var id = event.target.dataset.id

    var params = {
      id:   id,
      done: function (response) {
        Redcaser.executionDialog.forUpdate(response, context)
      },
      fail: function (response) { console.log(response) }
    }

    Redcaser.API.executionSuites.edit(params)
  }

  self.handleSuiteDelete = function (event, context) {
    var id = event.target.dataset.id

    var params = {
      id:   id,
      done: function (response) { location.reload(true) },
      fail: function (response) { console.log(response) }
    }

    Redcaser.API.executionSuites.destroy(params)
  }

  // handlePreviewSubmit :: Event, Object
  self.handlePreviewSubmit = function (event, context) {
    var params    = this.gatherPreviewData(event, context)
    var id        = event.target.dataset.id
    var test_case = context.testCases[id]

    if (test_case.status) {
      params.id = event.target.dataset.test_case_status_id

      Redcaser.API.testSuiteStatuses.update(params)
    }
    else {
      Redcaser.API.testSuiteStatuses.create(params)
    }
  }

  // handleExecutionCreate :: Event, Object
  self.handleExecutionCreate = function (event, context) {
    var params = {
      done: function (response) {
        Redcaser.executionDialog.forCreate(response, context)
      },
      fail: function (response) { console.log(response) }
    }

    Redcaser.API.executionSuites.new(params)
  }

  // handleListItemClick :: Event, Object
  self.handleListItemClick = function (event, context) {
    var id = event.target.dataset.id

    context.displayCasePreview(id)
    context.preview.dataset.test_case_id = id
  }

  // updateStatusForListItem :: Object, Object
  self.updateStatusForListItem = function (data, context) {
    var testCaseStatus = data.test_case_status
    var listItem = context.listItems[testCaseStatus.test_case_id.toString()]
    var nameText = listItem.getElementsByClassName('list-item-status-name')[0]
      .childNodes[0]
    var nameSelect = listItem.getElementsByClassName('list-item-select')[0]

    nameText.nodeValue = testCaseStatus.name
    nameSelect.value   = testCaseStatus.status_id

    if (context.preview && testCaseStatus.test_case_id == context.preview.dataset.test_case_id) {
      var textField = context.preview
        .getElementsByClassName('case-footer-comment')[0]
      var selectField = context.preview
        .getElementsByClassName('case-footer-select')[0]

      textField.value   = ''
      selectField.value = testCaseStatus.status_id
    }
  }

  // handleRelationCreate :: Event, Object
  self.handleRelationCreate = function (event, context) {
    var params = this.gatherPreviewData(event, context)

    var id        = event.target.dataset.id
    var test_case = context.testCases[id]
    var relation  = event.target.parentNode.getElementsByClassName('case-footer-related-select')[0].value

    params.done = function () {
      location.href = '/projects/' + context.project.identifier
        + '/issues/new?test_case[relation_type]='
        + relation
        + '&test_case[issue_id]='
        + test_case.issue_id
    }

    if (test_case.status) {
      params.id = event.target.dataset.test_case_status_id

      Redcaser.API.testSuiteStatuses.update(params)
    }
    else {
      Redcaser.API.testSuiteStatuses.create(params)
    }
  }

  self.gatherPreviewData = function (event, context) {
    var id      = event.target.dataset.id
    var parent  = event.target.parentNode
    var comment = parent.getElementsByClassName('case-footer-comment')[0].value
    var status  = parent.getElementsByClassName('case-footer-select')[0].value

    var data = {
      test_case_status: {
        execution_suite_id:  context.selectedExecutionSuite.id,
        execution_result_id: status,
        test_case_id:        id
      },
      comment: comment
    }

    var params = {
      data: data,
      done: function (response) {
        this.updateStatusForListItem(response, context)
      }.bind(this),
      fail: function (response) { console.log(response) }
    }

    return params
  }
  return self
})()

Redcaser.TestCaseSelectorEvents = (function () {
  'use strict'

  var self = $.extend({}, Redcaser.Events)

  // eventHandlers :: -> [[String, String, (Event -> *)]]
  self.eventHandlers = function () {
    // [event name, class, handler]
    return [
      ['change', 'queries-select',    this.handleQueryChange],
      ['change', 'case-header-check', this.handleCheckToggle]
    ]
  }

  self.handleQueryChange = function (event, context) {
    var id = event.target.value

    context.getTestCaseList(id)
  }

  self.handleCheckToggle = function (event, context) {
    var isChecked = event.target.checked
    var children  = context.caseList.childNodes

    for(var index = 0; index < children.length; index += 1) {

      var checkbox = children[index].getElementsByClassName('checkbox')[0].firstChild
      checkbox.checked = isChecked
    }
  }

  return self
})()


Redcaser.EnvironmentSelectorEvents = (function () {
  'use strict'

  var EnvironmentDialog = Redcaser.EnvironmentDialog

  var self = $.extend({}, Redcaser.Events)

  // eventHandlers :: -> [[String, String, (Event -> *)]]
  self.eventHandlers = function () {
    // [event name, class, handler]
    return [
      ['click', 'environment-create', this.handleEnvironmentCreate]
    ]
  }

  // handleEnvironmentCreate :: Event, Object
  self.handleEnvironmentCreate = function (event, context) {
    Redcaser.environmentDialog.forCreate(context)
  }

  return self
})()