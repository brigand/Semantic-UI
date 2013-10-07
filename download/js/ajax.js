(function(window, $){
    var AJAX = {};

    /**
     *
     * @param url the path to the file
     * @param name the data will be stored in AJAX[name]
     * @param property the property of the object
     * @param like an object with similar structure to the object
     */
    function ajaxLoad(url, name, like) {

        AJAX[name] = ko.observable(like);

        $.getJSON(url, function(data){
            // Update the data
            AJAX[name](data);
        }, function () {
           throw new (window.URIError || Error)("Failed to load " + url);
        });
    }

    ajaxLoad("data/jquery.json", "jQueryData", {versions: []});

    window.AJAX = AJAX;
})(window, jQuery);