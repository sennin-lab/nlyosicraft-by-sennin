import { BLOCKS } from '../data/blocks.js';
import { isLiquid } from '../physics.js';

// 爆発: 球状に地形を壊し、近いプレイヤーへ距離に応じたダメージを与える
export function explode(world, cx, cy, cz, r, player, hurtPlayer, rand = Math.random) {
  const R = Math.ceil(r);
  for (let dy = -R; dy <= R; dy++) {
    for (let dz = -R; dz <= R; dz++) {
      for (let dx = -R; dx <= R; dx++) {
        if (dx * dx + dy * dy + dz * dz > r * r) continue;
        const x = Math.floor(cx) + dx, y = Math.floor(cy) + dy, z = Math.floor(cz) + dz;
        const id = world.getBlock(x, y, z);
        if (!id || isLiquid(id)) continue;
        const def = BLOCKS[id];
        if (!def || def.hardness < 0) continue;
        if (rand() < 0.8) world.setBlock(x, y, z, 0);
      }
    }
  }
  const px = player.x, py = player.y + 0.9, pz = player.z;
  const d = Math.hypot(px - cx, py - cy, pz - cz);
  const reach = r * 2;
  if (d < reach) {
    hurtPlayer(Math.round((1 - d / reach) * 14), cx, cz, 'creeper');
  }
}
