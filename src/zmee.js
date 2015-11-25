
window.onerror = function(msg, url, line) {
	if (onerror.num++ < onerror.max) {
	alert("ERROR: " + msg + "\n" + url + ":" + line);
	return true;
	}
}
	var TIMER_DELAY = 100;
	var KEY_UP = 38;
	var KEY_DOWN = 40;
	var KEY_LEFT = 37;
	var KEY_RIGHT = 39;
	
	function animate(options) 
	{

  		var start = performance.now();

  		requestAnimationFrame(function animate(time) {
    		// timeFraction от 0 до 1
    		var timeFraction = (time - start) / options.duration;
    		if (timeFraction > 1) timeFraction = 1;

    		// 	текущее состояние анимации
    		var progress = options.timing(timeFraction)

    		options.draw(progress);

    		if (timeFraction < 1) {
      			requestAnimationFrame(animate);
    		} 
    	});
	}
	
	function startGame(game)
	{		

		game.drawStatic();
		game.drawText("both");
		game.drawText("pause");

		game.drawCell(game.head_position,game.head_color);
		game.drawCell(game.tail_position);
		game.apple.generateNewApple();
		
		game.gameIsStarted = true;		
		game.gameON = true;
		game.timeoutID = window.setTimeout(function(){game.timeOutFunc();},TIMER_DELAY);
	}

	function makeCanvas(id, width, height) 
	{
		var canvas = document.createElement("canvas");
		canvas.id = id;
		canvas.width = width;
		canvas.height = height;
		return canvas;
	}

	function Apple(game)
	{
		var apple = new Object();
		
		apple.index = {x: -1, y:-1};
		// apple.color = "#AA1111";
		apple.game = game;
		apple.colors = ["rgb(255,69,0)","#00bfff","#7f3fbf","#ff4719", "#f5c000", "#42ff49"];
		apple.drawApple = function()
		{
			var coord = this.game.getCoord(this.index);
			var context = game.context;
			var color = Math.floor(Math.random() * (apple.colors.length));
			context.fillStyle = apple.colors[color];
			context.strokeStyle = "black";
			context.lineWidth = 1;

			context.beginPath();
			context.moveTo(coord.x, coord.y - (this.game.cell_size/2 - this.game.cell_border_size) + Math.floor(this.game.cell_size/4)); 
			var x = coord.x;
			var y = coord.y + (this.game.cell_size/2 - this.game.cell_border_size);
			var P1x = coord.x - (this.game.cell_size/2 - this.game.cell_border_size);
			var P1y = coord.y - (this.game.cell_size/2 - this.game.cell_border_size);
			var P2x = P1x;
			var P2y = coord.y + (this.game.cell_size/2 - this.game.cell_border_size);
			context.bezierCurveTo(P1x, P1y, P2x, P2y, x, y);
			
			context.moveTo(coord.x, coord.y - (this.game.cell_size/2 - this.game.cell_border_size) + Math.floor(this.game.cell_size/4));
			P1x = coord.x + (this.game.cell_size/2 - this.game.cell_border_size);
			P2x = P1x;
			context.bezierCurveTo(P1x, P1y, P2x, P2y, x, y);
			context.fill();
			context.stroke();
			

			context.beginPath();
			context.moveTo(coord.x, coord.y 
						- (this.game.cell_size/2 - this.game.cell_border_size)
						+ Math.floor(this.game.cell_size/4)); 
		
			context.lineTo(coord.x 
						+ (Math.floor(this.game.cell_size/4)
						- this.game.cell_border_size),
						coord.y
						- (this.game.cell_size/2 
						- this.game.cell_border_size));

			context.closePath();
			context.stroke();

			//this.game.drawCell(this.index,this.color);
		}

		apple.generateNewApple = function()
		{
			if(this.game.score < this.game.x_cells_quantity * this.game.y_cells_quantity / (1.5))
			{
					do
					{
						this.index.x = Math.floor(Math.random() * this.game.x_cells_quantity);
						this.index.y = Math.floor(Math.random() * this.game.y_cells_quantity);	
						if(this.index.x == this.game.x_cells_quantity) --this.index.x;
						if(this.index.y == this.game.y_cells_quantity) --this.index.y;

					}while(this.game.cells[this.index.x] != undefined && this.game.cells[this.index.x][this.index.y] != undefined);
			}
			else
			{
				var free_cells = []
				for(var i = 0; i < this.game.x_cells_quantity; ++i)
				{
					for(var j = 0 ; j < this.game.y_cells_quantity; ++j)
					{
						if(this.game.cells[i]== undefined || this.game.cells[i][j] != undefined) free_cells.push([i,j]); 
					}
				}
				var rand = Math.floor(Math.random()* free_cells.length);
				if(rand == free_cells.length) --rand;
				this.index.x = free_cells[rand][0];
				this.index.y = free_cells[rand][1];
			}
			this.drawApple();
		}
		return apple;
	}

	function Game(canvas, width, height)
	{
		var new_game = new Object();
		new_game.canvas = canvas;
		new_game.context = canvas.getContext("2d");
		new_game.context.lineJoin = "round";	
		new_game.score = 2;
		new_game.direct = [0,-1];
		new_game.cell_border_size = 1;
		new_game.cell_size = 2*16 + 2*new_game.cell_border_size;
		new_game.cell_border_color = "black";
		new_game.cell_color = "#32CD32";
		new_game.head_color = "#4faab3";
		new_game.width = width;
		new_game.height = height;
		new_game.x_cells_quantity = (width - 12)/new_game.cell_size;
		new_game.y_cells_quantity = (height - 12)/new_game.cell_size;
		new_game.apple = Apple(new_game);

		new_game.leftBorder = 6 + new_game.cell_size/2;
		new_game.rightBorder = width - 6 -new_game.cell_size/2;
		new_game.topBorder = 6 + new_game.cell_size/2;
		new_game.bottomBorder = height - 6 - new_game.cell_size/2;
		new_game.cells = []

		new_game.background_color = "#E6E6FA";
		new_game.border_color = "#4B0082";
		new_game.gameON = false;

		new_game.timeoutID;
		new_game.head_position = {};
		new_game.tail_position = {};


		new_game.fillPosition = function(index)
		{
			with(index)
			{
				if(this.cells[x] == undefined) this.cells[x] = [];
				this.cells[x][y] = this.direct.slice();
			}
		}
		new_game.clearPosition = function(index)
		{
			with(index)
			{
				this.cells[x][y] = undefined;
			}
		}
		new_game.checkPosition = function(index)
		{
			with(index)
			{
				if(this.cells[x] == undefined) return false;
				if(this.cells[x][y] == undefined) return false;
			}
			return true;
		}
		new_game.getLastDirection = function(index)
		{
			with(index)
			{
				if(this.cells[x] == undefined) return undefined;
				if(this.cells[x][y] == undefined) return undefined;
			}
			return this.cells[index.x][index.y];	
		}
		
		new_game.getCoord = function(index)
		{
			var coord = {};
			with(this)
			{
			coord.x = index.x * cell_size + 6 + cell_size/2;
			coord.y = index.y * cell_size + 6 + cell_size/2; 
			}
			return coord;
		}

		new_game.drawCell = function(index,color,brd_color)
		{
			var context = this.context;
			var coord = this.getCoord(index);
			
			if(brd_color == undefined) context.fillStyle = this.cell_border_color;
			else context.fillStyle = brd_color;

			context.fillRect(coord.x - this.cell_size/2, coord.y - this.cell_size/2 ,this.cell_size ,this.cell_size);

			if(color == undefined) context.fillStyle = this.cell_color;
			else context.fillStyle = color;

			context.fillRect(coord.x - this.cell_size/2 + this.cell_border_size, 
							 coord.y - this.cell_size/2 + this.cell_border_size ,
							 this.cell_size - this.cell_border_size*2 ,
							 this.cell_size - this.cell_border_size*2);
		}
		new_game.drawEmptyField = function(index)
		{
			this.drawCell(index,this.background_color,"gray");
		}
		

		new_game.drawText = function(type)
		{
			var add_str = "";
			var top = 0;
			var left_offset = 0;
			var types = [];
			var canvas = this.canvas;
			var fontSize = "16px"
			var className = "right_text";
			var left_offset = 0;
			types[0] = type;

			if(this.drawText.textElements == undefined) this.drawText.textElements = [];
			if(type == "both")
			{
				 types[0] = "score";
			 	types[1] =  "best_score";
			}

			for(var i = 0; i < types.length; ++i)
			{
				var label = document.createElement("div");

				if(types[i] == "pause")
				{
					add_str = "'P': pause";
					top = canvas.offsetTop + this.width/2 - 20;

				}
				else if(types[i] == "score")
				{
					add_str = "Score: " + this.score;
					top = canvas.offsetTop + 30;
				}
				else if( types[i] == "best_score")
				{
					add_str = "Best score: " + Game.best_score;
					top = canvas.offsetTop + 30 + 50;
				}
				else if(types[i] == "pauseON")
				{
					label.style.width = this.width - 12;
					label.style.height = this.height - 12;
					label.style.lineHeight = this.width - 12  + "px";
					add_str = "pause";
					top = canvas.offsetTop + 6;
					fontSize = "72px"
					className = "pause";
					left_offset = -(this.width + 30) + 6; 	
				}
				else if(types[i] == "pauseOFF")
				{
					add_str = "";
				}
				else break;
				
				var updated_str = undefined;
				if(types[i] != "pauseON")
				{
					var element = this.drawText.textElements[types[i]];
					if(types[i] == "pauseOFF")
					{
						types[i] = "pauseON";
						element = this.drawText.textElements[types[i]];
						if(element != undefined) document.body.removeChild(element);
					}
					else
						if(element != undefined)
						{
							element.childNodes[0].data = add_str;
						}
				}

				if(add_str == undefined || add_str.length == 0) continue;
				


				label.style.position = "absolute";
				label.style.left = (canvas.offsetLeft+ this.width + 30 + left_offset);
				label.style.top = top;
				label.style.fontFamily = "sans-serif";
				label.style.fontSize = fontSize;
				label.className = className;
				label.appendChild(document.createTextNode(add_str));
				this.drawText.textElements[types[i]] = document.body.appendChild(label);
			}
		}


		new_game.drawStatic = function()
		{
			var context = this.context;
			context.fillStyle = this.border_color;
			context.fillRect(0,0, this.width, this.height);

			context.fillStyle = this.background_color;
			context.fillRect(6,6, this.width-12, this.height-12 );
			var index = {};
			for(index.x = 0; index.x < this.x_cells_quantity; ++index.x)
			{
				for(index.y = 0; index.y < this.y_cells_quantity; ++index.y)
				{
					this.drawEmptyField(index);
				}
			}
		}

		new_game.timeOutFunc = function(new_dir)
		{
			if(new_dir != undefined)
			{
				if(this.direct[0] == -new_dir[0] && this.direct[1] == -new_dir[1]) return; // back edge ignore
					
				if(this.timeoutID != undefined) window.clearTimeout(this.timeoutID);
				if(!(this.direct[0] == new_dir[0] && this.direct[1] == new_dir[1])) //turn
				{		
					this.direct = new_dir;
				}
			}
			
			this.fillPosition(this.head_position); //safe new direction
			this.drawCell(this.head_position);

			var new_head_position = {};
			new_head_position.x =  this.head_position.x + this.direct[0];
			new_head_position.y =  this.head_position.y + this.direct[1];
			
			this.head_position = new_head_position; // move head
			
			var isApple = this.checkIsApple();
			if(!isApple)
			{
				//move tail
				var last_dir = this.getLastDirection(this.tail_position);
				var new_tail_position ={};
				new_tail_position.x = this.tail_position.x + last_dir[0]; 
				new_tail_position.y = this.tail_position.y + last_dir[1]; 
			
				this.drawEmptyField(this.tail_position);
				this.clearPosition(this.tail_position);
				this.tail_position = new_tail_position;
			}
			else
			{
				++this.score;
				this.drawText("score");
				if(this.score > Game.best_score)
				{
					Game.best_score = this.score;
					this.drawText("best_score");
				}
			}

			if(!this.checkGameLoose())
			{
				
				this.fillPosition(this.head_position); // safe head
				this.drawCell(this.head_position, this.head_color);

				if(isApple) this.apple.generateNewApple();
			
				var self = this;
				this.timeoutID = window.setTimeout(function(){self.timeOutFunc()},TIMER_DELAY);
			}
			else this.gameLoose();
		}


		new_game.checkIsApple = function()
		{
			if(this.head_position.x == this.apple.index.x && this.head_position.y == this.apple.index.y) return true;
			return false;
		}
		new_game.checkGameLoose = function()
		{
			var isLoose = false;
			if(this.head_position.x < 0 || this.head_position.y < 0 ||
				this.head_position.x >= this.x_cells_quantity || this.head_position.y >= this.y_cells_quantity) isLoose = true;
			if(!isLoose)
			{
				if(this.checkPosition(this.head_position)) isLoose = true;
			}
			return isLoose;
		}
		new_game.gameLoose = function()
		{
			this.gameON = false;
			window.clearTimeout(this.timeoutID);	
			window.onkeydown = function(){};
			
			//document.body.removeChild(this.drawText.elements["score"]);
			//document.body.removeChild(this.drawText.elements["best_score"]);

			this.context.fillStyle = this.background_color;
			this.context.fillRect(6,6,this.width-12,this.height-12);

			var label = document.createElement("div");
			label.style.position = "absolute";
			label.style.left = this.canvas.offsetLeft + +this.width/2 - 60;
			label.style.top = this.canvas.offsetTop + this.height/2 - 100;
			label.style.fontFamily = "sans-serif";
			label.style.fontSize = "25px";
			label.className = "loose_text"
			label.appendChild(document.createTextNode("You loose!"));
			label.appendChild(document.createElement("br"));
			label.appendChild(document.createTextNode("Score: " + this.score));
			label.appendChild(document.createElement("br"));
			var id = document.body.appendChild(label);

			var progress_bar =  document.createElement("progress");
			
			label.appendChild(progress_bar);
			
			animate({
  					duration: 1000,
  					timing: function(timeFraction) {
    							return timeFraction;
  													},
					draw: function(progress) {
    							progress_bar.style.width = progress * 100 + '%';}
					});
			
			var self = this;
			window.setTimeout(
						function(){
							label = document.createElement("div");
							label.style.position = "absolute";
							label.style.left = self.canvas.offsetLeft + self.width/2 - 125;
							label.style.top = self.canvas.offsetTop + self.height/2 - 20;
							label.style.fontFamily = "sans-serif";
							label.style.fontSize = "25px";
							label.className = "loose_text"
							label.appendChild(document.createTextNode("SPACE: start new game"));
							var bar_id = document.body.appendChild(label);
							window.onkeydown = function(e)
							{
								if(e.keyCode != " ".charCodeAt(0)) return;
								if(id != null) document.body.removeChild(id);
								if(bar_id != null) document.body.removeChild(bar_id);
								initNewGame();
							};
						},
						1000);
		}

		return new_game;
	}

	Game.best_score = 2;
	function init()
	{
		var canvas = makeCanvas("canvas", 544 + 300 + 12 ,544 + 12);
		document.body.appendChild(canvas);
		initNewGame();
	}
	function initNewGame()
	{
		window.onkeydown = function(e){};
		if(game != undefined)
		{
			game.drawText("pauseOFF");
			document.body.removeChild(game.drawText.textElements["score"]);
			document.body.removeChild(game.drawText.textElements["best_score"]);
		}
		var game = Game(canvas,canvas.width - 300,canvas.height);

		game.head_position = {x: game.x_cells_quantity/2, y: game.y_cells_quantity/2 };
		game.tail_position = {x: game.x_cells_quantity/2, y: game.y_cells_quantity/2 + 1};

		game.fillPosition(game.tail_position);
		game.fillPosition(game.head_position);

		
		window.onkeydown = function(event)
		{
        	event = event || window.event;
        	var new_dir = [];
        	if(event.keyCode  == KEY_UP          ||
        	 event.keyCode.to  == "w".charCodeAt(0) ||
        	 event.keyCode  == 'W'.charCodeAt(0) ||
        	 event.keyCode  == 'i'.charCodeAt(0) ||
        	 event.keyCode  == 'I'.charCodeAt(0))  new_dir = [0,-1];
        	else if(event.keyCode  == KEY_DOWN   ||
        	 event.keyCode  == 's'.charCodeAt(0) || 
        	 event.keyCode  == 'S'.charCodeAt(0) ||
        	 event.keyCode  == 'k'.charCodeAt(0) ||
        	 event.keyCode  == 'K'.charCodeAt(0)) new_dir = [0,1];
        	else if(event.keyCode  == KEY_LEFT   ||
        	 event.keyCode  == 'a'.charCodeAt(0) || 
        	 event.keyCode  == 'A'.charCodeAt(0) ||
        	 event.keyCode  == 'j'.charCodeAt(0) ||
        	 event.keyCode  == 'J'.charCodeAt(0)) new_dir = [-1,0];
        	else if(event.keyCode  == KEY_RIGHT  || 
        	 event.keyCode  == 'd'.charCodeAt(0) ||
        	 event.keyCode  == 'D'.charCodeAt(0) ||
        	 event.keyCode  == 'l'.charCodeAt(0) ||
        	 event.keyCode  == 'L'.charCodeAt(0))  new_dir = [1,0];
        	else if(event.keyCode == 'p'.charCodeAt(0) || event.keyCode == 'P'.charCodeAt(0))
        	{
        		if(game.gameON == true) 
        		{
        			game.gameON = false;
        			game.drawText("pauseON");
        			if(game.timeoutID != undefined) window.clearTimeout(game.timeoutID);
        		}
        		else 
        		{ 
        			game.drawText("pauseOFF");
        			game.gameON = true;
					game.timeoutID = window.setTimeout(function(){game.timeOutFunc();},TIMER_DELAY);
        		}
        		return;	
        	}
        	else return;
        	if(game.gameON) 
        	{	
        		game.timeOutFunc(new_dir);
        	}
		};

		startGame(game);
}
