const TILE_SIZE = 30;
const FPS = 30;
const SLEEP = 1000 / FPS;

enum Tile {
  AIR,
  FLUX,
  UNBREAKABLE,
  PLAYER,
  STONE, FALLING_STONE,
  BOX, FALLING_BOX,
  KEY1, LOCK1,
  KEY2, LOCK2
}

const tileColors = {
  [Tile.FLUX]: "#ccffcc",
  [Tile.UNBREAKABLE]: "#999999",
  [Tile.STONE]: "#0000cc",
  [Tile.FALLING_STONE]: "#0000cc",
  [Tile.BOX]: "#8b4513",
  [Tile.FALLING_BOX]: "#8b4513",
  [Tile.KEY1]: "#ffcc00",
  [Tile.LOCK1]: "#ffcc00",
  [Tile.KEY2]: "#00ccff",
  [Tile.LOCK2]: "#00ccff",
  [Tile.AIR]: "#fff",
};
const PLAYER_COLOR = "#ff0000";

type TileCoords = {
  x: number,
  y: number,
};

type MapUpdater = {
  canUseTileAt: ({x, y}: TileCoords) => boolean,

  performUpdateAt: ({x, y}: TileCoords) => void,
};

const mapUpdaters: MapUpdater[] = [
  {
    canUseTileAt: ({x, y}: TileCoords) =>
      (map[y][x] === Tile.STONE || map[y][x] === Tile.FALLING_STONE)
      && map[y + 1][x] === Tile.AIR,

    performUpdateAt: ({x, y}: TileCoords) => {
      map[y + 1][x] = Tile.FALLING_STONE;
      map[y][x] = Tile.AIR;
    },
  },
  {
    canUseTileAt: ({x, y}: TileCoords) => (map[y][x] === Tile.BOX || map[y][x] === Tile.FALLING_BOX)
      && map[y + 1][x] === Tile.AIR,

    performUpdateAt: ({x, y}: TileCoords) => {
      map[y + 1][x] = Tile.FALLING_BOX;
      map[y][x] = Tile.AIR;
    },
  },
  {
    canUseTileAt: ({x, y}: TileCoords) => map[y][x] === Tile.FALLING_STONE,

    performUpdateAt: ({x, y}: TileCoords) => {
      map[y][x] = Tile.STONE;
    },
  },
  {
    canUseTileAt: ({x, y}: TileCoords) => map[y][x] === Tile.FALLING_BOX,

    performUpdateAt: ({x, y}: TileCoords) => {
      map[y][x] = Tile.BOX
    },
  },
];

enum Input {
  UP, DOWN, LEFT, RIGHT
}

const LEFT_KEY = 37;
const UP_KEY = 38;
const RIGHT_KEY = 39;
const DOWN_KEY = 40;

const keyToInput = {
  [LEFT_KEY]: Input.LEFT,
  a: Input.LEFT,
  ArrowLeft: Input.LEFT,
  [UP_KEY]: Input.UP,
  w: Input.UP,
  ArrowUp: Input.UP,
  [RIGHT_KEY]: Input.RIGHT,
  d: Input.RIGHT,
  ArrowRight: Input.RIGHT,
  [DOWN_KEY]: Input.DOWN,
  s: Input.DOWN,
  ArrowDown: Input.DOWN,
};

type Move = {
  isValid: (moveArgs: Partial<MoveArgs>) => boolean,
  perform: (moveArgs: MoveArgs) => void,
};

type MoveArgs = {
  px: number, py: number, dx: number, dy: number,
}

