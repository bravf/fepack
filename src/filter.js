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
    let rf = path.relative(g_conf.root, f)

    if (util.match(releaseConf.ignore, rf)){
        return false
    }
    if (util.match(releaseConf.copy, rf)){
        return util.copy(f, path.join(tmpDir.f, rf))
    }
    return util.copy(f, path.join(tmpDir.a, rf))
}

function filter(){
    let ps = []
    util.walk(g_conf.root, f => {
        let p = filterFile(f)
        p && ps.push(p)
    })
    return Promise.all(ps)
}

exports.filter = filter
