/***
    *** FEPACK, A easy web tool!
    *** by bravf 16/9/7
***/

let path = require('path')
let fs = require('fs')
let program = require('commander')
let exec = require('child_process').exec
let colors = require('colors')
let deepAssign = require('deep-assign')
let util = require('./src/util')

function main(){
    program
        .version('1.0.0')
        .option('release [r]', 'release project', _=>{
            program.releaseCase = _
            initConfig()
            factory()
        })
        .parse(process.argv)
}

function initConfig(){
    let root = process.cwd()
    let tmp = '__fepack-tmp'

    let g_conf = global.g_conf = {
        root: root,
        tmp: tmp,
        tmpDir: {},
        fepackJSON: {},
        case: {}
    }

    //* 构造临时目录路径
    'abcdef'.split('').forEach(_ => {
        g_conf.tmpDir[_] = path.join(root, tmp, _)
    })

    //* 读取fepack配置文件
    let fepackFile = path.join(root, 'fepack.json')
    if (!fs.existsSync(fepackFile)){
        util.error(`Can not find "fepack.json", please check!`)
        process.exit()
    }

    let fepackJSON = JSON.parse(util.getBody(fepackFile))
    g_conf.fepackJSON = deepAssign({
        server: {port: 8080},
        release: {
            project: '',
            domain: '',
            cases: {},
            copy: [],
            igonre: []
        }
    }, fepackJSON)

    g_conf.case = deepAssign({
        optimize: false,
        version: false,
        watch: false,
        domain: false,
        www: path.join(process.env.HOME, '.fepack-tmp/www'),
        env: {}
    }, g_conf.fepackJSON.release.cases[program.releaseCase] || {})

    if (g_conf.case.www[0] != '/'){
        g_conf.case.www = path.join(root, g_conf.case.www)
    }

    //* 设置cmd title
    process.stdout.write(`${String.fromCharCode(27)}]0;FEPACK [${g_conf.fepackJSON.release.project}]${String.fromCharCode(7)}`)
}

function cleanTmpDir(){
    let defer = Promise.defer()
    exec(`rm -rf ${path.join(g_conf.root, g_conf.tmp)}`).stdout.on('end', _=>{
        defer.resolve()
    })
    return defer.promise
}

function factory(){
    cleanTmpDir()
        .then(_ => {
            return require('./src/filter').filter()
        })
        .then(_ => {
            return require('./src/translate').translate()
        })
        .catch(msg => {
            util.error(msg)
        })
}

main()
