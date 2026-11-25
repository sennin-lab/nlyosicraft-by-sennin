<!-- FILE: FEATURE_MATRIX.md -->
<!-- RESPONSIBILITY: Minecraft統合版準拠の全データ仕様（ブロック・アイテム・レシピ・取引・モブ・バイオーム・構造物・食料・挙動仕様・描画性能制限・スコープ外）とSTAGE割り当て付き充足表を定義する。 -->
<!-- EDIT: S1完了時の ? 確定まで -->

# FEATURE_MATRIX (Minecraft Bedrock 1.20準拠)

すべてのブロック・アイテム・食料は**単一の連番ID空間**に固定し、`src/data/ids.js` に定数として集約いたします（重複は厳禁ですわ）。
- **blocks**: `1` 〜 `99` (`0` は `air` 予約)
- **items**: `100` 〜 `199`
- **food**: `200` 〜 `299`

※全数値確定済み（`?` 残存ゼロ）。各独自調整値・実値には備考欄に根拠を明記しております。

---

## 1. ブロック一覧 (`src/data/blocks.js`)

### 採掘・ツール計算の定義
- **必要ティア**: `0` = 素手可 / `1` = 木以上 / `2` = 石以上 / `3` = 鉄以上 / `4` = ダイヤ以上 / `99` = 破壊不可
- **硬度**: Minecraftの基準硬度値。
  - 基本採掘時間（秒） = `硬度 × 1.5 ÷ 速度倍率`（適正ツールでない場合は速度倍率を `1/5` とし、かつ必要ティアを満たさない場合は基本時間を `硬度 × 5.0` に延長し、**ドロップなし**といたします。なお、**水中採掘時は速度倍率をさらに `1/5`** といたします）。

