import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native';

const foodItems = [
  {
    id: 1,
    name: 'Roasted Potato Salad',
    price: '$15.00',
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=100&h=100&fit=crop&crop=center'
  },
  {
    id: 2,
    name: 'Orange Juice',
    price: '8.00',
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=100&h=100&fit=crop&crop=center'
  },
  {
    id: 3,
    name: 'Croissant',
    price: '7.50',
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=100&h=100&fit=crop&crop=center'
  },
  {
    id: 4,
    name: 'Hot Cheese Burrito',
    price: '8.00',
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=100&h=100&fit=crop&crop=center'
  }
];

const people = [
  {
    id: 1,
    name: 'You',
    amount: '9.50',
    hasFood: true,
    foodImage: 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=100&h=100&fit=crop&crop=center',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face'
  },
  {
    id: 2,
    name: 'Tom',
    hasFood: false,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face'
  },
  {
    id: 3,
    name: 'Jessica',
    hasFood: false,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face'
  },
  {
    id: 4,
    name: 'Add Person',
    isAddButton: true
  }
];

export default function SplitScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>
          <Text style={styles.titleBold}>Split</Text>
          <Text style={styles.titleRegular}> order</Text>
        </Text>
        
        <View style={styles.foodItemsContainer}>
          {foodItems.map((item) => (
            <View key={item.id} style={styles.foodItem}>
              <Image source={{ uri: item.image }} style={styles.foodImage} />
              <Text style={styles.quantity}>{item.quantity} ×</Text>
              <Text style={styles.foodName}>{item.name}</Text>
              <Text style={styles.foodPrice}>{item.price}</Text>
            </View>
          ))}
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.peopleContainer}
          style={styles.peopleScrollView}
        >
          {people.map((person) => (
            <TouchableOpacity 
              key={person.id} 
              style={[
                styles.personCard, 
                person.hasFood && styles.personCardWithFood,
                person.isAddButton && styles.addPersonCard
              ]}
            >
              {person.isAddButton ? (
                <>
                  <View style={styles.addIconContainer}>
                    <Text style={styles.addIcon}>+</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.avatarContainer}>
                    <Image source={{ uri: person.avatar }} style={styles.avatar} />
                  </View>
                  <Text style={styles.personName}>{person.name}</Text>
                  {person.amount && <Text style={styles.personAmount}>{person.amount}</Text>}
                  {person.hasFood && (
                    <View style={styles.itemsContainer}>
                      <Image 
                        source={{ uri: person.foodImage }} 
                        style={styles.personItemImage} 
                      />
                    </View>
                  )}
                </>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
        
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8e8e8',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flex: 1,
  },
  backButton: {
    marginBottom: 16,
  },
  backArrow: {
    fontSize: 28,
    color: '#333',
    fontWeight: '300',
  },
  title: {
    fontSize: 36,
    color: '#1a1a1a',
    marginBottom: 40,
  },
  titleBold: {
    fontWeight: 'bold',
  },
  titleRegular: {
    fontWeight: 'normal',
  },
  foodItemsContainer: {
    marginBottom: 40,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  foodImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  quantity: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
    minWidth: 24,
  },
  foodName: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
    fontWeight: '500',
  },
  foodPrice: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  peopleContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'flex-start',
  },
  peopleScrollView: {
    flexGrow: 0,
  },
  personCard: {
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 8,
    width: 100,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  personCardWithFood: {
    paddingBottom: 10,
  },
  addPersonCard: {
    paddingVertical: 16,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#d0d0d0',
    shadowOpacity: 0.02,
  },
  selectedPersonCard: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 6,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  personName: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    marginBottom: 0,
    textAlign: 'center',
  },
  personAmount: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: 'bold',
    marginTop: 2,
    marginBottom: 0,
  },
  itemsContainer: {
    marginTop: 2,
  },
  personItemImage: {
    width: 50,
    height: 32,
    borderRadius: 6,
  },
  addIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: 24,
    color: '#999',
    fontWeight: '300',
  },
});