var Game = function(canvas, cellSize, difficulty) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.cellSize = cellSize;
    
    switch(difficulty) {
        case "Easy":
            this.setBoardDifficulty(10, 10, 6);
            break;
        case "Medium":
            this.setBoardDifficulty(12, 12, 10);
            break;
        case "Hard":
            this.setBoardDifficulty(15, 15, 25);
            break;   
        case "Insane":
            this.setBoardDifficulty(20, 20, 45);
            break;    
    }

    this.time = 0;
    this.cellStack = [];
}

Game.prototype.setBoardDifficulty = function(rows, cols, bombCount) {
    this.rows = rows;
    this.cols = cols;
    this.bombCount = bombCount;
    this.canvas.width = cols * this.cellSize;
    this.canvas.height = rows * this.cellSize;
}

Game.prototype.getClickCoords = function(event) {
    var top = parseFloat($("#game").offset().top);
    var left = parseFloat($("#game").offset().left);
    var pixelX = parseFloat(event.pageX) - left;
    var pixelY = parseFloat(event.pageY) - top;
    var x = Math.floor(pixelX / this.cellSize);
    var y = Math.floor(pixelY / this.cellSize);

    return { x: x, y: y };
}

Game.prototype.getCell = function(x, y) {
    for(var i = 0; i < this.cellStack.length; i++) {
        if(this.cellStack[i].x == x && this.cellStack[i].y == y)
            return this.cellStack[i];
    }
}

Game.prototype.clearBoard = function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

Game.prototype.generateBombs = function() {
    var c = this.cellStack;
    var i = 0;

    while(i < this.bombCount) {
        var index = Math.floor(Math.random() * c.length);

        if(!c[index].bomb) {
            c[index].bomb = true;
            i++;
        }
    }
}

Game.prototype.generateNums = function() {
    var c = this.cellStack;

    for(var i = 0; i < c.length; i++) {
        var cell = c[i];
        cell.generateNeighbors(this.rows, this.cols);
        var neighbors = cell.neighbors;

        for(var j = 0; j < neighbors.length; j++) {
            var neighbor = neighbors[j];

            if(this.getCell(neighbor.x, neighbor.y).bomb)
                cell.num++;
        }
    }
}

Game.prototype.massReveal = function(cell) {
    var neighbors = cell.neighbors;

    for(var i = 0; i < neighbors.length; i++) {
        var neighbor = this.getCell(neighbors[i].x, neighbors[i].y);

        if(!neighbor.clicked) {
            neighbor.clicked = true;

            if(neighbor.num === 0)
                this.massReveal(neighbor);
        }
    }
}

Game.prototype.initBoard = function() {
    this.clearBoard();

    for(var y = 0; y < this.rows; y++) {
        for(var x = 0; x < this.cols; x++) {
            var cell = new Cell(this.cellSize, x, y);
            this.cellStack.push(cell);
        }
    }

    this.generateBombs();
    this.generateNums();
}

Game.prototype.drawBoard = function() {
    this.clearBoard();

    for(var i = 0; i < this.cellStack.length; i++) {
        this.cellStack[i].draw(this.ctx);
    }
}

Game.prototype.clickCell = function(event) {
    var coords = this.getClickCoords(event);
    var cell = this.getCell(coords.x, coords.y);

    if(cell.x == coords.x && cell.y == coords.y) {
        if(!cell.clicked && !cell.flagged) {
            cell.clicked = true;

            if(!cell.bomb && cell.num === 0)
                this.massReveal(cell);
        }
    }
}

Game.prototype.flagCell = function(event) {
    var coords = this.getClickCoords(event);
    var cell = this.getCell(coords.x, coords.y);

    if(cell.x == coords.x && cell.y == coords.y) {
        if(!cell.flagged && !cell.clicked) {
            cell.flagged = true;
        } else {
            cell.flagged = false;
        }
    }
}

