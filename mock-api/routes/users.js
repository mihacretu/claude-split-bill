const express = require('express');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { users, friendships } = require('../data/users');
const router = express.Router();

// Search users (for adding friends)
router.get('/search', authenticateToken, (req, res) => {
  try {
    const { q, limit = 10, offset = 0 } = req.query;
    const currentUserId = req.user.id;

    if (!q || q.length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters',
        code: 'INVALID_QUERY'
      });
    }

    // Search users by name, username, or email
    let searchResults = users.filter(user => {
      if (user.id === currentUserId) return false; // Exclude current user
      
      return (
        user.name.toLowerCase().includes(q.toLowerCase()) ||
        user.username.toLowerCase().includes(q.toLowerCase()) ||
        user.email.toLowerCase().includes(q.toLowerCase())
      );
    });

    // Add friendship status to each user
    searchResults = searchResults.map(user => {
      const friendship = friendships.find(f => 
        (f.userId === currentUserId && f.friendId === user.id) ||
        (f.friendId === currentUserId && f.userId === user.id)
      );

      return {
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        friendshipStatus: friendship ? friendship.status : 'none',
        lastActive: user.lastActive
      };
    });

    // Apply pagination
    const paginatedResults = searchResults.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );

    res.json({
      success: true,
      data: {
        users: paginatedResults,
        pagination: {
          total: searchResults.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < searchResults.length
        }
      }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get nearby friends (based on location and privacy settings)
router.get('/nearby', authenticateToken, (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { latitude, longitude, radius = 5 } = req.query;

    // Get current user's friends
    const userFriendships = friendships.filter(f => 
      (f.userId === currentUserId || f.friendId === currentUserId) && 
      f.status === 'accepted'
    );

    const friendIds = userFriendships.map(f => 
      f.userId === currentUserId ? f.friendId : f.userId
    );

    // Get friends who allow location sharing
    let nearbyFriends = users.filter(user => 
      friendIds.includes(user.id) && 
      user.preferences?.privacy?.showInNearby === true
    );

    // If location provided, filter by distance (simplified)
    if (latitude && longitude) {
      nearbyFriends = nearbyFriends.filter(friend => {
        // In a real app, you'd have user locations stored
        // For demo, we'll just return all friends who allow location sharing
        return true;
      });
    }

    // Transform for response
    const nearbyFriendsData = nearbyFriends.map(friend => ({
      id: friend.id,
      name: friend.name,
      username: friend.username,
      avatar: friend.avatar,
      lastActive: friend.lastActive,
      // In a real app, you'd include distance if location was provided
      distance: latitude && longitude ? Math.random() * 5 : null
    }));

    res.json({
      success: true,
      data: {
        nearbyFriends: nearbyFriendsData
      }
    });

  } catch (error) {
    console.error('Get nearby friends error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get user's friends list
router.get('/friends', authenticateToken, (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { status = 'accepted' } = req.query;

    // Get friendships for current user
    let userFriendships = friendships.filter(f => 
      (f.userId === currentUserId || f.friendId === currentUserId)
    );

    // Filter by status
    if (status !== 'all') {
      userFriendships = userFriendships.filter(f => f.status === status);
    }

    // Get friend user data
    const friendsData = userFriendships.map(friendship => {
      const friendId = friendship.userId === currentUserId ? 
        friendship.friendId : friendship.userId;
      
      const friend = users.find(u => u.id === friendId);
      
      return {
        friendshipId: `${friendship.userId}-${friendship.friendId}`,
        user: {
          id: friend.id,
          name: friend.name,
          username: friend.username,
          avatar: friend.avatar,
          lastActive: friend.lastActive
        },
        status: friendship.status,
        createdAt: friendship.createdAt,
        // Indicate if current user sent the request
        sentByMe: friendship.userId === currentUserId
      };
    });

    // Sort by creation date (newest first)
    friendsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: {
        friends: friendsData
      }
    });

  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Send friend request
router.post('/friends/request', authenticateToken, (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required',
        code: 'MISSING_USER_ID'
      });
    }

    if (userId === currentUserId) {
      return res.status(400).json({
        error: 'Cannot send friend request to yourself',
        code: 'INVALID_REQUEST'
      });
    }

    // Check if target user exists
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if friendship already exists
    const existingFriendship = friendships.find(f => 
      (f.userId === currentUserId && f.friendId === userId) ||
      (f.friendId === currentUserId && f.userId === userId)
    );

    if (existingFriendship) {
      return res.status(409).json({
        error: 'Friend request already exists or you are already friends',
        code: 'FRIENDSHIP_EXISTS'
      });
    }

    // Create new friendship request
    const newFriendship = {
      userId: currentUserId,
      friendId: userId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    friendships.push(newFriendship);

    res.status(201).json({
      success: true,
      data: {
        friendship: {
          friendshipId: `${currentUserId}-${userId}`,
          user: {
            id: targetUser.id,
            name: targetUser.name,
            username: targetUser.username,
            avatar: targetUser.avatar
          },
          status: 'pending',
          sentByMe: true,
          createdAt: newFriendship.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Respond to friend request (accept/decline)
router.put('/friends/request/:friendshipId', authenticateToken, (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { friendshipId } = req.params;
    const { action } = req.body; // 'accept' or 'decline'

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        error: 'Action must be either "accept" or "decline"',
        code: 'INVALID_ACTION'
      });
    }

    // Parse friendship ID (format: "userId-friendId")
    const [userId, friendId] = friendshipId.split('-').map(id => parseInt(id));

    // Find the friendship request
    const friendshipIndex = friendships.findIndex(f => 
      f.userId === userId && f.friendId === friendId
    );

    if (friendshipIndex === -1) {
      return res.status(404).json({
        error: 'Friend request not found',
        code: 'REQUEST_NOT_FOUND'
      });
    }

    const friendship = friendships[friendshipIndex];

    // Check if current user is the recipient of the request
    if (friendship.friendId !== currentUserId) {
      return res.status(403).json({
        error: 'You can only respond to friend requests sent to you',
        code: 'FORBIDDEN'
      });
    }

    if (friendship.status !== 'pending') {
      return res.status(400).json({
        error: 'Friend request has already been responded to',
        code: 'ALREADY_RESPONDED'
      });
    }

    // Update friendship status
    if (action === 'accept') {
      friendships[friendshipIndex].status = 'accepted';
    } else {
      // Remove the friendship request if declined
      friendships.splice(friendshipIndex, 1);
    }

    const responseUser = users.find(u => u.id === userId);

    res.json({
      success: true,
      data: {
        friendship: action === 'accept' ? {
          friendshipId,
          user: {
            id: responseUser.id,
            name: responseUser.name,
            username: responseUser.username,
            avatar: responseUser.avatar
          },
          status: 'accepted',
          sentByMe: false,
          createdAt: friendship.createdAt
        } : null
      }
    });

  } catch (error) {
    console.error('Respond to friend request error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Remove friend
router.delete('/friends/:friendshipId', authenticateToken, (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { friendshipId } = req.params;

    // Parse friendship ID
    const [userId, friendId] = friendshipId.split('-').map(id => parseInt(id));

    // Find the friendship
    const friendshipIndex = friendships.findIndex(f => 
      (f.userId === userId && f.friendId === friendId) ||
      (f.userId === friendId && f.friendId === userId)
    );

    if (friendshipIndex === -1) {
      return res.status(404).json({
        error: 'Friendship not found',
        code: 'FRIENDSHIP_NOT_FOUND'
      });
    }

    const friendship = friendships[friendshipIndex];

    // Check if current user is part of this friendship
    if (friendship.userId !== currentUserId && friendship.friendId !== currentUserId) {
      return res.status(403).json({
        error: 'You can only remove your own friendships',
        code: 'FORBIDDEN'
      });
    }

    // Remove friendship
    friendships.splice(friendshipIndex, 1);

    res.json({
      success: true,
      message: 'Friendship removed successfully'
    });

  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get user profile by ID
router.get('/:userId', optionalAuth, (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    const user = users.find(u => u.id === parseInt(userId));

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check friendship status if authenticated
    let friendshipStatus = 'none';
    if (currentUserId && currentUserId !== user.id) {
      const friendship = friendships.find(f => 
        (f.userId === currentUserId && f.friendId === user.id) ||
        (f.friendId === currentUserId && f.userId === user.id)
      );
      friendshipStatus = friendship ? friendship.status : 'none';
    }

    // Return public profile info
    const publicProfile = {
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      createdAt: user.createdAt,
      friendshipStatus: currentUserId ? friendshipStatus : undefined
    };

    // Add more info if they're friends or it's the user's own profile
    if (currentUserId === user.id || friendshipStatus === 'accepted') {
      publicProfile.phone = user.phone;
      publicProfile.lastActive = user.lastActive;
    }

    res.json({
      success: true,
      data: {
        user: publicProfile
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