| ID | スネークケース名 | 日本語名 | 形状 | 当たり判定 | 硬度 | 適正ツール | 必要ティア | ドロップ (アイテム名 x個) | 光源 | 透過 | 備考 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | `air` | 空気 | none | なし | 0 | none | 0 | none | 0 | true | 判定なし |
| 1 | `bedrock` | 岩盤 | cube | あり(フル) | -1 | none | 99 | none | 0 | false | 破壊不可 |
| 2 | `stone` | 石 | cube | あり(フル) | 1.5 | pickaxe | 1 | `cobblestone` x1 | 0 | false | 精錬で `stone` に戻る |
| 3 | `cobblestone` | 丸石 | cube | あり(フル) | 2.0 | pickaxe | 1 | `cobblestone` x1 | 0 | false | |
| 4 | `dirt` | 土 | cube | あり(フル) | 0.5 | shovel | 0 | `dirt` x1 | 0 | false | |
| 5 | `grass_block` | 草ブロック | cube | あり(フル) | 0.6 | shovel | 0 | `dirt` x1 | 0 | false | 上面緑・側面草付 |
| 6 | `sand` | 砂 | cube | あり(フル) | 0.5 | shovel | 0 | `sand` x1 | 0 | false | 重力落下 |
| 7 | `gravel` | 砂利 | cube | あり(フル) | 0.6 | shovel | 0 | `gravel` x1 (`flint` x1: 10%) | 0 | false | 重力落下 |
| 8 | `sandstone` | 砂岩 | cube | あり(フル) | 0.8 | pickaxe | 1 | `sandstone` x1 | 0 | false | |
| 9 | `oak_log` | オークの原木 | cube | あり(フル) | 2.0 | axe | 0 | `oak_log` x1 | 0 | false | |
| 10 | `birch_log` | シラカバの原木 | cube | あり(フル) | 2.0 | axe | 0 | `birch_log` x1 | 0 | false | |
| 11 | `spruce_log` | トウヒの原木 | cube | あり(フル) | 2.0 | axe | 0 | `spruce_log` x1 | 0 | false | |
| 12 | `jungle_log` | ジャングルの原木 | cube | あり(フル) | 2.0 | axe | 0 | `jungle_log` x1 | 0 | false | |
| 13 | `oak_planks` | オークの板材 | cube | あり(フル) | 2.0 | axe | 0 | `oak_planks` x1 | 0 | false | 全原木から変換 |
| 14 | `oak_leaves` | オークの葉 | cube | あり(フル) | 0.2 | shears/hoe | 0 | `oak_sapling` x1 (5%) / `apple` x1 (0.5%) | 0 | true(cutout) | ハサミで `oak_leaves` x1 |
| 15 | `birch_leaves` | シラカバの葉 | cube | あり(フル) | 0.2 | shears/hoe | 0 | `birch_sapling` x1 (5%) | 0 | true(cutout) | ハサミで `birch_leaves` x1 |
| 16 | `spruce_leaves` | トウヒの葉 | cube | あり(フル) | 0.2 | shears/hoe | 0 | `spruce_sapling` x1 (5%) | 0 | true(cutout) | ハサミで `spruce_leaves` x1 |
| 17 | `jungle_leaves` | ジャングルの葉 | cube | あり(フル) | 0.2 | shears/hoe | 0 | `jungle_sapling` x1 (2.5%) | 0 | true(cutout) | ハサミで `jungle_leaves` x1 |
| 18 | `coal_ore` | 石炭鉱石 | cube | あり(フル) | 3.0 | pickaxe | 1 | `coal` x1 | 0 | false | |
| 19 | `copper_ore` | 銅鉱石 | cube | あり(フル) | 3.0 | pickaxe | 2 | `raw_copper` x2-5 | 0 | false | |
| 20 | `iron_ore` | 鉄鉱石 | cube | あり(フル) | 3.0 | pickaxe | 2 | `raw_iron` x1 | 0 | false | |
| 21 | `gold_ore` | 金鉱石 | cube | あり(フル) | 3.0 | pickaxe | 3 | `raw_gold` x1 | 0 | false | |
| 22 | `redstone_ore` | レッドストーン鉱石 | cube | あり(フル) | 3.0 | pickaxe | 3 | `redstone` x4-5 | 0 | false | |
| 23 | `lapis_ore` | ラピスラズリ鉱石 | cube | あり(フル) | 3.0 | pickaxe | 2 | `lapis_lazuli` x4-9 | 0 | false | |
| 24 | `diamond_ore` | ダイヤモンド鉱石 | cube | あり(フル) | 3.0 | pickaxe | 3 | `diamond` x1 | 0 | false | |
| 25 | `emerald_ore` | エメラルド鉱石 | cube | あり(フル) | 3.0 | pickaxe | 3 | `emerald` x1 | 0 | false | 山バイオーム限定 |
| 26 | `crafting_table` | 作業台 | cube | あり(フル) | 2.5 | axe | 0 | `crafting_table` x1 | 0 | false | タップで3x3UI |
| 27 | `furnace` | かまど | cube | あり(フル) | 3.5 | pickaxe | 1 | `furnace` x1 | 0(燃焼13) | false | 向き保持、タップで精錬UI |
| 28 | `chest` | チェスト | cube | あり(フル) | 2.5 | axe | 0 | `chest` x1 + 中身 | 0 | false | 向き保持、1個27枠 / 隣接2個で大チェスト54枠 |
| 29 | `torch` | 松明 | torch | なし | 0.0 | none | 0 | `torch` x1 | 14 | true(cutout) | 固体の上面・側面のみ設置可、水流で流される |
| 30 | `glass` | ガラス | cube | あり(フル) | 0.3 | none | 0 | none | 0 | true(trans) | |
| 31 | `water` | 水 | liquid | なし(液体) | 100.0 | none | 99 | none | 0 | true(trans) | 減衰8、無限水源ルールあり |
| 32 | `lava` | 溶岩 | liquid | なし(液体) | 100.0 | none | 99 | none | 15 | true(trans) | 減衰4、4dmg/0.5s+炎上 |
| 33 | `oak_door` | オークのドア | door | あり(板状/開閉) | 3.0 | axe | 0 | `oak_door` x1 | 0 | true(cutout) | 向き保持、タップ開閉、ゾンビ破壊対象 |
| 34 | `ladder` | はしご | ladder | あり(薄板/昇降) | 0.4 | axe | 0 | `ladder` x1 | 0 | true(cutout) | 向き保持、固体側面のみ設置可 |
| 35 | `oak_fence` | オークのフェンス | fence | あり(柱/高さ1.5) | 2.0 | axe | 0 | `oak_fence` x1 | 0 | true(cutout) | 隣接フェンス・固体と自動接続 |
| 36 | `cobblestone_stairs` | 丸石の階段 | stairs | あり(階段L字) | 2.0 | pickaxe | 1 | `cobblestone_stairs` x1 | 0 | true(cutout) | 向き保持、自動段差昇降 |
| 37 | `oak_slab` | オークのハーフブロック | slab | あり(下/上0.5) | 2.0 | axe | 0 | `oak_slab` x1 | 0 | true(cutout) | 設置位置で下付き/上付き保持 |
| 38 | `bed` | ベッド | slab | あり(高さ0.56) | 0.2 | none | 0 | `bed` x1 | 0 | true(cutout) | 2ブロック占有、夜スキップ+リスポーン |
| 39 | `farmland` | 耕地 | cube | あり(高さ0.9375) | 0.6 | shovel | 0 | `dirt` x1 | 0 | false | 水源4ブロック以内で湿潤維持、外れると乾燥し土に戻る |
| 40 | `wheat_crop` | 小麦の作物 | cross | なし | 0.0 | none | 0 | `wheat` x1 + `wheat_seeds` x0-3 | 0 | true(cutout) | 成長段階0-7(光9以上で成長) |
| 41 | `cactus` | サボテン | cactus | あり(幅0.875) | 0.4 | none | 0 | `cactus` x1 | 0 | true(cutout) | 接触1dmg/0.5s、隣接固体ブロックがあると破壊 |
| 42 | `sugar_cane` | サトウキビ | cross | なし | 0.0 | none | 0 | `sugar_cane` x1 | 0 | true(cutout) | 水辺隣接で成長 |
| 43 | `short_grass` | 草 | cross | なし | 0.0 | none | 0 | `wheat_seeds` x1 (12.5%) | 0 | true(cutout) | クロス形状 |
| 44 | `poppy` | ポピー | cross | なし | 0.0 | none | 0 | `poppy` x1 | 0 | true(cutout) | クロス形状 |
| 45 | `dandelion` | タンポポ | cross | なし | 0.0 | none | 0 | `dandelion` x1 | 0 | true(cutout) | クロス形状 |
| 46 | `cobweb` | クモの巣 | cross | あり(減速判定) | 4.0 | sword/shears | 0 | `string` x1 | 0 | true(cutout) | 移動速度85%減・落下ダメージ無効 |
| 47 | `rail` | レール | rail | なし | 0.7 | pickaxe | 0 | `rail` x1 | 0 | true(cutout) | 板形状・廃坑生成 |
| 48 | `snow_block` | 雪ブロック | cube | あり(フル) | 0.2 | shovel | 0 | `snowball` x4 | 0 | false | |
| 49 | `ice` | 氷 | cube | あり(フル) | 0.5 | pickaxe | 0 | none | 0 | true(trans) | 滑る(摩擦低減)、破壊時下に固体あれば水源化 |
| 50 | `clay` | 粘土 | cube | あり(フル) | 0.6 | shovel | 0 | `clay_ball` x4 | 0 | false | 水辺生成 |
| 51 | `obsidian` | 黒曜石 | cube | あり(フル) | 50.0 | pickaxe | 4 | `obsidian` x1 | 0 | false | 水+溶岩源で生成 |
| 52 | `dirt_path` | 砂利の道 | cube | あり(高さ0.9375) | 0.65 | shovel | 0 | `dirt` x1 | 0 | false | 村の道 |
| 53 | `copper_block` | 銅ブロック | cube | あり(フル) | 3.0 | pickaxe | 2 | `copper_block` x1 | 0 | false | |
| 54 | `iron_block` | 鉄ブロック | cube | あり(フル) | 5.0 | pickaxe | 2 | `iron_block` x1 | 0 | false | |
| 55 | `diamond_block` | ダイヤモンドブロック | cube | あり(フル) | 5.0 | pickaxe | 3 | `diamond_block` x1 | 0 | false | |
| 56 | `spawner` | モンスタースポナー | cube | あり(フル) | 5.0 | pickaxe | 1 | none | 0 | true(cutout) | 16m以内で最大4体、光量無視、クモのみ |
| 57 | `white_wool` | 羊毛(白) | cube | あり(フル) | 0.8 | shears | 0 | `white_wool` x1 | 0 | false | 羊ドロップ/クラフト |
| 58 | `oak_sapling` | オークの苗木 | cross | なし | 0.0 | none | 0 | `oak_sapling` x1 | 0 | true(cutout) | 光9以上・時間/骨粉でオークの木に成長 |
| 59 | `birch_sapling` | シラカバの苗木 | cross | なし | 0.0 | none | 0 | `birch_sapling` x1 | 0 | true(cutout) | 光9以上・時間/骨粉でシラカバの木に成長 |
| 60 | `spruce_sapling` | トウヒの苗木 | cross | なし | 0.0 | none | 0 | `spruce_sapling` x1 | 0 | true(cutout) | 光9以上・時間/骨粉でトウヒの木に成長 |
| 61 | `jungle_sapling` | ジャングルの苗木 | cross | なし | 0.0 | none | 0 | `jungle_sapling` x1 | 0 | true(cutout) | 光9以上・時間/骨粉でジャングルの木に成長 |
| 62 | `potato_crop` | ジャガイモの作物 | cross | なし | 0.0 | none | 0 | `potato` x1-4 | 0 | true(cutout) | 成長段階0-7(光9以上で成長)、村の畑に配置 |
| 63 | `carrot_crop` | ニンジンの作物 | cross | なし | 0.0 | none | 0 | `carrot` x1-4 | 0 | true(cutout) | 成長段階0-7(光9以上で成長)、村の畑に配置 |
| 64 | `fire` | 炎 | cross | なし(接触炎上) | 0.0 | none | 0 | none | 15 | true(cutout) | 可燃ブロックへ延焼、可燃物が無いと消滅 |
| 65 | `tnt` | TNT | cube | あり(フル) | 0.0 | none | 0 | `tnt` x1 | 0 | false | 火打石と打ち金/炎で着火→4秒後に爆発(地形破壊あり) |
| 66 | `bricks` | レンガ | cube | あり(フル) | 2.0 | pickaxe | 1 | `bricks` x1 | 0 | false | `brick` x4 でクラフト |

