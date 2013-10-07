function ToggleSet(keys) {
    for (var i=0; i<keys.length; i++) {
        this[keys[i]] = ko.observable(true);
    }

    this.all = this.all.bind(this);
    this.none = this.none.bind(this);
}

ToggleSet.prototype.all = function(){
    for (var prop in this) {
        var thing = this[prop];
        console.log(prop, ko.unwrap(thing));
        if (ko.isObservable(thing)) {
            thing(true);
        }
    }
}

ToggleSet.prototype.none = function(){
    for (var prop in this) {
        var thing = this[prop];
        if (ko.isObservable(thing)) {
            thing(false);
        }
    }
}

function DownloaderViewModel(){
    this.framework = ko.observable("");
    this.jQueryVersion = ko.observable(0);

    var elements = [
        "icons", "buttons", "divider", "header", "image", "input", "label", "loader", "progress", "segment", "step"
    ];
    var collections = [
        "breadcrumb", "form", "grid", "menu", "message", "table"
    ];

    this.elements = new ToggleSet(elements);
    this.collections = new ToggleSet(collections);
}

DownloaderViewModel.prototype.toString = function(){
    // Strip away the observables so we have only data
    var obj = ko.toJS(this), binary = obj.binary;

    // Chop off some stuff we don't want to save
    delete obj.binary;


};

ko.applyBindings(window.k = new DownloaderViewModel());