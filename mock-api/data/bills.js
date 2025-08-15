// Mock bill data
const bills = [
  {
    id: "bill-1",
    title: "Steak House",
    restaurantId: 1,
    createdBy: 2, // Tom
    createdAt: "2024-03-28T18:30:00Z",
    updatedAt: "2024-03-28T19:45:00Z",
    status: "active", // active, settled, cancelled
    totalAmount: 50.50,
    tax: 4.04,
    tip: 8.08,
    finalAmount: 62.62,
    currency: "USD",
    participants: [
      {
        id: 1,
        name: "You",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face",
        items: [
          { 
            id: "it-1", 
            menuItemId: 1,
            name: "Roasted Potato Salad", 
            price: 15.00, 
            quantity: 1,
            image: "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=100&h=100&fit=crop&crop=center"
          },
          { 
            id: "it-2", 
            menuItemId: 2,
            name: "Orange Juice", 
            price: 8.00, 
            quantity: 2,
            image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=100&h=100&fit=crop&crop=center"
          },
          { 
            id: "it-3", 
            menuItemId: 3,
            name: "Croissant", 
            price: 7.50, 
            quantity: 1,
            image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=100&h=100&fit=crop&crop=center"
          },
          { 
            id: "it-4", 
            menuItemId: 10,
            name: "Cappuccino", 
            price: 5.50, 
            quantity: 1,
            image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=100&h=100&fit=crop&crop=center"
          }
        ],
        subtotal: 36.00,
        taxShare: 2.88,
        tipShare: 5.76,
        totalOwed: 44.64,
        netBalance: -20.50, // owes 20.50 to Tom
        paymentStatus: "pending" // pending, paid, partial
      },
      {
        id: 2,
        name: "Tom",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face",
        items: [
          { 
            id: "it-5", 
            menuItemId: 6,
            name: "Grilled Salmon", 
            price: 22.00, 
            quantity: 1,
            image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=100&h=100&fit=crop&crop=center"
          },
          { 
            id: "it-6", 
            menuItemId: 5,
            name: "Caesar Salad", 
            price: 12.50, 
            quantity: 1,
            image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&h=100&fit=crop&crop=center"
          }
        ],
        subtotal: 34.50,
        taxShare: 2.76,
        tipShare: 5.52,
        totalOwed: 42.78,
        netBalance: 20.50, // to receive 20.50
        paymentStatus: "paid", // Tom paid the full bill
        paidAmount: 62.62,
        paidAt: "2024-03-28T19:00:00Z"
      }
    ],
    payments: [
      {
        id: "pay-1",
        fromUserId: 2,
        toUserId: null, // restaurant payment
        amount: 62.62,
        status: "completed",
        method: "credit_card",
        transactionId: "txn_abc123",
        createdAt: "2024-03-28T19:00:00Z"
      }
    ],
    splitMethod: "itemized", // itemized, equal, percentage, custom
    location: {
      latitude: 40.7128,
      longitude: -74.0060
    },
    receiptImage: "https://example.com/receipts/bill-1.jpg"
  },
  {
    id: "bill-2",
    title: "Pizza Kingdom",
    restaurantId: 2,
    createdBy: 1, // You
    createdAt: "2024-03-19T19:15:00Z",
    updatedAt: "2024-03-19T20:30:00Z",
    status: "active",
    totalAmount: 45.00,
    tax: 3.60,
    tip: 9.00,
    finalAmount: 57.60,
    currency: "USD",
    participants: [
      {
        id: 1,
        name: "You",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face",
        items: [
          { 
            id: "it-7", 
            menuItemId: 8,
            name: "Margherita Pizza", 
            price: 16.50, 
            quantity: 1,
            image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop&crop=center"
          }
        ],
        subtotal: 16.50,
        taxShare: 1.32,
        tipShare: 2.64,
        totalOwed: 20.46,
        netBalance: 28.50, // to receive 28.50
        paymentStatus: "paid",
        paidAmount: 57.60,
        paidAt: "2024-03-19T19:30:00Z"
      },
      {
        id: 3,
        name: "Jessica",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face",
        items: [
          { 
            id: "it-8", 
            menuItemId: 2,
            name: "Orange Juice", 
            price: 8.00, 
            quantity: 1,
            image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=100&h=100&fit=crop&crop=center"
          }
        ],
        subtotal: 8.00,
        taxShare: 0.64,
        tipShare: 1.28,
        totalOwed: 9.92,
        netBalance: -10.00,
        paymentStatus: "pending"
      },
      {
        id: 4,
        name: "Alex",
        avatar: "https://i.pravatar.cc/36?img=9",
        items: [
          { 
            id: "it-9", 
            menuItemId: 9,
            name: "Chocolate Cake", 
            price: 9.00, 
            quantity: 1,
            image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100&h=100&fit=crop&crop=center"
          }
        ],
        subtotal: 9.00,
        taxShare: 0.72,
        tipShare: 1.44,
        totalOwed: 11.16,
        netBalance: -9.50,
        paymentStatus: "pending"
      }
    ],
    payments: [
      {
        id: "pay-2",
        fromUserId: 1,
        toUserId: null,
        amount: 57.60,
        status: "completed",
        method: "debit_card",
        transactionId: "txn_def456",
        createdAt: "2024-03-19T19:30:00Z"
      }
    ],
    splitMethod: "itemized",
    location: {
      latitude: 40.7589,
      longitude: -73.9851
    },
    receiptImage: "https://example.com/receipts/bill-2.jpg"
  },
  {
    id: "bill-3",
    title: "Nobu Sushi",
    restaurantId: 3,
    createdBy: 102, // Steve
    createdAt: "2024-03-12T20:00:00Z",
    updatedAt: "2024-03-12T21:15:00Z",
    status: "settled",
    totalAmount: 85.00,
    tax: 6.80,
    tip: 17.00,
    finalAmount: 108.80,
    currency: "USD",
    participants: [
      {
        id: 1,
        name: "You",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face",
        items: [
          { 
            id: "it-10", 
            menuItemId: 11,
            name: "Salmon Roll", 
            price: 18.00, 
            quantity: 1,
            image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=100&h=100&fit=crop"
          }
        ],
        subtotal: 18.00,
        taxShare: 1.44,
        tipShare: 2.88,
        totalOwed: 22.32,
        netBalance: -5.00,
        paymentStatus: "paid"
      },
      {
        id: 102,
        name: "Steve",
        avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=72&h=72&fit=crop&crop=face",
        items: [
          { 
            id: "it-11", 
            menuItemId: 12,
            name: "Chirashi Bowl", 
            price: 32.00, 
            quantity: 1,
            image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=100&h=100&fit=crop"
          }
        ],
        subtotal: 32.00,
        taxShare: 2.56,
        tipShare: 5.12,
        totalOwed: 39.68,
        netBalance: 5.00,
        paymentStatus: "paid",
        paidAmount: 108.80,
        paidAt: "2024-03-12T20:30:00Z"
      }
    ],
    payments: [
      {
        id: "pay-3",
        fromUserId: 102,
        toUserId: null,
        amount: 108.80,
        status: "completed",
        method: "cash",
        createdAt: "2024-03-12T20:30:00Z"
      },
      {
        id: "pay-4",
        fromUserId: 1,
        toUserId: 102,
        amount: 5.00,
        status: "completed",
        method: "venmo",
        transactionId: "venmo_xyz789",
        createdAt: "2024-03-12T21:15:00Z"
      }
    ],
    splitMethod: "itemized",
    location: {
      latitude: 40.7831,
      longitude: -73.9712
    },
    receiptImage: "https://example.com/receipts/bill-3.jpg"
  }
];

