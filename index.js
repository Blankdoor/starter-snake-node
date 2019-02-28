const bodyParser = require('body-parser')
const express = require('express')
const logger = require('morgan')
const app = express()
const {
  fallbackHandler,
  notFoundHandler,
  genericErrorHandler,
  poweredByHandler
} = require('./handlers.js')
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
var PF = require('pathfinding')  //import pathfinder
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// For deployment to Heroku, the port needs to be set using ENV, so
// we check for the port number in process.env
app.set('port', (process.env.PORT || 9001))
app.enable('verbose errors')
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(poweredByHandler)

// --- SNAKE LOGIC GOES BELOW THIS LINE ---
// Handle POST request to '/start'
app.post('/start', (request, response) => {
  // NOTE: Do something here to start the game
  const data = {
    color: '#2F4F4F',
    headType: 'silly',
    tailType: 'regular'
  }
  return response.json(data)
})

//~~~~~~~~~~~~~~~FUNCTIONS FUNCTIONS FUNCTIONS so much fun fun functions

function wallCollisonWarning(snakeBody,gameInfo) {
  //function give a console log warning if the snake is going to crash in 1 turn not a very good or useful function
  var warning = "No Wall Collison This Turn...yay"
  if (snakeBody[0].y === 0){
    warning ='~~~~~~~~~~Warning SNAKE at Top Wall ~~~~~~~~~~~'
  }
  if (snakeBody[0].x === 0){
    warning ='~~~~~~~~~~Warning SNAKE at Left Wall ~~~~~~~~~~~'
  }
  if (snakeBody[0].x === (gameInfo.boardWidth -1)){
    warning ='~~~~~~~~~~Warning SNAKE at Right Wall ~~~~~~~~~~~'
  }
  if (snakeBody[0].y === (gameInfo.boardHight -1)){
    warning ='~~~~~~~~~~Warning SNAKE at Bottom Wall ~~~~~~~~~~~'
  }
  return warning
}

function snakeDirection(snakeBody) {
  //function calculates the direction a snake object is going in 
  var direction  //declaration
  direction = 'up'//fall though case & turn 0 case
    
  if(snakeBody[0].x < snakeBody[1].x  ){//snake going left
    direction = 'left'
  }
  if(snakeBody[0].x > snakeBody[1].x ){//snake going right
    direction = 'right'
  }
  if(snakeBody[0].y < snakeBody[1].y ){//snake going up
    direction = 'up'
  }
  if(snakeBody[0].y > snakeBody[1].y ){//snake going down
    direction = 'down'
  }
    
  return direction
}

function isSnakeOnWallx(snakeBody,gameInfo){
  if (snakeBody[0].x===0 || snakeBody[0].x===(gameInfo.boardWidth -1)){
    return 'true'
  }
  return 'false'
}
function isSnakeOnWally(snakeBody,gameInfo){
  if (snakeBody[0].y===0 || snakeBody[0].y===(gameInfo.boardHeight -1)){
    return 'true'
  }
  return 'false'
}

function wallAvoidance(snakeBody,gameInfo){
  var snakeMove
  snakeMove = snakeDirection(snakeBody)  //Fall though case

  //if the snake is at the top wall and going up, move left or right
  if(snakeBody[0].y===0 && snakeDirection(snakeBody)==='up'){
    if(snakeBody[0].x > (gameInfo.boardWidth/2)){      
      snakeMove = 'left'
    } else {     
      snakeMove = 'right'
    }
  }
  //if the snake is at the bottom wall and going down, move left or right
  if(snakeBody[0].y===(gameInfo.boardHeight-1) && snakeDirection(snakeBody)==='down'){
    if(snakeBody[0].x > (gameInfo.boardWidth/2)){      
      snakeMove = 'left'
    } else {      
      snakeMove = 'right'
    }
  }
  //if the snake is at the right wall and going right, move up or down
  if(snakeBody[0].x===(gameInfo.boardWidth-1) && snakeDirection(snakeBody)==='right'){
    if(snakeBody[0].y > (gameInfo.boardHeight/2)){
      snakeMove = 'up'
    } else {
      snakeMove = 'down'
    }
  }
  //if the snake is at the left wall and going left, move up or down
  if(snakeBody[0].x===0 && snakeDirection(snakeBody)==='left'){
    if(snakeBody[0].y > (gameInfo.boardHeight/2)){
      snakeMove = 'up'
    } else {
      snakeMove = 'down'
    }
  }
  return snakeMove
}
/*function moveToFood(snakeBody, foodArray){
  var snakeMove
  console.log(foodArray)
  //calculate nearest food location from array and from snake head
  //move towards food in a way that wont break the snake, if direction left and food up and right, move up first
  return snakeMove
}
*/

