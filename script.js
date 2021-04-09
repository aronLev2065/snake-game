//elements
const canvas 				= document.querySelector('canvas'),
	 ctx 					= canvas.getContext('2d'),
	 scoreEl				= document.querySelectorAll('.score'),
	 recordEl				= document.querySelector('.record');
let
//snake
	tail				= [],								// list of elements of the tail
	snakeSize		 	= 20,								// width & height of the shake
	tailLength			= 100,								// length of the tail
	tailSaveZone		= 10,								// when self-collision happens, it can help xD
	headSaveZone		= 50,								// enemies can't appear behind the snake B)
//main variables
	direction 			= '',								// snake's directoion
	speedX				= 0,								// speed by X
	speedY				= 0,								// speed by Y
	headX 				= ~~(canvas.width / 2) - snakeSize,	// positionX of the head
	headY 				= ~~(canvas.height / 2) - snakeSize,// positionY of the head
	speed = baseSpeed 	= 5,								// speed of the snake movement
	cooldown			= false,							// is key in cooldown mode
	gs					= false,							// game started
//enemy
	enemies				= [],								// list of enemies
	enemySize			= 50,								// width & height of the enemies
	maxEnemy			= 5,								// maximum amount of enemies(will grow)
//apple
	apples				= [],								// list of apples
	appleSize			= 20,								// width & height of the apple
	maxApple			= 10,								// maximum amount of apples(will become less)
//helpfull
	recordBeat			= false,							// when you beat a record, it helps to play music only at once
	record 				= localStorage.getItem('record'),	// record(will reload when it is less than current score)
	score				= 0,								// score (will reload with collecting apples)
//sounds
	collisionS 			= document.getElementById('collision'),
	game_overS			= document.getElementById('game_over'),
	mainS				= document.getElementById('main'),
	took_an_appleS		= document.getElementById('took_an_apple'),
	recordS				= document.getElementById('record');


document.addEventListener('keydown', changeDirection);
let game = setInterval(loop, 1000/60);

function loop() {
	//clear canvas
	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	//main movement
	headX += speedX;
	headY += speedY;

	//teleports
	if (headX < 0) headX = canvas.width;
	if (headX > canvas.width) headX = 0;
	if (headY > canvas.height) headY = 0;
	if (headY < 0) headY = canvas.height;

	//drawing snake
	ctx.fillStyle = '#06F5C5';
	draw(tail, snakeSize);

	tail.push({x: headX, y: headY, color: ctx.fillStyle});

	//limiter (x2)
	if(tail.length > tailLength) tail.shift();
	if(tail.length > tailLength) tail.shift();

	// self collision check
	if(tail.length >= tailLength && gs){
		for(let i = tail.length - tailSaveZone; i >= 0; i--){
			if( headX < (tail[i].x + snakeSize)
				&& headX + snakeSize > tail[i].x
				&& headY < (tail[i].y + snakeSize)
				&& headY + snakeSize > tail[i].y
			){
				collisionS.play();
				speed = baseSpeed;
				tailLength = 10;

				if(score > 5) score = score - 5;
				else score = 0;

				for(let j = 0; j < tail.length; j++){
					tail[j].color = '#420303';

					if(j >= tail.length - tailLength) break
				}
			}
		}
	}

	//draw enemies
	draw(enemies, enemySize);

	//check for snake's collision with enemy, then the game finishs
	for(let i = 0; i < enemies.length; i++){
		let enemy = enemies[i];
		let snake = {x: headX, y: headY};
		if(Snake_VS_Enemy(enemy, snake, enemySize, snakeSize)){
			/*GAME OVER*/
			mainS.pause();
			game_overS.play();
			gs = false;
			clearInterval(game);
			document.body.classList.add('ended');
			document.removeEventListener('keydown', changeDirection);
			document.addEventListener('keydown', function(e) {
				if(e.keyCode == 13) window.location.reload();
			});
		}
	}

	//draw apples
	draw(apples, appleSize);

	//check for snake's collision with apple
	for(let i = 0; i < apples.length; i++){
		if( headX < (apples[i].x + snakeSize)
			&& headX + snakeSize > apples[i].x
			&& headY < (apples[i].y + snakeSize)
			&& headY + snakeSize > apples[i].y
		){
			//ate an apple
			took_an_appleS.pause();
			took_an_appleS.play();// play the sound
			apples.splice(i, 1);// remove this apple
			enemies.shift();// remove one enemy
			tailLength += 10;// make the snake a little longer
			speed += .1;// add some speed
			score++;// add the score
			if(maxEnemy < 15) maxEnemy++;// allow one more enemy to live xD
			if(maxApple > 3) maxApple--;//remove one apple to make the game a little harder
			spawnApple();// spawn new apple
			spawnEnemy();// and enemy
			break;
		}
	}

	//output of the score on the screen
	info();
}

