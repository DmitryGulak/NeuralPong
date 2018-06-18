<template lang="html">
  <div>
    <div ref="appField">
    </div>
    <el-row>
      <el-col :span="11" style="text-align: left;">
        <el-row>
          <el-col>
            <el-radio-group v-model="predictionModeTwo" @change="updatePredictionModeTwo" size="mini">
              <el-radio-button label="user">User</el-radio-button>
              <el-radio-button label="random">Random</el-radio-button>
              <el-radio-button label="model">Model</el-radio-button>
            </el-radio-group>
            <el-button @click="trainAgentTwo" size="mini" type="success">Train</el-button>
            <el-button @click="resetDataTwo" size="mini" type="danger">Reset data</el-button>
          </el-col>
        </el-row>
        <el-row>
          <el-col>
            <br>
            Train data (<span v-text="targetsTwo.length"></span>):
            <br><br>
            <div class="targets-list">
              <span v-for="(target, index) of targetsTwo" v-text="JSON.stringify(target) + ' ' + JSON.stringify(lablesTwo[index])"></span>
            </div>
          </el-col>
        </el-row>
      </el-col>
      <el-col :span="2">
        <el-button @click="resetBall" type="warning" size="mini">Reset ball</el-button>
      </el-col>
      <el-col :span="11" style="text-align: right;">
        <el-row>
          <el-col>
            <el-button @click="resetDataOne" size="mini" type="danger">Reset data</el-button>
            <el-button @click="trainAgentOne" size="mini" type="success">Train</el-button>
            <el-radio-group v-model="predictionModeOne" @change="updatePredictionModeOne" size="mini">
              <el-radio-button label="model">Model</el-radio-button>
              <el-radio-button label="random">Random</el-radio-button>
              <el-radio-button label="user">User</el-radio-button>
            </el-radio-group>
          </el-col>
        </el-row>
        <el-row>
          <el-col>
            <br>
            Train data (<span v-text="targetsOne.length"></span>):
            <br><br>
            <div class="targets-list">
              <span v-for="(target, index) of targetsOne" v-text="JSON.stringify(lablesOne[index]) + ' ' + JSON.stringify(target)"></span>
            </div>
          </el-col>
        </el-row>
      </el-col>
    </el-row>
    <br>
    Open console to see more info <br>
    Github: <a href="https://github.com/DmitryGulak/NeuralPong">https://github.com/DmitryGulak/NeuralPong</a>
    <br>
  </div>
</template>

<script>
import Game from '../game.js'
import Agent from '../agent.js'
export default {
  name: 'GameField',
  data () {
    return {
      game: null,
      targetsTwo: [],
      lablesTwo: [],
      targetsOne: [],
      lablesOne: [],
      agentTwo: null,
      agentOne: null,
      predictionModeOne: 'random',
      predictionModeTwo: 'random'
    }
  },
  methods: {
    updatePredictionModeTwo () {
      this.agentTwo.predictionMode = this.predictionModeTwo
    },
    trainAgentTwo () {
      this.agentTwo.trainData()
    },
    resetDataTwo () {
      this.agentTwo.resetData()
    },
    updatePredictionModeOne () {
      this.agentOne.predictionMode = this.predictionModeOne
    },
    trainAgentOne () {
      this.agentOne.trainData()
    },
    resetDataOne () {
      this.agentOne.resetData()
    },
    drawGame () {
      this.game.iterate()
      requestAnimationFrame(this.drawGame)
    },
    handlePlayerMove (e) {
      this.agentOne.userPick(e.clientY)
      this.agentTwo.userPick(e.clientY)
    },
    initGame () {
      this.game = new Game(900, 500)
      this.game.initView(this.$refs.appField)
      this.agentTwo = new Agent(this.game, this, this.game.player_two, 'agent_two')
      this.agentOne = new Agent(this.game, this, this.game.player_one, 'agent_one')
      this.agentLoop()
    },
    agentLoop () {
      this.agentOne.tick().then((timeout) => {
        this.targetsOne = JSON.parse(JSON.stringify(this.agentOne.targets)).reverse()
        this.lablesOne = JSON.parse(JSON.stringify(this.agentOne.lables)).reverse()
        setTimeout(() => {
          this.agentTwo.tick().then((secondTimeout) => {
            this.targetsTwo = JSON.parse(JSON.stringify(this.agentTwo.targets)).reverse()
            this.lablesTwo = JSON.parse(JSON.stringify(this.agentTwo.lables)).reverse()
            setTimeout(() => this.agentLoop(), secondTimeout)
          })
        }, timeout)
      })
    },
    resetBall () {
      this.game.ball.reset()
    }
  },
  mounted () {
    this.initGame()
    this.drawGame()
    this.$refs.appField.onmousemove = this.handlePlayerMove
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .targets-list {
    padding: 5px;
    height: 200px;
    overflow-y: scroll;
  }
  .targets-list span {
    display: block;
    width: 100;
    font-size: 11px;
    line-height: 1.5;
  }
  .panel {
    width: 200px;
  }
  h1, h2 {
    font-weight: normal;
  }
  ul {
    list-style-type: none;
    padding: 0;
  }
  li {
    display: inline-block;
    margin: 0 10px;
  }
  a {
    color: #42b983;
  }
</style>
