// Mock user data
const users = [
  {
    id: 1,
    email: "you@example.com",
    username: "you",
    name: "You",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face",
    phone: "+1234567890",
    preferences: {
      currency: "USD",
      notifications: {
        billReminders: true,
        paymentReceived: true,
        friendRequests: true
      },
      privacy: {
        shareLocation: true,
        showInNearby: true
      }
    },
    createdAt: "2024-01-15T08:30:00Z",
    lastActive: "2024-03-28T15:45:00Z"
  },
  {
    id: 2,
    email: "tom@example.com",
    username: "tom",
    name: "Tom",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face",
    phone: "+1234567891",
    preferences: {
      currency: "USD",
      notifications: {
        billReminders: true,
        paymentReceived: true,
        friendRequests: true
      },
      privacy: {
        shareLocation: true,
        showInNearby: true
      }
    },
    createdAt: "2024-01-10T10:20:00Z",
    lastActive: "2024-03-28T14:30:00Z"
  },
  {
    id: 3,
    email: "jessica@example.com",
    username: "jessica",
    name: "Jessica",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face",
    phone: "+1234567892",
    preferences: {
      currency: "USD",
      notifications: {
        billReminders: true,
        paymentReceived: false,
        friendRequests: true
      },
      privacy: {
        shareLocation: false,
        showInNearby: true
      }
    },
    createdAt: "2024-01-05T12:15:00Z",
    lastActive: "2024-03-27T18:20:00Z"
  },
  {
    id: 101,
    email: "oliver@example.com",
    username: "oliver",
    name: "Oliver",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=72&h=72&fit=crop&crop=face",
    phone: "+1234567893",
    preferences: {
      currency: "USD",
      notifications: {
        billReminders: true,
        paymentReceived: true,
        friendRequests: true
      },
      privacy: {
        shareLocation: true,
        showInNearby: true
      }
    },
    createdAt: "2024-02-01T09:00:00Z",
    lastActive: "2024-03-28T12:00:00Z"
  },
  {
    id: 102,
    email: "steve@example.com",
    username: "steve",
    name: "Steve",
    avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=72&h=72&fit=crop&crop=face",
    phone: "+1234567894",
    preferences: {
      currency: "USD",
      notifications: {
        billReminders: false,
        paymentReceived: true,
        friendRequests: true
      },
      privacy: {
        shareLocation: true,
        showInNearby: true
      }
    },
    createdAt: "2024-02-05T14:30:00Z",
    lastActive: "2024-03-27T20:15:00Z"
  }
];

const friendships = [
  { userId: 1, friendId: 2, status: "accepted", createdAt: "2024-01-20T10:00:00Z" },
  { userId: 1, friendId: 3, status: "accepted", createdAt: "2024-01-25T11:00:00Z" },
  { userId: 1, friendId: 101, status: "accepted", createdAt: "2024-02-10T12:00:00Z" },
  { userId: 1, friendId: 102, status: "pending", createdAt: "2024-03-15T13:00:00Z" },
  { userId: 2, friendId: 3, status: "accepted", createdAt: "2024-01-30T14:00:00Z" }
];

module.exports = { users, friendships };
