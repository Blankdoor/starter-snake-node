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
function tailDirection(snakeBody) {
  //console.log('we made it to the tail direction function')
  //function calculates the direction a tail is pointing in (opposit of head direction)
  var direction  //declaration
  var tail = snakeBody.length -1
  direction = 'up'//fall though case & turn 0 case
      
  if(snakeBody[tail].x < snakeBody[tail-1].x  ){ //tail points left
    direction = 'left'
  }
  if(snakeBody[tail].x > snakeBody[tail-1].x ){//tail points right
    direction = 'right'
  }
  if(snakeBody[tail].y < snakeBody[tail-1].y ){//tail points up
    direction = 'up'
  }
  if(snakeBody[tail].y > snakeBody[tail-1].y ){//tail points down
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

function checkCollison(snakeBody, move, gameInfo){
  var x;
  var y;
  x = snakeBody[0].x
  y = snakeBody[0].y

  console.log('snake' , snakeBody[0])

  if(move === 'left'){
    x = x -1
  }
  if(move === 'right'){
    x = x + 1
  }
  if(move === 'up'){
    y = y - 1
  }
  if(move === 'down'){
    y = y + 1
  }
  console.log('x =' , x, 'y=', y)
  var j;
  var i;
  var k;
  var xproblem = 'false'
  var yproblem = 'false'
  var collison = 'false'

  for (j=0; j < gameInfo.snakes.length; j++) { // iterate though all the alive snakes array including me
    console.log('check collisona against ', gameInfo.snakes[j].id)

    for (i=0; i < gameInfo.snakes[j].body.length; i++) { // for the length of each alive snake

      if(gameInfo.snakes[j].body[i].x === x){
        xproblem = 'true'

        for (k=0; k < gameInfo.snakes[j].body.length; k++){

          if(gameInfo.snakes[j].body[i].y === y){
            yproblem = 'true'
          }
        }

      }        
    } 
  }

  if(yproblem === 'true' && xproblem === 'true'){
    collison = 'true'
    console.log('there will be a collison')
  }

return collison
}

function wallAvoidance(snakeBody,gameInfo){
  var snakeMove
  //snakeMove = snakeDirection(snakeBody)  //Fall though case

  //if the snake is at the top wall and going up, move left or right
  if(snakeBody[0].y===0 && snakeDirection(snakeBody)==='up'){
    if(snakeBody[0].x > (gameInfo.boardWidth/2)){      
      snakeMove = 'left'
      if(checkCollison(snakeBody, snakeMove, gameInfo) === 'true'){
        snakeMove = 'right'
      }
    } else {     
      snakeMove = 'right'
      if(checkCollison(snakeBody, snakeMove, gameInfo) === 'true'){
        snakeMove = 'left'
      }
    }
  }


  //if the snake is at the bottom wall and going down, move left or right
  if(snakeBody[0].y===(gameInfo.boardHeight-1) && snakeDirection(snakeBody)==='down'){
    if(snakeBody[0].x > (gameInfo.boardWidth/2)){      
      snakeMove = 'left'
      if(checkCollison(snakeBody, snakeMove, gameInfo) === 'true'){
        snakeMove = 'right'
      }
    } else {      
      snakeMove = 'right'
      if(checkCollison(snakeBody, snakeMove, gameInfo) === 'true'){
        snakeMove = 'left'
      }
    }
  }
  //if the snake is at the right wall and going right, move up or down
  if(snakeBody[0].x===(gameInfo.boardWidth-1) && snakeDirection(snakeBody)==='right'){
    if(snakeBody[0].y > (gameInfo.boardHeight/2)){
      snakeMove = 'up'
      if(checkCollison(snakeBody, snakeMove, gameInfo) === 'true'){
        snakeMove = 'down'
      }
    } else {
      snakeMove = 'down'
      if(checkCollison(snakeBody, snakeMove, gameInfo) === 'true'){
        snakeMove = 'up'
      }
    }
  }
  //if the snake is at the left wall and going left, move up or down
  if(snakeBody[0].x===0 && snakeDirection(snakeBody)==='left'){
    if(snakeBody[0].y > (gameInfo.boardHeight/2)){
      snakeMove = 'up'
      if(checkCollison(snakeBody, snakeMove, gameInfo) === 'true'){
        snakeMove = 'down'
      }
    } else {
      snakeMove = 'down'
      if(checkCollison(snakeBody, snakeMove, gameInfo) === 'true'){
        snakeMove = 'up'
      }
    }
  }
  return snakeMove
}

function leaveCorner(snakeBody, gameInfo){
  var move
  if(snakeBody[0].x === 0 && snakeBody[0].y === 0){
    console.log('snake is in the top left corner')
    if(snakeDirection(snakeBody) === 'left'){
      move = 'down'
    } else if(snakeDirection(snakeBody) === 'up'){
      move = 'right'
    }
  }
  if(snakeBody[0].x === 0 && snakeBody[0].y === (gameInfo.boardHeight-1)){
    console.log('snake is in the bottom left corner')
    if(snakeDirection(snakeBody) === 'left'){
      move = 'up'
    } else if(snakeDirection(snakeBody) === 'down'){
      move = 'right'
    }
  }
  if(snakeBody[0].x === (gameInfo.boardWidth-1) && snakeBody[0].y === (gameInfo.boardHeight-1)){
    console.log('snake is in the bottom right corner')
    if(snakeDirection(snakeBody) === 'right'){
      move = 'up'
    } else if(snakeDirection(snakeBody) === 'down'){
      move = 'left'
    }
  }
  if(snakeBody[0].x === (gameInfo.boardWidth-1) && snakeBody[0].y === 0){
    console.log('snake is in the top right corner')
    if(snakeDirection(snakeBody) === 'right'){
      move = 'down'
    } else if(snakeDirection(snakeBody) === 'up'){
      move = 'left'
    }
  }

  console.log('recomend corner move', move)
  return move
}

function findNearstWall(snakeBody,gameInfo){
  var snakeMove
  //snakeMove = 'left' //fall though case
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

  //If the snake starts on the wall do something special
  //if the snake starts at the top wall
  if(snakeBody[0].y===0){
    snakeMove = 'down'
  }
  //if the snake is at the bottom wall and going down, move left or right
  if(snakeBody[0].y===(gameInfo.boardHeight-1)){
    snakemove = 'up'
  }
  //if the snake is at the right wall and going right, move up or down
  if(snakeBody[0].x===(gameInfo.boardWidth-1)){
    snakemove = 'left'
  }
  
  //if the snake is at the left wall and going left, move up or down
  if(snakeBody[0].x===0){
    snakemove = 'right'
  }

  return snakeMove
}

function findFoodPath(snakeBody, gameInfo, element){
//  console.log("generating food path")
  var grid = new PF.Grid(gameInfo.boardWidth, gameInfo.boardHeight); 
  
  var j;
  var i;
  for (j=0; j < gameInfo.snakes.length; j++) { // iterate though all the alive snakes including me
    //console.log('alive snake ', j, 'length ',gameInfo.snakes[j].body.length)
    for (i=0; i < gameInfo.snakes[j].body.length; i++) { // for each alive snake
        grid.setWalkableAt(gameInfo.snakes[j].body[i].x, gameInfo.snakes[j].body[i].y, false);
    }
  }
// console.log('generated food path grid')
  var finder = new PF.AStarFinder();
  var path = finder.findPath(snakeBody[0].x, snakeBody[0].y, gameInfo.foodLocations[element].x, gameInfo.foodLocations[element].y, grid);
//  console.log('path lenght ', path.length)
// console.log('path ', path)
  return path
}

function tailfinder(snakeBody, gameInfo, taillocation){
  console.log('tail finder path')
  var grid = new PF.Grid(gameInfo.boardWidth, gameInfo.boardHeight); 
  
  var j;
  var i;
  for (j=0; j < gameInfo.snakes.length; j++) { // iterate though all the alive snakes including me
    //console.log('alive snake ', j, 'length ',gameInfo.snakes[j].body.length)
    for (i=0; i < gameInfo.snakes[j].body.length; i++) { // for each alive snake
        grid.setWalkableAt(gameInfo.snakes[j].body[i].x, gameInfo.snakes[j].body[i].y, false);
    }
  }
// console.log('generated food path grid')
  var finder = new PF.AStarFinder();
  var path = finder.findPath(snakeBody[0].x, snakeBody[0].y, taillocation.x, taillocation.y, grid);
  console.log('tailpath lenght ', path.length)
// console.log('path ', path)
  return path
}

function getFakeTail(snakeBody){
  let faketail = {x: 0, y:0}
  //console.log ('starting faketail', faketail)
  var tail = snakeBody.length -1

  faketail.x = snakeBody[tail].x
  faketail.y = snakeBody[tail].y
  //console.log (' snakebodytailx', snakeBody[tail].x)
  //console.log (' init faketailx', faketail.x)
  //console.log (' init faketail', faketail)

  if(tailDirection(snakeBody) === 'up'){
    faketail.y = snakeBody[tail].y -1
  }
  if(tailDirection(snakeBody) === 'down'){
    faketail.y = snakeBody[tail].y +1
    }
  if(tailDirection(snakeBody) === 'right'){
    console.log('we should get here')
    faketail.x = snakeBody[tail].x +1
  }
  if(tailDirection(snakeBody) === 'left'){
    faketail.x = snakeBody[tail].x -1
  }
  //console.log('made a fake tail')
  if(faketail.x<0){ // catch some stupid wall cases probably needs more thought but hey its 2am
    faketail.x = 0
  }
  if(faketail.y<0){
    faketail.y = 0
  }
  return faketail
}


//~~~~~~~~~~~~~~End of fun funtion definitions

//############################################### post move #############################
// Handle POST request to '/move'
//Boards will be either small (7x7), medium (11x11) or large (19x19)
//A minimum of 2 snakes can be put on a board.
//A maximum of 8 snakes can be put on a board.

app.post('/move', (request, response) => {
  // NOTE: Do something here to generate your move
  console.log('  ')
  console.log('  ')
  
  var snakeMove
  var healthSafetyFactor = 95
 
  let snake = {
    health: request.body.you.health, //Health <=100
    body: request.body.you.body, // array of snake positions
    length: request.body.you.body.length,   //find size of snake... important for later.
    id: request.body.you.id
  }

  let gameInfo = {
    turn: request.body.turn, // turn #
    boardHeight: request.body.board.height,
    boardWidth: request.body.board.width,
    foodLocations: request.body.board.food,
    snakes: request.body.board.snakes
  }

  snakeMove = snakeDirection(snake.body) // just keep going the direction you were going before

  //~~~~~~~~~~~~~~~~~~~~~~~~Prepare for food path finding~~~~~~~~~~~~~~~~~~
  var foodpath = []; //create empty array
  var q;
  var nearFoodPath;
  if(gameInfo.foodLocations.length !== 0){ // if there is food on the board
    for (q=0; q < gameInfo.foodLocations.length; q++) { // iterate though the food array and find the nearst food location
      foodpath[q] = findFoodPath(snake.body, gameInfo,q)
      if(q===0){
        nearFoodPath = foodpath[q]
      }
      if(q > 0){
        if(foodpath[q].length < nearFoodPath.length){
          nearFoodPath = foodpath[q]
        }
      }
    }
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~END Prep for food path finding

  //Print out some game info to the console
  console.log('Turn: ',gameInfo.turn, '  ............. MOVE Calculations............')
  //console.log('Nearst Food Path ', nearFoodPath, 'Distance ', nearFoodPath.length)
  //console.log('MySnake ',snake.id, 'snake array  ', snake.body, 'snake Length  ', snake.length)
  //console.log('Number of enemies ', gameInfo.snakes.length -1)

  console.log(wallCollisonWarning(snake.body,gameInfo))
  console.log('Current Snake Direction...', snakeDirection(snake.body))
  console.log('Snake Health...', snake.health)
  //console.log('Board Size...', gameInfo.boardHeight, ' x ', gameInfo.boardWidth)
  
  //~~~~~~~~~~~~~SNAKE LOGIC~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~TURN ZERO~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  if(gameInfo.turn === 0){
    //snakeMove = findNearstWall(snake.body,gameInfo) // go to a space that you can protect!
    if(snake.body[0].y !== 0){
      snakeMove = 'up'
    } else if(snake.body[0].y ===0){
      snakeMove = 'down'
    }
  }
  //~~~~~~~~~~~~~~~~~~~~~~~END TURN ZERO~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~TURN One~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  if(gameInfo.turn === 1){
    if(snake.body[0].x !== 0){
      snakeMove = 'left'
    } else if(snake.body[0].x ===0){
      snakeMove = 'right'
    }
  }
  //~~~~~~~~~~~~~~~~~~~~~~~END TURN ONE~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~TURN TWO~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  if(gameInfo.turn === 2){
    snakeMove = snakeDirection(snake.body)
  }
  //~~~~~~~~~~~~~~~~~~~~~~~END TURN TWO~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  if(gameInfo.turn>20){
    healthSafetyFactor = 50
  }

  if(gameInfo.turn > 2 && snake.health > healthSafetyFactor){
    //console.log('try to run tail finder')
    //console.log('tail finding function', getFakeTail(snake.body))
    var tailpath = [];
    var thing;
    tailpath = tailfinder(snake.body, gameInfo, getFakeTail(snake.body))
    console.log('tailpath', tailpath)
    if(tailpath.length !== 0 && tailpath.length !== 1){
      thing = tailpath[1]
      //console.log('thing', thing)
      if(thing[0]>snake.body[0].x){ //new tail is x direction
        //console.log('snake should chose to move right here')
        snakeMove = 'right'
      }
      if(thing[0]<snake.body[0].x){ //new tail is -x direction
        snakeMove = 'left'
      }
      if(thing[1]<snake.body[0].y){ //new tail is y direction
        snakeMove = 'up'
      }
      if(thing[1]>snake.body[0].y){ //new tail is -y direction
        snakeMove = 'down'
      }
    } else if(tailpath.length === 0 || tailpath.length === 1){
      
      snakeMove = snakeDirection(snake.body)
      console.log('no valid tailpath snake will just move in the direction he was going , ',snakeMove)

      var lies = snakeMove
      var temp4 = checkCollison(snake.body, lies, gameInfo)
      console.log('temp4', temp4)
      
      if(temp4 === 'true'){
        //find another path
        console.log('no valid tailpath snake will colide on this course')
        var temp = 'right'
        var loop;
        var options = ['left','right','up','down'];
        //console.log('options0', options[0])

        for(loop = 0; loop < 4; loop ++){
          console.log('options loop', options[loop])
          var temp6 = checkCollison(snake.body, options[loop], gameInfo)
          console.log('for the direciton of ',options[loop], 'snake thinks that collison is',temp6)
          if(temp6 === 'false'){
            temp = options[loop]
            console.log('go ', temp)
          }  
        }

        snakeMove = temp
      }
      
    }

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~START FOOD SEARCH~~~~~~~~~~~~~~~~~~~
  if(snake.health < healthSafetyFactor){ //go find nearest food
    console.log('SNAKE IS HUNGRY!!!!')
    if(gameInfo.foodLocations.length !== 0){ // if there is food one the board
      console.log('foodpath is ', nearFoodPath)
      var next = nearFoodPath[1] // find out what direction the path should be
      console.log('Foodpath 1 step away ', nearFoodPath[1])
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
    } else if (gameInfo.foodLocations.length === 0){
      console.log('no way to get to food, no snake move set here')
    } 
  }
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~END FOOD SEARCH ~~~~~~~~~~~~~~~~~~~~


  
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~START Wall avoidance~~~~~~~~~~~~~~~~
  //if the snake is going to wall crash, do something
  if((snake.body[0].x ===0 && snakeDirection(snake.body) === 'left') || 
     (snake.body[0].y ===0 && snakeDirection(snake.body) === 'up') ||
     (snake.body[0].y === (gameInfo.boardHeight-1) && snakeDirection(snake.body) === 'down') ||
     (snake.body[0].x ===(gameInfo.boardWidth-1) && snakeDirection(snake.body) === 'right')){
    console.log('wall avoidance')
    snakeMove = wallAvoidance(snake.body,gameInfo) 
    }
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~END wall Avoidance~~~~~~~~~~~~~~~~~~~
  
  //~~~~~~~~~~~~~~~~~~~~~~~~~~Snakes in a corner~~~~~~~~~~~~~~~~~~~~~~
  // When the snake is in one of the 4 corners he has only 1 move available so take it
  if((snake.body[0].x === 0 && snake.body[0].y === 0) || 
     (snake.body[0].x === 0 && snake.body[0].y === (gameInfo.boardHeight-1))|| 
     (snake.body[0].x === (gameInfo.boardWidth-1) && snake.body[0].y === (gameInfo.boardHeight-1))|| 
     (snake.body[0].x === (gameInfo.boardWidth-1) && snake.body[0].y === 0)){
    console.log('made it to leave corner')
    snakeMove = leaveCorner(snake.body, gameInfo)
  }
  //~~~~~~~~~~~~~~~~~~~~~~~~~~END Snake in a corner~~~~~~~~~~~~~~~~~~~




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
