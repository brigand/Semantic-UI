(function () {
    var menuElements = {}, menuShow = {};

    function isDescendant(parent, child) {
        var node = child.parentNode;
        while (node != null) {
            if (node == parent) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    }

    function bindEvent(event, element, callback) {
        var current = document["on" + event];

        // Prefer addEventListener
        if (element.addEventListener) {
            element.addEventListener(event, callback)
        }

        // For IE8
        else if (current == null) {
            element["on" + event] = callback;
        }
        else {
            element["on" + event] = function () {
                return (current.apply(element, arguments) === false) || (callback.apply(element, arguments) === false);
            };
        }
    }

    ko.bindingHandlers.menuScope = {
        init: function (element, valueAccessor) {
            var menu = ko.unwrap(valueAccessor());

            function hideMenu() {
                if (menuElements[menu]) {
                    menuElements[menu].style.display = "none";
                }
                if (window.removeEventListener) {
                    window.removeEventListener("mousemove", MouseMoveHandler);
                }
            }

            // hides the menu when we move more than 20 pixels away from one edge
            function MouseMoveHandler(event) {
                var ex = event.pageX, ey = event.pageY,
                    t = 20, // pixel threshold
                    m = menuElements[menu],
                    mLeft = parseInt(m.style.left), mRight = mLeft + m.width,
                    mTop = parseInt(m.style.top), mBottom = mTop + m.height;

                // checks if we're > t outside of the menu bounds
                ( (ex < mLeft - t) || (ex > mRight + t) || (ey < mTop - t) || (ey > mBottom + t) ) && hideMenu();
            }

            function showMenu(event) {
                var menuElement = menuElements[menu], offsetY = 0, offsetX = 0, scrollTop, size;

                // Call the menu show event handler (which defaults to a noop)
                var result = menuShow[menu].call(element, event.target);

                // they explicitly returned false, so don't show the menu
                if (result === false) {
                    return;
                }

                if (menuElement == null) return;

                scrollTop = window.pageYOffset || document.documentElement.scrollTop;

                menuElement.style.position = "absolute";
                menuElement.style.display = "block";

                size = window.getComputedStyle ? window.getComputedStyle(menuElement) : {width: 0, height: 0}

                if (event.pageY > scrollTop + (document.documentElement.clientHeight * 0.5)) {
                    offsetY -= parseInt(size.height);
                }

                // if we'r on the right side of the page, push it over
                if (event.pageX > document.documentElement.clientWidth * 0.5) {
                    offsetX -= parseInt(size.width);
                }

                menuElement.style.top = offsetY + event.pageY + "px";
                menuElement.style.left = offsetX + event.pageX + "px";
            }

            if (menu) {
                function handleContext(event) {
                    // The isDescendant check allows bind to a node for all of its children
                    if (event.target === element || isDescendant(element, event.target) && menuElements[menu]) {
                        showMenu(event);
                        event.preventDefault();

                        // ehh, IE8 users don't need this (it would be insanely complicated)
                        if (window.addEventListener) {
                            window.addEventListener("mousemove", MouseMoveHandler);
                        }
                    }
                }

                bindEvent("contextmenu", element, handleContext);
            }

        }
    };

    ko.bindingHandlers.menuName = {
        init: function (element, valueAccessor, allBindingsAccessor) {
            var menu = ko.unwrap(valueAccessor()),
                allBindings = allBindingsAccessor();

            // event handler for the menu being shown
            menuShow[menu] = allBindings.menuShow || function () {
            };

            if (menu) {
                menuElements[menu] = element;
            }
        }
    };

})();