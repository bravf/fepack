let fs = require('fs')
let path = require('path')
let crypto = require('crypto')
let exec = require('child_process').exec
let minimatch = require("minimatch")
let colors = require('colors')

let util = {}

util.log = function (msg){
    console.log(`[${util.logTime()}]${msg}`)
}
util.error = function (msg){
    console.log(colors.red(`[${util.logTime()}]${msg}`))
}

util.logTime = function (){
    let now = new Date
    return `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
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

    util.createF(path.dirname(f2))
    exec(`cp -f ${f1} ${f2}`).stdout.on('data', data=>{
        console.log(data)
    })
    .on('end', _=>{
        defer.resolve()
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

module.exports = util
