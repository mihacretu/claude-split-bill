export const calculatePersonTotal = (person, assignedItems, quantityAssignments, assignments) => {
  const assignedTotal = assignedItems.reduce((sum, item) => {
    const price = parseFloat(item.price.replace('$', '')) || 0;
    const personQuantity = quantityAssignments[item.id]?.[person.id] || 1;
    
    if (item.quantity > 1) {
      const pricePerUnit = price / item.quantity;
      return sum + (pricePerUnit * personQuantity);
    } else {
      // If quantity is 1 but the item is shared by multiple people,
      // split the price evenly among everyone who has the item assigned
      if (assignments) {
        const assignedPeopleCount = Object.values(assignments).filter(items =>
          items.some(assigned => assigned.id === item.id)
        ).length;
        if (assignedPeopleCount > 1) {
          return sum + (price / assignedPeopleCount);
        }
      }
      return sum + price;
    }
  }, 0);
  
  const originalAmount = person.amount ? parseFloat(person.amount) : 0;
  return (originalAmount + assignedTotal).toFixed(2);
};

export const calculateRemainingQuantity = (item, quantityAssignments) => {
  const assignedQuantities = quantityAssignments[item.id] || {};
  const totalAssigned = Object.values(assignedQuantities).reduce((sum, qty) => sum + qty, 0);
  return item.quantity - totalAssigned;
};

export const formatPrice = (price) => {
  if (typeof price === 'string' && price.includes('$')) {
    return price;
  }
  return `$${parseFloat(price).toFixed(2)}`;
};