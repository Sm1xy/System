export interface RolePlayEmotion {
  action: string;
  secondaryAction: string;
  color: number;
  emoji: string;
}

export const RolePlayEmotions: { [key: string]: RolePlayEmotion } = {
  hug: {
    action: "umarmt",
    secondaryAction: "drückt",
    color: 0xff69b4,
    emoji: "🤗",
  }, // Hot Pink
  kiss: {
    action: "gibt einen Kuss an",
    secondaryAction: "küsst",
    color: 0xff0000,
    emoji: "💋",
  }, // Rot
  pat: {
    action: "tätschelt",
    secondaryAction: "klopft",
    color: 0x00ff00,
    emoji: "👋",
  }, // Grün
  slap: {
    action: "schlägt",
    secondaryAction: "schlägt",
    color: 0xff4500,
    emoji: "👋",
  }, // OrangeRot
  cuddle: {
    action: "kuschelt mit",
    secondaryAction: "schmust mit",
    color: 0xffff00,
    emoji: "🤗",
  }, // Gelb
  poke: {
    action: "stupst",
    secondaryAction: "piekst",
    color: 0x1e90ff,
    emoji: "👉",
  }, // DodgerBlue
  tickle: {
    action: "kitzelt",
    secondaryAction: "neckst",
    color: 0xdaa520,
    emoji: "😂",
  }, // Goldbraun
  wave: {
    action: "winkt zu",
    secondaryAction: "grüßt",
    color: 0x00ffff,
    emoji: "👋",
  }, // Aqua
  blush: {
    action: "errötet wegen",
    secondaryAction: "wird rot",
    color: 0xffb6c1,
    emoji: "😊",
  }, // Hellrosa
  cry: {
    action: "weint mit",
    secondaryAction: "tränt",
    color: 0x0000ff,
    emoji: "😢",
  }, // Blau
  dance: {
    action: "tanzt mit",
    secondaryAction: "schwingt das Tanzbein",
    color: 0x800080,
    emoji: "💃",
  }, // Lila
  laugh: {
    action: "lacht über",
    secondaryAction: "kichert",
    color: 0xffffff,
    emoji: "😂",
  }, // Weiß
  smile: {
    action: "lächelt zu",
    secondaryAction: "grinst",
    color: 0xffff00,
    emoji: "😊",
  }, // Gelb
  bored: {
    action: "ist gelangweilt von",
    secondaryAction: "gähnt",
    color: 0xa9a9a9,
    emoji: "😒",
  }, // Dunkelgrau
  confused: {
    action: "ist verwirrt über",
    secondaryAction: "fragt sich",
    color: 0x808080,
    emoji: "😕",
  }, // Grau
  happy: {
    action: "freut sich mit",
    secondaryAction: "ist glücklich mit",
    color: 0x00ff00,
    emoji: "😊",
  }, // Grün
  sad: {
    action: "ist traurig über",
    secondaryAction: "bedauert",
    color: 0x0000ff,
    emoji: "😢",
  }, // Blau
  scared: {
    action: "fürchtet sich vor",
    secondaryAction: "zittert vor Angst",
    color: 0x00008b,
    emoji: "😱",
  }, // Dunkelblau
  surprised: {
    action: "ist überrascht von",
    secondaryAction: "staunt über",
    color: 0xffe4b5,
    emoji: "😲",
  }, // Moccasin
  wink: {
    action: "zwinkert zu",
    secondaryAction: "blinzelt",
    color: 0xff1493,
    emoji: "😉",
  }, // Tiefrosa
};
