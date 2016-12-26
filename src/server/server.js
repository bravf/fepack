let http = require('http')
let url = require('url')
let path = require('path')
let mime = require('./mime').types
let fs = require('fs')
let exec = require('child_process').exec
let util = require('../util')

let Engine = require('velocity').Engine

let g_conf = global.g_conf
let tmpDir = g_conf.tmpDir
let gCase = g_conf.case

let PORT = g_conf.fepackJSON.server.port
let wwwRoot = gCase.www

function cLink(text, href){
    return `<a href="${href}">${text}</a>`
}

function cHtml(body){
    return `
<!DOCTYPE html>
<html>
<head>
<title>fepack</title>
<style>
a{
    font-size: 18px;
    text-decoration: none;
    margin: 10px;
    color: #000;
    display: inline-block;
    padding: 10px;
}
a:hover{
    background: #00c0ef;
}
</style>
<meta charset="utf-8" />
</head>
<body>
${body}
</body>
</html>
`
}

let server = http.createServer((req, res) => {
    let pathname = url.parse(req.url).pathname
    let realPath = path.join(wwwRoot, pathname)

    console.log(realPath.replace(wwwRoot, ''))

    fs.exists(realPath, exists => {
        if (!exists){
            res.writeHead(404, {
                'Content-type': mime.txt
            })
            res.write('404')
            res.end()
        }
        else {
            let body = ''
            let stat = fs.lstatSync(realPath)
            let isDir = stat.isDirectory()

            //如果文件夹
            if (isDir){
                fs.readdirSync(realPath).forEach(f=>{
                    body += cLink(f, path.join(pathname, f))
                })
                res.writeHead(200, {
                    'Content-type': mime.html
                })
                res.write(cHtml(body))
                res.end()
            }
            //如果文件
            else {
                let ext = path.extname(realPath)
                ext = ext ? ext.slice(1) : mime.txt

                //如果是vm，则进行解析
                if (ext == 'vm'){
                    let pathObj = path.parse(realPath)
                    let vmBody = util.getBody(realPath)

                    let vmJSON = {}
                    
                    try{
                        vmJSON = require(`${pathObj.dir}/${pathObj.name}.vm.js`)
                    }
                    catch(ex){}

                    let engineObj = new Engine({
                        root: ['./'],
                        template: vmBody
                    })
                    let output = engineObj.render(vmJSON)

                    res.writeHead(200, {
                        'Content-type': mime[ext] + '; charset=utf-8',
                        'Access-Control-Allow-Origin': '*'
                    })
                    res.write(output)
                    res.end()
                }
                else {
                    fs.readFile(realPath, 'binary', (err, file) => {
                        if (err){
                            res.writeHead(500, {
                                'Content-type': mime.txt
                            })
                            res.end(err)
                        }
                        else {
                            res.writeHead(200, {
                                'Content-type': mime[ext],
                                'Access-Control-Allow-Origin': '*'
                            })
                            res.write(file, 'binary')
                            res.end()
                        }
                    })
                }
            }
        }
    })
})

exports.start = function (){
    console.log(`开始监听${PORT}端口!`)
    server.listen(PORT)
}
exports.stop = function (){

}
exports.clean = function (){
    exec(`rm -rf ${wwwRoot}/*`)
}
exports.open = function (){
    exec(`open ${wwwRoot}`)
}
