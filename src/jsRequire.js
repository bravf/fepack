let path = require('path')
let fs = require('fs')
let exec = require('child_process').exec
let colors = require('colors')
let deepAssign = require('deep-assign')
let util = require('./util')
let resolve = require('browser-resolve')

let g_conf = global.g_conf
let tmpDir = g_conf.tmpDir
let releaseConf = g_conf.fepackJSON.release
let externals = releaseConf.externals

let requireReg = /require\(['|"](.*?)['|"]\)/g

//* 全局依赖表
// {'/static/_a.js':['/static/index.js', '/static/index2.js']}
let depTable = {}

//* 文件对象表
// {'/static/a.js':{code:code, ast:ast}}
let fileTable = {}

function getRequirePath(currF, requireF){
    let rf = requireF

    // 如果是jade,md转换为html
    if (util.isext(rf, '.jade,.md')){
        rf = rf.replace(/\.jade|.md$/, '.html')
    }

    return resolve.sync(rf, {filename: currF})
}

//* 扫描当前js文件所有require的模块
function scanJs(mainF, currF, requireFiles){
    if (requireFiles.indexOf(currF) != -1){
        return
    }

    if (util.isext(currF, '.js')){
        let code = util.getBody(currF)
        let rs = util.getRequireDepsByAst(code)
        let arr = rs.requires

        for (let i=0; i<arr.length; i++){
            //检查是否在externals中
            if ( !(arr[i] in externals) ){
                scanJs(mainF, getRequirePath(currF, arr[i]), requireFiles)
            }
        }
    }

    if (mainF != currF){
        requireFiles.push(currF)
    }
}

//* 根据文件类型生成新的文件内容
function getBody(f){
    let body = util.getBody(f)
    let rf = path.relative(tmpDir.b, f)
    let winFuncName = g_conf.case.optimize ? `window["${util.getMd5(rf)}"]` : `window["${rf}"]`
    let body2

    // 如果tpl
    if (util.isext(f, '.tpl,.html')){
        body2 = `${winFuncName} = '${body.replace(/\r?\n\s*/g, '').replace(/'/g, "\\'")}'`
    }
    else if (util.isext(f, '.css')){
        body2 = `
void function (){
    var style = ${winFuncName} = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = '${body.replace(/\r?\n\s*/g, '').replace(/'/g, "\\'")}';
    document.getElementsByTagName('head')[0].appendChild(style);
}();
        `
    }
    else if (util.isext(f, '.js')){
        body2 = `
void function (module, exports){
    ${winFuncName} = {};
    ${body.replace(/(module\.)?exports/g, winFuncName).replace(/(^|\n)/g, '\n\t')};
}({exports:{}}, {});
        `
        // 把所有require('xx')转换为window['xx']引用
        let requires = util.getRequireDepsByAst(body).requires
        requires.forEach(_=>{
            let reg = RegExp(`(?:require\\('${_}'\\))|(?:require\\("${_}"\\))`, 'g')

            if (_ in externals){
                body2 = body2.replace(reg, externals[_])
            }
            else {
                let requirePath = path.relative(tmpDir.b, getRequirePath(f, _))
                let afterStr = g_conf.case.optimize ? `window["${util.getMd5(requirePath)}"]` : `window["${requirePath}"]`
                
                body2 = body2.replace(reg, afterStr)
            }
        })
    }

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
    if (!fs.existsSync(f) || util.isNodeModulePath(f)){
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
            if (util.isext(f, '.js')){
                compileJs(f)
            }
            else {
                if (!util.isNodeModulePath(f)){
                    ps.push(util.copy(f, path.join(tmpDir.c, path.relative(tmpDir.b, f))))
                }
            }
        }
    })
    return Promise.all(ps)
}

function watch(){
    fs.watch(tmpDir.b, {recursive:true}, (e, rf) => {
        let f = path.join(tmpDir.b, rf)

        if (util.isext(f, '.js,.tpl,.jade,.html,.css')){
            if (f in depTable){
                depTable[f].forEach(_=>{
                    compileJs(_)
                })
            }
            else {
                if (util.isext(f, '.js')){
                    compileJs(f)
                }
            }
        }

        if (!util.underline(f) && !util.isNodeModulePath(f) && !util.isext(f, '.js')){
            util.copy(f, path.join(tmpDir.c, path.relative(tmpDir.b, f)))
        }
    })
}

exports.jsRequire = jsRequire
exports.watch = watch
