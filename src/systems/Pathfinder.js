const CARDINALS = Object.freeze([[1, 0], [-1, 0], [0, 1], [0, -1]]);

function key(x, y) { return `${x},${y}`; }
function heuristic(ax, ay, bx, by) { return Math.abs(ax - bx) + Math.abs(ay - by); }

export class Pathfinder {
  constructor(maxNodes = 320) {
    this.maxNodes = maxNodes;
  }

  findPath(world, startX, startY, goalX, goalY, radius = 0.24) {
    const sx = Math.floor(startX);
    const sy = Math.floor(startY);
    const gx = Math.floor(goalX);
    const gy = Math.floor(goalY);
    if (sx === gx && sy === gy) return [];

    const open = [{ x: sx, y: sy, g: 0, f: heuristic(sx, sy, gx, gy) }];
    const cameFrom = new Map();
    const bestCost = new Map([[key(sx, sy), 0]]);
    let visited = 0;

    while (open.length && visited < this.maxNodes) {
      open.sort((a, b) => a.f - b.f || a.g - b.g);
      const current = open.shift();
      visited += 1;
      if (current.x === gx && current.y === gy) return this.#reconstruct(cameFrom, current, sx, sy);

      for (const [dx, dy] of CARDINALS) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        const centerX = nx + 0.5;
        const centerY = ny + 0.5;
        if (world.isWall(centerX, centerY)) continue;
        if (!this.#hasClearance(world, centerX, centerY, radius)) continue;
        const newCost = current.g + 1;
        const nodeKey = key(nx, ny);
        if (newCost >= (bestCost.get(nodeKey) ?? Infinity)) continue;
        bestCost.set(nodeKey, newCost);
        cameFrom.set(nodeKey, current);
        open.push({ x: nx, y: ny, g: newCost, f: newCost + heuristic(nx, ny, gx, gy) });
      }
    }
    return [];
  }

  #hasClearance(world, x, y, radius) {
    return !world.isWall(x - radius, y - radius)
      && !world.isWall(x + radius, y - radius)
      && !world.isWall(x - radius, y + radius)
      && !world.isWall(x + radius, y + radius);
  }

  #reconstruct(cameFrom, current, sx, sy) {
    const path = [];
    let node = current;
    while (node && !(node.x === sx && node.y === sy)) {
      path.push({ x: node.x + 0.5, y: node.y + 0.5 });
      node = cameFrom.get(key(node.x, node.y));
    }
    return path.reverse();
  }
}
