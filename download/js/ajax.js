(function(window, $){
    var AJAX = {};

    /**
     *
     * @param url the path to the file
     * @param name the data will be stored in AJAX[name]
     * @param property the property of the object
     */
    function ajaxLoad(url, name) {
        $.get(url, function(data){
            AJAX[name] = data;
        });
    }

    ajaxLoad("lib/knockout-min.js", "knockout");
    ajaxLoad("lib/knockout-semantic.js", "knockoutsemantic");
    ajaxLoad("lib/knockout-es5.min.js", "knockoutes5");

    window.AJAX = AJAX;
})(window, jQuery);
