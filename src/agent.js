import * as tf from '@tensorflow/tfjs'

function randomInteger (min, max) {
  let rand = min - 0.5 + Math.random() * (max - min + 1)
  rand = Math.round(rand)
  if (rand === 0) return randomInteger(min, max)
  return rand
}

class Agent {
  constructor (game, app, player, agent_name) {
    this.agent_name = agent_name
    this.player = player
    this.player.agent = this
    this.targetCoordsLength = 4
    this.trainLoss = 9999
    this.randomTimeout = 20
    this.modelTimeout = 30
    this.app = app
    this.game = game
    this.targets = []
    this.lables = []
    this.target = []
    this.predictionMode = 'random'
    this.tryLoadModel()
    this.tryRestoreData()
    this.label = null
  }
  async tryLoadModel () {
    const loadedModel = await tf.loadModel(`indexeddb://${this.agent_name}_model`)
    this.model = loadedModel
  }
  trainData () {
    const model = tf.sequential()
    model.add(tf.layers.dense({units: this.targetCoordsLength, inputShape: [this.targetCoordsLength]}))
    model.add(tf.layers.dense({units: 64, inputShape: [this.targetCoordsLength]}))
    model.add(tf.layers.dense({units: 256, inputShape: [64]}))
    model.add(tf.layers.dense({units: 1024, inputShape: [256]}))
    model.add(tf.layers.dense({units: 1, inputShape: [1024]}))
    const optimizer = tf.train.adam(0.001)
    model.compile({
      optimizer: optimizer,
      loss: tf.losses.meanSquaredError
    })
    console.log(this.targets, this.lables)
    const xs = tf.tensor2d(this.targets, [this.targets.length, this.targetCoordsLength])
    const ys = tf.tensor1d(this.lables)
    console.log('Start training')
    async function train () {
      let loss = 9999
      for (let i = 0; i < 200; i++) {
        const result = await model.fit(xs, ys)
        console.log(`${i + 1}/200, Loss: ${result.history.loss[0]}`)
        loss = result.history.loss[0]
      }
      return loss
    }
    train().then((loss) => {
      this.model = model
      this.model.save(`indexeddb://${this.agent_name}_model`)
      this.trainLoss = loss
    })
  }
  tryRestoreData () {
    const lables = window.localStorage.getItem(`${this.agent_name}_lables`)
    if (lables) this.lables = JSON.parse(lables)
    const targets = window.localStorage.getItem(`${this.agent_name}_targets`)
    if (targets) this.targets = JSON.parse(targets)
  }
  storeData () {
    window.localStorage.setItem(`${this.agent_name}_lables`, JSON.stringify(this.lables))
    window.localStorage.setItem(`${this.agent_name}_targets`, JSON.stringify(this.targets))
  }
  resetData () {
    this.targets = []
    this.lables = []
    window.localStorage.setItem(`${this.agent_name}_lables`, JSON.stringify([]))
    window.localStorage.setItem(`${this.agent_name}_targets`, JSON.stringify([]))
    this.storeData()
  }
  clearState () {
    this.target = []
    this.label = null
  }
  onLose () {
    this.clearState()
    this.game.ball.reset()
  }
  onWin () {
    if (this.target.length !== this.targetCoordsLength) return
    if (!this.label) return
    if (this.predictionMode !== 'model') {
      this.target.map((item) => Math.round(item))
      this.targets.push(this.target)
      const label = ((this.player.object.y * 100) / this.game.app.renderer.height) / 100
      this.lables.push(Math.ceil((label) * 100) / 100)
    }
    this.storeData()
    this.clearState()
    // this.game.ball.reset()
  }
  userPick (y) {
    if (this.predictionMode === 'user') {
      this.label = ((y * 100) / this.game.app.renderer.height) / 100
      this.player.calcVelocity(y)
    }
  }
  pickY (procent) {
    const y = (this.game.app.renderer.height * (procent * 100)) / 100
    this.player.calcVelocity(y)
  }
  async tick () {
    if (this.target.length < this.targetCoordsLength) {
      this.target.push(this.game.ball.object.x)
      this.target.push(this.game.ball.object.y)
      return this.randomTimeout
    }
    if (this.predictionMode === 'model') {
      this.target.shift()
      this.target.shift()
      this.target.push(this.game.ball.object.x)
      this.target.push(this.game.ball.object.y)
    }
    if (this.predictionMode === 'user') return this.modelTimeout
    if (this.predictionMode === 'model') {
      let target = JSON.parse(JSON.stringify(this.target))
      if (target.length < this.targetCoordsLength) return this.modelTimeout
      const pr = await this.model.predict(tf.tensor2d(target, [1, this.targetCoordsLength]))
      const data = await pr.data()
      this.label = Math.abs(data[0])
      console.log(`(${this.agent_name}) Model prediction: ${this.label}`)
      this.pickY(this.label)
    } else {
      const y = randomInteger(1, this.game.app.renderer.height)
      this.label = ((y * 100) / this.game.app.renderer.height) / 100
      console.log(`(${this.agent_name}) Random prediction: ${this.label}`)
      this.pickY(this.label)
      return this.randomTimeout
    }
  }
}

export default Agent
