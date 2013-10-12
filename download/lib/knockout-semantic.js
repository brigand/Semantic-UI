;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

// not implemented
// The reason for having an empty file and not throwing is to allow
// untraditional implementation of this module.

},{}],2:[function(require,module,exports){
var utils = require("../utils");
var fs = require('fs');
var template = "<input type=\"hidden\">\n<i class=\"dropdown icon\"></i>\n<div class=\"default text\" data-bind=\"text: context.text || context.selected || context.defaultText\"></div>\n<div class=\"menu\" data-bind=\"foreach: context.data\">\n    <!-- ko if: $data.go -->\n        <div class=\"item\" data-bind=\"click: $data.go\">\n            <!-- ko if: $data.icon -->\n                <i data-bind=\"attr: {'class': 'icon ' + $data.icon}\"></i>\n            <!-- /ko -->\n            <!-- ko text: $data.name --><!-- /ko -->\n        </div>\n    <!-- /ko -->\n    <!-- ko ifnot: $data.go -->\n    <div class=\"item\" data-bind=\"text: $data\"></div>\n    <!-- /ko -->\n</div>\n<!--\ncontext.data[$index() | 0]-->\n";

module.exports = {
    init: function dropdownBinding(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var $el = $(element), obj = valueAccessor(), suppressUpdate;

        console.log("initiating dropdown");

        var updateSelection = function () {
            var selected = obj.selected;

            if ( suppressUpdate ) {
                suppressUpdate = false;
            } else {
                suppressUpdate = true;
                $el.find('.menu .item:contains(' + selected + ')').click();
            }
        };

        // watch for changes
        var selectedObservable = ko.getObservable(obj, 'selected');

        if ( selectedObservable == null ) {
            ko.track(obj);
            selectedObservable = ko.getObservable(obj, 'selected');
        }

        obj.defaultText = obj.defaultText || element.textContent || "";


        selectedObservable.subscribe(updateSelection);

        // apply the template
        element.innerHTML = template;

        var innerBindingContext = bindingContext.createChildContext({
            context: obj
        });

        // not sure if this is even possible with Knockout-ES5
        // but I suppose they could still use ko.observable(thingImPassingToModalParam)

        ko.applyBindingsToDescendants(innerBindingContext, element);
        // invoke immediately to get the initial selection
        updateSelection();

        $el.dropdown({
            onChange: function (value, text) {

                if ( suppressUpdate ) {
                    suppressUpdate = false;
                } else {
                    suppressUpdate = true;
                    obj.selected = text;
                }
            }
        });

        return { controlsDescendantBindings: true };
    },
    makeRealNode: function (node) {
        var dropdown, data = node.getAttribute("data");

        if ( !data ) {
            return {required: "data"};
        }
        dropdown = document.createElement("div");

        utils.mergeClasses("ui dropdown", node, dropdown);

        dropdown.setAttribute("data-bind", utils.hashToBindingString({
            dropdown: data
        }));

        // Preserve the text node if one exists
        if ( node.childNodes[0] && node.childNodes[0].nodeType === Node.TEXT_NODE ) {
            dropdown.appendChild(node.childNodes[0]);
        }

        return dropdown;
    }
};

},{"../utils":10,"fs":1}],3:[function(require,module,exports){
var fs = require('fs');
var template = "<i class=\"close icon\"></i>\n<div class=\"header\" data-bind=\"text: title\">\n\n</div>\n<div class=\"content\" data-bind=\"html: content\">\n    <div class=\"left\">\n        Content can appear on left\n    </div>\n    <div class=\"right\">\n        Content can appear on right\n    </div>\n</div>\n<div class=\"actions\" data-bind=\"foreach: buttons\">\n    <div class=\"ui button\" data-bind=\"text: name, click: go\"></div>\n</div>";
var Action = require("../classes").Action;
var utils = require("../utils.js");


module.exports = {
    init: function modalBinding(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        // We need to figure out if we have a boolean variable/observable, or an object variable/observable
        var obj = valueAccessor();

        // if we have our own buttons config, we don't want to
        // have Semantic-UI hide when a button is pressed
        if ( obj.buttons ) {
            // Some nonexistent element
            obj.selector = "#fake-" + new Date().getTime();
        }

        var context = ko.utils.extend({
            title: "",
            content: "",
            buttons: [
                new Action("Cancel", $.noop), new Action("Okay", $.noop)
            ],
            show: false
        }, obj);

        // Patch the buttons so they get the element as the `this`
        ko.utils.arrayForEach(context.buttons, function (action) {
            // but only do this once
            action.go = action.callback.bind(element);
            action.go._wasAlreadyPatched = true;
        });


        // if we've already applied bindings, we need to clean up first
        ko.cleanNode(element);


        // check if there are children
        // if so, we don't want to delete them
        if ( element.children.length === 0 ) {
            // load our module template
            element.innerHTML = template;
        }

        var observable = ko.getObservable(obj, "show");

        var showing = false, hiding = false;

        observable.subscribe(function () {

            // We don't want these to fire if we're in the process
            // of showing or hiding already
            if ( obj.show && !showing ) {
                setTimeout(function () {
                    showing = false;
                }, 430);

                $(element).modal("show");
            } else if ( !obj.show && !hiding ) {
                setTimeout(function () {
                    if ( !obj.show ) {
                        hiding = false;
                    }
                }, 430);

                $(element).modal("hide").modal("hide dimmer");
            } else {
                console.log("fake", showing, hiding);
            }
        });

        // we need our own onHide and onShow methods to make sure
        // our observable stays in check
        context.onShow = function () {
            console.log("onshow", showing, hiding);
            showing = true;
            obj.show = true;
        };
        context.onHide = function () {
            console.log("onhide", showing, hiding);
            hiding = true;
            obj.show = false;
        };

        var innerBindingContext = bindingContext.createChildContext(context);

        // not sure if this is even possible with Knockout-ES5
        // but I suppose they could still use ko.observable(thingImPassingToModalParam)
        ko.applyBindingsToDescendants(innerBindingContext, element);

        $(element).modal(context);


        return { controlsDescendantBindings: true };

    }, makeRealNode: function (node, attributes) {
        var modal, data = node.getAttribute("data");

        if ( !data ) {
            return {required: "data"};
        }

        modal = document.createElement("div");
        modal.className = "ui modal";

        modal.setAttribute("data-bind", utils.hashToBindingString({ modal: data}));

        return modal;
    }
};

},{"../classes":6,"../utils.js":10,"fs":1}],4:[function(require,module,exports){
var fs = require('fs');
var template = "<!-- ko foreach: data -->\n<!-- ko if: $parent.disabled -->\n\n<div class=\"step\" data-bind=\"text: $data,\n    css: {\n        active: $parent.active === $index() || $parent.active === $data,\n        disabled: $parent.active !== $index() && $parent.active !== $data\n    }\"></div>\n<!-- /ko -->\n<!-- ko ifnot: $parent.disabled -->\n<div class=\"step\" data-bind=\"text: $data,\n    css: { active: $parent.active === $index() || $parent.active === $data },\n    click: function(){ typeof $parent.active === 'number' ? $parent.active = $index() : $parent.active = $data }\"></div>\n<!-- /ko -->\n\n<!-- /ko -->";

var utils = require("../utils");

var binding = {
    'init': function stepsBingindInit(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var obj = valueAccessor(), $el = $(element);

        // if we've already applied bindings, we need to clean up first
        ko.cleanNode(element);

        // load our module template
        element.innerHTML = template;

        var innerBindingContext = bindingContext.createChildContext(obj);

        // not sure if this is even possible with Knockout-ES5
        // but I suppose they could still use ko.observable(thingImPassingToModalParam)
        ko.applyBindingsToDescendants(innerBindingContext, element);

        return { controlsDescendantBindings: true };
    },
    makeRealNode: function (node, attributes) {
        var steps, data = node.getAttribute("data");

        if ( !data ) {
            return {required: "data"};
        }

        steps = document.createElement("div");

        utils.mergeClasses("ui steps", node, steps);

        steps.setAttribute("data-bind", utils.hashToBindingString({
            steps: data
        }));

        return steps;
    }

};

module.exports = binding;
},{"../utils":10,"fs":1}],5:[function(require,module,exports){
var utils = require("../utils");

module.exports = {
    init: function toggleBinding(element, valueAccessor){
        var $el = $(element);

        // Toggle the observable on click
        $(element).click(function(){
            var obj = valueAccessor();

            // Update the observable (true or false)
            // this also effects the class change
            obj.on = !obj.on;
        });

        var updateClass = function(){
            // if we set it to true, add the "active" class
            if (valueAccessor().on) {
                $el.addClass('active');
            }

            // otherwise, remove it
            else {
                $el.removeClass('active');
            }
        };

        // watch for changes
        ko.getObservable(valueAccessor(), 'on').subscribe(updateClass);

        // invoke immediately to get the initial class correct
        updateClass();
    },
    makeRealNode: function(node, attributes) {
        var toggle,
            data = node.getAttribute("data");

        if (!data) {
            return {required: "data"};
        }

        toggle = document.createElement("div");
        utils.mergeClasses("ui toggle button", node, toggle);

        toggle.setAttribute("data-bind", utils.hashToBindingString({
            toggle: data,
            text: node.getAttribute("text")
        }));

        // preserve a text node if one exists
        if (node.childNodes[0] && node.childNodes[0].nodeType === Node.TEXT_NODE) {
            toggle.appendChild(node.childNodes[0]);
        }

        return toggle;
    }
};

},{"../utils":10}],6:[function(require,module,exports){
/**
 * @constructor
 */
function Steps(obj) {
    ko.utils.extend(this, obj);
    ko.track(this);
}

/**
 * An action.  Call action.go to do the action.
 * @param {String} name
 * @param {Function} callback
 * @param {String} icon an icon name, which will be rendered with the action (where applicable)
 * @constructor
 */
function Action(name, callback, icon) {
    var _this = this;

    this.name = name;
    this.icon = icon || false;
    this.callback = callback || $.noop;

    _this.go = function () {
        _this.callback.apply(_this, arguments);
    };

    ko.track(this, ["name", "icon"]);
}

/**
 * @constructor
 */
function Toggle(bool) {
    this.on = bool || false;
    ko.track(this);
}

/**
 * @constructor
 */
function Dropdown(obj) {
    ko.utils.extend(this, obj);
    this.selected = obj.selected || null;
    ko.track(this);
}

module.exports = {
    Action: Action,
    Steps: Steps,
    Toggle: Toggle,
    Dropdown: Dropdown
};
},{}],7:[function(require,module,exports){

var config = {
    namespace: "sui-"
}

module.exports = config;
},{}],8:[function(require,module,exports){
// Load up our binding handlers
var bindingHandlers = window.ko.bindingHandlers;
bindingHandlers["toggle"] = require("./bindings/toggle");
bindingHandlers["steps"] = require("./bindings/steps");
bindingHandlers["modal"] = require("./bindings/modal");
bindingHandlers["dropdown"] = require("./bindings/dropdown");

// this module registers it self, so we just need to make sure it runs
require("./suiBindingProvider.js");

var previousNamespace = window.sui;

module.exports = require("./classes");

/* not sure what other libs use the 'semantic' global, but it's good practice */
module.exports.noConflict = function () {
    if (previousNamespace != null) {
        window.sui = previousNamespace;
    }
    else {
        delete window.sui;
    }
    return module.exports;
};

if ( typeof window !== "undefined" ) {
    window.sui = module.exports;
}

},{"./bindings/dropdown":2,"./bindings/modal":3,"./bindings/steps":4,"./bindings/toggle":5,"./classes":6,"./suiBindingProvider.js":9}],9:[function(require,module,exports){
var config = require("./config");

/* --- Namespace binding provider ---
 Allows <namespace:bindingHandler data="foo" /> to be replaced by
  a bindngHandler which implements makeRealNode

  simple example:

  ko.bindingHandlers.text.makeRealNode = function (node, attributes) {
      data = node.getAttribute("data");

      if (!data) {
        return {required: "data"};
      }

      var textElement = document.createElement("span");
      textElement.setAttribute("data-bind", "text: " + data);
      return textElement;
  }

  if the namespace is "ko", then this element
    <ko:text data="foo" />
  would become
    <span data-bind="text: foo" />

  actual cases will usually be more complicated
 */

var NamespaceBindingProvider = function() {
    this.constructor = NamespaceBindingProvider;

    this.preprocessNode = function(node) {
        // first, let's get out of here if we don't have a node with a tagName
        if (!node.tagName) return;

        // e.g. if config.namespace is "KO-", namespace is "ko-"
        // if config.namespace is falsy, namespace is ""
        var tagName = node.tagName.toLowerCase(),
            namespace = config.namespace ? config.namespace.toLowerCase() : "";

        if (node.nodeType === Node.ELEMENT_NODE && tagName.indexOf(namespace) === 0) {
            var bindingName = namespace ? tagName.split(namespace)[1] : tagName;

            // if there's a binding with the correct name
            if (ko.bindingHandlers[bindingName] && ko.bindingHandlers[bindingName].makeRealNode) {
                result = ko.bindingHandlers[bindingName].makeRealNode(node);
            }

            // they tried to use an element which is now just sitting in the dom
            // we should warn developers about this...
            else {
                window.console && console.log("WARNING: no binding handler " + tagName +
                    " which implements makeRealNode.  Fix this!");
                return;
            }

            if (result && result.constructor.name === "Object" && result.required) {

            }

            // did they return a node?  sweet! insert it into the DOM
            else if (result && result.nodeType) {
                node.parentNode.insertBefore(result, node);
                node.parentNode.removeChild(node);
                return result;
            }
        }
    };
};

var bpInstance = ko.bindingProvider.instance;

bpInstance.others = bpInstance.others || [];

// did someone go ahead and stick themselves in the preprocessNode function?
if (typeof bpInstance.preprocessNode === "function"
    && !bpInstance.preprocessNode._thisIsTheRightOne) {
    bpInstance.others.push(
        bpInstance.preprocessNode.bind(bpInstance)
    );
}

/**
 * calls all other node preprocessors
 * @param {HTMLElement} node the node to process
 */
bpInstance.preprocessNode = function(node) {
    var result;

    ko.utils.arrayForEach(bpInstance.others, function(callback){
        result = callback(node);

        // if they explicitly return false, don't do any more processing on this node
        if (result === false) {
            return false;
        }

        // if they return a node, that's the new node we're working with
        else if (result && result.nodeType) {
            node = result;
        }

        // otherwise do nothing special, the same node will be used in the next preprocessor
    });
}

// set a flag so it's not set again
bpInstance.preprocessNode._thisIsTheRightOne = true;

NamespaceBindingProvider.prototype = bpInstance;

var nsProvider = new NamespaceBindingProvider();
bpInstance.others.push(nsProvider.preprocessNode.bind(nsProvider));
},{"./config":7}],10:[function(require,module,exports){
module.exports = {
    byIndexOrName: function(index, array) {
        if (!isNaN(parseInt(index))) {
            return parseInt(index);
        }
        else {
            return array.indexOf(index);
        }
    },
    hashToBindingString: function(hash) {
        var bindings = [];

        ko.utils.objectForEach(hash, function(key, value){
            if (value != null) {
                bindings.push(key + ": " + value);
            }
        });
        return bindings.join(", ").replace(/\\?"/g, "'");
    },
    /**
     *
     * @param {String} extra new classes, seperated by spaces
     * @param {HTMLElement} source the element to copy classes from
     * @param {HTMLElement} dest the element to assign the new classes to
     */
    mergeClasses: function(extra, source, dest) {
        var sourceClasses = source.className;
        if (sourceClasses) {
            dest.className = extra + " " + sourceClasses;
        }
        else {
            dest.className = extra;
        }
    }
};

},{}]},{},[2,3,4,5,6,7,8,9,10])
;