---

## 2. アイテム・ツール・防具一覧 (`src/data/items.js`)

### 2-1. 素材・道具アイテム (`100` 〜 `149`)
| ID | スネークケース名 | 日本語名 | スタック | 耐久 | 燃焼時間(秒) | 用途・備考 |
|---|---|---|---|---|---|---|
| 100 | `stick` | 棒 | 64 | - | 5 | ツール・松明・フェンス・はしご素材 |
| 101 | `coal` | 石炭 | 64 | - | 80 | 燃料(8個精錬)・松明素材 |
| 102 | `charcoal` | 木炭 | 64 | - | 80 | 原木精錬・燃料(8個精錬) |
| 103 | `raw_copper` | 銅の原石 | 64 | - | - | 精錬で `copper_ingot` |
| 104 | `raw_iron` | 鉄の原石 | 64 | - | - | 精錬で `iron_ingot` |
| 105 | `raw_gold` | 金の原石 | 64 | - | - | 精錬で `gold_ingot` |
| 106 | `copper_ingot` | 銅インゴット | 64 | - | - | 銅ツール・銅防具素材 |
| 107 | `iron_ingot` | 鉄インゴット | 64 | - | - | 鉄ツール・鉄防具・バケツ素材 |
| 108 | `gold_ingot` | 金インゴット | 64 | - | - | 金リンゴ素材 |
| 109 | `diamond` | ダイヤモンド | 64 | - | - | ダイヤツール・防具素材 |
| 110 | `emerald` | エメラルド | 64 | - | - | 村人取引通貨 |
| 111 | `lapis_lazuli` | ラピスラズリ | 64 | - | - | 取引専用(レシピ無し) |
| 112 | `redstone` | レッドストーン | 64 | - | - | 取引専用(レシピ無し) |
| 113 | `flint` | 火打石 | 64 | - | - | 矢・火打石と打ち金素材 |
| 114 | `string` | 糸 | 64 | - | - | 弓・羊毛素材 |
| 115 | `bone` | 骨 | 64 | - | - | 骨粉素材 |
| 116 | `bone_meal` | 骨粉 | 64 | - | - | 作物・苗木の成長を1段階進める |
| 117 | `feather` | 羽根 | 64 | - | - | 矢素材 |
| 118 | `leather` | 革 | 64 | - | - | 革防具・取引素材 |
| 119 | `gunpowder` | 火薬 | 64 | - | - | `tnt` クラフト素材 |
| 120 | `wheat_seeds` | 小麦の種 | 64 | - | - | 耕地に植えて `wheat_crop` |
| 121 | `wheat` | 小麦 | 64 | - | - | パン素材・動物誘導・村人取引 |
| 122 | `bow` | 弓 | 1 | 384 | - | 遠距離攻撃(`arrow`消費、最大dmg 9: wiki実値) |
| 123 | `arrow` | 矢 | 64 | - | - | 弓の弾薬（命中矢は回収可、外れ矢は消滅） |
| 124 | `bucket` | バケツ | 16 | - | - | 水源・溶岩源の回収 |
| 125 | `water_bucket` | 水入りバケツ | 1 | - | - | 水源設置・落下ダメージ無効化 |
| 126 | `lava_bucket` | 溶岩入りバケツ | 1 | - | 1000 | 溶岩源設置・かまど燃料(100個精錬、空バケツ返却) |
| 127 | `shears` | ハサミ | 1 | 238 | - | 羊毛・葉ブロック回収 |
| 128 | `flint_and_steel` | 火打石と打ち金 | 1 | 64 | - | タップ対象面に着火 (`fire` 設置 / `tnt` 起爆) |
| 129 | `snowball` | 雪玉 | 16 | - | - | 投擲可能(ダメージ0、スタック16) |
| 130 | `clay_ball` | 粘土玉 | 64 | - | - | 精錬で `brick` |
| 131 | `brick` | レンガ(アイテム) | 64 | - | - | `clay_ball` を精錬、4個で `bricks` ブロック |

### 2-2. ツール5段階 (`150` 〜 `174`, スタック1)
- **採掘速度倍率**: `wooden` = 2.0x / `stone` = 4.0x / `copper` = 5.0x / `iron` = 6.0x / `diamond` = 8.0x
- **重要ゲート仕様**: 銅ツルハシ (`copper_pickaxe`) の採掘ティアは石と同等の `2` とし、**金鉱石 (`gold_ore`)・レッドストーン鉱石 (`redstone_ore`)・ダイヤモンド鉱石 (`diamond_ore`)・エメラルド鉱石 (`emerald_ore`) は採掘不可（鉄ツルハシ以上 `tier 3` が必要）** といたします。

| ティア | 耐久 | 採掘ティア | 剣 (`*_sword`) 攻撃力 | ツルハシ (`*_pickaxe`) 攻撃力 | 斧 (`*_axe`) 攻撃力 | シャベル (`*_shovel`) 攻撃力 | クワ (`*_hoe`) 攻撃力 |
|---|---|---|---|---|---|---|---|
| `wooden` (木) | 59 | 1 | `wooden_sword` (150): 4 | `wooden_pickaxe` (151): 2 | `wooden_axe` (152): 3 | `wooden_shovel` (153): 1 | `wooden_hoe` (154): 1 |
| `stone` (石) | 131 | 2 | `stone_sword` (155): 5 | `stone_pickaxe` (156): 3 | `stone_axe` (157): 4 | `stone_shovel` (158): 2 | `stone_hoe` (159): 1 |
| `copper` (銅) | 190 | 2 | `copper_sword` (160): 4 | `copper_pickaxe` (161): 2 (鉄以上鉱石は採掘不可) | `copper_axe` (162): 3 | `copper_shovel` (163): 1 | `copper_hoe` (164): 1 |
| `iron` (鉄) | 250 | 3 | `iron_sword` (165): 6 | `iron_pickaxe` (166): 4 | `iron_axe` (167): 5 | `iron_shovel` (168): 3 | `iron_hoe` (169): 1 |
| `diamond` (ダイヤ) | 1561 | 4 | `diamond_sword` (170): 7 | `diamond_pickaxe` (171): 5 | `diamond_axe` (172): 6 | `diamond_shovel` (173): 4 | `diamond_hoe` (174): 1 |

### 2-3. 防具4部位・5段階 (`175` 〜 `194`, スタック1)
- 防御ポイント1あたりダメージ4%軽減（最大20ポイント = 80%軽減）。

