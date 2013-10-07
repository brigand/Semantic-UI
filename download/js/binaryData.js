/**
 * a way to searilize binary data
 * @param {Object} format
 * @param {Object} holds number of bits for each item; default is 1 (Boolean)
 * @param {String} initial the initial base64 string
 * @constructor
 */
function BinaryData(format, types, initial){
    // Sort the keys because we need consistent order and we're working with dictionaries
    var i,
        keys = Object.keys(format).sort();

    // for each key we need to figure out how many bits it needs,
    // and make sure to keep this in order
    for (i=0; i < keys.length; i++) {
        var key = keys[i];

        types[key] = types[key] || {};

        format[key].forEach(function(name){
            //
            var thisType = types[key];
            thisType[name] = thisType[name] || 1;
        });
    }

    // these two are useful for keeping everything in the correct order
    this.format = format;
    this.keys = keys;

    // Maybe we have a default value
    if (typeof initial === "string") {
        this.loadString(initial);
    }
}

BinaryData.prototype.loadString = function loadString(string) {
    var i, j,
        buffer = base32ToArrayBuffer(string),
        keys = this.keys,
        loadedData = {};

    // our keys are in order, so this'll be quick
    for (i=0; i<keys.length; i++) {
        key = keys[i];

    }
}


BinaryData.prototype.loadObject = function loadString(obj) {
}

