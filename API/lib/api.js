const Express = require('express')
const cors = require('cors')
const reqlib = require('app-root-path').require
const bodyParser = require('body-parser')
const tools = reqlib('./lib/tools.js')
const rooms = reqlib('./lib/api_ressources/rooms.js')
const dongle = reqlib('./lib/api_ressources/dongle.js')


global.devicetype = null

function API() {
    if (!(this instanceof API)) {
        return new API()
    }
    init.call(this)
}


function init() {

    this.connections = {},
    this.api = Express()
    this.api.use(cors())
    this.api.use(bodyParser.urlencoded({ extended: true }))
    this.api.use(bodyParser.json())
    this.api.use(bodyParser.raw())


    this.api.listen(80, () =>
        console.log(`Example app listening on port 80!`),
    )

    this.api.get('/tempstat/', async (req, res) => {
        let DBClient = new (reqlib('./lib/dbclient.js'))(null)
        let result
        if ('nodeuid' in req.query) {
            result = await DBClient.gettempstat(() => { DBClient.closeconnection() }, req.query)
            res.status(200)
            return res.json(result);
        } else {
            res.status(400).send({ error: 'could interpret param ' + req.query })
        }
    })

    rooms.init(this.api)

    dongle.init(this.api,this.connections)

    this.api.get('/task/:uuid', async (req, res) => {
        if (req.params.uuid) {
            let DBClient = new (reqlib('./lib/dbclient.js'))(null)
            result = await DBClient.gettaskstatus(() => { DBClient.closeconnection() }, req.params.uuid)
            res.status(200).json(result)
        } else {
            res.status(400).send({ error: 'no uuid in query' })
        }
         
    })

    this.api.delete('/task/:uuid', async (req, res) => {
        if (req.params.uuid) {
            let DBClient = new (reqlib('./lib/dbclient.js'))(null)
            result = await DBClient.removetask(() => { DBClient.closeconnection() }, req.params.uuid)
            res.status(200)
        } else {
            res.status(400).send({ error: 'no uuid in query' })
        }

    })

    this.api.get('/getnodeconfig/:uuid', async (req, res) => {
        if (req.params.uuid) {
            let DBClient = new (reqlib('./lib/dbclient.js'))(null)
            result = await DBClient.getnodeconfig(() => { DBClient.closeconnection() }, req.params.uuid)
            res.status(200).json(result)
        } else {
            res.status(400).send({ error: 'no uuid in query' })
        }

    })

    this.api.post('/:uuid/config/', async (req, res) => {
        if (req.params.uuid) {
            tools.writeconfig(this.connections.zwave,req.body)
            res.status(200)
        } else {
            res.status(400).send({ error: 'no uuid in query' })
        }
    })

    this.api.post('/:uuid/data/', async (req, res) => {
        if (req.params.uuid) {
            tools.writedata(this.connections.zwave, req.body)
            res.status(200)
        } else {
            res.status(400).send({ error: 'no uuid in query' })
        }

    })

    this.api.get('/nodes/', async (req, res) => {
        let DBClient = new (reqlib('./lib/dbclient.js'))(null)
        let result
        result = await DBClient.getnodes(() => { DBClient.closeconnection() }, req.query)
        res.status(200)
        return res.json(result);

    })

    this.api.get('/curtainlevel/:uuid',async (req, res) => {
        if (req.params.uuid) {
            let DBClient = new (reqlib('./lib/dbclient.js'))(null)
            result = await DBClient.getcurtainlevel(() => { DBClient.closeconnection() }, req.params.uuid)
            res.status(200).json(result)
        } else {
            res.status(400).send({ error: 'no uuid in query' })
        }


    })

    this.api.get('/usblist/', async (req, res) => {
        let result = await tools.getusblist()
        res.status(200).json(result)
    })

    this.api.post('/addmodule/', async (req, res) => {
        if (req.body.port && req.body.type) {
            let { err, portconfig, type, connection } = await tools.setport(req.body.type, req.body.port, process.platform, this.connections)
            if (!err) {
                let DBClient = new (reqlib('./lib/dbclient.js'))(null)
                await DBClient.setport(req.body.type, req.body.port)
                DBClient.closeconnection()
                this.connection = connection
            } else {
                res.status(400).send({ error: err })
            }
            res.status(200).json(process.platform)
        } else {
            res.status(400).send({ error: 'missing param' })
        }
    })

    this.api.get('/modules/', async (req, res) => {
        let modulelist = {}
        if (this.connections.zwave) {
            modulelist.zwave = this.connections.zwave
        }
        res.status(200).json(modulelist)
    })

}

module.exports = API