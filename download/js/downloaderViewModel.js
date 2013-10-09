function ToggleSet(keys) {
    for ( var i = 0; i < keys.length; i++ ) {
        this[keys[i]] = ko.observable(true);
    }

    this.all = this.all.bind(this);
    this.none = this.none.bind(this);
}

ToggleSet.prototype.all = function () {
    for ( var prop in this ) {
        var thing = this[prop];
        console.log(prop, ko.unwrap(thing));
        if ( ko.isObservable(thing) ) {
            thing(true);
        }
    }
}

ToggleSet.prototype.none = function () {
    for ( var prop in this ) {
        var thing = this[prop];
        if ( ko.isObservable(thing) ) {
            thing(false);
        }
    }
}

function DownloaderViewModel() {
    var _this = this;

    this.framework = ko.observable("");
    this.jQueryVersion = ko.observable(0);

    // Stuff that shouldn't be saved
    this._temp = {
        shouldTheModalBeVisible: ko.observable(false)
    };


    // DO NOT change the order of these, but you may add additional entries to the end
    var elements = [
        "icon", "button", "divider", "header", "image", "input", "label", "loader", "progress", "segment", "step"
    ];
    var collections = [
        "breadcrumb", "form", "grid", "menu", "message", "table"
    ];

    var modules = [
        "accordion", "checkbox", "dimmer", "dropdown", "modal", "popup", "rating", "reveal", "shape", "sidebar",
        "transition"
    ];

    this.elements = new ToggleSet(elements);
    this.collections = new ToggleSet(collections);
    this.modules = new ToggleSet(modules);

    // Make the context menu work
    this.menuTarget = ko.observable();

    // Meta Info
    this.meta = {
        title: ko.observable(""),
        description: ko.observable("")
    }

    // AJAX stuff
    this.downloadComplete = ko.observable(false);

    // jQuery doesn't support this, but JSZip loves it
    // http://bugs.jquery.com/ticket/11461
    var zip, files = {
        js: {},
        less: {
            elements: {},
            collections: {},
            modules: {},
            views: {}
        }
    };

    downloadZipball(files, function(z){
        zip = z;
        _this.downloadComplete(true);
    });
}

DownloaderViewModel.prototype.toJSON = function () {
    // Strip away the observables so we have only data
    var obj = ko.toJS(this);

    // Chop off some stuff we don't want to save
    delete obj._temp;
    delete obj.menuTarget;

    return obj;
};

var viewModel = new DownloaderViewModel();
ko.applyBindings(viewModel);



function downloadZipball(files, callback){
    var zip, xhr = new XMLHttpRequest();

    xhr.open('GET', '/build/semantic.zip', true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = function(e) {
        zip = new JSZip(this.response);
        $.each(zip.files, function(name, file){
            // exclude directory results
            if (name.indexOf(".") === -1) return;

            var parts = name.split("/"), type, dir, fileName, ext;

            // must be something/something/somefile.txt
            // just a sanity check, this shouldn't ever be true
            // note that it may be 4, for less/modules/behavior
            if (parts.length < 3) return;

            // e.g. less or minified
            type = parts[0];

            // e.g. components or elements
            dir = parts[1];

            // e.g. "modal"
            fileName = /\w+(?=\.)/g.exec(name)[0];

            // e.g. less or min.js; strange method, so here's a graph from `name` to `ext`
            // "path/to/file.a" -> ["path/to/file", "a"] -> ["a"] -> "a"
            // "path/to/file.a.b" -> ["path/to/file", "a", "b"] -> ["a", "b"] -> "a.b"
            var extensions = name.split(".");
            extensions.shift();
            ext = extensions.join(".");

            if (ext === "min.js") console.log(dir);

            // store our less files
            if (type === "less" && ext === "less") {
                files.less[dir][fileName] = file.asText();
            }
            // store the minified JavaScript files
            else if (type === "minified" && dir === "modules" && ext === "min.js") {
                files.js[fileName] = file.asText();
            }

            /* TODO: parse variables and stuff like that */
        });

        callback(zip);
    };

    xhr.send();
}