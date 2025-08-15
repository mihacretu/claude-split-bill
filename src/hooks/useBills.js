// Custom hook for managing bills data
import { useState, useEffect, useCallback } from 'react';
import { billsAPI } from '../services/apiService';

export const useBills = (initialParams = {}) => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadBills = useCallback(async (params = initialParams) => {
    try {
      setError(null);
      const response = await billsAPI.getBills(params);
      
      if (response.success) {
        setBills(response.data.bills);
      } else {
        throw new Error('Failed to load bills');
      }
    } catch (err) {
      console.error('Error loading bills:', err);
      setError(err.message);
      
      // Fallback to demo data if API fails
      setBills(getDemoBillsData());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [initialParams]);

  const refreshBills = useCallback(async () => {
    setRefreshing(true);
    await loadBills();
  }, [loadBills]);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  return {
    bills,
    loading,
    error,
    refreshing,
    refreshBills,
    loadBills,
  };
};

// Fallback demo data (matches your current HomeScreen structure)
const getDemoBillsData = () => [
  {
    id: 'demo-1',
    time: '03/28',
    title: 'Steak House',
    description: 'You owe $20.50 to Tom',
    status: 'active',
    totalAmount: 62.62,
    participants: [
      { id: 1, name: 'You', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face' },
      { id: 2, name: 'Tom', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face' },
      { id: 3, name: 'Jessica', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face' }
    ],
    bill: {
      id: 'demo-1',
      time: '03/28',
      title: 'Steak House',
      description: 'You owe $20.50 to Tom',
      paidBy: 'Tom',
      participants: [
        { 
          id: 1, 
          name: 'You', 
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face', 
          items: [
            { id: 'it-1', name: 'Roasted Potato Salad', price: 15, quantity: 1 },
            { id: 'it-2', name: 'Orange Juice', price: 8, quantity: 2 }
          ], 
          netBalance: -20.5,
          paymentStatus: 'pending'
        },
        { 
          id: 2, 
          name: 'Tom', 
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face', 
          items: [
            { id: 'it-6', name: 'Grilled Salmon', price: 22, quantity: 1 }
          ], 
          netBalance: 20.5,
          paymentStatus: 'paid'
        }
      ]
    }
  },
  {
    id: 'demo-2',
    time: '03/19',
    title: 'Pizza Kingdom',
    description: 'Left to receive $28.50',
    status: 'active',
    totalAmount: 57.60,
    participants: [
      { id: 1, name: 'You', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face' },
      { id: 3, name: 'Jessica', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face' },
      { id: 4, name: 'Alex', avatar: 'https://i.pravatar.cc/36?img=9' }
    ],
    bill: {
      id: 'demo-2',
      time: '03/19',
      title: 'Pizza Kingdom',
      description: 'Left to receive $28.50',
      paidBy: 'You',
      participants: [
        { id: 1, name: 'You', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face', items: [{ id: 'it-3', name: 'Margherita Pizza', price: 16.5, quantity: 1 }], netBalance: 28.5, paymentStatus: 'paid' },
        { id: 3, name: 'Jessica', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face', items: [{ id: 'it-4', name: 'Orange Juice', price: 8, quantity: 1 }], netBalance: -10, paymentStatus: 'pending' },
        { id: 4, name: 'Alex', avatar: 'https://i.pravatar.cc/36?img=9', items: [{ id: 'it-5', name: 'Chocolate Cake', price: 9, quantity: 1 }], netBalance: -9.5, paymentStatus: 'settled' }
      ]
    }
  }
];

export default useBills;
