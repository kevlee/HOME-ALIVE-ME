<template>
    <v-container class="nodedetails">
        <v-tabs v-model="tab">
            <v-tab key="tab-manage" label="manage">
                Manage
            </v-tab>
            <v-tab key="tab-home" label="Config" v-if="configs">
               Configuration
            </v-tab>
        </v-tabs>
        <v-tabs-items v-model="tab">
            <v-tab-item key="tab-manage" v-show="true">
                <v-form flat>
                    <v-container v-if="nodeinfo.type == 'shutter'">
                        <v-slider label="Curtain Position"
                                  ticks id="curtainposition"
                                  name="curtainposition"
                                  min="0" max="100" v-model="lvl" step="25"
                                  @input="changelvl($event)">
                            <template v-slot:append>
                                <div id="value">{{lvl}}%</div>
                            </template>
                        </v-slider>
                    </v-container>
                    <v-divider></v-divider>
                    <v-container>
                        <v-select v-model="moduleroom"
                                  :items="roomlist"
                                  item-text="name"
                                  item-value="name"
                                  label="Room"
                                  single-line
                                  >
                        </v-select>
                    </v-container>
                    <v-container>
                        <v-select v-model="nodetype"
                                  :items="typelist"
                                  label="Type"
                                  single-line
                                  >
                        </v-select>
                    </v-container>
                </v-form>
                <div class="processbuttton">
                    <md-button class="md-raised md-primary save"
                               @click="savenode()">
                        SAVE
                    </md-button>
                </div>
            </v-tab-item>
            <v-tab-item key="tab-home">
                <configeditor v-bind:configs="configs" v-bind:dataset="newconfig"></configeditor>
                <div class="processbuttton">
                    <md-button class="md-raised md-primary save"
                               @click="savenodeconfig()">
                        SAVE
                    </md-button>
                </div>
            </v-tab-item>
        </v-tabs-items>
    </v-container>
</template>

<script>
    import * as tools from '../../lib/tools.js'
    import configeditor from "./configeditor.vue";

    function initialState() {
        return {
            newconfig: { 'update': true },
            lvl: 0,
            matchinglvl: {
                0: 0xFF,
                25: 0x54,
                50: 0x45,
                75: 0x20,
                100:0x00
            },
            delay: null,
            tab: null,
            moduleroom: null,
            nodetype: null,
            roomlist: [],
            typelist: [],
        }
    }
    export default {
        name: 'listnodeinfo',
        data: () => {
            return initialState()
        },
        props: [
            'nodeinfo',
            'curtainlvl'
        ],
        asyncComputed: {
            configs: async function () {
                let nodeconfigs = await tools.fetchconfig(this.nodeinfo.nodeuid)
                for (var config in nodeconfigs) {
                    var label = nodeconfigs[config].label
                    if (nodeconfigs[config].value == nodeconfigs[config].availablevalue[1]) {
                        this.newconfig[label] = true
                    } else {
                        this.newconfig[label] = false
                    }
                }
                return nodeconfigs
            },
            data: async function () {
                this.moduleroom = this.nodeinfo.roomname
                this.getrooms()
                this.typelist = tools.typelist
                this.nodetype = this.nodeinfo.type

            }
        }
        ,
        watch: {
            curtainlvl: function (curtainlvl) {
                this.lvl = this.getcurtainlvl(curtainlvl.value)
            }
        },
        methods: {
            setcurtain(value) {
            },
            getcurtainlvl(value) {
                var lvl
                switch (true) {
                    case value > this.matchinglvl[25]:
                        lvl = 0
                        break
                    case value > this.matchinglvl[50]:
                        lvl = 25
                        break
                    case value > this.matchinglvl[75]:
                        lvl = 50
                        break
                    case value > this.matchinglvl[100]:
                        lvl = 75
                        break
                    default:
                        lvl = 100
                }
                return lvl
            },
            changelvl(value) {
                this.lvl = value
                this.curtainlvl.value = this.matchinglvl[value]
                if (!this.delay) {
                    this.delay = setTimeout(() => {
                        tools.senddata(this.curtainlvl, this.nodeinfo.nodeuid)
                    }, 2000)
                } else {
                    clearTimeout(this.delay)
                    this.delay = setTimeout(() => {
                        tools.senddata(this.curtainlvl, this.nodeinfo.nodeuid)
                    }, 2000)
                }
                
            },
            async savenodeconfig() {
                await tools.sendconfig(this.configs, this.nodeinfo.nodeuid)
                this.$emit('newconfig', this.nodeinfo.nodeuid)
            },
            async savenode() {
                await tools.setnoderoom(this.nodeinfo.nodeuid , this.moduleroom)
                await tools.setnodetype(this.nodeinfo.nodeuid , this.nodetype)
                this.$emit('editmetadata', this.nodeinfo.nodeuid)
            },
            async getrooms(){
                let list = await tools.getroom()
                this.roomlist = list 
            },
            
            
        },
        components: {
            configeditor,
        },
    }

</script>

<style scoped>
    .nodedetails {
        width: 100%;
    }
    .md-content {
        display: flex;
        justify-content: space-around;
    }

    #curtainposition {
        display: flex;
        min-width: 80%;
    }
    output#value {
        align-self: center;
    }

</style>