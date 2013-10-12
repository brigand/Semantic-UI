var wrapper = "/* Semantic-UI | (c) Contribuiters | opensource.org/licenses/MIT */";

function compileLess(files, allowed) {
    console.time("less compile");

    function stringifyPart(which) {
        var parts = [];

        var len = 0;

        // todo: deal with basic.icon.less and awesome.icon.less
        $.each(files.less[which], function (name, file) {
            var toggle = allowed[which][name];
            if ( toggle && toggle.on ) {
                parts.push(file);
            }
        });

        return parts.join("\n");
    }


    // merge all selected components into one string
    css = [
        stringifyPart("elements"), stringifyPart("collections"), stringifyPart("modules"), stringifyPart("views")
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

function compileJavaScript(files, allowed) {
    var result, combined = [];

    console.time("compileJavaScript");

    $.each(files.js, function(name, contents){
        if (allowed.modules[name] && allowed.modules[name].on) {
            combined.push(contents)
        }
    });

    result = {
        'semantic.min.js': wrapper + combined.join(";")
    };

    console.timeEnd("compileJavaScript");

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