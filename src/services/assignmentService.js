export const getItemAssignmentInfo = (itemId, assignments) => {
  const assignedPeople = [];
  Object.entries(assignments).forEach(([personId, items]) => {
    if (items.some(item => item.id === itemId)) {
      assignedPeople.push(personId);
    }
  });
  return {
    count: assignedPeople.length,
    people: assignedPeople,
    isAssigned: assignedPeople.length > 0,
    isShared: assignedPeople.length > 1
  };
};

export const handleItemDrop = (
  draggedItem, 
  targetPerson, 
  assignments, 
  quantityAssignments,
  onShowModal
) => {
  console.log('🎯 Drop event:', draggedItem?.name, 'on', targetPerson?.name);
  
  if (!draggedItem || !targetPerson || targetPerson.isAddButton) {
    return { shouldUpdate: false };
  }

  const currentAssignments = assignments[targetPerson.id] || [];
  const alreadyHasItem = currentAssignments.some(item => item.id === draggedItem.id);
  
  if (alreadyHasItem) {
    console.log('❌ Person already has this item');
    return { shouldUpdate: false };
  }

  const hasMultipleQuantity = draggedItem.quantity > 1;
  
  if (hasMultipleQuantity) {
    const assignedQuantities = quantityAssignments[draggedItem.id] || {};
    const totalAssigned = Object.values(assignedQuantities).reduce((sum, qty) => sum + qty, 0);
    const remainingQuantity = draggedItem.quantity - totalAssigned;
    
    if (remainingQuantity > 0) {
      onShowModal({
        item: draggedItem,
        person: targetPerson,
        maxQuantity: remainingQuantity
      });
      return { shouldUpdate: false };
    }
  } else {
    console.log('✅ Assigning item to person');
    return {
      shouldUpdate: true,
      newAssignments: {
        ...assignments,
        [targetPerson.id]: [...currentAssignments, draggedItem]
      }
    };
  }

  return { shouldUpdate: false };
};

export const handleQuantityAssignment = (
  pendingAssignment, 
  quantity, 
  assignments, 
  quantityAssignments
) => {
  if (!pendingAssignment) return { shouldUpdate: false };

  const { item, person } = pendingAssignment;
  
  const newAssignments = {
    ...assignments,
    [person.id]: [...(assignments[person.id] || []), item]
  };
  
  const newQuantityAssignments = {
    ...quantityAssignments,
    [item.id]: {
      ...quantityAssignments[item.id],
      [person.id]: quantity
    }
  };
  
  console.log(`✅ Assigned ${quantity} ${item.name} to ${person.name}`);
  
  return {
    shouldUpdate: true,
    newAssignments,
    newQuantityAssignments
  };
};