| ティア | ヘルメット (`*_helmet`) 耐久/防御 | チェストプレート (`*_chestplate`) 耐久/防御 | レギンス (`*_leggings`) 耐久/防御 | ブーツ (`*_boots`) 耐久/防御 | 合計防御 |
|---|---|---|---|---|---|
| `leather` (革) | `leather_helmet` (175): 55 / 1 | `leather_chestplate` (176): 80 / 3 | `leather_leggings` (177): 75 / 2 | `leather_boots` (178): 65 / 1 | 7 (28%) |
| `copper` (銅) | `copper_helmet` (179): 121 / 2 | `copper_chestplate` (180): 176 / 4 | `copper_leggings` (181): 165 / 3 | `copper_boots` (182): 143 / 1 | 10 (40%) |
| `iron` (鉄) | `iron_helmet` (183): 165 / 2 | `iron_chestplate` (184): 240 / 6 | `iron_leggings` (185): 225 / 5 | `iron_boots` (186): 195 / 2 | 15 (60%) |
| `gold` (金) | `gold_helmet` (187): 77 / 2 | `gold_chestplate` (188): 112 / 5 | `gold_leggings` (189): 105 / 3 | `gold_boots` (190): 91 / 1 | 11 (44%) |
| `diamond` (ダイヤ) | `diamond_helmet` (191): 363 / 3 | `diamond_chestplate` (192): 528 / 8 | `diamond_leggings` (193): 495 / 6 | `diamond_boots` (194): 429 / 3 | 20 (80%) |

---

## 3. 食料・疲労仕様 (`src/data/food.js`, `src/systems/hunger.js`)

### 3-1. 食料一覧 (`200` 〜 `215`, スタック64)
| ID | スネークケース名 | 日本語名 | 空腹回復量 | 隠し満腹度回復 | 満腹時摂取 | 特殊効果・備考 |
|---|---|---|---|---|---|---|
| 200 | `apple` | リンゴ | 4 | 2.4 | 不可 | オークの葉からドロップ |
| 201 | `bread` | パン | 5 | 6.0 | 不可 | `wheat` x3 でクラフト |
| 202 | `raw_beef` | 生の牛肉 | 3 | 1.8 | 不可 | 牛ドロップ |
| 203 | `cooked_beef` | ステーキ | 8 | 12.8 | 不可 | `raw_beef` を精錬 |
| 204 | `raw_porkchop` | 生の豚肉 | 3 | 1.8 | 不可 | 豚ドロップ |
| 205 | `cooked_porkchop` | 焼き豚 | 8 | 12.8 | 不可 | `raw_porkchop` を精錬 |
| 206 | `raw_chicken` | 生の鶏肉 | 2 | 1.2 | 不可 | 30%で食中毒(空腹減り2倍・30秒) |
| 207 | `cooked_chicken` | 焼き鳥 | 6 | 7.2 | 不可 | `raw_chicken` を精錬 |
| 208 | `raw_mutton` | 生の羊肉 | 2 | 1.2 | 不可 | 羊ドロップ |
| 209 | `cooked_mutton` | 焼き羊肉 | 6 | 9.6 | 不可 | `raw_mutton` を精錬 |
| 210 | `rotten_flesh` | 腐った肉 | 4 | 0.8 | 不可 | 80%で食中毒(空腹減り2倍・30秒) |
| 211 | `golden_apple` | 金のリンゴ | 4 | 9.6 | **可能** | 再生II(5秒)+衝撃吸収I(2分) |
| 212 | `potato` | ジャガイモ | 1 | 0.6 | 不可 | 耕地に植えて `potato_crop` |
| 213 | `baked_potato` | ベイクドポテト | 5 | 6.0 | 不可 | `potato` を精錬 |
| 214 | `carrot` | ニンジン | 3 | 3.6 | 不可 | 耕地に植えて `carrot_crop` |

### 3-2. 空腹・疲労度仕様 (統合版準拠)
- **上限と消費順序**: 隠し満腹度の上限は**現在の空腹値と同値**といたします。疲労度が蓄積すると**隠し満腹度が先に減少し、隠し満腹度が `0` になってから空腹ゲージが減少**いたします。
- **飢餓ダメージ**: 空腹ゲージが `0` になると `4秒` ごとに `1ダメージ` を受けます（難易度はノーマル固定のため、**体力 `10` で停止**いたします）。
- **食中毒状態**: 発動から **30秒間、疲労度の蓄積速度（空腹の減り）が2倍** になります。
- **疲労度加算表**（累積 `4.0` ごとに隠し満腹度または空腹ゲージが `1` 減少）:
  - **ダッシュ**: `0.1` / m
  - **ダッシュジャンプ**: `0.2` / 回
  - **通常ジャンプ**: `0.05` / 回
  - **ブロック採掘**: `0.005` / 個
  - **攻撃**: `0.1` / 回
  - **被弾**: `0.1` / 回
  - **自然回復 (1HPあたり)**: `6.0` (空腹18以上かつ隠し満腹度 > 0 のとき4秒毎に1HP回復)

---

## 4. クラフト・精錬・村人取引一覧 (`src/data/recipes.js`, `src/data/trades.js`)

### 4-1. クラフトレシピ (2x2 / 3x3)
| カテゴリ | 出力アイテム (スネークケース名 x個) | 必要素材 | 形状 | 備考 |
|---|---|---|---|---|
| 基本 | `oak_planks` x4 | `oak_log` / `birch_log` / `spruce_log` / `jungle_log` x1 | 2x2形なし | 全原木からオーク板材へ変換 |
| 基本 | `stick` x4 | `oak_planks` x2 (縦) | 2x2形あり | |
| 基本 | `crafting_table` x1 | `oak_planks` x4 (2x2) | 2x2形あり | |
| 基本 | `torch` x4 | `coal` または `charcoal` x1 + `stick` x1 (縦) | 2x2形あり | |
| 基本 | `bone_meal` x3 | `bone` x1 | 2x2形なし | |
| 設備 | `furnace` x1 | `cobblestone` x8 (外周) | 3x3形あり | |
| 設備 | `chest` x1 | `oak_planks` x8 (外周) | 3x3形あり | |
| 設備 | `bed` x1 | `white_wool` x3 (上段) + `oak_planks` x3 (中段) | 3x3形あり | |
| 建材 | `oak_door` x3 | `oak_planks` x6 (2列x3段) | 3x3形あり | |
| 建材 | `ladder` x3 | `stick` x7 (H字型) | 3x3形あり | |
| 建材 | `oak_fence` x3 | `oak_planks` x4 + `stick` x2 | 3x3形あり | |
| 建材 | `cobblestone_stairs` x4 | `cobblestone` x6 (階段型) | 3x3形あり | |
| 建材 | `oak_slab` x6 | `oak_planks` x3 (横1列) | 3x3形あり | |
| 建材 | `bricks` x1 | `brick` x4 (2x2) | 2x2形あり | |
| 爆発 | `tnt` x1 | `gunpowder` x5 + `sand` x4 (市松模様) | 3x3形あり | |
| ツール | `*_sword` x1 | 頭素材 x2 + `stick` x1 (縦) | 3x3形あり | wooden/stone/copper/iron/diamond |
| ツール | `*_pickaxe` x1 | 頭素材 x3(上横) + `stick` x2(縦) | 3x3形あり | wooden/stone/copper/iron/diamond |
| ツール | `*_axe` x1 | 頭素材 x3(L字) + `stick` x2(縦) | 3x3形あり | wooden/stone/copper/iron/diamond |
| ツール | `*_shovel` x1 | 頭素材 x1 + `stick` x2 (縦) | 3x3形あり | wooden/stone/copper/iron/diamond |
| ツール | `*_hoe` x1 | 頭素材 x2(上横) + `stick` x2(縦) | 3x3形あり | wooden/stone/copper/iron/diamond |
| 防具 | `*_helmet` x1 | 素材 x5 (逆U字) | 3x3形あり | leather/copper/iron/gold/diamond |
| 防具 | `*_chestplate` x1 | 素材 x8 (T字欠け) | 3x3形あり | leather/copper/iron/gold/diamond |
| 防具 | `*_leggings` x1 | 素材 x7 (門型) | 3x3形あり | leather/copper/iron/gold/diamond |
| 防具 | `*_boots` x1 | 素材 x4 (左右2縦) | 3x3形あり | leather/copper/iron/gold/diamond |
| 道具 | `bucket` x1 | `iron_ingot` x3 (V字) | 3x3形あり | |
| 道具 | `shears` x1 | `iron_ingot` x2 (斜め) | 2x2形あり | |
| 道具 | `flint_and_steel` x1 | `iron_ingot` x1 + `flint` x1 | 2x2形なし | |
| 道具 | `bow` x1 | `stick` x3 + `string` x3 | 3x3形あり | |
| 道具 | `arrow` x4 | `flint` x1 + `stick` x1 + `feather` x1 (縦) | 3x3形あり | |
| 食料 | `bread` x1 | `wheat` x3 (横1列) | 3x3形あり | |
| 食料 | `golden_apple` x1 | `gold_ingot` x8 + `apple` x1 | 3x3形あり | |
| 圧縮 | `copper_block` / `iron_block` / `diamond_block` x1 | 各インゴット/宝石 x9 | 3x3形あり | 逆変換(9個還元)も実装 |
| 圧縮 | `white_wool` x1 | `string` x4 (2x2) | 2x2形あり | |

