/**
 * returns a function which will set this observable to value when invoked
 * most useful for event handlers, e.g. data-bind="click: foo.set('value after click')"
 * @param value the value to be set
 * @returns {Function} call this to update the observable
 */
ko.subscribable.fn.set = function(value){
    var _this = this;
    return function(){
        _this(value);
    }
};

ko.subscribable.fn.is = function(value){
    var _this = this;
    return ko.computed(function(){
        return _this() === value;
    });
};
