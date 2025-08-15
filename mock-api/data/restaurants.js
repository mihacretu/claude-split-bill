// Mock restaurant and menu data
const restaurants = [
  {
    id: 1,
    name: "Steak House",
    address: "123 Main St, Downtown",
    phone: "+1234567800",
    cuisine: "American",
    rating: 4.5,
    priceRange: "$$$",
    location: {
      latitude: 40.7128,
      longitude: -74.0060
    },
    hours: {
      monday: "11:00-22:00",
      tuesday: "11:00-22:00",
      wednesday: "11:00-22:00",
      thursday: "11:00-22:00",
      friday: "11:00-23:00",
      saturday: "11:00-23:00",
      sunday: "12:00-21:00"
    },
    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop"
  },
  {
    id: 2,
    name: "Pizza Kingdom",
    address: "456 Oak Ave, Midtown",
    phone: "+1234567801",
    cuisine: "Italian",
    rating: 4.2,
    priceRange: "$$",
    location: {
      latitude: 40.7589,
      longitude: -73.9851
    },
    hours: {
      monday: "12:00-23:00",
      tuesday: "12:00-23:00",
      wednesday: "12:00-23:00",
      thursday: "12:00-23:00",
      friday: "12:00-24:00",
      saturday: "12:00-24:00",
      sunday: "12:00-22:00"
    },
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop"
  },
  {
    id: 3,
    name: "Nobu Sushi",
    address: "789 Pine St, Uptown",
    phone: "+1234567802",
    cuisine: "Japanese",
    rating: 4.8,
    priceRange: "$$$$",
    location: {
      latitude: 40.7831,
      longitude: -73.9712
    },
    hours: {
      monday: "17:00-22:00",
      tuesday: "17:00-22:00",
      wednesday: "17:00-22:00",
      thursday: "17:00-22:00",
      friday: "17:00-23:00",
      saturday: "17:00-23:00",
      sunday: "17:00-21:00"
    },
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop"
  }
];

const menuItems = [
  // Steak House items
  {
    id: 1,
    restaurantId: 1,
    name: "Roasted Potato Salad",
    description: "Fresh mixed greens with roasted potatoes, herbs, and vinaigrette",
    price: 15.00,
    category: "Appetizers",
    image: "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=100&h=100&fit=crop&crop=center",
    allergens: ["gluten"],
    dietary: ["vegetarian"],
    available: true,
    preparationTime: 15
  },
  {
    id: 2,
    restaurantId: 1,
    name: "Orange Juice",
    description: "Freshly squeezed orange juice",
    price: 8.00,
    category: "Beverages",
    image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=100&h=100&fit=crop&crop=center",
    allergens: [],
    dietary: ["vegan", "gluten-free"],
    available: true,
    preparationTime: 2
  },
  {
    id: 3,
    restaurantId: 1,
    name: "Croissant",
    description: "Buttery, flaky French pastry",
    price: 7.50,
    category: "Pastries",
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=100&h=100&fit=crop&crop=center",
    allergens: ["gluten", "dairy", "eggs"],
    dietary: ["vegetarian"],
    available: true,
    preparationTime: 5
  },
  {
    id: 4,
    restaurantId: 1,
    name: "Hot Cheese Burrito",
    description: "Warm tortilla filled with melted cheese and spices",
    price: 8.00,
    category: "Main Course",
    image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=100&h=100&fit=crop&crop=center",
    allergens: ["gluten", "dairy"],
    dietary: ["vegetarian"],
    available: true,
    preparationTime: 12
  },
  {
    id: 5,
    restaurantId: 1,
    name: "Caesar Salad",
    description: "Crisp romaine lettuce with Caesar dressing, croutons, and parmesan",
    price: 12.50,
    category: "Salads",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&h=100&fit=crop&crop=center",
    allergens: ["gluten", "dairy", "fish"],
    dietary: ["vegetarian"],
    available: true,
    preparationTime: 8
  },
  {
    id: 6,
    restaurantId: 1,
    name: "Grilled Salmon",
    description: "Fresh Atlantic salmon grilled to perfection with lemon and herbs",
    price: 22.00,
    category: "Main Course",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=100&h=100&fit=crop&crop=center",
    allergens: ["fish"],
    dietary: ["gluten-free"],
    available: true,
    preparationTime: 18
  },
  {
    id: 7,
    restaurantId: 1,
    name: "Chicken Wings",
    description: "Crispy chicken wings with your choice of sauce",
    price: 14.00,
    category: "Appetizers",
    image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=100&h=100&fit=crop&crop=center",
    allergens: [],
    dietary: ["gluten-free"],
    available: true,
    preparationTime: 15
  },
  // Pizza Kingdom items
  {
    id: 8,
    restaurantId: 2,
    name: "Margherita Pizza",
    description: "Classic pizza with tomato sauce, mozzarella, and fresh basil",
    price: 16.50,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop&crop=center",
    allergens: ["gluten", "dairy"],
    dietary: ["vegetarian"],
    available: true,
    preparationTime: 20
  },
  {
    id: 9,
    restaurantId: 1,
    name: "Chocolate Cake",
    description: "Rich chocolate layer cake with chocolate ganache",
    price: 9.00,
    category: "Desserts",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100&h=100&fit=crop&crop=center",
    allergens: ["gluten", "dairy", "eggs"],
    dietary: ["vegetarian"],
    available: true,
    preparationTime: 5
  },
  {
    id: 10,
    restaurantId: 1,
    name: "Cappuccino",
    description: "Italian coffee drink with steamed milk foam",
    price: 5.50,
    category: "Beverages",
    image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=100&h=100&fit=crop&crop=center",
    allergens: ["dairy"],
    dietary: ["vegetarian"],
    available: true,
    preparationTime: 5
  },
  {
    id: 11,
    restaurantId: 1,
    name: "Fish Tacos",
    description: "Grilled fish with cabbage slaw in soft tortillas",
    price: 13.00,
    category: "Main Course",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=100&h=100&fit=crop&crop=center",
    allergens: ["fish", "gluten"],
    dietary: [],
    available: true,
    preparationTime: 15
  },
  {
    id: 12,
    restaurantId: 1,
    name: "Greek Yogurt",
    description: "Creamy Greek yogurt with honey and granola",
    price: 6.00,
    category: "Breakfast",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=100&h=100&fit=crop&crop=center",
    allergens: ["dairy", "nuts"],
    dietary: ["vegetarian"],
    available: true,
    preparationTime: 3
  }
];

module.exports = { restaurants, menuItems };
