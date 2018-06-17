import * as tf from '@tensorflow/tfjs'

class Agent {
  constructor (game, app, player, agent_name) {
    this.agent_name = agent_name
    this.player = player
    this.player.agent = this
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
    model.add(tf.layers.dense({units: 4, inputShape: [5]}))
    model.add(tf.layers.dense({units: 512, inputShape: [5]}))
    model.add(tf.layers.dense({units: 256, inputShape: [512]}))
    model.add(tf.layers.dense({units: 1, inputShape: [256]}))
    const optimizer = tf.train.adam(0.001)
    model.compile({
      optimizer: optimizer,
      loss: tf.losses.meanSquaredError
    })
    console.log(this.targets, this.lables)
    const xs = tf.tensor2d(this.targets, [this.targets.length, 5])
    const ys = tf.tensor1d(this.lables)
    console.log('Start training')
    async function train () {
      for (let i = 0; i < 100; i++) {
        const result = await model.fit(xs, ys)
        console.log(`${i + 1}/100, Loss: ${result.history.loss[0]}`)
      }
    }
    train().then(() => {
      this.model = model
      const saveResults = this.model.save(`indexeddb://${this.agent_name}_model`)
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
    if (this.target.length !== 4) return
    if (!this.label) return
    this.target.push(1)
    console.log(this.target)
    this.targets.push(this.target)
    this.lables.push(this.label)
    this.storeData()
    this.clearState()
    // this.game.ball.reset()
  }
  pickY (procent) {
    const y = (this.game.app.renderer.height * (procent * 100)) / 100
    this.player.calcVelocity(y)
  }
  async tick () {
    if (this.target.length < 4) {
      this.target.push(this.game.ball.object.x)
      this.target.push(this.game.ball.object.y)
      return
    } else if (this.predictionMode === 'model') {
      this.target.shift()
      this.target.shift()
      this.target.push(this.game.ball.object.x)
      this.target.push(this.game.ball.object.y)
    }
    if (this.predictionMode === 'model') {
      let target = JSON.parse(JSON.stringify(this.target))
      target.push(1)
      if (target.length === 3) return
      const pr = await this.model.predict(tf.tensor2d(target, [1, 5]))
      const data = await pr.data()
      this.label = Math.abs(data[0])
      console.log(`(${this.agent_name}) Model prediction: ${this.label}`)
      this.pickY(this.label)
    } else {
      this.label = Math.random()
      console.log(`(${this.agent_name}) Random prediction: ${this.label}`)
      this.pickY(this.label)
      return
    }
  }
}

export default Agent
