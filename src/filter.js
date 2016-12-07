let path = require('path')
let fs = require('fs')
let exec = require('child_process').exec
let colors = require('colors')
let deepAssign = require('deep-assign')
let util = require('./util')

let g_conf = global.g_conf
let tmpDir = g_conf.tmpDir
let releaseConf = g_conf.fepackJSON.release

function filterFile(f){
    //忽略__fepack-tmp
    if ( f.indexOf('__fepack-tmp/') != -1 ){
        return false
    }

    let rf = path.relative(g_conf.root, f)
    
    if (!fs.existsSync(f) || util.isNodeModulePath(rf)){
        return
    }

    // check file size
    // 如果大于200k，报警
    let fsize = (util.getFileSize(f)/1024).toFixed(2)
    if (fsize > 200){
        util.error(`[${rf}], 文件尺寸为${fsize}k, 大于200k，请注意!`)
    }

    util.log(`[filter]: ${rf}`)

    if (util.match(releaseConf.ignore, rf)){
        return false
    }
    if (util.match(releaseConf.copy, rf)){
        return util.copy(f, path.join(g_conf.case.www, releaseConf.project, rf))
    }

    // 参与语法降级的到a
    // 其他全部到b
    let extname = path.extname(f)
    let toDir

    if (util.isext(f, '.ts,.scss,.md,.jade,.js,.jsx')){
        toDir = tmpDir.a
    }
    else {
        toDir = tmpDir.b
    }

    // 如果是jsx文件，改成tsx后缀，方便tsc识别
    if (util.isext(rf, '.jsx')){
        rf = rf.replace('.jsx', '.tsx')
    }

    return util.copy(f, path.join(toDir, rf))
}

function filter(){
    let ps = []

    //处理node_modules目录，直接到b参与jsRequire
    let a = path.join(g_conf.root, 'node_modules')
    let b = path.join(tmpDir.b, 'node_modules')

    //是否有node_modules
    if (fs.existsSync(a)){
        ps.push(util.copy(a, b))
    }

    util.walk(g_conf.root, f => {
        let p = filterFile(f)
        p && ps.push(p)
    })
    return Promise.all(ps)
}

function watch(){
    fs.watch(g_conf.root, {recursive:true}, (e, f) => {
        filterFile(path.join(g_conf.root, f))
    })
}

exports.filter = filter
exports.watch = watch
