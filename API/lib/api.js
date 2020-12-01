const Express = require('express')
const cors = require('cors')
const reqlib = require('app-root-path').require
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const tools = require('./tools.js')

function API(zwavecontroller) {
    if (!(this instanceof API)) {
        return new API(zwavecontroller)
    }
    init.call(this, zwavecontroller)
}


function init(zwavecontroller) {

    this.zwave = zwavecontroller
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

    this.api.post('/adddevice/', async (req, res) => {
        if (req.body.type) {
            let DBClient = new (reqlib('./lib/dbclient.js'))(null)
            let uuid = uuidv4()
            res.status(200).send({ 'msg': 'start enrolling', 'task_id' : uuid })
            this.zwave.startInclusion(true)
            result = await DBClient.inittask(() => { DBClient.closeconnection() }, uuid, "AddDevice")
        } else {
            res.status(400).send({ error:  'no type in query' })
        }
    })

    this.api.post('/removedevice/', async (req, res) => {
        if (req.body.type) {
            let DBClient = new (reqlib('./lib/dbclient.js'))(null)
            let uuid = uuidv4()
            res.status(200).send({ 'msg': 'start removed', 'task_id': uuid })
            this.zwave.startExclusion(true)
            result = await DBClient.inittask(() => { DBClient.closeconnection() }, uuid, "RemoveDevice")
        } else {
            res.status(400).send({ error: 'no type in query' })
        }
    })

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
            tools.writeconfig(this.zwave,req.body)
            res.status(200)
        } else {
            res.status(400).send({ error: 'no uuid in query' })
        }

    })


}

module.exports = API