// Additional bills for timeline history
const historicalBills = [
  {
    id: "bill-4",
    title: "Cafe Aroma",
    createdBy: 4,
    createdAt: "2024-03-10T16:20:00Z",
    status: "settled",
    totalAmount: 24.00,
    finalAmount: 29.76,
    participants: [
      { id: 1, name: "You", netBalance: 12.00, paymentStatus: "paid" },
      { id: 4, name: "Alex", netBalance: -12.00, paymentStatus: "paid" }
    ]
  },
  {
    id: "bill-5",
    title: "Burger Joint",
    createdBy: 1,
    createdAt: "2024-03-08T13:45:00Z",
    status: "active",
    totalAmount: 35.00,
    finalAmount: 43.40,
    participants: [
      { id: 1, name: "You", netBalance: 8.75, paymentStatus: "paid" },
      { id: 5, name: "Mike", netBalance: -8.75, paymentStatus: "pending" }
    ]
  },
  {
    id: "bill-6",
    title: "Vegan Garden",
    createdBy: 6,
    createdAt: "2024-03-06T12:30:00Z",
    status: "settled",
    totalAmount: 18.40,
    finalAmount: 22.81,
    participants: [
      { id: 1, name: "You", netBalance: -9.20, paymentStatus: "paid" },
      { id: 6, name: "Mia", netBalance: 9.20, paymentStatus: "paid" }
    ]
  }
];

const billActivities = [
  {
    id: "activity-1",
    billId: "bill-1",
    userId: 2,
    type: "bill_created",
    description: "Tom created the bill",
    timestamp: "2024-03-28T18:30:00Z"
  },
  {
    id: "activity-2",
    billId: "bill-1",
    userId: 2,
    type: "item_added",
    description: "Tom added Grilled Salmon",
    metadata: { itemName: "Grilled Salmon", price: 22.00 },
    timestamp: "2024-03-28T18:32:00Z"
  },
  {
    id: "activity-3",
    billId: "bill-1",
    userId: 1,
    type: "item_added",
    description: "You added Roasted Potato Salad",
    metadata: { itemName: "Roasted Potato Salad", price: 15.00 },
    timestamp: "2024-03-28T18:35:00Z"
  },
  {
    id: "activity-4",
    billId: "bill-1",
    userId: 2,
    type: "payment_made",
    description: "Tom paid the restaurant bill",
    metadata: { amount: 62.62, method: "credit_card" },
    timestamp: "2024-03-28T19:00:00Z"
  }
];

module.exports = { bills, historicalBills, billActivities };
