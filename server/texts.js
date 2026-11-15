// Plain ASCII only, so every key is on a normal keyboard.
export const TEXTS = [
  "Building a robot is a lot like learning to type. At first every movement is slow and deliberate, but with practice the pieces begin to fit together, and soon the machine moves with a smooth rhythm that looks almost effortless to anyone watching.",
  "A good engineer does not fear failure. Each broken circuit, each bent gear, and each unexpected error message is a small lesson in disguise, teaching you how the world really works and pointing the way toward a better design on the next attempt.",
  "On a quiet morning the factory floor hums to life. Conveyor belts begin to glide, robotic arms swing into position, and sensors blink awake one by one, while a single engineer sips her coffee and watches the whole orchestra play.",
  "Speed means nothing without accuracy. The fastest typists in the world are not the ones who hammer the keys hardest, but the ones who stay relaxed, keep their eyes ahead of their fingers, and let steady rhythm carry them across every line.",
  "Deep in the mountains there is a small village where every evening the lamps are lit in the same order. Children race through narrow streets, bakers pull warm bread from stone ovens, and the sky turns from gold to violet above the rooftops.",
  "Learning to code is a journey of small victories. You print your first message, fix your first bug, and ship your first project, and somewhere along the way the confusing symbols on the screen turn into a language you can speak fluently.",
  "Autonomous machines must sense, think, and act in a continuous loop. Cameras and lasers describe the world, algorithms decide what to do next, and motors turn those decisions into motion, all within a fraction of a second, again and again.",
  "The river wound slowly through the valley, carrying fallen leaves toward the distant sea. A heron stood perfectly still in the shallows, patient and silent, waiting for the exact moment when the water would offer up its next small silver reward.",
  "Every great startup begins with a simple question: what problem is worth solving? Founders who listen closely to real people, build quickly, and learn from honest feedback often discover that the best ideas are hiding in plain sight.",
  "When the clock strikes midnight, the city does not truly sleep. Delivery trucks rumble through empty avenues, night shift workers swap stories in glowing diners, and somewhere high above the streets a lone window shows a programmer still hard at work.",
];

export const randomText = () => TEXTS[Math.floor(Math.random() * TEXTS.length)];
