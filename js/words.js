/**
 * Undercover Chameleon - Curated Category Word Packs
 * Provides high-engagement topics and secret words for party gameplay.
 */

const CATEGORY_PACKS = [
  {
    id: "cyberpunk",
    name: "Cyberpunk & Sci-Fi",
    icon: "fa-robot",
    color: "#06b6d4",
    words: [
      "Neural Link", "Neon City", "Quantum Computer", "Hologram", "Cyborg",
      "Time Machine", "Black Hole", "Flying Car", "Warp Drive", "Matrix",
      "Android", "Laser Blaster", "AI Overlord", "Space Elevator", "Cyberdeck",
      "Cryosleep", "Nanobots", "Hoverboard", "Dystopia", "Teleportation"
    ]
  },
  {
    id: "tech",
    name: "Tech & Internet",
    icon: "fa-microchip",
    color: "#3b82f6",
    words: [
      "ChatGPT", "Smartwatch", "Discord", "TikTok", "Algorithm",
      "Bitcoin", "Virtual Reality", "Drone", "GitHub", "Satellite",
      "WiFi Router", "Touchscreen", "Podcast", "Bluetooth", "Cloud Storage",
      "Ad Blocker", "Dark Mode", "Cybersecurity", "Streaming Service", "Selfie Stick"
    ]
  },
  {
    id: "food",
    name: "Food & Midnight Snacks",
    icon: "fa-burger",
    color: "#f59e0b",
    words: [
      "Taco Bell", "Bubble Tea", "Pepperoni Pizza", "Chocolate Donut", "Sushi Roll",
      "Belgian Waffles", "French Fries", "Iced Espresso", "Spicy Ramen", "Cheeseburger",
      "Avocado Toast", "Cotton Candy", "Churros", "Guacamole", "Pancakes",
      "Hot Dog", "Ice Cream Sundae", "Chicken Nuggets", "Popcorn", "Dumplings"
    ]
  },
  {
    id: "popculture",
    name: "Gaming & Pop Culture",
    icon: "fa-gamepad",
    color: "#ec4899",
    words: [
      "Minecraft", "Spider-Man", "Hogwarts", "Super Mario", "Stranger Things",
      "Lightsaber", "Pokémon", "Batman", "Star Wars", "The Legend of Zelda",
      "Among Us", "Fortnite", "Barbie", "Avengers", "Game of Thrones",
      "Pac-Man", "Iron Man", "Lord of the Rings", "Jurassic Park", "Sonic the Hedgehog"
    ]
  },
  {
    id: "landmarks",
    name: "World Landmarks & Travel",
    icon: "fa-earth-americas",
    color: "#10b981",
    words: [
      "Eiffel Tower", "Tokyo", "Pyramids of Giza", "Grand Canyon", "Roman Colosseum",
      "Mount Everest", "Venice", "Statue of Liberty", "Great Wall of China", "Niagara Falls",
      "Taj Mahal", "Sydney Opera House", "Bermuda Triangle", "Golden Gate Bridge", "Stonehenge",
      "Times Square", "Amazon Rainforest", "Hollywood Sign", "Leaning Tower of Pisa", "Machu Picchu"
    ]
  },
  {
    id: "espionage",
    name: "Secret Agents & Spies",
    icon: "fa-user-secret",
    color: "#8b5cf6",
    words: [
      "Laser Grid", "Master Disguise", "Bank Vault", "Hidden Wiretap", "Smoke Bomb",
      "Handcuffed Briefcase", "Fake Passport", "Night Vision Goggles", "Black Trench Coat", "Mountain Safehouse",
      "Lie Detector", "Fingerprint Scanner", "Secret Code", "Silenced Pistol", "Undercover Identity",
      "Escape Submarine", "Double Agent", "Poison Dart", "Encrypted Radio", "Invisibility Cloak"
    ]
  }
];

class WordManager {
  constructor() {
    this.categories = CATEGORY_PACKS;
  }

  /**
   * Selects a category and picks 1 secret word + 5 decoy words for the Chameleon guess grid.
   * @param {string[]} selectedCategoryIds - Optional list of active categories.
   */
  pickRoundTopic(selectedCategoryIds = []) {
    let pool = this.categories;
    if (selectedCategoryIds && selectedCategoryIds.length > 0) {
      const filtered = this.categories.filter(c => selectedCategoryIds.includes(c.id));
      if (filtered.length > 0) pool = filtered;
    }

    const category = pool[Math.floor(Math.random() * pool.length)];
    const shuffled = [...category.words].sort(() => 0.5 - Math.random());
    const secretWord = shuffled[0];
    
    // Choose 5 other words from the same category as decoys for the Chameleon guess round
    const candidates = shuffled.slice(0, 6).sort(() => 0.5 - Math.random());

    return {
      categoryId: category.id,
      categoryName: category.name,
      categoryIcon: category.icon,
      categoryColor: category.color,
      secretWord: secretWord,
      guessCandidates: candidates
    };
  }

  getAllCategories() {
    return this.categories;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { CATEGORY_PACKS, WordManager };
}
