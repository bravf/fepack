let path = require('path')
let fs = require('fs')
let util = require('./util')

let g_conf = global.g_conf
let tmpDir = g_conf.tmpDir
let releaseConf = g_conf.fepackJSON.release
let gCase = g_conf.case

let fromDir = gCase.optimize? tmpDir.d : tmpDir.c
let toDir = releaseConf.project ? path.join(gCase.www, releaseConf.project) : gCase.www

//版本对应表
let vtable = {}
//依赖表
let dtable = {}
//script|css|img
let reg1 = /(?:<script.*?src="(.*?)".*?><\/script>)|(?:<link.*?href="(.*?)".*?>)|(?:<img.*?src="(.*?)".*?>)/gi
//url()
let reg2 = /url\(['"]?(?!http:\/\/)([^)'"]+)/gi
//img
let reg3 = /<img.*?src="(.*?)".*?>/gi

//插入依赖表
function idtable(a, b){
    if (! (a in dtable)){
        dtable[a] = [b]
    }
    else {
        if (dtable[a].indexOf(b) == -1){
            dtable[a].push(b)
        }
    }
}

//f1当前文件，f2引用文件
function gPath(f1, f2){
    let f3

    if (f2.slice(0,4) == 'http'){
        return false
    }

    if (f2[0] == '/'){
        f3 = path.join(fromDir, f2)
    }
    else {
        f3 = path.join(path.dirname(f1), f2)
    }

    return f3
}

function v(t){
    //先其他类型
    let ps = []
    t.other.forEach(_=>{
        ps.push(v1(_))
    })

    return Promise.all(ps).then(_=>{
        //再css
        t.css.forEach(_=>{
            v2(_)
        })
        //最后html
        t.html.forEach(_=>{
            v3(_)
        })
    })
}

//替换引用辅助函数
function vf(f, a, b){
    let bf = gPath(f, b)

    if (bf !== false){
        idtable(bf, f)

        let bo = path.parse(bf)

        let domain = gCase.domain ? releaseConf.domain : ''
        let project = releaseConf.project ? releaseConf.project : ''
        let version = gCase.version && vtable[bf] ? `.${vtable[bf]}` : ''

        return a.replace(b, domain + '/' + path.join(project, bo.dir.replace(fromDir, ''), `${bo.name}${version}${bo.ext}`))
    }
}

//处理非html,css文件
function v1(f){
    util.log(`[version]: ${path.relative(fromDir, f)}`)

    let fo = path.parse(f)
    let f2 = path.join(toDir, path.relative(fromDir, f))

    let v = ''
    if (gCase.version){
        v = util.getMd5(util.getBody(f))
        vtable[f] = v
        v = `.${v}`
    }

    f2 = path.join(path.dirname(f2), `${fo.name}${v}${fo.ext}`)
    return util.copy(f, f2)
}
//处理js,css文件
function v2(f){
    util.log(`[version]: ${path.relative(fromDir, f)}`)

    let fo = path.parse(f)
    let f2 = path.join(toDir, path.relative(fromDir, f))

    let reg = (fo.ext == '.css') ? reg2 : reg3

    let body = util.getBody(f).replace(reg, (a, b)=>{
        if (b){
            return vf(f, a, b)
        }
        else {
            return a
        }
    })

    let v = ''
    if (gCase.version){
        v = util.getMd5(body)
        vtable[f] = v
        v = `.${v}`
    }

    util.createF(path.join(path.dirname(f2), `${fo.name}${v}${fo.ext}`), body)
}
//处理html文件
function v3(f){
    util.log(`[version]: ${path.relative(fromDir, f)}`)

    let fo = path.parse(f)
    let rf = path.relative(fromDir, f)
    let f2 = path.join(toDir, rf)

    let body = util.getBody(f).replace(reg1, (a, b, c, d) => {
        b = b || c || d
        if (b){
            return vf(f, a, b)
        }
        else {
            return a
        }
    })

    let v = ''
    let isStatic = rf.split('/')[0] == 'static'
    if (gCase.htmlVersion && isStatic){
        v = gCase.env.htmlVersion
    }

    util.createF(path.join(path.dirname(f2), `${fo.name}${v}${fo.ext}`), body)
}

function isHtml(ext){
    return ['.html', '.vm'].indexOf(ext) != -1
}

function iftable(f, ftable){
    let fo = path.parse(f)
    let ext = fo.ext

    if (isHtml(ext)){
        ftable.html.push(f)
    }
    else if (ext == '.css' || ext == '.js'){
        ftable.css.push(f)
    }
    else {
        ftable.other.push(f)
    }
}

//递归查询依赖
function findDep(f, ftable){
    iftable(f, ftable)

    let deps = dtable[f]
    if (!deps || deps.length == 0){
        return false
    }

    deps.forEach(_=>{
        findDep(_, ftable)
    })
}

function version(){
    //得到文件表
    let ftable = {html:[], css:[], other:[]}

    util.walk(fromDir, f=>{
        iftable(f, ftable)
    })

    return v(ftable)
}

function watch(){
    fs.watch(fromDir, {recursive:true}, (event, f)=>{
        f = path.join(fromDir, f)

        if (!fs.existsSync(f) || util.isDir(f)){
            return
        }

        let ftable = {html:[], css:[], other:[]}
        findDep(f, ftable)

        v(ftable)
    })
}

exports.version = version
exports.watch = watch
