/* 方位推算核心逻辑：八个方向按顺时针排列，地图约定「上北下南、左西右东」。
   口诀（北半球·中国大部分地区）：早上面向太阳前东后西左北右南；
   中午面向太阳前南后北左东右西；下午面向太阳前西后东左南右北。 */

export const DIRECTIONS = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];

export const PERIODS = {
  morning: { dir: '东', label: '早上', emoji: '🌅', shadow: '西' },
  noon: { dir: '南', label: '中午', emoji: '🌞', shadow: '北' },
  afternoon: { dir: '西', label: '下午', emoji: '🌇', shadow: '东' }
};

export function dirIndex(name) {
  return DIRECTIONS.indexOf(name);
}

/* 相对方向：后=+180°，左=逆时针90°，右=顺时针90° */
export function opposite(name) {
  return DIRECTIONS[(dirIndex(name) + 4) % 8];
}

export function leftOf(name) {
  return DIRECTIONS[(dirIndex(name) + 6) % 8];
}

export function rightOf(name) {
  return DIRECTIONS[(dirIndex(name) + 2) % 8];
}

/* 面向某方向时的方位卡：前/后/左/右 */
export function facingCard(name) {
  return { face: name, back: opposite(name), left: leftOf(name), right: rightOf(name) };
}

/* 地图角度：北=0°，顺时针每 45° 一格 */
export function angleOf(name) {
  return dirIndex(name) * 45;
}