### 4-2. かまど精錬レシピ (1個あたり10秒)
| 入力 | 出力 | 備考 |
|---|---|---|
| `raw_copper` | `copper_ingot` | |
| `raw_iron` | `iron_ingot` | |
| `raw_gold` | `gold_ingot` | |
| `cobblestone` | `stone` | |
| `sand` | `glass` | |
| `clay_ball` | `brick` | |
| `oak_log` / `birch_log` / `spruce_log` / `jungle_log` | `charcoal` | |
| `raw_beef` / `raw_porkchop` / `raw_chicken` / `raw_mutton` | `cooked_beef` / `cooked_porkchop` / `cooked_chicken` / `cooked_mutton` | |
| `potato` | `baked_potato` | |

※燃料燃焼時間: `lava_bucket`=1000秒(100個・空バケツ返却) / `coal`・`charcoal`=80秒(8個) / `oak_planks`・各原木=15秒(1.5個) / 木ツール=10秒(1個) / `stick`=5秒(0.5個)

### 4-3. 村人取引一覧 (`src/data/trades.js`)
- 全取引共通仕様: **在庫無限・職業レベルアップ無し**（村人タップで簡易取引UIを表示）。

| No | 支払アイテム (スネークケース名 x個) | 受取アイテム (スネークケース名 x個) | 種別 |
|---|---|---|---|
| 1 | `emerald` x1 | `bread` x3 | 購入 (食料) |
| 2 | `emerald` x1 | `carrot` x4 | 購入 (食料) |
| 3 | `emerald` x2 | `potato` x5 | 購入 (食料) |
| 4 | `emerald` x3 | `iron_ingot` x1 | 購入 (素材) |
| 5 | `emerald` x4 | `iron_pickaxe` x1 | 購入 (ツール) |
| 6 | `emerald` x5 | `diamond` x1 | 購入 (貴重品) |
| 7 | `lapis_lazuli` x8 | `emerald` x1 | 売却 (鉱物) |
| 8 | `redstone` x12 | `emerald` x1 | 売却 (鉱物) |
| 9 | `wheat` x16 | `emerald` x1 | 売却 (農作物) |

---

## 5. モブ・動物一覧 (`src/data/mobs.js`)

※難易度は**ノーマル固定**です（難易度切替およびデバッグパネル内の難易度変更は存在いたしません）。

| スネークケース名 | 日本語名 | 分類 | HP | 攻撃力(ノーマル) | 移動速度 | スポーン条件 | ドロップ (アイテム名 x個) | AI・特殊挙動 |
|---|---|---|---|---|---|---|---|---|
| `zombie` | ゾンビ | 敵対 | 20 | 3 | 0.23 | ブロック光0, 固体上, 夜間/地下 | `rotten_flesh` x0-2 / `iron_ingot` x1 (2.5%: wiki実値) | プレイヤー追跡、日中炎上(2dmg/s)、ドア破壊・村人攻撃 |
| `skeleton` | スケルトン | 敵対 | 20 | 矢2-4 | 0.25 | ブロック光0, 固体上, 夜間/地下 | `bone` x0-2 / `arrow` x0-2 | 距離15以内で射撃(命中矢は回収可/外れ矢は消滅)、日中炎上 |
| `creeper` | クリーパー | 敵対 | 20 | 爆発最大43 | 0.25 | ブロック光0, 固体上, 夜間/地下 | `gunpowder` x0-2 | 3m以内で導火1.5秒・3m超でキャンセル、爆発で地形破壊(ドロップ率50%) |
| `spider` | クモ | 敵対/中立 | 16 | 2 | 0.30 | ブロック光0, 固体上, 夜間/廃坑スポナー | `string` x0-2 | 昼間(光12以上)は中立、壁登り可能 |
| `cow` | 牛 | 友好 | 10 | 0 | 0.20 | `grass_block` 上, 光9以上 | `leather` x0-2 / `raw_beef` x1-3 | 徘徊、`wheat` で誘導 |
| `pig` | 豚 | 友好 | 10 | 0 | 0.25 | `grass_block` 上, 光9以上 | `raw_porkchop` x1-3 | 徘徊、`carrot` / `potato` で誘導 |
| `chicken` | 鶏 | 友好 | 4 | 0 | 0.25 | `grass_block` 上, 光9以上 | `feather` x0-2 / `raw_chicken` x1 | ゆっくり落下、`wheat_seeds` で誘導 |
| `sheep` | 羊 | 友好 | 8 | 0 | 0.23 | `grass_block` 上, 光9以上 | `white_wool` x1 / `raw_mutton` x1-2 | ハサミで `white_wool` x1-3回収(草で再生) |
| `villager` | 村人 | 中立 | 20 | 0 | 0.20 | 村生成時 | none | 昼徘徊・夜ベッド就寝・タップで簡易取引UI |
| `iron_golem` | アイアンゴーレム | 中立 | 100 | 7 (ノックバック大) | 0.25 (wiki実値) | 村生成時に1-2体 | `iron_ingot` x3-5 / `poppy` x0-2 | 敵対モブを自動索敵して攻撃、プレイヤー攻撃時反撃 |

---