const moves: Move[] = [
  // horizontal moves
  {
    isValid: ({dx}) =>
      dx !== undefined &&
      (map[playery][playerx + dx] === Tile.FLUX
        || map[playery][playerx + dx] === Tile.AIR),

    perform: ({dx}) => {
      moveToTile(playerx + dx, playery);
    },
  },

  {
    isValid: ({dx}) =>
      dx !== undefined &&
      (map[playery][playerx + dx] === Tile.STONE
        || map[playery][playerx + dx] === Tile.BOX)
      && map[playery][playerx + dx + dx] === Tile.AIR
      && map[playery + 1][playerx + dx] !== Tile.AIR,

    perform: ({dx}) => {
      moveToTile(playerx + dx, playery);
    },
  },

  {
    isValid: ({dx}) =>
      dx !== undefined &&
      map[playery][playerx + dx] === Tile.KEY1,

    perform: ({dx}) => {
      remove(Tile.LOCK1);
      moveToTile(playerx + dx, playery);
    },
  },

  {
    isValid: ({dx}) =>
      dx !== undefined &&
      map[playery][playerx + dx] === Tile.KEY2,

    perform: ({dx}) => {
      remove(Tile.LOCK2);
      moveToTile(playerx + dx, playery);
    },
  },

  // vertical moves
  {
    isValid: ({dy}) => {
      return dy !== undefined &&
        (map[playery + dy][playerx] === Tile.FLUX
          || map[playery + dy][playerx] === Tile.AIR);
    },

    // up/down move
    perform: ({dy}) => moveToTile(playerx, playery + dy),
  },

  {
    isValid: ({dy}) =>
      dy !== undefined &&
      map[playery + dy][playerx] === Tile.KEY1,

    perform: ({dy}) => {
      remove(Tile.LOCK1);
      moveToTile(playerx, playery + dy);
    },
  },

  {
    isValid: ({dy}) =>
      dy !== undefined &&
      map[playery + dy][playerx] === Tile.KEY2,

    perform: ({dy}) => {
      remove(Tile.LOCK2);
      moveToTile(playerx, playery + dy);
    },
  },
];

const inputToMoveMethod = {
  [Input.LEFT]: () => movePlayer(-1, 0),
  [Input.RIGHT]: () => movePlayer(1, 0),
  [Input.UP]: () => movePlayer(0, -1),
  [Input.DOWN]: () => movePlayer(0,1),
};

let inputs: Input[] = [];

let playerx = 1;
let playery = 1;
let map: Tile[][] = [
  [2, 2, 2, 2, 2, 2, 2, 2],
  [2, 3, 0, 1, 1, 2, 0, 2],
  [2, 4, 2, 6, 1, 2, 0, 2],
  [2, 8, 4, 1, 1, 2, 0, 2],
  [2, 4, 1, 1, 1, 9, 0, 2],
  [2, 2, 2, 2, 2, 2, 2, 2],
];

function remove(tile: Tile) {
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (map[y][x] === tile) {
        map[y][x] = Tile.AIR;
      }
    }
  }
}

function moveToTile(newx: number, newy: number) {
  map[playery][playerx] = Tile.AIR;
  map[newy][newx] = Tile.PLAYER;
  playerx = newx;
  playery = newy;
}

function movePlayer(dx: number, dy: number) {
  const move = moves.find(m => m.isValid({dx, dy}));

  if (move) {
    const px = playerx;
    const py = playery;

    move.perform({px, py, dx, dy});
  }
}

function update() {
  updatePlayerPosition();
  updateMap();
}

function updatePlayerPosition(): void {
  while (inputs.length > 0) {
    const moveMethod = inputToMoveMethod[inputs.pop()];

    if (moveMethod !== undefined) {
      moveMethod();
    }
  }
}

function updateMap(): void {
  for (let y = map.length - 1; y >= 0; y--) {
    for (let x = 0; x < map[y].length; x++) {
      const tileCoords = {x, y};
      const updateMethod = mapUpdaters.find(m => m.canUseTileAt(tileCoords));

      if (updateMethod) {
        updateMethod.performUpdateAt(tileCoords);
      }
    }
  }
}

function draw() {
  const g: CanvasRenderingContext2D = prepareCanvas2d("GameCanvas");
  drawMap(g);
  drawPlayer(g);
}

function prepareCanvas2d(canvasId: string): CanvasRenderingContext2D {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  const g = canvas.getContext("2d");
  g.clearRect(0, 0, canvas.width, canvas.height);
  return g;
}

function fillTile(x, y, g: CanvasRenderingContext2D): void {
  const tile = map[y][x];

  if (tile === Tile.AIR) {
    return;
  }

  g.fillStyle = tileColors[tile];
  g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function drawMap(g: CanvasRenderingContext2D) {
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      fillTile(x, y, g);
    }
  }
}

function drawPlayer(g: CanvasRenderingContext2D) {
  g.fillStyle = PLAYER_COLOR;
  g.fillRect(playerx * TILE_SIZE, playery * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function gameLoop() {
  let before = Date.now();
  update();
  draw();
  let after = Date.now();
  let frameTime = after - before;
  let sleep = SLEEP - frameTime;
  setTimeout(gameLoop, sleep);
}

window.onload = () => {
  gameLoop();
}

window.addEventListener("keydown", e => {
  const input = keyToInput[e.key];
  if (input !== undefined) {
    inputs.push(input);
  }
});

