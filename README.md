# fepack

[![Version](http://img.shields.io/npm/v/fepack.svg)](https://www.npmjs.org/package/fepack)

fepack是面向前端的工程构建工具。解决前端工程中资源加载、模块化开发、自动化工具、代码部署等问题。

```
1、安装全局依赖
npm install -g typescript
gem install compass

2、安装fepack
npm install -g fepack
```

## 例子
```
mkdir my-proj
cd my-proj

fepack init // 生成fepack.json，配置看后文介绍
fepack release dev
fepack server start

在浏览器中打开127.0.0.1:8080
```

## 支持功能
1. 语法增强，支持
    ```
    (typescript,es6,coffee) => es5
    sass => css
    (jade,md) => html
    jsx => js
    ```

2. 静态资源加版本号（支持.html inline模式 `<script src="a.js" inline></script>, <link href="a.css" inline>`）
3. 文件压缩
4. 源文件常量注入
5. 文件大小检测，主要是图片文件，默认大于200k报警
6. 增加velocity模板语法支持，[用法](https://github.com/bravf/fepack/tree/master/test/vm)


## 模块加载
### fepack支持browserify式的模块加载
```js
// require业务js文件
let head = require('./head.js')

// require 4种格式模板文件
let headTemplate = require('./head.tpl')
require('./head.html')
require('./head.jade')
require('./head.md')

// require css
// index.css内容会被以style tag方式插入到head里
// cssModule代表生成的style tag
let cssModule = require('./index.css')

// require npm安装的node包（不支持依赖native环境的包）
// 在项目根目录npm install --save cookie
let cookie = require('cookie')
```

## fepack.json
```js
{
    "server": {

        //server监听的端口
        "port": 8080    
    },
    "release": {

        //项目名，会加到被引用的资源前
        "project": "",  

        //域名，会加到被引用的资源前
        "domain": "//s1.mljr.com",

        //是否开启coffee编译
        "coffee": "false", //默认不开启（如果开启，需要提前全局安装coffeescript, npm install -g coffee-script）

        //编译实例
        "cases": {
            "dev": {
                "optimize": false,
                "version": true,
                "watch": true,

                //常量注入
                //js里使用：let a = "@{FEPACK.aa}" => let a = "aaaa"
                //jade里使用： #{FEPACK.aa}
                "env": {    
                    "aa": "aaaa",
                    "bb": "bbbb",
                    "a": "cc"
                }
            },
            "qa": {
                //是否压缩，默认false
                "optimize": true,

                //是否加版本号，默认false
                "version": true,

                //是否watch，默认false  
                "watch": false,

                //是否启用域名，默认false  
                "domain": true,

                //覆盖全局的domain
                "reDomain": "//s2.mljr.com",

                 //指定编译结果目录，
                 //默认为/Users/${user}/.fedog-tmp/www
                "www": "../www"  
            }
        },

        // 设置文件原样复制，中间不做任何处理
        "copy": [
            "**/*.min.js",
            "static/script/copy/**/*"
        ],

        // 设置文件忽略
        "ignore": [
            "static/script/ignore/**/*",
            "fepack.json"
        ],

        // 设置全局模块引用
        "externals": {
            "jquery": "window.$"
        },

        // 设置postcss配置
        "postcss": {
            "autoprefixer": {"browsers": ["last 2 versions", "iOS 7", "Android 4.4", "> 5%"]},
            "pxtorem": {
                "root_value": 40,
                "prop_white_list": []
            }
        }
    }
}
```
