import * as PIXI from 'pixi.js'
import * as Bump from 'bump.js'

function randomInteger (min, max) {
  let rand = min - 0.5 + Math.random() * (max - min + 1)
  rand = Math.round(rand)
  if (rand === 0) return randomInteger(min, max)
  return rand
}

class Ball {
  constructor (game) {
    this.game = game
    this.app = this.game.app
    this.graphics = new PIXI.Graphics()
    this.x = this.app.renderer.width / 2
    this.y = this.app.renderer.height / 2
    this.maxVectorY = 20
    this.radius = 10
    this.velocityX = 10
    this.velocityY = 10
    this.vectorX = this.velocityX
    this.vectorY = this.velocityY
    this.draw()
    this.app.ticker.add(() => this.tick())
    this.reset()
  }
  draw () {
    this.graphics.beginFill(0x9999999)
    this.graphics.drawCircle(0, 0, this.radius)
    this.graphics.endFill()
    this.object = new PIXI.Sprite(this.graphics.generateCanvasTexture())
    this.object.x = this.x
    this.object.y = this.y
    this.app.stage.addChild(this.object)
  }
  updateVectors (vX, vY) {
    if (vX) this.vectorX = vX
    if (vY) this.vectorY = vY
  }
  conllisionCheck () {
    const objXRight = this.object.x + (this.radius * 2)
    if (objXRight > this.app.renderer.width) {
      this.game.player_one.agent.onLose()
      this.game.player_two.agent.clearState()
    }
    if (this.object.x < 0) {
      this.game.player_two.agent.onLose()
      this.game.player_one.agent.clearState()
    }
    const objYDown = this.object.y + (this.radius * 2)
    if (objYDown > this.app.renderer.height) this.updateVectors(null, this.vectorY * -1)
    if (this.object.y < 0) this.updateVectors(null, this.vectorY * -1)
  }
  checkPlayerColision () {
    const isHit = this.game.b.rectangleCollision(this.object, this.game.player_one.object, true)
    if (isHit === 'right') {
      this.game.player_one.agent.onWin()
      this.game.player_two.agent.clearState()
      let vectY = (this.game.player_one.vectorY * 2) - this.vectorY
      if (vectY > this.maxVectorY) vectY = this.maxVectorY
      if (vectY < (this.maxVectorY * -1)) vectY = this.maxVectorY * -1
      this.object.x -= 10
      this.updateVectors(this.vectorX * -1, vectY)
    }
  }
  checkPlayerTwoColision () {
    const isHit = this.game.b.rectangleCollision(this.object, this.game.player_two.object)
    if (isHit === 'left') {
      this.game.player_two.agent.onWin()
      this.game.player_one.agent.clearState()
      let vectY = (this.game.player_two.vectorY * 2) - this.vectorY
      if (vectY > this.maxVectorY) vectY = this.maxVectorY
      if (vectY < (this.maxVectorY * -1)) vectY = this.maxVectorY * -1
      this.object.x += 10
      this.updateVectors(this.vectorX * -1, vectY)
    }
  }
  tick () {
    this.conllisionCheck()
    this.checkPlayerColision()
    this.checkPlayerTwoColision()
    this.object.x += this.vectorX
    this.object.y += this.vectorY
  }
  reset () {
    this.velocityX = randomInteger(5, 10)
    this.velocityY = randomInteger(5, 10)
    this.object.x = this.app.renderer.width / 2
    this.object.y = this.app.renderer.height / 2
    this.vectorX = this.velocityX * randomInteger(-1, 1)
    this.vectorY = this.velocityY * randomInteger(-1, 1)
  }
}

class Player {
  constructor (game, x) {
    this.x = x
    this.game = game
    this.app = game.app
    this.graphics = new PIXI.Graphics()
    this.width = 15
    this.height = 60
    this.initCoords()
    this.draw()
    this.app.ticker.add(() => this.tick())
  }
  initCoords () {
    this.y = (this.app.renderer.height / 2) - (this.height / 2)
  }
  tick () {
    this.object.y = this.game.ball.object.y - (this.height / 2)
  }
  draw () {
    this.graphics.beginFill(0x9999999)
    this.graphics.drawRect(0, 0, this.width, this.height)
    this.graphics.endFill()
    this.object = new PIXI.Sprite(this.graphics.generateCanvasTexture())
    this.object.x = this.x
    this.object.y = this.y - 10
    this.object.width = this.width
    this.object.height = this.height
    this.app.stage.addChild(this.object)
  }
}

class PlayerTwo extends Player {
  initCoords () {
    this.velocity = 5
    this.vectorY = 0
    this.y = (this.app.renderer.height / 2) - (this.height / 2)
    this.tY = null
    this.tvY = null
  }
  calcVelocity (y) {
    this.tY = y
    this.vectorY = (y - this.object.y) / this.velocity
    // this.vectorY = this.object.y < y ? this.velocity : (this.velocity * -1)
  }
  tick () {
    this.object.y += this.vectorY
    if (this.tY) {
      if (this.vectorY > 0 && this.object.y > this.tY) this.vectorY = 0
      if (this.vectorY < 0 && this.object.y < this.tY) this.vectorY = 0
    }
  }
}

class Game {
  constructor (width, height) {
    this.width = width
    this.height = height
    this.app = new PIXI.Application({width: width, height: height})
    this.b = new Bump()
    this.ball = new Ball(this)
    this.player_one = new PlayerTwo(this, this.app.renderer.width - 30)
    this.player_two = new PlayerTwo(this, 15)
  }
  initView (domElement) {
    domElement.append(this.app.renderer.view)
  }
  iterate () {
    this.app.render(this.app.stage)
  }
}

export default Game
