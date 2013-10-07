;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

// not implemented
// The reason for having an empty file and not throwing is to allow
// untraditional implementation of this module.

},{}],2:[function(require,module,exports){
var fs = require('fs');
var template = "<i class=\"close icon\"></i>\n<div class=\"header\" data-bind=\"text: title\">\n\n</div>\n<div class=\"content\" data-bind=\"html: content\">\n    <div class=\"left\">\n        Content can appear on left\n    </div>\n    <div class=\"right\">\n        Content can appear on right\n    </div>\n</div>\n<div class=\"actions\" data-bind=\"foreach: buttons\">\n    <div class=\"ui button\" data-bind=\"text: name, click: go\"></div>\n</div>";
var Action = require("../classes/action.js");


module.exports = {
    init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        // We need to figure out if we have a boolean variable/observable, or an object variable/observable
        var value = valueAccessor(), isObservable = ko.isSubscribable(value),
            realValue = ko.unwrap(value);


        // Just a boolean value, so we'll watch it for changes and
        // show/hide the modal
        // the user is expected to handle the template
        if (typeof realValue === "boolean") {
            if (isObservable) {
                value.subscribe(function(newValue){
                    if (newValue) {
                        $(element).modal("show");
                    }
                    else {
                        $(element.modal("hide"));
                    }
                });
            }
        }

        // Maybe it's an object, so we'll be using our own template for this
        else if (typeof realValue === "object") {
            // this function handles the initial value, and the case of the object
            // being replaced
            var initializeModal = function(settings){
                var context = ko.utils.extend({
                    title: "",
                    content: "",
                    buttons: [
                        new Action("Cancel", function(){}),
                        new Action("Okay", function(){})
                    ],
                    show: false
                }, settings);

                // if we've already applied bindings, we need to clean up first
                //ko.cleanNode(element);

                // load our module template
                element.innerHTML = template;

                if (ko.isSubscribable(context.show)) {
                    var showing = false, hiding = false;
                    context.show.subscribe(function(newValue){

                        // We don't want these to fire if we're in the process
                        // of showing or hiding already
                        if (newValue && !showing) {
                            $(element).modal("show");
                        }
                        else if (!newValue && !hiding) {
                            $(element).modal("hide");
                        }

                        showing = false;
                        hiding = false;
                    });


                    // we need our own onHide and onShow methods to make sure
                    // our observable stays in check
                    context.onShow = function(){
                        showing = true;
                        context.show(true);
                    };
                    context.onHide = function(){
                        hiding = true;
                        context.show(false);
                    };
                }

                ko.applyBindingsToDescendants(context, element);

                $(element).modal(context);
            };

            if (isObservable) {
                value.subscribe(initializeModal);
            }
            else {
                initializeModal(realValue);
            }

            return { controlsDescendantBindings: true };
        }

        var newProperties = valueAccessor(),
            innerBindingContext = bindingContext.extend(newProperties);



    }
};

},{"../classes/action.js":5,"fs":1}],3:[function(require,module,exports){
var fs = require('fs');
var template = "<div class=\"step\" data-bind=\"text: step.text,\n            css: {active: step.active()}\"></div>";

var Step = require("../classes/step.js");
var util = require("../utils.js");

var binding = {
    makeTemplateValueAccessor: function(element, valueAccessor) {
        return function() {
            var modelValue = valueAccessor(),
                unwrappedValue = ko.utils.peekObservable(modelValue);

            // It's just an array, so we'll assume it's syntax sugar for foreach
            if ((!unwrappedValue) || typeof unwrappedValue.length == "number")
                return { 'foreach': modelValue, 'templateEngine': ko.nativeTemplateEngine.instance };

            ko.utils.unwrapObservable(modelValue);

            // Inject our template
            element.innerHTML = template;

            var data = unwrappedValue['data'], activeTest, original = data.slice(0);

            if (unwrappedValue.active != null) {
                activeTest = function(index){
                    // The active observable could hold the 0-based index, or the string
                    // matching the tab text
                    var foundIndex = util.byIndexOrName(ko.unwrap(unwrappedValue.active), original);
                    return index === foundIndex && foundIndex !== -1;
                };
            }

            for (var i=0; i<data.length; i++) {
                if (typeof data[i] === "string") {
                    data[i] = new Step(data[i], typeof activeTest === "function"
                                                ? activeTest.bind(null, i)
                                                : activeTest);
                }
            }

            return {
                'foreach': data,
                'as': 'step',
                'includeDestroyed': unwrappedValue['includeDestroyed'],
                'afterAdd': unwrappedValue['afterAdd'],
                'beforeRemove': unwrappedValue['beforeRemove'],
                'afterRender': unwrappedValue['afterRender'],
                'beforeMove': unwrappedValue['beforeMove'],
                'afterMove': unwrappedValue['afterMove'],
                'templateEngine': ko.nativeTemplateEngine.instance
            };
        };
    },
    'init': function(element, valueAccessor) {
        return ko.bindingHandlers['template']['init'](element, binding.makeTemplateValueAccessor(element, valueAccessor));
    },
    'update': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        return ko.bindingHandlers['template']['update'](element, binding.makeTemplateValueAccessor(element, valueAccessor), allBindings, viewModel, bindingContext);
    }
};

module.exports = binding;
},{"../classes/step.js":6,"../utils.js":8,"fs":1}],4:[function(require,module,exports){
module.exports = {
    init: function(element, valueAccessor){
        var $el = $(element);

        // Toggle the observable on click
        $(element).click(function(){
            var observable = valueAccessor();

            // Update the observable (true or false)
            // this also effects the class change
            observable(!ko.unwrap(observable));
        });

        var updateClass = function(){
            // if we set it to true, add the "active" class
            if (!!ko.unwrap(valueAccessor())) {
                $el.addClass('active');
            }

            // otherwise, remove it
            else {
                $el.removeClass('active');
            }
        };

        valueAccessor().subscribe(updateClass);

        // invoke immediately to get the initial class correct
        updateClass();
    }
};

},{}],5:[function(require,module,exports){
/**
 * An action.  Call action.do to do the action.
 * @param {String} name
 * @param {Function} callback
 * @constructor
 */
function Action(name, callback) {
    var self = this;

    self.name = name;
    self.callback = callback || $.noop;

    self.go = function(){
        self.callback.apply(self, arguments);
    };
}

module.exports = Action;
},{}],6:[function(require,module,exports){
function Step(text, activeTest){
    this.text = ko.observable(text);

    if (typeof activeTest === "functon") {
        this.active = ko.computed(activeTest);
    }
    else {
        this.active = activeTest;
    }
}

module.exports = Step;
},{}],7:[function(require,module,exports){
// Load up our binding handlers
var bindingHandlers = window.ko.bindingHandlers;
bindingHandlers["toggle"] = require("./bindings/binding-toggle");
bindingHandlers["steps"] = require("./bindings/binding-steps");
bindingHandlers["modal"] = require("./bindings/binding-modal");

module.exports = {
    Step: require("./classes/step.js"),
    Action: require("./classes/action.js")
};

if (typeof window !== "undefined") {
    window["semantic"] = module.exports;
}
},{"./bindings/binding-modal":2,"./bindings/binding-steps":3,"./bindings/binding-toggle":4,"./classes/action.js":5,"./classes/step.js":6}],8:[function(require,module,exports){
module.exports = {
    byIndexOrName: function(index, array) {
        if (!isNaN(parseInt(index))) {
            return parseInt(index);
        }
        else {
            return array.indexOf(index);
        }
    }
};

},{}]},{},[2,6,7,8,3,4,5])
;