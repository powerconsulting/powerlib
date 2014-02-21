//accept instance of pl in order to provide proper interaction between the modules
var PowerLibSupport = function (pl) {
	//place a reference to this "context" tp self so that it can be referenced inside of child functions
	var self = this;

	//Check if input placeholder is supported
	self.input = {
		___placeholder: null,
		placeholder: function () {
			if (PowerLib.support.input.___placeholder != null) {
				var i = document.createElement('input');
				PowerLib.support.input.placeholder('placeholder' in i);
				i = null;
			}

			return PowerLib.support.input.___placeholder;
		}
	};


	//Check if local storage exists and is available to use
	self.localStorage = function () {
		return 'localStorage' in window && window['localStorage'] !== null;
	}


	return self;
};


//accept instance of pl in order to provide proper interaction between the modules
var PowerLibUtils = function (pl) {
	//place a reference to this "context" tp self so that it can be referenced inside of child functions
	var self = this;

	//Returns epoch value that can be used for communicating with the server.
	self.getEpoch = function () {
		return Math.round(new Date().getTime() / 1000);
	};

	var _queryData = null;
	self.getQueryValue = function (key) {
		//If exists, we will use existing data, no need to reparse the data. querystring should never changes once you are on the page.
		if (!pl.isDefined(_queryData)) {
			//Get keysets, remove the ? and split into pairs
			var keySets = location.search.slice(1).split('&');

			keySets.forEach(function (keySet) {
				var keyValue = keySet.split('=');
				_queryData[keyValue[0]] = keyValue[1]
			});
		}

		return _queryData[key];
	};

	//trap the enter submission, just a quick util to save the time of writing this time and time again.
	self.onInputKeyDownSubmit = function (e, elm, func) {
		var evt = e || window.event
		if (evt.keyCode === 13) {
			func.apply(this, [elm]);
		}
	};

	/*These two functions are for legacy browsers, that don't have placeholder support yet*/
	self.onInputBlur = function (elm) {
		if (pl.support.input.placeholder())
			return;
		if (elm.value == '') {
			var titleAttribute = pl.getAttributes(elm, 'placeholder');
			elm.value = titleAttribute;
		}
	};

	onInputFocus = function (elm) {
		if (pl.support.input.placeholder())
			return;
		var titleAttribute = pl.getAttributes(elm, 'placeholder');
		if (elm.value == titleAttribute) {
			elm.value = '';
		}
	};

	//I am not sure where I got this from, if you know, please feel free to let me know so I can give proper credits.
	selfgetElementBoundaries = function (elm) {
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
	};
	
	//Sinple version of generating guids, this is not timebased.
	self.getGuid = function () {
		var s4 = function () {
			return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
		};
		return (s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4());
	};


	//Functions to set the storage, without generating errors if it fails. since this fails silently, first call pl.support.localStorage() to check if localStorage is supported.
	self.getStorage = function (key) {
		pl.log('PowerLib.getStorage(key[' + key + '])');
		if (localStorage) {
			var value = localStorage[key];
			if (!pl.isDefined(value))
				return null;
			try {
				return JSON.parse(localStorage[key]);
			} catch (ex) {
				return localStorage[key];
			}
		}
		return null;
	};

	self.setStorage = function (key, value) {
		pl.log('PowerLib.setStorage(key[' + key + '])');
		if (typeof value != "string" && pl.isDefined(value))
			value = JSON.stringify(value);
		try {
			if (localStorage)
				localStorage[key] = value;
		} catch (storageEx) {
			pl.log('PowerLib.setStorage(key[' + key + ']) -> Error: ' + storageEx.message);
		}
	};

	return self;
};

var PowerLib = function (conf) {
	//place a reference to this "context" to self, so it can be referenced inside of child functions
	var self = this;

	//Pass in any value and get an absolute true in case it is defined, this function takes in account some older browsers and how they handle null values
	self.isDefined = function (value) {
		if (value == null || typeof value == 'undefined')
			return false;
		//In case for some reason obj is set to the text of undefined, not just it's type. I have seen this on several occasions, when working with 3rd party code.
		if (obj === 'undefined')
			return false;

		return true;
	};

	//
	self.isArray = function (obj) {
		if (!self.isDefined(obj))
			return false;
		return obj.constructor == Array;
	};

	self.isInArray = function (item, array) {
		var length = array.length;
		for (var i = 0; i < length; i++) {
			if (array[i] == item) return true;
		}
		return false;
	};

	//returns true if the passed in value is a true function
	self.isFunction = function (functionRef) {
		var checkableType = {};
		return functionRef && checkableType.toString.call(functionRef) === '[object Function]';
	};

	//make sure that if no config is passed in, when we check for values we don't get undefined errors
	if (!self.isDefined(conf))
		conf = {};

	self.debug = conf.debug || false;

	//Logging function to log to the console that prevents some browsers (e.g IE) from throwing errors when dev tools are not enabled
	//Passing in level 2 will trigger an error log, increasing visibility in the console.log when used sparingly
	self.log = function (value, level) {
		//if we are not in debug mode, we don't want to have the logging enabled.
		if (!self.debug)
			return;

		if (self.isDefined(console) && self.isFunction(console.log)) {
			if (level == 2)
				console.error(value);
			else
				console.log(value);
		}
	};

	//Create instance of the utilities module, bc self is an object when we pass it to the utils module, it will be passed as a reference.
	self.util = new PowerLibUtils(self);
	self.support = new PowerLibSupport(self);
	
	return self;
};

if (typeof pl != 'undefined') {
	pl = new PowerLib({
		debug : false
	});
}

/*Prototypes*/
if (!pl.isDefined(String.prototype.contains)) {
	String.prototype.contains = function (value) { return this.indexOf(value) != -1; };
}
