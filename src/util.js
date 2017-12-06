let fs = require('fs-extra')
let path = require('path')
let crypto = require('crypto')
let exec = require('child_process').exec
let minimatch = require("minimatch")
let colors = require('colors')
let esprima = require('esprima')
let escodegen = require('escodegen')
let chokidar = require('chokidar')

let util = {}

util.log = function (msg){
    console.log(`${util.logTime()} ${msg}`)
}
util.error = function (msg){
    console.log(util.logTime(), colors.red(`${msg}`))
}

util.logTime = function (){
    let now = new Date
    return colors.magenta(`${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`)
}

//深度遍历文件夹
util.walk = function (dir, callback){
    fs.readdirSync(dir).forEach(item => {
        //忽略隐藏文件
        if (item[0] == '.'){
            return false
        }

        let f = path.join(dir, item)
        if (fs.statSync(f).isDirectory()){
            util.walk(f, callback)
        }
        else {
            callback(f)
        }
    })
}

//获取文件内容
util.getBody = function (f){
    return fs.readFileSync(f).toString()
}

//得到文件大小
util.getFileSize = function (f){
    return fs.statSync(f).size
}

//或者内容md5后8位
util.getMd5 = function (body){
    let md5 = crypto.createHash('md5')
    md5.update(body)

    let md58 = md5.digest('hex').slice(-8)

    //有一定几率出现md58是纯数字，但是firefox不支持window['123']的情况，所以加前缀
    if (/^\d+$/.test(md58)){
        md58 = 'fe-' + md58
    }

    return md58
}

//创建文件
util.createF = function (f, body){
    let arr = f.split('/')
    let len = arr.length
    let i = 0
    let a = '/'
    let b

    while ( (b = arr.shift()) != null ){
        i++
        a = path.join(a, b)
        //如果b是最后一项，并且有body
        if ( (typeof body != 'undefined') &&  (i == len) ){
            fs.writeFileSync(a, body.toString())
        }
        else {
            if (!fs.existsSync(a)){
                fs.mkdirSync(a)
            }
        }
    }
}

//复制文件
util.copy = function (f1, f2){
    let defer = Promise.defer()

    fs.copy(f1, f2, (err) => {
        if (err){
            console.log(err)
            defer.reject()
        }
        else {
            defer.resolve()
        }
    })

    return defer.promise
}

util.isDir = function (f){
    return fs.lstatSync(f).isDirectory()
}

//rules: 规则array
//f: 项目的相对路径
util.match = function (rules, f){
    let a = false
    rules.some(b=>{
        if (minimatch(f, b)){
            a = true
            return true
        }
    })
    return a
}

//处理环境变量
util.replaceEnv = function (env, body){
    if (Object.keys(env).length == 0){
        return body
    }

    return body.replace(/(?:@FEDOG\.(\w+)|@\{FEDOG\.(\w+)\}|@FEPACK\.(\w+)|@\{FEPACK\.(\w+)\})/g, (a, b, c, d, e)=>{
        b = b || c || d || e
        if (b in env){
            return env[b]
        }
        else {
            return ''
        }
    })
}

//是否下划线开头
util.underline = function (f){
    return path.basename(f)[0] == '_'
}

util.isext = function (f, exts){
    return exts.split(',').indexOf(path.extname(f)) != -1
}

util.isNodeModulePath = function (f){
    return f.indexOf('node_modules/') != -1
}

//去除注释
util.delComment = function (code){
    return code.replace(/([^\\]|^)(((\/\*)[\s\S]*?\*\/)|((\/\/).*$))/mg, function(){
        var codeLen = code.length;
        var args = arguments,argsLen = args.length;
        var comment = args[0],
            pos = args[argsLen - 2],
            multi = args[4] == '/*';
        if(!~comment.indexOf('\n')){//多行不会出现在字符串中
            var tempChar,tempIndex = pos + (multi?comment.length:2);
            while((tempChar = code.charAt(tempIndex++)) != '\n' && tempIndex < codeLen){
                if(tempChar == "'" || tempChar == '"'){
                    tempIndex = pos;
                    var leftQuotes = 0,rightChar = tempChar;
                    while((tempChar = code.charAt(tempIndex--)) != '\n' && tempIndex >= 0){
                        if(tempChar == rightChar){
                            leftQuotes ++;
                        }
                    }
                    if(leftQuotes % 2 == 1){//有单数个->注释在引号中
                        return comment;
                    }
                    break;
                }
            }
        }
        return args[1];
    });
}

// 得到Js require 依赖 (by tokens, 解析某些文件bug)
util.getRequireDeps = function (code){
    let tokens = esprima.tokenize(code)
    let reqs = {}

    for (let i=0,len=tokens.length; i<len; i++){
        let token = tokens[i]
        if (token.type == 'Identifier' && token.value == "require"){
            // i索引向前进2
            i = i + 2
            let token2 = tokens[i]

            if (token2){
                let reqValue = token2.value
                if ( !(reqValue in reqs) ){
                    reqs[reqValue] = ''
                }
            }
        }
    }

    return Object.keys(reqs)
}

util.getType = function (obj){
    return Object.prototype.toString.call(obj).slice(8,-1)
}

// 得到js require依赖 (by ast)
util.getRequireDepsByAst = function (code){
    let ast = {}
    
    try{
        ast = util.getType(code) == 'Object' ? code : esprima.parse(code)
    }
    catch(ex){}
    
    let requires = {}

    function walk(obj){
        let otype = util.getType(obj)

        if (otype == 'Array'){
            obj.forEach(_=>{
                walk(_)
            })
        }
        else if (otype == 'Object'){
            let callee = obj.callee
            let args = obj.arguments

            if (obj.type == 'CallExpression' && 
                    callee.type == 'Identifier' &&  
                    callee.name == 'require' &&
                    args.length == 1 &&
                    args[0].type == 'Literal'
            ){
                let reqValue = args[0].value
                if (!(reqValue in requires)){
                    requires[reqValue] = ''
                }
            }
            else {
                for (k in obj){
                    walk(obj[k])
                }
            }
        }
    }

    walk(ast.body)

    return {
        requires: Object.keys(requires),
        ast: ast
    } 
}

//watch
util.watch = function (p, c){
    
    // fs.watch(p, {recursive:true}, (e, f)=>{
    //     c(e, f)
    // })

    let t = +new Date

    chokidar.watch(p, {
        ignored: /\.git|\.listen_test|\.sass-cache/,
    })
    .on('all', (e, f) => {
        // 如果文件被删除，则忽略
        if (!fs.existsSync(f)){
            util.error('[translate]:' + f + ' 已经被移除!')
            return
        }

        // 如果文件更改于watch之前，则忽略此次事件
        if (+fs.statSync(f).mtime <= t){
            return
        }
        c(e, path.relative(p, f))
    })
}

//中文转unicode
util.toAscii = function (str){
     return str.replace(/[\u0080-\uffff]/g, function (ch) {
        var code = ch.charCodeAt(0).toString(16)
        if (code.length <= 2) {
            while (code.length < 2) code = "0" + code
            return "\\x" + code
        } else {
            while (code.length < 4) code = "0" + code
            return "\\u" + code
        }
    });
}

module.exports = util
