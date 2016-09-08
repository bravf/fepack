let path = require('path')
let fs = require('fs')
let exec = require('child_process').exec
let colors = require('colors')
let deepAssign = require('deep-assign')
var markdown = require('markdown').markdown
let util = require('./util')
let transJade = require('./transJade')

let g_conf = global.g_conf
let tmpDir = g_conf.tmpDir
let releaseConf = g_conf.fepackJSON.release

let isWatch = g_conf.case.watch

//* typescript 转换
function transts(){
    let defer = Promise.defer()
    let tsconf = path.join(tmpDir.a, 'tsconfig.json')

    util.createF(tsconf, `
{
    "compilerOptions": {
        "module": "commonjs",
        "rootDir": ".",
        "outDir": "../b",
        "allowJs": true
    },
    "filesGlob": [
        "./**/*.ts",
        "./**/*.js"
    ],
    "atom": {
        "rewriteTsconfig": false
    }
}
`)

    let tscProcess = exec('tsc -w')
    tscProcess.stdout.on('data', msg=>{
        if (msg.indexOf('Watching for file changes') != -1){
            defer.resolve()

            if (!isWatch){
                tscProcess.kill()
            }
            return
        }
        if (msg.indexOf('error') != -1){
            util.error(msg)
            return
        }

        util.log(msg)
    })
    tscProcess.stderr.on('data', msg=>{
        util.error(msg)
    })

    return defer.promise
}

//* sass 转换
function transsass(){
    let defer = Promise.defer()
    let sassconf = path.join(tmpDir.a, 'config.rb')

    util.createF(sassconf, `
require "compass/import-once/activate"

http_path = "/"
css_dir = "../b"
sass_dir = ""
images_dir = ""
`
    )

    let sassProcess = exec('compass compile')
    sassProcess.stdout.on('data', msg=>{
        util.log(msg)
    })
    .on('end', msg=>{
        defer.resolve()
    })
    sassProcess.stderr.on('data', msg=>{
        util.error(msg)
    })

    return defer.promise
}

function sassWatch(){
    let sassProcess = exec('compass watch')
    sassProcess.stdout.on('data', msg=>{
        util.log(msg)
    })
    sassProcess.stderr.on('data', msg=>{
        util.error(msg)
    })
}

//# markdown 转换
function isMD(f){
    return path.extname(f) == '.md'
}

function mdc(f){
    if (!fs.existsSync(f) || !isMD(f)){
        return
    }
    let rf = path.relative(tmpDir.a, f)

    util.log(`[translate]: ${rf}`)

    let body = markdown.toHTML(util.getBody(f))
    let f2 = path.join(tmpDir.b, rf.replace(/\.md/, '.html'))
    util.createF(f2, body)
}

function transmd(){
    util.walk(tmpDir.a, f => {
        if (path.extname(f) != '.md'){
            return
        }
        mdc(f)
    })
}

function mdWatch(){
    fs.watch(tmpDir.a, {recursive:true}, (e, f)=>{
        mdc(path.join(tmpDir.a, f))
    })
}

//* 整体转换
function translate(){
    process.chdir(tmpDir.a)

    transJade.translate()
    transmd()

    return transts().then(_=>{
        return transsass()
    })
}
function watch(){
    transJade.watch()
    mdWatch()
    sassWatch()
}

exports.translate = translate
exports.watch = watch