function draw(arr, size) {
	for(let i = 0; i < arr.length; i++){
		ctx.fillStyle = arr[i].color;
		ctx.fillRect(arr[i].x, arr[i].y, size, size);
	}
}

function spawnEnemy() {
	let newEnemy = {
		x: ~~(Math.random() * (canvas.width - canvas.width / 10)),
		y: ~~(Math.random() * (canvas.height - canvas.height / 10)),
		color: '#7D0B0B'
	}
	//check appearing enemies in the adges
	if(
		(newEnemy.x < enemySize || newEnemy.x > canvas.width - enemySize)
		||
		(newEnemy.y < enemySize || newEnemy.y > canvas.height - enemySize)
	){
		spawnEnemy();
		return;
	}

	//check for collisions with snake's tail
	for(let i = 0; i < tail.length; i++){
		let tailEl = tail[i];
		if( collisionToEnemy(newEnemy, tailEl, snakeSize)){
			spawnEnemy();
			return;
		}
	}

	//check collisions with other enemies
	for(let i = 0; i < enemies.length; i++){
		let enemy = enemies[i];
		if(sameCollision(newEnemy, enemy, enemySize)){
			spawnEnemy();
			return;
		}
	}

	//check collisions with apples
	for(let i = 0; i < apples.length; i++){
		let apple = apples[i];
		if(collisionToEnemy(newEnemy, apple, appleSize)){
			spawnEnemy();
			return;
		}
	}

	if(( direction == 'left'
		 && newEnemy.x + enemySize + headSaveZone > headX
		 && newEnemy.y - snakeSize < headY
		 && newEnemy.y + enemySize + snakeSize > headY + snakeSize
		)
		||
	   ( direction == 'right'
		 &&	newEnemy.x - headSaveZone < headX + snakeSize
		 && newEnemy.y - snakeSize < headY
		 && newEnemy.y + enemySize + snakeSize > headY + snakeSize
		)
	    ||
	   ( direction == 'top'
	   	 && newEnemy.y + enemySize + snakeSize < headY + snakeSize
	   	 && newEnemy.x - snakeSize < headX
		 && newEnemy.x + enemySize + snakeSize > headX + snakeSize
	   	)
	    ||
	   ( direction == 'down'
	   	 && newEnemy.y - headSaveZone > headY + snakeSize
	   	 && newEnemy.x - snakeSize < headX
		 && newEnemy.x + enemySize + snakeSize > headX + snakeSize
	   	)
		)
	{
		spawnEnemy();
		return;
	}

	enemies.push(newEnemy);
}

function spawnApple() {
	let newApple = {
		x: ~~(Math.random() * canvas.width),
		y: ~~(Math.random() * canvas.height),
		color: 'green'
	}
	//check appearing apples in the adges
	if(
		(newApple.x < appleSize || newApple.x > canvas.width - appleSize)
		||
		(newApple.y < appleSize || newApple.y > canvas.height - appleSize)
	){
		spawnApple();
		return;
	}

	//check for collisions with snake's tail
	for(let i = 0; i < tail.length; i++){
		if( newApple.x < (tail[i].x + appleSize)
			&& newApple.x + appleSize > tail[i].x
			&& newApple.y < (tail[i].y + appleSize)
			&& newApple.y + appleSize > tail[i].y
		){
			spawnApple();
			return;
		}
	}

	//check collisions with other apples
	for(let i = 0; i < apples.length; i++){
		let apple = apples[i];
		if(sameCollision(apple, newApple, appleSize)){
			spawnApple();
			return;
		}
	}

	//check collisions with enemies
	for(let i = 0; i < enemies.length; i++){
		let enemy = enemies[i];
		if(collisionToEnemy(enemy, newApple, appleSize)){
			spawnApple();
			return;
		}
	}

	apples.push(newApple);

	// 30% probability for spawning one more apple
	if(apples.length < 4 && ~~(Math.random() * 1000) > 700){
		spawnApple();
	}
}

