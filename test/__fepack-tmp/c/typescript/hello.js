
void function (module, exports){
    window["typescript/sm-validator.js"] = {};
    
	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	function serialAnd(objs, control) {
	    objs = objs.slice();
	    var retDefer = $.Deferred();
	    function getNext() {
	        var obj = objs.shift();
	        if (obj === undefined) {
	            retDefer.resolve();
	            return;
	        }
	        obj.check(control).done(function () {
	            getNext();
	        })
	            .fail(function () {
	            retDefer.reject(obj);
	        });
	    }
	    getNext();
	    return retDefer;
	}
	function serialOr(objs, control) {
	    objs = objs.slice();
	    var retDefer = $.Deferred();
	    var isOk = false;
	    var msgObj;
	    function getNext() {
	        if (isOk) {
	            retDefer.resolve();
	            return;
	        }
	        var obj = objs.shift();
	        if (obj === undefined) {
	            retDefer.reject(msgObj);
	            return;
	        }
	        obj.check(control).done(function () {
	            isOk = true;
	        })
	            .fail(function () {
	            if (obj.msg) {
	                msgObj = obj;
	            }
	        })
	            .always(function () {
	            getNext();
	        });
	    }
	    getNext();
	    return retDefer;
	}
	function parallelAnd(objs) {
	    var defers = [];
	    $.each(objs, function (_i, obj) {
	        defers.push(obj.check());
	    });
	    return $.when.apply(null, defers);
	}
	var css = {
	    inputError: 'stars-input-error'
	};
	window["typescript/sm-validator.js"].css = css;
	var Rule = (function () {
	    function Rule() {
	        this.display = true;
	    }
	    Rule.prototype.on = function () {
	        this.display = true;
	    };
	    Rule.prototype.off = function () {
	        this.display = false;
	    };
	    Rule.prototype.check = function (control) {
	        if (!this.display) {
	            var defer = $.Deferred();
	            defer.resolve();
	            return defer;
	        }
	        return this.checkSelf(control);
	    };
	    Rule.prototype.checkSelf = function (control) { };
	    return Rule;
	}());
	var RegRule = (function (_super) {
	    __extends(RegRule, _super);
	    function RegRule(reg, msg) {
	        _super.call(this);
	        this.reg = reg;
	        this.msg = msg;
	    }
	    RegRule.prototype.checkSelf = function (control) {
	        var defer = $.Deferred();
	        if (this.reg.test(control.val())) {
	            defer.resolve();
	        }
	        else {
	            defer.reject();
	        }
	        return defer;
	    };
	    return RegRule;
	}(Rule));
	window["typescript/sm-validator.js"].RegRule = RegRule;
	var FuncRule = (function (_super) {
	    __extends(FuncRule, _super);
	    function FuncRule(func, msg) {
	        _super.call(this);
	        this.func = func;
	        this.msg = msg;
	    }
	    FuncRule.prototype.checkSelf = function (control) {
	        var defer = $.Deferred();
	        if (this.func(control)) {
	            defer.resolve();
	        }
	        else {
	            defer.reject();
	        }
	        return defer;
	    };
	    return FuncRule;
	}(Rule));
	window["typescript/sm-validator.js"].FuncRule = FuncRule;
	var IORule = (function (_super) {
	    __extends(IORule, _super);
	    function IORule(url, callback, msg, getParamsFunc) {
	        if (getParamsFunc === void 0) { getParamsFunc = Function.prototype; }
	        _super.call(this);
	        this.url = url;
	        this.callback = callback;
	        this.msg = msg;
	        this.getParamsFunc = getParamsFunc;
	    }
	    IORule.prototype.checkSelf = function (control) {
	        var me = this;
	        var defer = $.Deferred();
	        var params = this.getParamsFunc() || {};
	        var url = me.url + encodeURIComponent(control.val()) + '&t=' + (new Date).getTime();
	        $.getJSON(url, params, function (data) {
	            if (me.callback(control, data)) {
	                defer.resolve();
	            }
	            else {
	                defer.reject();
	            }
	        })
	            .fail(function () {
	            me.msg = 'request timeout';
	            defer.reject();
	        });
	        return defer;
	    };
	    return IORule;
	}(Rule));
	window["typescript/sm-validator.js"].IORule = IORule;
	var NotRule = (function (_super) {
	    __extends(NotRule, _super);
	    function NotRule(rule, msg) {
	        _super.call(this);
	        this.rule = rule;
	        this.msg = msg;
	    }
	    NotRule.prototype.checkSelf = function (control) {
	        var defer = $.Deferred();
	        this.rule.check(control).done(function () {
	            defer.reject();
	        })
	            .fail(function () {
	            defer.resolve();
	        });
	        return defer;
	    };
	    return NotRule;
	}(Rule));
	window["typescript/sm-validator.js"].NotRule = NotRule;
	var AndRule = (function (_super) {
	    __extends(AndRule, _super);
	    function AndRule() {
	        var rules = [];
	        for (var _a = 0; _a < arguments.length; _a++) {
	            rules[_a - 0] = arguments[_a];
	        }
	        _super.call(this);
	        this.msg = '';
	        this.rules = rules;
	    }
	    AndRule.prototype.add = function () {
	        var rules = [];
	        for (var _a = 0; _a < arguments.length; _a++) {
	            rules[_a - 0] = arguments[_a];
	        }
	        this.rules = this.rules.concat(rules);
	        return this;
	    };
	    AndRule.prototype.checkSelf = function (control) {
	        var me = this;
	        return serialAnd(this.rules, control).fail(function (rule) {
	            me.msg = rule.msg;
	        });
	    };
	    return AndRule;
	}(Rule));
	window["typescript/sm-validator.js"].AndRule = AndRule;
	var OrRule = (function (_super) {
	    __extends(OrRule, _super);
	    function OrRule() {
	        var rules = [];
	        for (var _a = 0; _a < arguments.length; _a++) {
	            rules[_a - 0] = arguments[_a];
	        }
	        _super.apply(this, rules);
	    }
	    OrRule.prototype.checkSelf = function (control) {
	        var me = this;
	        return serialOr(this.rules, control).fail(function (rule) {
	            if (rule) {
	                me.msg = rule.msg;
	            }
	        });
	    };
	    return OrRule;
	}(AndRule));
	window["typescript/sm-validator.js"].OrRule = OrRule;
	var Control = (function () {
	    function Control() {
	        this.classType = 'control';
	        this.$tipEle = $('<div/>');
	        this.$event = $('<div/>');
	        this.msg = '';
	        this.parent = null;
	        this.display = true;
	        this.$ele = null;
	    }
	    Control.prototype.onSuccess = function (func) {
	        var me = this;
	        this.$event.on('success', function () {
	            func(me);
	        });
	        return me;
	    };
	    Control.prototype.onError = function (func) {
	        var me = this;
	        this.$event.on('error', function () {
	            func(me);
	        });
	        return me;
	    };
	    Control.prototype.onAlways = function (func) {
	        var me = this;
	        this.$event.on('always', function () {
	            func(me);
	        });
	        return me;
	    };
	    Control.prototype.execCallback = function (ret) {
	        this.$event.trigger('always').trigger(ret ? 'success' : 'error');
	    };
	    Control.prototype.check = function (isSelf) {
	        var me = this;
	        //如果被主动off
	        //或者，元素被隐藏或删除
	        if (this.display === false || (this.$ele && this.$ele.is(':hidden'))) {
	            var defer = $.Deferred();
	            defer.resolve();
	            return defer;
	        }
	        if (!this.parent) {
	            this.clearStatus();
	            return this.checkSelf();
	        }
	        else {
	            if (isSelf) {
	                return this.checkSelf();
	            }
	            else {
	                return this.parent.check();
	            }
	        }
	    };
	    Control.prototype.setTipEle = function ($tipEle) {
	        this.$tipEle = $($tipEle);
	        return this;
	    };
	    Control.prototype.showTip = function (msg) {
	        this.msg = msg;
	        this.$tipEle.html(msg).hide();
	        if (msg) {
	            this.$tipEle.fadeIn();
	        }
	        return this;
	    };
	    Control.prototype.on = function () {
	        this.display = true;
	        return this;
	    };
	    Control.prototype.off = function () {
	        this.display = false;
	        return this;
	    };
	    Control.prototype.checkSelf = function () { };
	    Control.prototype.clearStatus = function () { };
	    Control.prototype.bindEvents = function () { };
	    return Control;
	}());
	var TextControl = (function (_super) {
	    __extends(TextControl, _super);
	    function TextControl($ele) {
	        _super.call(this);
	        this.rules = [];
	        this.$ele = $($ele);
	        this.initStarsEvent();
	        this.bindEvents();
	    }
	    TextControl.prototype.getTriggerType = function () {
	        return 'blur';
	    };
	    TextControl.prototype.add = function () {
	        var rules = [];
	        for (var _a = 0; _a < arguments.length; _a++) {
	            rules[_a - 0] = arguments[_a];
	        }
	        this.rules = this.rules.concat(rules);
	        return this;
	    };
	    TextControl.prototype.val = function () {
	        if ((this instanceof TextControl) && this.$ele.hasClass('js-placeholder')) {
	            return '';
	        }
	        return $.trim(this.$ele.val()) || this.$ele.attr('data-stars-value') || '';
	    };
	    TextControl.prototype.initStarsEvent = function () {
	        var $ele = this.$ele;
	        var flag = 'data-stars-event';
	        if ($ele.attr(flag) == 'yes') {
	            return false;
	        }
	        $ele.attr(flag, 'yes');
	        var events = ['blur', 'change'];
	        $.each(events, function (_i, evt) {
	            $ele.on(evt, function () {
	                $ele.trigger('stars-' + evt);
	            });
	        });
	    };
	    TextControl.prototype.clearStatus = function () {
	        this.showTip('');
	        if (this instanceof TextControl) {
	            this.$ele.removeClass(css.inputError);
	        }
	    };
	    TextControl.prototype.checkSelf = function () {
	        var me = this;
	        var andRule = new AndRule();
	        andRule.add.apply(andRule, this.rules);
	        return andRule.check(this).done(function () {
	            me.execCallback(true);
	        })
	            .fail(function () {
	            me.execCallback(false);
	        })
	            .always(function () {
	            me.showTip(andRule.msg);
	        });
	    };
	    TextControl.prototype.bindEvents = function () {
	        var me = this;
	        var eventType = 'stars-' + me.getTriggerType();
	        me.$ele.off(eventType).on(eventType, function () {
	            me.check();
	        });
	        if (me instanceof TextControl) {
	            me.onError(function () {
	                me.$ele.addClass(css.inputError);
	            });
	        }
	        return me;
	    };
	    return TextControl;
	}(Control));
	window["typescript/sm-validator.js"].TextControl = TextControl;
	var SelectControl = (function (_super) {
	    __extends(SelectControl, _super);
	    function SelectControl($ele) {
	        _super.call(this, $ele);
	    }
	    SelectControl.prototype.getTriggerType = function () {
	        return 'change';
	    };
	    return SelectControl;
	}(TextControl));
	window["typescript/sm-validator.js"].SelectControl = SelectControl;
	var RadioControl = (function (_super) {
	    __extends(RadioControl, _super);
	    function RadioControl($ele) {
	        _super.call(this, $ele);
	    }
	    return RadioControl;
	}(SelectControl));
	window["typescript/sm-validator.js"].RadioControl = RadioControl;
	var CheckboxControl = (function (_super) {
	    __extends(CheckboxControl, _super);
	    function CheckboxControl($ele) {
	        _super.call(this, $ele);
	    }
	    return CheckboxControl;
	}(SelectControl));
	window["typescript/sm-validator.js"].CheckboxControl = CheckboxControl;
	var AndControl = (function (_super) {
	    __extends(AndControl, _super);
	    function AndControl() {
	        var controls = [];
	        for (var _a = 0; _a < arguments.length; _a++) {
	            controls[_a - 0] = arguments[_a];
	        }
	        _super.call(this);
	        this.controls = [];
	        this.add.apply(this, controls);
	        this.bindEvents();
	    }
	    AndControl.prototype.add = function () {
	        var controls = [];
	        for (var _a = 0; _a < arguments.length; _a++) {
	            controls[_a - 0] = arguments[_a];
	        }
	        var me = this;
	        this.controls = this.controls.concat(controls);
	        $.each(this.controls, function (_i, control) {
	            control.parent = me;
	        });
	        return this;
	    };
	    AndControl.prototype.clearStatus = function () {
	        this.showTip('');
	        $(this.controls).each(function (_i, control) {
	            control.clearStatus();
	        });
	    };
	    AndControl.prototype.bindEvents = function () {
	        var me = this;
	        me.onSuccess(function () {
	            me.clearStatus();
	        });
	    };
	    AndControl.prototype.checkSelf = function () {
	        var me = this;
	        return serialAnd(this.controls, true).done(function () {
	            me.showTip('');
	            me.execCallback(true);
	        })
	            .fail(function (control) {
	            if (control) {
	                me.showTip(control.msg);
	            }
	            me.execCallback(false);
	        });
	    };
	    return AndControl;
	}(Control));
	window["typescript/sm-validator.js"].AndControl = AndControl;
	var OrControl = (function (_super) {
	    __extends(OrControl, _super);
	    function OrControl() {
	        var controls = [];
	        for (var _a = 0; _a < arguments.length; _a++) {
	            controls[_a - 0] = arguments[_a];
	        }
	        _super.apply(this, controls);
	    }
	    OrControl.prototype.checkSelf = function () {
	        var me = this;
	        return serialOr(this.controls, true).done(function () {
	            me.showTip('');
	            me.execCallback(true);
	        })
	            .fail(function (control) {
	            if (control) {
	                me.showTip(control.msg);
	            }
	            me.execCallback(false);
	        });
	    };
	    return OrControl;
	}(AndControl));
	window["typescript/sm-validator.js"].OrControl = OrControl;
	var FormControl = (function (_super) {
	    __extends(FormControl, _super);
	    function FormControl() {
	        var controls = [];
	        for (var _a = 0; _a < arguments.length; _a++) {
	            controls[_a - 0] = arguments[_a];
	        }
	        _super.apply(this, controls);
	    }
	    FormControl.prototype.add = function () {
	        var controls = [];
	        for (var _a = 0; _a < arguments.length; _a++) {
	            controls[_a - 0] = arguments[_a];
	        }
	        this.controls = this.controls.concat(controls);
	        return this;
	    };
	    FormControl.prototype.check = function () {
	        var me = this;
	        return parallelAnd(this.controls).done(function () {
	            me.execCallback(true);
	        })
	            .fail(function () {
	            me.execCallback(false);
	        });
	    };
	    return FormControl;
	}(AndControl));
	window["typescript/sm-validator.js"].FormControl = FormControl;
	function rule(a, b, c, d) {
	    var t = $.type(a);
	    if (t == 'regexp') {
	        return new RegRule(a, b);
	    }
	    else if (t == 'function') {
	        return new FuncRule(a, b);
	    }
	    else if (t == 'string') {
	        return new IORule(a, b, c, d);
	    }
	    throw 'Rule error:' + a + ',' + b;
	}
	window["typescript/sm-validator.js"].rule = rule;
	function not(rule, msg) {
	    return new NotRule(rule, msg);
	}
	window["typescript/sm-validator.js"].not = not;
	function control($ele) {
	    if (!$ele) {
	        return new FormControl;
	    }
	    $ele = $($ele);
	    var eleType = $ele.prop('type');
	    var obj;
	    switch (eleType) {
	        case 'radio':
	            obj = new RadioControl($ele);
	            break;
	        case 'select-one':
	        case 'select-multiple':
	        case 'file':
	            obj = new SelectControl($ele);
	            break;
	        case 'checkbox':
	            obj = new CheckboxControl($ele);
	            break;
	        default:
	            obj = new TextControl($ele);
	            break;
	    }
	    return obj;
	}
	window["typescript/sm-validator.js"].control = control;
	function andOr(t) {
	    t = (t == 'and') ? 'and' : 'or';
	    var ruleMap = { 'and': AndRule, 'or': OrRule };
	    var controlMap = { 'and': AndControl, 'or': OrControl };
	    var fn = function () {
	        var args = [];
	        for (var _a = 0; _a < arguments.length; _a++) {
	            args[_a - 0] = arguments[_a];
	        }
	        var obj;
	        if (!args.length) {
	            return new controlMap[t];
	        }
	        if (args[0].classType == 'control') {
	            obj = new controlMap[t];
	        }
	        else {
	            obj = new ruleMap[t];
	        }
	        obj.add.apply(obj, args);
	        return obj;
	    };
	    return fn;
	}
	function required(msg) {
	    function func(control) {
	        var $ele = control.$ele;
	        var eleType = $ele.prop('type');
	        if (eleType == 'checkbox' || eleType == 'radio') {
	            return $ele.prop('checked');
	        }
	        else if (eleType == 'select-one') {
	            var value = control.val();
	            return (value != '-1') && (value != '');
	        }
	        else if (eleType == 'select-multiple') {
	            return control.val().length > 0;
	        }
	        else if (eleType == 'file') {
	            return $ele[0].files.length != 0;
	        }
	        else {
	            return $.trim(control.val()) != '';
	        }
	    }
	    return new FuncRule(func, msg);
	}
	window["typescript/sm-validator.js"].required = required;
	function length(range, msg) {
	    var min = parseInt(range[0]);
	    var max = parseInt(range[1]);
	    if (isNaN(min) && isNaN(max)) {
	        throw 'length error';
	    }
	    function func(control) {
	        var $ele = control.$ele;
	        var len = $.trim($ele.val()).length;
	        if (!isNaN(min) && !isNaN(max)) {
	            return (len >= min) && (len <= max);
	        }
	        if (isNaN(min)) {
	            return len < max;
	        }
	        return len >= min;
	    }
	    return new FuncRule(func, msg);
	}
	window["typescript/sm-validator.js"].length = length;
	function any($eles, msg) {
	    $eles = $($eles);
	    var orControlObj = new OrControl;
	    $eles.each(function (_, ele) {
	        var me = $(ele);
	        orControlObj.add(control(me).add(required(msg)));
	    });
	    return orControlObj;
	}
	window["typescript/sm-validator.js"].any = any;
	;
}({exports:{}}, {});
        

void function (module, exports){
    window["typescript/hello.js"] = {};
    
	"use strict";
	var sm = window["typescript/sm-validator.js"];
	console.log(sm.any);
	console.log('hehe');
	;
}({exports:{}}, {});
        