## 6. バイオーム・鉱石・構造物一覧 (`src/world/*`)

### 6-1. バイオーム11種 (`src/world/biomes.js`)
| スネークケース名 | 日本語名 | 気温 | 湿度 | 標高オフセット | 地表ブロック | 樹木・植生密度 | 固有スポーン・特徴 |
|---|---|---|---|---|---|---|---|
| `plains` | 平原 | 0.8 | 0.4 | 0 | `grass_block` | オーク低密度、草花多 | 牛・豚・鶏・羊、村生成 |
| `forest` | 森 | 0.7 | 0.8 | +2 | `grass_block` | オーク高密度 | 動物全般 |
| `birch_forest` | 樺の森 | 0.6 | 0.6 | +2 | `grass_block` | シラカバ高密度 | 動物全般 |
| `desert` | 砂漠 | 2.0 | 0.0 | +1 | `sand` (下層 `sandstone`) | `cactus` 点在 | 動物湧きなし、村生成 |
| `beach` | 海岸 | 0.8 | 0.4 | -1 | `sand` | `sugar_cane` (水際) | 海抜y=62付近の緩衝帯 |
| `ocean` | 海洋 | 0.5 | 0.5 | -18 | `sand` / `gravel` (海底) | なし | 水面y=62まで `water` で満たす |
| `mountains` | 山 | 0.2 | 0.3 | +48 (最大標高 y=110) | `stone` / `grass_block` / 山頂 `snow_block` | トウヒ低密度 | 銅鉱石増量、`emerald_ore` 生成 |
| `taiga` | タイガ | 0.25 | 0.8 | +4 | `grass_block` | トウヒ高密度 | 羊多め、村生成 |
| `jungle` | ジャングル | 0.95 | 0.9 | +4 | `grass_block` | ジャングル巨木・茂み | 鶏多め |
| `swamp` | 湿地 | 0.8 | 0.9 | -2 | `grass_block` | オーク、水たまり多 | `clay` 生成多め |
| `snowy_plains` | 雪原 | 0.0 | 0.5 | 0 | `snow_block` / `grass_block` | トウヒ極少 | 水面凍結(`ice`)、村生成 |

### 6-2. 鉱石分布 (`src/world/ores.js`)
| スネークケース名 | Y座標範囲 | チャンクあたり試行回数 | 鉱脈最大サイズ | 特殊条件 |
|---|---|---|---|---|
| `coal_ore` | y = 0 .. 127 | 20 | 17 | 全バイオーム |
| `copper_ore` | y = 0 .. 96 | 16 (山は32) | 10 | 山のみ2倍 |
| `iron_ore` | y = 0 .. 64 | 20 | 9 | 全バイオーム |
| `gold_ore` | y = 0 .. 32 | 4 | 9 | 全バイオーム |
| `redstone_ore` | y = 0 .. 16 | 8 | 8 | 全バイオーム |
| `lapis_ore` | y = 0 .. 30 | 2 | 7 | y=15付近がピーク |
| `diamond_ore` | y = 0 .. 16 | 2 (y<8で4) | 8 | 深部2倍 |
| `emerald_ore` | y = 4 .. 32 | 6 | 1 | 山バイオーム限定 |

### 6-3. 構造物と戦利品 (`src/world/structures.js`, `src/data/loot.js`)
※`src/world/structures.js` は **S8 の村 (`village`)・廃坑 (`mineshaft`) 専用**といたします（樹木・草花・湖の自然生成は `src/world/gen.js` が担当いたします）。

| スネークケース名 | 日本語名 | 生成場所 | 構成要素 | チェスト戦利品 (アイテム名 x個, 確率) |
|---|---|---|---|---|
| `village` | 村 | `plains` / `desert` / `taiga` / `snowy_plains` | `dirt_path`、井戸、畑(`wheat_crop`/`potato_crop`/`carrot_crop`)、家(`bed`・`crafting_table`・`furnace`・`chest`)、`villager` 2-4体、`iron_golem` 1-2体 | `bread` x1-3 (60%), `apple` x1-3 (50%), `potato` x1-4 (40%), `carrot` x1-4 (40%), `iron_ingot` x1-3 (25%), `emerald` x1-2 (20%), `oak_sapling` x1-2 (40%), `iron_pickaxe` x1 (10%) |
| `mineshaft` | 廃坑 | 地下 y = 15 .. 45 | 3x3坑道、`oak_planks`・`oak_fence` 支柱、`rail`、`cobweb`、`spawner`(クモ)、`chest` | `iron_ingot` x1-5 (45%), `coal` x3-8 (60%), `rail` x4-8 (50%), `torch` x4-12 (60%), `bread` x1-3 (40%), `diamond` x1-2 (10%), `golden_apple` x1 (5%) |

---

## 7. 挙動仕様（物理・戦闘・環境・設置制約）

### 7-1. 物理・戦闘・環境・エンティティ挙動
- **攻撃無敵時間**: プレイヤーおよびモブへの攻撃ヒット後は `0.5秒`（10tick）の無敵時間が発生し、**無敵時間中の連続ヒットは空振り**（ダメージ・ノックバックなし）となります。
- **落下ダメージ**: `落下距離(ブロック) - 3`（3ブロック未満は無傷）。着地先が `water` または `cobweb` の場合は落下ダメージを完全に無効化いたします。
- **水中挙動**:
  - 移動速度が通常の `1/2` になります。
  - 水中でのブロック採掘速度が通常の `1/5` になります。
  - 酸素ゲージは `15秒`（300tick）。酸素が尽きると溺れダメージが開始し、以降 `1秒` ごとに `1ダメージ` を受けます。
- **水・溶岩・炎・植物の環境ルール**:
  - **無限水源**: 水平隣接4方向のうち `2方向以上` が水源ブロックに挟まれた水流ブロックは、自動的に新たな水源ブロックへ変化いたします。
  - **黒曜石生成**: 溶岩源ブロックに水が接触すると `obsidian` へ変化いたします（水流に水が接触した場合は `cobblestone`）。
  - **水流による流出**: `torch` に水流が接触すると破壊されてアイテム化いたします。
  - **延焼と消火**: `fire` は周囲の可燃ブロック（原木・板材・葉・羊毛・草花・TNT）へ延焼し、周囲に可燃ブロックが存在しなくなると自然消滅いたします。
  - **耕地と成長条件**: `farmland` は水源から水平4ブロック以内に無いと乾燥して `dirt` に戻ります。作物3種および苗木4種は**光レベル `9` 以上でのみ成長**いたします。
  - **サボテンの破壊条件**: `cactus` は水平4方向のいずれかに隣接する固体ブロックが存在すると即座に破壊されてアイテム化いたします。
- **ドロップアイテム・投擲物**:
  - 地面にドロップしたアイテムは寿命 `5分`（6000tick）。半径1.5ブロック以内の同種アイテムは自動的に1つのスタックへ合流いたします。`y < 0`（奈落）へ落ちた場合は即消滅いたします。
  - `snowball` はタップで投擲可能（ダメージ0、ノックバック演出のみ）。
