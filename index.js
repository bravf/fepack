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
        .version('1.1.6')
        .option('init', 'create fepack.json', _=>{
            createConfig()
        })
        .option('server [s]', 'a static server', _=>{
            initConfig()
            let server = require('./src/server/server')
            server[_]()
        })
        .option('release [r]', 'release project', _=>{
            program.releaseCase = _
            initConfig()
            factory()
        })
        .parse(process.argv)
}

function createConfig(){
    let root = process.cwd()
    let conf1 = path.join(root, 'fepack.json')
    let conf2 = path.join(root, 'fedog.json')

    if (!fs.existsSync(conf1) && !fs.existsSync(conf2)){
        util.createF(conf1,
`{
    "server": {
        "port": 8080
    },
    "release": {
        "project": "",
        "domain": "",

        "cases": {
            "dev": {
                "watch": true,
                "version": false,
                "optimize": false,
                "env": {
                    "ENV": "LOCAL"
                }
            },
            "qa": {
                "watch": false,
                "version": false,
                "optimize": false
            },
            "www": {
                "watch": false,
                "version": true,
                "optimize": true
            }
        },

        "copy": [
            "**/*.min.js",
            "**/*.min.css"
        ],
        "ignore": [
            "fepack.json"
        ]
    }
}`
        )

        util.log('fepack.json创建成功!')
    }
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
        // 兼容fedog
        fepackFile = path.join(root, 'fedog.json')
        if (!fs.existsSync(fepackFile)){
            util.error(`Can not find "fepack.json", please check!`)
            process.exit()
        }
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

    //在环境变量中增加html版本号
    g_conf.case.env['htmlVersion'] = g_conf.case.htmlVersion ? +new Date : ''

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
    let gCase = g_conf.case
    let filter = require('./src/filter')
    let translate = require('./src/translate')
    let jsRequire = require('./src/jsRequire')
    let optimize = require('./src/optimize')
    let version = require('./src/version')

    cleanTmpDir()
        .then(_ => {
            return filter.filter()
        })
        .then(_ => {
            return translate.translate()
        })
        .then(_ => {
            return jsRequire.jsRequire()
        })
        .then(_ => {
            if (gCase.optimize){
                return optimize.optimize()
            }
        })
        .then(_ => {
                return version.version()
        })
        .then(_ => {
            if (gCase.watch){
                filter.watch()
                translate.watch()
                jsRequire.watch()

                if (gCase.optimize){
                    optimize.watch()
                }
                version.watch()
            }
        })
        .catch(msg => {
            console.error(msg)
        })
}

exports.main = main
