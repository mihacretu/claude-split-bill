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

  // If draggedItem has a `person` property, it is being dragged from a person card → reassign
  if (draggedItem.person) {
    const sourcePerson = draggedItem.person;
    if (!sourcePerson || sourcePerson.id === targetPerson.id) {
      return { shouldUpdate: false };
    }

    const sourceItems = assignments[sourcePerson.id] || [];
    const targetItems = assignments[targetPerson.id] || [];
    const withoutFromSource = sourceItems.filter(i => i.id !== draggedItem.item.id);
    const alreadyOnTarget = targetItems.some(i => i.id === draggedItem.item.id);

    // If target already has the item, cancel move (avoid duplicates)
    if (alreadyOnTarget) {
      // Still need to ensure source keeps the item if we canceled
      return { shouldUpdate: false };
    }

    const movedItem = draggedItem.item;
    const newAssignments = {
      ...assignments,
      [sourcePerson.id]: withoutFromSource,
      [targetPerson.id]: [...targetItems, movedItem]
    };

    // Move quantity assignment if it exists
    let newQuantityAssignments = quantityAssignments;
    const sourceQuantities = quantityAssignments[movedItem.id] || {};
    const qtyForSource = sourceQuantities[sourcePerson.id];
    if (typeof qtyForSource === 'number') {
      newQuantityAssignments = {
        ...quantityAssignments,
        [movedItem.id]: {
          ...sourceQuantities,
          [targetPerson.id]: (sourceQuantities[targetPerson.id] || 0) + qtyForSource,
          [sourcePerson.id]: undefined,
        }
      };
    }

    console.log('🔁 Reassigned', movedItem.name, 'from', sourcePerson.name, 'to', targetPerson.name);
    return { shouldUpdate: true, newAssignments, newQuantityAssignments };
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

export const unassignItemFromPerson = (person, item, assignments, quantityAssignments) => {
  if (!person || !item) return { shouldUpdate: false };

  const personItems = assignments[person.id] || [];
  const updatedItems = personItems.filter(i => i.id !== item.id);

  const { [person.id]: _, ...restQuantitiesForItem } = (quantityAssignments[item.id] || {});
  const newQuantityAssignments = {
    ...quantityAssignments,
    [item.id]: restQuantitiesForItem,
  };

  return {
    shouldUpdate: true,
    newAssignments: { ...assignments, [person.id]: updatedItems },
    newQuantityAssignments,
  };
};