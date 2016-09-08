let path = require('path')
let fs = require('fs')
let exec = require('child_process').exec
let colors = require('colors')
let deepAssign = require('deep-assign')
let util = require('./util')

let g_conf = global.g_conf
let tmpDir = g_conf.tmpDir
let releaseConf = g_conf.fepackJSON.release

let requireReg = /require\(['|"](.*?)['|"]\)/g

//* 全局依赖表
// {'/static/_a.js':['/static/index.js', '/static/index2.js']}
let depTable = {}

//* 扫描当前js文件所有require的模块
function scanJs(mainF, currF, requireFiles){
    let body = util.getBody(currF)
    let arr = []

    // 开始扫描
    let regValue
    while ( (regValue = requireReg.exec(body)) != null ){
        arr.push(regValue[1])
    }

    for (let i=0; i<arr.length; i++){
        let rf = arr[i]
        let f

        // 如果缺省扩展名，默认为.js
        if (!path.extname(rf)){
            rf = `${rf}.js`
        }

        // 先找业务文件夹
        if (rf[0] == '/'){
            f = path.join(tmpDir.b, rf)
        }
        else {
            f = path.join(path.dirname(currF), rf)
        }

        if (!fs.existsSync(f)){
            util.error(`Can not find ${rf}!`)
            continue
        }

        scanJs(mainF, f, requireFiles)
    }

    if (mainF != currF){
        if (requireFiles.indexOf(currF) == -1){
            requireFiles.push(currF)
        }
    }
}

//* 根据文件类型生成新的文件内容
function getBody(f){
    let body = util.getBody(f)
    let rf = path.relative(tmpDir.b, f)
    let winFuncName = `window["${rf}"]`
    let body2

    // 如果tpl
    if (util.isext(f, '.tpl')){
        body2 = `${winFuncName} = '${body.replace(/\r?\n\s*/g, '').replace(/'/g, "\\'")}'`
    }
    else if (util.isext(f, '.js')){
        body2 = `
void function (module, exports){
    ${winFuncName} = {};
    ${body.replace(/(module\.)?exports/g, winFuncName).replace(/(^|\n)/g, '\n\t')};
}({exports:{}}, {});
        `
    }

    body2 = body2.replace(requireReg, (a, b)=>{
        b = path.extname(b) ? b : `${b}.js`
        let requirePath = b[0] == '/' ?  b : path.relative(tmpDir.b, path.join(path.dirname(f), b))
        return `window["${requirePath}"]`
    })

    return body2
}

//* 根据require信息生成新的文件
function createBundleJs(f, requireFiles){
    let bodys = []
    requireFiles.forEach(f=>{
        bodys.push(getBody(f))
    })
    bodys.push(getBody(f))

    let bundleJs = util.replaceEnv(g_conf.case.env, bodys.join('\n'))

    util.createF(path.join(tmpDir.c, path.relative(tmpDir.b, f)), bundleJs)
}

function compileJs(f){
    if (!fs.existsSync(f)){
        return
    }

    util.log(`[jsRequire]: ${path.relative(tmpDir.b, f)}`)

    let requireFiles = []
    scanJs(f, f, requireFiles)
    createBundleJs(f, requireFiles)

    // 把当前依赖关系加入全局表
    requireFiles.forEach(requireFile => {
        if (! (requireFile in depTable)){
            depTable[requireFile] = []
        }

        if (depTable[requireFile].indexOf(f) == -1){
            depTable[requireFile].push(f)
        }
    })
}

function jsRequire(){
    let ps = []
    util.walk(tmpDir.b, f => {
        if (!util.underline(f)){
            if (util.isext(f, '.js,.tpl')){
                compileJs(f)
            }
            else {
                ps.push(util.copy(f, path.join(tmpDir.c, path.relative(tmpDir.b, f))))
            }
        }
    })
    return Promise.all(ps)
}

function watch(){
    fs.watch(tmpDir.b, {recursive:true}, (e, rf) => {
        let f = path.join(tmpDir.b, rf)

        if (util.isext(f, '.js,.tpl')){
            if (f in depTable){
                depTable[f].forEach(_=>{
                    compileJs(_)
                })
            }
            else {
                compileJs(f)
            }
        }
        else {
            if (!util.underline(f)){
                util.copy(f, path.join(tmpDir.c, path.relative(tmpDir.b, f)))
            }
        }
    })
}

exports.jsRequire = jsRequire
exports.watch = watch