Game.prototype.checkLoss = function() {
    var c = this.cellStack;

    for(var i = 0; i < c.length; i++) {
        if(c[i].bomb && c[i].clicked)
            return true;
    }

    return false;
}

Game.prototype.checkWin = function() {
    var c = this.cellStack;
    var winCount = c.length - this.bombCount;
    var clickedCount = 0;

    for(var i = 0; i < c.length; i++) {
        if(c[i].clicked && !c[i].bomb)
            clickedCount++;
    }

    if(clickedCount == winCount)
        return true;

    return false;
}

Game.prototype.reset = function(message) {
    for(var i = 0; i < this.cellStack.length; i++) {
        this.cellStack[i].clicked = true;
        this.cellStack[i].flagged = false;
    }

    this.drawBoard();
    alert(message);
    this.quickReset(); 
}

Game.prototype.quickReset = function() {
    var difficulty = $("#difficulty").val();

    this.cellStack = [];

    switch(difficulty) {
        case "Easy":
            this.setBoardDifficulty(10, 10, 6);
            break;
        case "Medium":
            this.setBoardDifficulty(12, 12, 10);
            break;
        case "Hard":
            this.setBoardDifficulty(15, 15, 25);
            break;   
        case "Insane":
            this.setBoardDifficulty(20, 20, 40);
            break;    
    }

    this.time= 0;

    this.initBoard();
    this.drawBoard();
}


var Cell = function(cellSize, x, y) {
    this.cellSize = cellSize;
    this.x = x;
    this.y = y;
    this.clicked = false;
    this.flagged = false;
    this.bomb = false;
    this.num = 0;

    this.neighbors = [];
}

Cell.prototype.generateNeighbors = function(rows, cols) {
    var xCoords = [-1, 0, 1, -1, 1, -1, 0, 1];
    var yCoords = [-1, -1, -1, 0, 0, 1, 1, 1];
    var x = this.x;
    var y = this.y;

    for(var i = 0; i < 8; i++) {
        var neighbor =  {
            x: x + xCoords[i],
            y: y + yCoords[i]
        }

        if(neighbor.x >= 0 && neighbor.x < cols)
            if(neighbor.y >= 0 && neighbor.y < rows)
                this.neighbors.push(neighbor);
    }
}

Cell.prototype.draw = function(ctx) {
    var c = this.cellSize;

    if(!this.clicked)
        ctx.fillStyle = "gray";
    if(this.clicked)
        ctx.fillStyle = "lightGray";
    if(this.flagged)
        ctx.fillStyle = "red";
    if(this.bomb && this.clicked)
        ctx.fillStyle = "black";

    ctx.fillRect(this.x * c, this.y * c, c, c);
    ctx.strokeStyle = "black";
    ctx.strokeRect(this.x * c, this.y * c, c, c);

    if(!this.bomb && !this.flagged && this.clicked && this.num > 0) {
        var colors = [
            "blue",
            "green",
            "red",
            "darkblue",
            "brown",
            "cyan",
            "black",
            "grey"
        ];

        ctx.fillStyle = colors[this.num - 1];
        ctx.font = "20px Times Roman";
        ctx.fillText(this.num, (this.x * c) + (c/2), (this.y * c) + (c/2));
    }
}


$(function() {
    var canvas = document.getElementById("game");
    var game = new Game(canvas, 30, "Easy");

    game.initBoard();
    game.drawBoard();

    setInterval(function() {
        $("#timer").text(game.time);
        game.time++;
    }, 1000);

    $("#game").mousedown(function(event) {
        switch(event.which) {
            case 1:
                game.clickCell(event);
                break;

            case 3:
                game.flagCell(event);
                break;
        }

        if(game.checkLoss())
            game.reset("You lose");

        if(game.checkWin())
            game.reset("You won!");

        game.drawBoard();

        //console.log(game.cellStack);
    });

    $("#game").contextmenu(function() {
        return false;
    });

    $("#reset").click(function() {
        game.quickReset();
    })
});


