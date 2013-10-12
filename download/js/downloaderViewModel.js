function ToggleSet(keys) {
    for ( var i = 0; i < keys.length; i++ ) {
        this[keys[i]] = new sui.Toggle({
            on: true
        });
    }

    this.all = this.all.bind(this);
    this.none = this.none.bind(this);

    ko.track(this);
}

ToggleSet.prototype.all = function () {
    for ( var prop in this ) {
        if ( this.hasOwnProperty(prop) ) {
            this[prop].on = true;
        }
    }
}

ToggleSet.prototype.none = function () {
    for ( var prop in this ) {
        if ( this.hasOwnProperty(prop) ) {
            this[prop].on = false;
        }
    }
}

// fonts from cssfontstack
FONTS = {
    "Helvetica (sans)": 'Helvetica Neue", Helvetica, Arial, sans-serif;',
    "Bodoni MT (serif)": '"Bodoni MT", Didot, "Didot LT STD", "Hoefler Text", Garamond, "Times New Roman", serif;',
    "Consolas (mono)": "Consolas, monaco, monospace"
}

function DownloaderViewModel() {
    var _this = this;

    this.framework = "";
    this.jQuery = new sui.Dropdown({
        selected: "",
        defaultText: "jQuery Version",
        data: [
            "2.0.3", "1.9.0", "1.8.3", "1.7.2", "1.6.4", "1.4.4"
        ]
    });

    // Stuff that shouldn't be saved
    this._temp = {
        testModal: {
            title: 'Demo Modal',
            content: 'This is just an example',
            show: false
        },
        showModal: function () {
            _this._temp.testModal.show = true;
        },
        activeItem: null
    };
    ko.track(this._temp, ["activeItem"]);
    ko.track(this._temp.testModal);


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
    this.menuTarget = null;

    // Meta Info
    this.meta = {
        title: "",
        description: ""
    }

    // AJAX stuff
    this.downloadComplete = false;

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
        _this.downloadComplete = true;
        window.gel = function () {
        }
    });

    // build and download
    this.download = function(){
        if (!_this.downloadComplete) return;

        // disable the button
        _this.downloadComplete = true;

        var less = compileLess(files, _this);
        var js = compileJavaScript(files, _this);

        // todo build example html file

        var zip = new JSZip();
        var lib = zip.folder("lib");
        lib.folder("js")
            .file("semantic.min.js", js['semantic.min.js']);

        lib.folder("css")
            .file("semantic.min.css", less['semantic.min.css'])
            .file("semantic.css", less['semantic.css']);


        console.log("framework", _this.framework)
        if (_this.framework === "knockout") {
            if (AJAX.knockout && AJAX.knockoutsemantic && AJAX.knockoutes5) {
                lib.file("js/knockout.min.js", AJAX.knockout);
                lib.file("js/knockout.es5.min.js", AJAX.knockoutes5);
                lib.file("js/knockout-semantic.min.js", AJAX.knockoutsemantic);
            }
            else {
                throw new Error("some files haven't finished downloading");
            }
        }

        // pack and download it
        var blob = zip.generate({type:"blob"});
        var createURL = (URL.createObjectURL || URL.webkitCreateObjectURL);
        var a = document.createElement("a")
        a.href = createURL(blob);
        a.download = "semantic.zip";
        a.click();

        // give the OS some time to show a file save dialog
        // users are impatient, but browsers get mad when
        // you try to download multiple files
        setTimeout(function(){
            _this.downloadComplete = true;
        }, 3000);
    };

    // menu stuff
    this.showMenu = function (element) {
        var $choice = $(element).closest(".choice");

        if ( $choice.length === 0 ) {
            return false;
        }

        _this._temp.activeItem({
            font: ko.observable(Object.keys(FONTS)[0])
        });
    }

    ko.track(this);
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
    delete obj.toJSON;
    delete obj.jQuery.data;
    delete obj.jQuery.defaultText;

    return obj;
};

var viewModel = new DownloaderViewModel();
ko.applyBindings(viewModel);