- **爆発・モブ特殊挙動**:
  - **クリーパー爆破**: プレイヤーから `3m以内` で導火（1.5秒）を開始し、`3m超` へ離れると導火をキャンセルいたします。爆発時は周囲のブロックを破壊（ドロップ率 `50%`）。`tnt` の起爆（4秒後爆発）も同一の爆発処理を共用いたします。
  - **睡眠時のスポーン抑止と起床判定**: ベッドで睡眠中は周囲にモブがスポーンいたしません。また、ベッド使用時に半径 `8ブロック以内` に敵対モブがいる場合は睡眠できず（または即座に）起床いたします。
  - **スケルトンの矢**: プレイヤーやモブに命中した矢は対象に刺さりアイテムとして回収可能。ブロックや地面に外れて刺さった矢は消滅いたします。
  - **ゾンビの特殊行動**: 進路上の `oak_door` を攻撃して破壊し、`villager` も索敵して攻撃いたします。

### 7-2. 設置系ブロックの向き保持・設置制約表
チャンク内のブロック状態（メタデータ `Uint8Array`）に設置時の向き・状態を保持いたします。

| ブロック | 向き・状態保持 | 設置制約・特殊挙動 |
|---|---|---|
| `chest` (チェスト) | 設置時にプレイヤーの正面（4方向 N/S/E/W）を向く | 隣接する同向きのチェストと結合して**大チェスト（54枠）**として機能 |
| `furnace` (かまど) | 設置時にプレイヤーの正面（4方向）を向く | 燃焼中フラグを保持し、光源レベル13を発光 |
| `oak_door` (ドア) | 設置時にプレイヤーの正面（4方向）＋開閉状態（開/閉）を保持 | 上下2ブロックを占有。タップで開閉トグル |
| `bed` (ベッド) | 設置時にプレイヤーの奥方向（4方向）へ足側を向ける | **足側・頭側の計2ブロックの空間が必要**。タップでリスポーン地点を設定し、夜間であれば朝（tick=0）へスキップしてスリープ解除 |
| `cobblestone_stairs` (階段) | 設置時にプレイヤーの正面（4方向）へ昇り向きを向ける | 段差0.5ブロック×2段のL字判定によりジャンプ不要で昇降可能 |
| `oak_slab` (ハーフブロック) | タップした面の高さ（下半分/上半分）に応じて下付き・上付きを保持 | 既存の下付きハーフ上面への同種設置でフルブロック相当へ合体 |
| `oak_fence` (フェンス) | 周囲4方向の隣接ブロック（同種フェンス・フル固体ブロック）に応じて自動接続状態を計算 | 当たり判定高さ `1.5` ブロック（通常ジャンプで飛び越え不可） |
| `ladder` (はしご) | 貼り付けた固体ブロックの面（4方向）を保持 | **固体ブロックの側面のみ設置可能**（支えがなくなるとドロップ）。当たり判定なし・接触時上昇/下降 |
| `torch` (松明) | 設置面（上面または4側面）の傾き向きを保持 | **固体ブロックの上面または側面のみ設置可能**（下面・非固体には設置不可、支え喪失・水流接触でドロップ）。当たり判定なし |

---

## 8. 描画・性能制約

- **描画パスの3分割と水面のカリング**:
  1. **不透明パス (`opaque`)**: 通常のフルブロック・原木・鉱石など。背面カリング有効・深度テスト/書き込み有効。
  2. **カットアウトパス (`cutout`)**: 葉 (`*_leaves`)・草花・作物・クモの巣・苗木・松明・ドア・はしご・フェンス・階段・スラブ・レール・スポナー・炎。**葉をアルファブレンドにせず、シェーダ内のアルファテスト（`alpha < 0.5` で `discard`）で高速描画**いたします。
  3. **透過パス (`translucent`)**: 水 (`water`)・ガラス (`glass`)・氷 (`ice`)。**水は隣接する水ブロックとの境界面を完全にカリングし、空気等に接する水面・側面のみを描画**いたします。カメラからの距離ソート（遠→近）でアルファブレンド描画いたします。
- **バッチ描画とドローコール目標**:
  - ドロップアイテムおよび矢・雪玉のエンティティはインスタンシングまたは動的頂点バッチにより**1ドローコール**にまとめて描画いたします。
  - **描画距離4での全体ドローコール目標は `400以下`** といたします。
- **ライト再計算の上限打ち切り**: ブロックの設置・破壊に伴うブロックライトのフラッドフィル再計算は、フレーム落ちを防ぐため**1回の変更あたり最大 `4096ブロック` で打ち切り**といたします。
- **エンティティ・パーティクル上限の分離**:
  - **敵対モブ**: 最大 `8体 / player`（全体上限40体枠内）
  - **友好動物**: 最大 `10体 / player`
  - **パーティクル**: **1チャンクあたり `64個` 上限**（全体リングバッファ管理）
  - **ドロップアイテム・矢・投擲物**: モブ上限とは**別枠の固定プール**で管理

---

## 9. 実装スコープ外（意図的に除外する要素）

本プロジェクト（ビルド不要・静的WebGL2・iPad第9世代60fps維持）の制約および設計方針に基づき、以下の要素は**実装スコープ外**と明記いたします。
1. **エンチャント・金床・経験値システム**（経験値オーブ、レベル、エンチャントテーブル、金床）
2. **ポーション醸造・空腹と食中毒以外の状態異常**（食中毒による空腹減り2倍・30秒、および金リンゴの即時再生/衝撃吸収のみ簡易実装）
3. **ネザー・エンド等の別ディメンション**（ネザーポータル、ネザーラック等）
4. **レッドストーン回路・ピストン・リピーター・コンパレーター**（レッドストーンは取引専用アイテムとしてのみ存在）
5. **色付き羊毛・染料バリエーション**（羊毛は `white_wool` のみ）
6. **樹種ごとの板材・ドア・フェンス・ハーフブロックの個別バリエーション**（原木・葉・苗木は4種あるが、加工後の板材等はすべて `oak_*` に統合）
7. **川バイオーム**（`ocean` と `beach` の組み合わせで代用）
8. **洞窟グモ**（廃坑スポナーを含め通常の `spider` で代用）
9. **動物の繁殖・子供個体・牛乳（ミルク）**
10. **ボート・釣り竿**
11. **本棚・看板・石レンガ・砂糖・紙・本・ケーキ・クッキー・キノコシチュー**
12. **村人ゾンビ・治療システム・襲撃イベント・難易度切替（ノーマル固定）**
13. **村人の職業別レベルアップ・全取引テーブル網羅**（エメラルドを軸とした9種の無限在庫取引のみ実装）

---

## 10. 必須カテゴリ充足表（自己採点・STAGE割り当て）

