const allergenEmojiMatchers: Array<[RegExp, string]> = [
  [/mand|almond/, "🌰"],
  [/pean|jordnot|peanut/, "🥜"],
  [/brazil|paranot/, "🌰"],
  [/cashew|cashewnot/, "🌰"],
  [/hazel|hassel/, "🌰"],
  [/pecan|pekan/, "🌰"],
  [/pistach|pistasj|pistacie/, "🌰"],
  [/walnut|valnot/, "🌰"],
  [/macadamia/, "🌰"],
  [/nuts|notter|nodder/, "🌰"],
  [/barley|bygg|byg/, "🌾"],
  [/cereal|korn|spannmal/, "🌽"],
  [
    /durum|wheat|hvete|vete|hvede|emmer|einkorn|enkorn|kamut|khorasan|korasan|rye|rug|rag|spelt|dinkel|triticale/,
    "🌾",
  ],
  [/gluten/, "🌾"],
  [/crustacean|skalldyr|skaldjur|skaldyr/, "🦀"],
  [/mollusc|blotdyr|bloddyr/, "🦪"],
  [/dairy|milk|melk|mjolk|maelk|meieri|mejeri/, "🥛"],
  [/egg|agg|aeg/, "🥚"],
  [/fish|fisk/, "🐟"],
  [/celery|selleri/, "🥬"],
  [/mustard|sennep|senap/, "🌭"],
  [/sesame|sesam/, "⚪"],
  [/soy|soya|soja/, "🫘"],
  [/sulphite|sulfitt|sulfit/, "🍷"],
  [/lupin/, "🌸"],
];

export function getAllergenEmoji(name: string) {
  const normalizedName = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ø/g, "o")
    .replace(/æ/g, "ae")
    .replace(/å/g, "a")
    .replace(/ö/g, "o")
    .replace(/ä/g, "a");

  return allergenEmojiMatchers.find(([matcher]) => matcher.test(normalizedName))?.[1] ?? "•";
}