function findNearstWall(snakeBody,gameInfo){
  var snakeMove
  snakeMove = 'left' //fall though case
  if(snakeBody[0].x < (gameInfo.boardWidth-1)/2){ //left side
    if(snakeBody[0].y < (gameInfo.boardHeight-1)/2){ //top
      snakeMove = 'left'
      console.log('top left')
    } else if (snakeBody[0].y > (gameInfo.boardHeight-1)/2){ //bottom
    snakeMove = 'down'
      console.log('bottom left')
    } else {
      snakeMove = 'left'
      console.log('mid left')
    }
  } else if(snakeBody[0].x > (gameInfo.boardWidth-1)/2){ //right side
    if(snakeBody[0].y < (gameInfo.boardHeight-1)/2){ //top
      snakeMove = 'right'
      console.log('top right')
    } else if (snakeBody[0].y > (gameInfo.boardHeight-1)/2){ //bottom
      snakeMove = 'down'
      console.log('bottom right')
    } else {
      snakeMove = 'right'
      console.log('mid right')
    }
  } else if(snakeBody[0].x === (gameInfo.boardWidth-1)/2){ //middle
    if(snakeBody[0].y < (gameInfo.boardHeight-1)/2){ //top
      snakeMove = 'up'
      console.log('top mid')
    } else if (snakeBody[0].y > (gameInfo.boardHeight-1)/2){ //bottom
      snakeMove = 'down'
      console.log('bottom mid')
    } else { //right in the middle of the board
      snakeMove = 'up'
      console.log('mid mid')
    }
  }

  return snakeMove
}

//~~~~~~~~~~~~~~End of fun funtion definitions

//############################################### post move #############################
// Handle POST request to '/move'
//Boards will be either small (7x7), medium (11x11) or large (19x19)
//A minimum of 2 snakes can be put on a board.
//A maximum of 8 snakes can be put on a board.

app.post('/move', (request, response) => {
  // NOTE: Do something here to generate your move
  console.log("S")
  
  var snakeMove
 
  let snake = {
    health: request.body.you.health, //Health <=100
    body: request.body.you.body, // array of snake positions
    length: request.body.you.body.length   //find size of snake... important for later.
  }

  let gameInfo = {
    turn: request.body.turn, // turn #
    boardHeight: request.body.board.height,
    boardWidth: request.body.board.width,
    foodLocations: request.body.board.food
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~Prepare for path finding~~~~~~~~~~~~~~~~~~
  var grid = new PF.Grid(gameInfo.boardWidth, gameInfo.boardHeight); 
  
  var i;
  for (i=0; i < snake.body.length; i++) {
    grid.setWalkableAt(snake.body[i].x, snake.body[i].y, false);
  }
  var finder = new PF.AStarFinder();
  var foodpath = finder.findPath(snake.body[0].x, snake.body[0].y, gameInfo.foodLocations[0].x, gameInfo.foodLocations[0].y, grid);
//~~~~~~~~~~~~~~~~~~~~~~~~END Prep for path finding



  //Print out some game info to the console
  console.log('Turn: ',gameInfo.turn, '.............Begining MOVE Calculations............')
  console.log(wallCollisonWarning(snake.body,gameInfo))
  console.log('Current Snake Direction...', snakeDirection(snake.body))
  console.log('Snake Health...', snake.health)
  console.log('Snake Length...', snake.length)
  console.log('Board Size...', gameInfo.boardHeight, ' x ', gameInfo.boardWidth)
  

  //******/snakeMove = snakeDirection(snake.body,gameInfo) //sets snakemove to something

  //~~~~~~~~~~~~~SNAKE LOGIC~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~TURN ZERO~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  if(gameInfo.turn === 0){
    snakeMove = findNearstWall(snake.body,gameInfo) // go to a space that you can protect!
  }
  //~~~~~~~~~~~~~~~~~~~~~~~END TURN ZERO~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~START FOOD SEARCH~~~~~~~~~~~~~~~~~~~
  if(snake.health < 101){ //go find nearest food
    console.log('SNAKE IS HUNGRY!!!!')
    var next = foodpath[1] // find out what direction the path should be
    
    if(next[0] !== snake.body[0].x){
      console.log(next[0], 'xpath')
      if(next[0] > snake.body[0].x){
        snakeMove = 'right'
      } else if (next[0] < snake.body[0].x){
        snakeMove = 'left'
      }
    } else if (next[1] !== snake.body[0].y){
      console.log(next[1], 'ypath')
        if(next[1] > snake.body[0].y){
        snakeMove = 'down'
        } else if (next[1] < snake.body[0].y){
        snakeMove = 'up'
        }
      }
  //snakeMove = moveToFood(snake.body,gameInfo.foodLocations)
  }
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~END FOOD SEARCH ~~~~~~~~~~~~~~~~~~~~

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~START Wall avoidance~~~~~~~~~~~~~~~~
  //if the snake is going to wall crash, do something
  //if(isSnakeOnWallx(snake.body,gameInfo)==='true' || isSnakeOnWally(snake.body,gameInfo)==='true'){
  //  snakeMove = wallAvoidance(snake.body,gameInfo)   
  //}
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~END wall Avoidance~~~~~~~~~~~~~~~~~~~
  
  



  //Log messages to console window
  console.log('Snake choses to move...', snakeMove)
  // Response data
  
  const data = {
    move: snakeMove, // one of: ['up','down','left','right']
  }

  return response.json(data)
})

//############################################   end post move ########################
app.post('/end', (request, response) => {
  console.log('Snake Died.....so sad')
  // NOTE: Any cleanup when a game is complete.
  return response.json({})
})

app.post('/ping', (request, response) => {
  // Used for checking if this snake is still alive.
  return response.json({});
})

// --- SNAKE LOGIC GOES ABOVE THIS LINE ---

app.use('*', fallbackHandler)
app.use(notFoundHandler)
app.use(genericErrorHandler)

app.listen(app.get('port'), () => {
  console.log('Server listening on port %s', app.get('port'))
})
