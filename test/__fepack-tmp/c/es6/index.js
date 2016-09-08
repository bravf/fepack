window["es6/_hello.tpl"] = 'this is a tpl文件哈哈哈'

void function (module, exports){
    window["es6/_header.js"] = {};
    
	window["es6/_header.js"].say = function () {
	    console.log(window["es6/_hello.tpl"]);
	};
	;
}({exports:{}}, {});
        
window["es6/_footer.tpl"] = 'this is footer tpl!!!--'

void function (module, exports){
    window["es6/_footer.js"] = {};
    
	window["es6/_footer.js"].say = function () {
	    console.log(window["es6/_footer.tpl"]);
	};
	;
}({exports:{}}, {});
        

void function (module, exports){
    window["es6/index.js"] = {};
    
	window["es6/_header.js"].say();
	window["es6/_footer.js"].say();
	console.log('aaaa');
	console.log('bbbb}');
	console.log('cc');
	console.log('aaaa');
	console.log(1);
	;
}({exports:{}}, {});
        