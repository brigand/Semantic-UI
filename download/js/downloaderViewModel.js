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

var wrapper = "/* Semantic-UI |  */";

// fonts from cssfontstack
FONTS = {
    "Helvetica (sans)": 'Helvetica Neue", Helvetica, Arial, sans-serif;',
    "Bodoni MT (serif)": '"Bodoni MT", Didot, "Didot LT STD", "Hoefler Text", Garamond, "Times New Roman", serif;',
    "Consolas (mono)": "Consolas, monaco, monospace"
}

function DownloaderViewModel() {
    var _this = this;

    this.framework = ko.observable("");
    this.jQueryVersion = ko.observable(0);

    // Stuff that shouldn't be saved
    this._temp = {
        shouldTheModalBeVisible: ko.observable(false),

        activeItem: ko.observable()
    };

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

    var views = [];

    this.elements = new ToggleSet(elements);
    this.collections = new ToggleSet(collections);
    this.modules = new ToggleSet(modules);
    this.views = new ToggleSet(views)

    // Make the context menu work
    this.menuTarget = ko.observable();

    // Meta Info
    this.meta = {
        title: ko.observable(""),
        description: ko.observable("")
    }

    // AJAX stuff
    this.downloadComplete = ko.observable(false);

    var zip, files = {
        js: {},
        less: {
            elements: {},
            collections: {},
            modules: {},
            views: {}
        }
    };

    downloadZipball(files, function (z) {
        zip = z;
        _this.downloadComplete(true);
        window.gel = function () {
            return compileLess(files, _this.toJSON());
        }
        console.log(gel());
    });


    // menu stuff
    this.showMenu = function (element) {
        var $choice = $(element).closest(".choice");

        if ($choice.length === 0) {
            return false;
        }

        _this._temp.activeItem({
            font: ko.observable(Object.keys(FONTS)[0])
        });

    }
}

/**
 * Lets us searlize the ViewModel, so we can later load it
 * @returns {Object} object for stringification
 */
DownloaderViewModel.prototype.toJSON = function () {
    // Strip away the observables so we have only data
    var obj = ko.toJS(this);

    // Chop off some stuff we don't want to save
    delete obj._temp;
    delete obj.menuTarget;
    delete obj.downloadComplete;

    return obj;
};

var viewModel = new DownloaderViewModel();
ko.applyBindings(viewModel);

function compileLess(files, allowed) {
    console.time("less compile");

    function stringifyPart(which) {
        var parts = [];

        var len = 0;

        // todo: deal with basic.icon.less and awesome.icon.less
        $.each(files.less[which], function (name, file) {
            if ( allowed[which][name] ) {
                parts.push(file);
            }
        });

        return parts.join("\n");
    }


    // merge all selected components into one string
    css = [
        stringifyPart("elements"),
        stringifyPart("collections"),
        stringifyPart("modules"),
        stringifyPart("views")
    ].join("\n")

        // remove any imports
        // regex borrowed from http://getbootstrap.com/assets/js/customizer.js
        .replace(/@import[^\n]*/gi, '');

    var result, parser = new less.Parser({
        paths: [],
        optimization: 0,
        filename: 'semantic.css'
    }).parse(css, function (err, tree) {
            if ( err ) {
                return console.error('<strong>Ruh roh!</strong> Could not parse less files.', err);
            }
            result = {
                'semantic.css': wrapper + tree.toCSS(),
                'semantic.min.css': wrapper + tree.toCSS({
                    compress: true
            })
        }
    });

    console.timeEnd("less compile");

    return result;
}

function downloadZipball(files, callback) {
    var zip, xhr = new XMLHttpRequest();

    // jQuery doesn't support this, but JSZip loves it
    // http://bugs.jquery.com/ticket/11461
    xhr.open('GET', '/build/semantic.zip', true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = function (e) {
        zip = new JSZip(this.response);
        $.each(zip.files, function (name, file) {
            // exclude directory results
            if ( name.indexOf(".") === -1 ) {
                return;
            }

            var parts = name.split("/"), type, dir, fileName, ext;

            // must be something/something/somefile.txt
            // just a sanity check, this shouldn't ever be true
            // note that it may be 4, for less/modules/behavior
            if ( parts.length < 3 ) {
                return;
            }

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

            // store our less files
            if ( type === "less" && (ext === "less" || ext === "icon.less") ) {
                files.less[dir][fileName] = file.asText();
            }
            // store the minified JavaScript files
            else if ( type === "minified" && dir === "modules" && ext === "min.js" ) {
                files.js[fileName] = file.asText();
            }

            /* TODO: parse variables and stuff like that */
        });

        callback(zip);
    };

    xhr.send();
}