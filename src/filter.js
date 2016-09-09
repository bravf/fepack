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
    if (!fs.existsSync(f)){
        return
    }

    let rf = path.relative(g_conf.root, f)

    util.log(`[filter]: ${rf}`)

    if (util.match(releaseConf.ignore, rf)){
        return false
    }
    if (util.match(releaseConf.copy, rf)){
        return util.copy(f, path.join(g_conf.case.www, releaseConf.project, rf))
    }

    // node_modules目录直接到b参与jsRequire
    // 参与语法降级的到a
    // 其他全部到b
    let extname = path.extname(f)
    let toDir

    if (util.isNodeModulePath(rf)){
        toDir = tmpDir.b
    }
    else if (util.isext(f, '.ts,.scss,.md,.jade')){
        toDir = tmpDir.a
    }
    else {
        toDir = tmpDir.b
    }

    return util.copy(f, path.join(toDir, rf))
}

function filter(){
    let ps = []
    util.walk(g_conf.root, f => {
        let p = filterFile(f)
        p && ps.push(p)
    })
    return Promise.all(ps)
}

function watch(){
    fs.watch(g_conf.root, {recursive:true}, (e, f) => {
        if ( (f.slice(0, 13) != '__fepack-tmp/') ){
            filterFile(path.join(g_conf.root, f))
        }
    })
}

exports.filter = filter
exports.watch = watch