function info() {
	//reload score on the screen
	scoreEl.forEach(el => el.innerHTML = score);

	//write down the record && reload record on the screen
	if(record !== null){
		if(score > record) {
			localStorage.setItem('record', score);
			record = score;
			if(!recordBeat) recordS.play();
			recordBeat = true;
			document.querySelector('.new_record-title').classList.add('new_record');
			document.querySelector('.info-r').classList.add('new_record');
		}
		recordEl.innerHTML = record;
	}else{
		localStorage.setItem('record', score);
		recordEl.innerHTML = score;
		record = score;
		return
	}
}

function changeDirection(e) {
	if([37, 38, 39, 40].includes(e.keyCode)){
		mainS.play();
		gs = true;
		if(!cooldown){
			if(e.keyCode == 37 && direction !== 'left' && direction !== 'right'){ //left arrow
				speedX = -speed;
				speedY = 0;
				direction = 'left';
			}
			if(e.keyCode == 38 && direction !== 'top' && direction !== 'down'){ //top arrow
				speedX = 0;
				speedY = -speed;
				direction = 'top';
			}
			if(e.keyCode == 39 && direction !== 'left' && direction !== 'right'){ //right arrow
				speedX = speed;
				speedY = 0;
				direction = 'right';
			}
			if(e.keyCode == 40 && direction !== 'top' && direction !== 'down'){ //down arrow
				speedX = 0;
				speedY = speed;
				direction = 'down'
			}
			cooldown = true;
			setTimeout(function() {
				cooldown = false;
			}, 50);
		}
		if(apples.length < maxApple) spawnApple();
		if(enemies.length < maxEnemy) spawnEnemy();
	}
}

function collisionToEnemy(enemy, smth, size) {
	if( enemy.x - size < smth.x
		&& enemy.x + enemySize + size > smth.x + size
		&& enemy.y - size < smth.y
		&& enemy.y + enemySize + size > smth.y + size
	){
		return true
	}
	return false
}

function sameCollision(obj1, obj2, size) {
	if( (obj1.x >= obj2.x
		 && obj1.y >= obj2.y
		 && obj1.x <= obj2.x + size
		 && obj1.y <= obj2.y + size)
		||
		(obj1.x >= obj2.x
		 && obj1.y <= obj2.y
		 && obj1.x <= obj2.x + size
		 && obj1.y + size >= obj2.y
		)
		||
		(obj1.x <= obj2.x
		 && obj1.x + size >= obj2.x
		 && obj1.y >= obj2.y
		 && obj1.y <= obj2.y + size
		)
		||
		(obj1.x <= obj2.x
		 && obj1.y <= obj2.y
		 && obj1.y + size >= obj2.y
		 && obj1.x + size >= obj2.x
		)
	){
		return true
	}
	return false
}

function Snake_VS_Enemy(enemy, snake, enemySize, snakeSize) {
	if( ( enemy.x + enemySize > snake.x
		 && enemy.x + enemySize < snake.x + snakeSize
		 && enemy.y - snakeSize < snake.y
		 && enemy.y + enemySize + snakeSize > snake.y + snakeSize
		 && direction == 'left'
		) //right side
		 ||
		( enemy.y < snake.y + snakeSize
		 && enemy.y > snake.y - (snakeSize / 2)
		 && enemy.x - snakeSize < snake.x
		 && enemy.x + enemySize + snakeSize > snake.x + snakeSize
		 && direction == 'down'
		) //top side
		 ||
		( enemy.x < snake.x + snakeSize
		 && enemy.x > snake.x
		 && enemy.y - snakeSize < snake.y
		 && enemy.y + enemySize + snakeSize > snake.y + snakeSize
		 && direction == 'right'
		) //left side
		 ||
		( enemy.y + enemySize > snake.y
		 && enemy.y + enemySize < snake.y + snakeSize
		 && enemy.x - snakeSize < snake.x
		 && enemy.x + enemySize + snakeSize > snake.x + snakeSize
		 && direction == 'top'
		) //bottom side
	){
		return true
	}
	return false
}