# fepack

fepack是面向前端的工程构建工具。解决前端工程中资源加载、模块化开发、自动化工具、代码部署等问题。

```
1、安装全局依赖
npm install -g typescript
gem install compass

2、安装fepack
npm install -g fepack
```

###例子
```
mkdir my-proj
cd my-proj
touch fepack.json // fepack.json配置看后文介绍
fepack release dev
fepack server start

在浏览器中打开127.0.0.1:8080
```

###fepack.json
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
        "domain": "",
        
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
            "config.rb",
            "fedog.json",
            "tsconfig.json",
            "run.py"
        ]
    }
}
```



