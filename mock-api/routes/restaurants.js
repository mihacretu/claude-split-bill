const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const { restaurants, menuItems } = require('../data/restaurants');
const router = express.Router();

// Get all restaurants
router.get('/', optionalAuth, (req, res) => {
  try {
    const { 
      search, 
      cuisine, 
      priceRange, 
      latitude, 
      longitude, 
      radius = 10,
      limit = 20,
      offset = 0 
    } = req.query;

    let filteredRestaurants = [...restaurants];

    // Search by name
    if (search) {
      filteredRestaurants = filteredRestaurants.filter(r => 
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by cuisine
    if (cuisine) {
      filteredRestaurants = filteredRestaurants.filter(r => 
        r.cuisine.toLowerCase() === cuisine.toLowerCase()
      );
    }

    // Filter by price range
    if (priceRange) {
      filteredRestaurants = filteredRestaurants.filter(r => 
        r.priceRange === priceRange
      );
    }

    // Filter by location (simplified distance calculation)
    if (latitude && longitude) {
      filteredRestaurants = filteredRestaurants.filter(r => {
        const distance = calculateDistance(
          parseFloat(latitude), 
          parseFloat(longitude),
          r.location.latitude,
          r.location.longitude
        );
        return distance <= parseFloat(radius);
      });

      // Add distance to each restaurant
      filteredRestaurants = filteredRestaurants.map(r => ({
        ...r,
        distance: calculateDistance(
          parseFloat(latitude), 
          parseFloat(longitude),
          r.location.latitude,
          r.location.longitude
        )
      }));

      // Sort by distance
      filteredRestaurants.sort((a, b) => a.distance - b.distance);
    }

    // Apply pagination
    const paginatedRestaurants = filteredRestaurants.slice(
      parseInt(offset), 
      parseInt(offset) + parseInt(limit)
    );

    res.json({
      success: true,
      data: {
        restaurants: paginatedRestaurants,
        pagination: {
          total: filteredRestaurants.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < filteredRestaurants.length
        }
      }
    });

  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get a specific restaurant by ID
router.get('/:restaurantId', optionalAuth, (req, res) => {
  try {
    const { restaurantId } = req.params;

    const restaurant = restaurants.find(r => r.id === parseInt(restaurantId));

    if (!restaurant) {
      return res.status(404).json({
        error: 'Restaurant not found',
        code: 'RESTAURANT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        restaurant
      }
    });

  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get menu items for a restaurant
router.get('/:restaurantId/menu', optionalAuth, (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { category, available, search, limit = 50, offset = 0 } = req.query;

    // Check if restaurant exists
    const restaurant = restaurants.find(r => r.id === parseInt(restaurantId));
    if (!restaurant) {
      return res.status(404).json({
        error: 'Restaurant not found',
        code: 'RESTAURANT_NOT_FOUND'
      });
    }

    let restaurantMenuItems = menuItems.filter(item => 
      item.restaurantId === parseInt(restaurantId)
    );

    // Filter by category
    if (category) {
      restaurantMenuItems = restaurantMenuItems.filter(item => 
        item.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by availability
    if (available !== undefined) {
      const isAvailable = available === 'true';
      restaurantMenuItems = restaurantMenuItems.filter(item => 
        item.available === isAvailable
      );
    }

    // Search by name or description
    if (search) {
      restaurantMenuItems = restaurantMenuItems.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Group by categories
    const categories = [...new Set(restaurantMenuItems.map(item => item.category))];
    const groupedItems = categories.reduce((acc, category) => {
      acc[category] = restaurantMenuItems.filter(item => item.category === category);
      return acc;
    }, {});

    // Apply pagination to total items
    const paginatedItems = restaurantMenuItems.slice(
      parseInt(offset), 
      parseInt(offset) + parseInt(limit)
    );

    res.json({
      success: true,
      data: {
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          cuisine: restaurant.cuisine
        },
        menuItems: paginatedItems,
        categories: groupedItems,
        availableCategories: categories,
        pagination: {
          total: restaurantMenuItems.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < restaurantMenuItems.length
        }
      }
    });

  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get all menu items (for general food item search)
router.get('/menu/items', optionalAuth, (req, res) => {
  try {
    const { 
      search, 
      category, 
      dietary, 
      maxPrice,
      available,
      limit = 50, 
      offset = 0 
    } = req.query;

    let filteredItems = [...menuItems];

    // Search by name or description
    if (search) {
      filteredItems = filteredItems.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by category
    if (category) {
      filteredItems = filteredItems.filter(item => 
        item.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by dietary restrictions
    if (dietary) {
      filteredItems = filteredItems.filter(item => 
        item.dietary.includes(dietary.toLowerCase())
      );
    }

    // Filter by max price
    if (maxPrice) {
      filteredItems = filteredItems.filter(item => 
        item.price <= parseFloat(maxPrice)
      );
    }

    // Filter by availability
    if (available !== undefined) {
      const isAvailable = available === 'true';
      filteredItems = filteredItems.filter(item => 
        item.available === isAvailable
      );
    }

    // Apply pagination
    const paginatedItems = filteredItems.slice(
      parseInt(offset), 
      parseInt(offset) + parseInt(limit)
    );

    // Add restaurant info to each item
    const itemsWithRestaurant = paginatedItems.map(item => ({
      ...item,
      restaurant: restaurants.find(r => r.id === item.restaurantId)
    }));

    res.json({
      success: true,
      data: {
        menuItems: itemsWithRestaurant,
        pagination: {
          total: filteredItems.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < filteredItems.length
        }
      }
    });

  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in kilometers
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

module.exports = router;
