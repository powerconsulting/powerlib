var PowerLib = {
    support : {
        input : {
            ___placeholder : null,
            placeholder : function () {
                if (PowerLib.support.input.___placeholder != null) {
                    var i = document.createElement('input');
                    PowerLib.support.input.placeholder('placeholder' in i);
                    i = null;
                }

                return PowerLib.support.input.___placeholder;
            }
        }
    },

debug: true,
    isDefined: function (obj) {
        if (obj == null || typeof (obj) == 'undefined') {
            return false;
        }
        //In case for some reason obj is set to the text of undefined, not just it's type. I have seen this on several occasions, when working with 3rd party code.
        if (obj === 'undefined')
            return false;

        return true;
    },
    isArray: function (obj) {
        if (!PowerLib.isDefined(obj))
            return false;
        return obj.constructor == Array;
    },

    isInArray: function (item, array) {
        var length = array.length;
        for (var i = 0; i < length; i++) {
            if (array[i] == item) return true;
        }
        return false;
    },
    //instead of using console.log everywhere, I use PowerLib.log(), which will write to the console only of debug is set to true and console exists, prevents IE problems
    //I also store a copy of the log here, in case the console was not available, we can still retrieve the log at a later point, this is extremely valuable for debugging, but be careful with production security.
    logValues: [],
    log: function (text) {
        if (PowerLib.debug)
            PowerLib.logValues.push(text);

        try {
            if (PowerLib.debug && PowerLib.isDefined(console)) {
                console.log(text);
            }
        } catch (er1) { }

    },

    /*
        Handlers functionality, add enums for various handle type support. 
    */
    handlers: {},
    handleTypes: { error: 'error', info: 'info' },
    addHandler: function (id, type, func) {
        PowerLib.log('PowerLib.addHandler(id[' + id + '], type[' + type + '])');
        PowerLib.handlers[id] = { id: id, type: type, func: func };
    },

    removeHandler: function (id) {
        PowerLib.log('PowerLib.removeHandler(id[' + id + '])');
        PowerLib.handlers[id] = null;
        delete PowerLib.handlers[id];
    },

    fireHandler: function (type, result, data) {
        PowerLib.log('PowerLib.fireHandler(type[' + type + '], result[' + result + '], data[' + data + '])');
        for (var index in PowerLib.handlers) {
            var handle = PowerLib.handlers[index];
            if (handle.type == type) {
                handle.func.apply(null, [result, data]);
            }
        }
    },
    get: function (id) {
        //Yes, I actually have this... For when I don't have access to JQuery ;-)
        return document.getElementById(id);
    },
    _queryData : null,
    getQueryValue : function(key){
        //If exists, we will use existing data, no need to reparse the data. querystring should never changes once you are on the page.
        if (!PowerLib.isDefined(_queryData)){
            //Get keysets, remove the ? and split into pairs
            var keySets = location.search.slice(1).split('&');


            keySets.forEach(function(keySet) {
                var keyValue = keySet.split('=');
                PowerLib._queryData[keyValue[0]] = keyValue[1]
            });
        }

        return _queryData[key];
    },
    //I found this function somewhere and have used it a lot in the past, it is here especially for legacy code. If anyone knows its source, please let me know so I can credit properly.
    getAttributes: function (ele, attr) {
        var result = (ele.getAttribute && ele.getAttribute(attr)) || null;
        if (!result) {
            var attrs = ele.attributes;
            var length = attrs.length;
            for (var i = 0; i < length; i++)
                if (attrs[i].nodeName === attr)
                    result = attrs[i].nodeValue;
        }
        return result;
    },
    //I use this a lot for getting epoc dates, to deal with .net dates. It is great for storing 
    getEpoch: function () {
        return Math.round(new Date().getTime() / 1000.0);
    },
    onInputKeyDownSubmit: function (e, elm, func) {
        var evt = e || window.event
        if (evt.keyCode === 13) {
            func.apply();
        }
    },
    /*These two functions are for lagacy browsers, that don't have placeholder support yet*/
    onInputBlur: function (elm) {
        if (PowerLib.support.input.placeholder())
            return;
        if (elm.value == '') {
            var titleAttribute = PowerLib.getAttributes(elm, 'placeholder');
            elm.value = titleAttribute;
        }
    },
    onInputFocus: function (elm) {
        if (PowerLib.support.input.placeholder())
            return;
        var titleAttribute = PowerLib.getAttributes(elm, 'placeholder');
        if (elm.value == titleAttribute) {
            elm.value = '';
        }
    },
    //I am not sure where I got this from, if you know, please feel free to let me know.
    getElementBoundaries : function (elm) {
        var bcrect, od, odb, odde, dimensions = { "left": 0, "top": 0, "right": 0, "bottom": 0, "width": 0, "height": 0 };

        if (typeof (elm) != 'undefined') {
            od = elm.ownerDocument;
            odb = od.body;
            odde = od.documentElement;
            bcrect = elm.getBoundingClientRect();
            dimensions.left = bcrect.left;
            dimensions.top = bcrect.top;
            dimensions.right = bcrect.right;
            dimensions.bottom = bcrect.bottom;

            if (bcrect.width) {
                dimensions.width = bcrect.width;
                dimensions.height = bcrect.height;
            }
            else {
                dimensions.width = dimensions.right - dimensions.left;
                dimensions.height = dimensions.bottom - dimensions.top;
            }

            if (odb.scrollTop) {
                dimensions.top += odb.scrollTop;
                dimensions.left += odb.scrollLeft;
            }
            else if (odde && odde.scrollTop) {
                dimensions.top += odde.scrollTop;


                dimensions.left += odde.scrollLeft;
            }
        }
        return dimensions;
    },
    newGuid: function () {
        var s4 = function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return (s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4());
    },
    getStorage : function (key) {
        PowerLib.log('PowerLib.getStorage(key[' + key + '])');
        if (localStorage) {
            var value = localStorage[key];
            if (!PowerLib.isDefined(value))
                return null;
            try {
                return JSON.parse(localStorage[key]);
            } catch (ex) {
                return localStorage[key];
            }
        }
        return null;
    },
    setStorage: function (key, value) {
        PowerLib.log('PowerLib.setStorage(key[' + key + '])');
        if (typeof value != "string" && PowerLib.isDefined(value))
            value = JSON.stringify(value);
        try {
            if (localStorage)
                localStorage[key] = value;
        } catch (storageEx) {
            PowerLib.log('PowerLib.setStorage(key[' + key + ']) -> Error: ' + storageEx.message);
        }
    }
};
/*Prototypes*/
if (!PowerLib.isDefined(String.prototype.contains)) {
    String.prototype.contains = function (value) { return this.indexOf(value) != -1; };
}