| No | 必須カテゴリ | STAGE | 状態 | 対応ファイル・設計方針 |
|---|---|---|---|---|
| 1 | 地形 | **S3** | **実装予定** | `src/world/gen.js` (2D/3D自前パーリンノイズ、決定論シード、海面y=62) |
| 2 | バイオーム11種 | **S3** | **実装予定** | `src/world/biomes.js` (`plains`〜`snowy_plains` 11種＋境界ブレンド、`mountains`標高+48/最大y=110) |
| 3 | 洞窟 | **S3** | **実装予定** | `src/world/gen.js` (3Dノイズによる洞窟生成) |
| 4 | 峡谷 | **S3** | **実装予定** | `src/world/gen.js` (細長い縦裂け目ノイズ生成) |
| 5 | 鉱石8種とY範囲 | **S3** | **実装予定** | `src/world/ores.js` (`coal_ore`〜`emerald_ore` 8種、Y範囲・山補正準拠) |
| 6 | 村 | **S8** | **実装予定** | `src/world/structures.js` (S8村・廃坑専用。4バイオーム対応、家・畑・井戸・道・設備・村人・アイアンゴーレム) |
| 7 | 廃坑 | **S8** | **実装予定** | `src/world/structures.js` (S8村・廃坑専用。坑道・梁・レール・クモの巣・クモスポナー・チェスト) |
| 8 | チェスト戦利品 | **S8** | **実装予定** | `src/data/loot.js` (重み付きテーブル抽選、村・廃坑別設定) |
| 9 | 木と植物 | **S3** (成長機構は **S8**) | **実装予定** | `src/world/gen.js` (樹木・草花・苗木・作物ブロックの生成定義、S3完了時点で木が生成されS4で伐採できること。作物・苗木の時間/骨粉成長機構はS8) |
| 10 | 水と溶岩 | **S4** | **実装予定** | `src/world/gen.js`, `src/physics.js` (減衰8/4、無限水源、黒曜石生成、浮力・溺れ・溶岩ダメージ、水面カリング) |
| 11 | ブロック種別ごとの形状 | **S2** (cube/cross) / **S4** (その他形状) | **実装予定** | `src/world/mesh.js` (S2で3パス描画とcube/cross形状、S4でtorch/door/ladder/fence/stairs/slab/rail/liquid形状) |
| 12 | ツール5段階とゲート | **S4** | **実装予定** | `src/data/items.js`, `src/physics.js` (木/石/銅/鉄/ダイヤ、銅は鉄以上鉱石採掘不可、ティア不足ドロップ無し) |
| 13 | 防具4部位5段階 | **S6** | **実装予定** | `src/data/items.js`, `src/systems/combat.js` (革/銅/鉄/金/ダイヤ、銅防具耐久 121/176/165/143、防御ポイント軽減・耐久消耗) |
| 14 | 食料と満腹度 | **S6** | **実装予定** | `src/data/food.js`, `src/systems/hunger.js` (15種、満腹時拒否、金リンゴ例外、食中毒30秒2倍) |
| 15 | かまどと燃料 | **S5** | **実装予定** | `src/systems/furnace.js`, `src/ui/furnace.js` (10秒精錬、溶岩バケツ・粘土玉含む燃焼・精錬表) |
| 16 | クラフト全レシピ | **S5** | **実装予定** | `src/data/recipes.js`, `src/systems/crafting.js` (2x2・3x3、TNT・レンガ含む形あり/形なし判定) |
| 17 | インベントリとチェスト | **S5** | **実装予定** | `src/systems/inventory.js`, `src/ui/inventory.js`, `src/ui/chest.js` (36+9+4枠、大チェスト54枠対応、タッチ移動/分割/ゴミ箱) |
| 18 | 耐久 | **S4** | **実装予定** | `src/systems/inventory.js`, `src/systems/combat.js` (ツール・防具・ハサミ・火打石と打ち金の消耗と破損) |
| 19 | 空腹と疲労と回復と飢餓 | **S6** | **実装予定** | `src/systems/hunger.js` (隠し満腹度上限=空腹値・優先消費、通常ジャンプ0.05/ダッシュジャンプ0.2含む疲労加算、18以上回復、18未満ダッシュ不可、空腹0で体力10停止) |
| 20 | 体力とダメージ源 | **S6** | **実装予定** | `src/systems/combat.js` (0.5s無敵時間、落下距離-3/溺れ15秒後/溶岩/火/矢/TNT爆発/モブ/窒息/サボテン) |
| 21 | 防具軽減 | **S6** | **実装予定** | `src/systems/combat.js` (防御ポイント×4%軽減＋防具耐久減少) |
| 22 | 死亡とドロップ | **S6** | **実装予定** | `src/systems/combat.js`, `src/player.js` (全アイテム散乱ドロップ・寿命5分合流・バッチ描画＋リスポーン画面) |
| 23 | モブ4種とAIとドロップ | **S7** | **実装予定** | `src/systems/mobs.js`, `src/data/mobs.js` (`zombie`ドア破壊・村人攻撃/`skeleton`回収矢/`creeper`3m導火/`spider`、日中炎上) |
| 24 | 動物4種 | **S7** | **実装予定** | `src/systems/mobs.js`, `src/data/mobs.js` (`cow`/`pig`/`chicken`/`sheep`、草上スポーン、誘導・ドロップ) |
| 25 | 昼夜とベッド | **S7** | **実装予定** | `src/main.js`, `src/world/light.js` (24000tick=20分、空色・太陽光変化、ベッド2ブロック設置・周囲8m敵チェック・朝スキップ＆リスポーン設定) |
| 26 | 村人 | **S8** | **実装予定** | `src/systems/mobs.js` (徘徊・夜間ベッド就寝＋アイアンゴーレム護衛) |
| 27 | 取引 | **S8** | **実装予定** | `src/ui/trades.js`, `src/data/trades.js` (エメラルド・ラピス・レッドストーン・小麦の無限在庫9種取引UI) |
| 28 | 松明と光 | **S3** | **実装予定** | `src/world/light.js` (スカイライト伝播＋ブロックライト14減衰、最大4096ブロック打ち切り、チャンク境界再計算) |
| 29 | ドア/はしご/フェンス/ガラス/階段/スラブ | **S4** | **実装予定** | `src/world/mesh.js`, `src/physics.js` (専用形状メッシュ・向き保持・設置制約・当たり判定・開閉挙動) |
| 30 | セーブ | **S9** | **実装予定** | `src/systems/save.js` (IndexedDB + チャンクUint8ArrayのRLE圧縮、ポーズ/離脱時保存) |
| 31 | 設定 | **S9** | **実装予定** | `src/ui/settings.js` (感度/反転/スプリット/自動ジャンプ/描画距離/解像度/FOV/音量/HUD切替) |
| 32 | 操作カスタム | **S1** (基本操作) / **S9** (設定UIカスタム) | **実装予定** | `src/input.js`, `src/ui/settings.js` (S1で左スティック・右視点・基本タッチ操作、S9でスプリット切替・ボタン配置・自動ジャンプ設定) |
| 33 | デバッグパネル | **S1** (HUD/バグ報告) / **S4** (本体機能) | **実装予定** | `src/ui/debug.js`, `src/debug/*` (S1で左上ダブルタップHUD・バグ報告コピー・エラー捕捉、S4でTP/時間/モード/アイテム一覧付与、S9でセルフテスト全項目完成) |

**自己採点結果: 33 / 33 カテゴリすべて「実装予定」として網羅し、S1〜S9への精密な割り当ておよびスコープ外境界・全数値確定・村人取引仕様を完了いたしました。**