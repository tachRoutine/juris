/**
 * Fixed Smart Diffing Component for Juris Framework
 * Properly implements minimal DOM manipulation without unnecessary re-rendering
 */

function SmartList(props, context) {
  const { items, renderItem, keyFn = (item, index) => index, placeholder } = props;
  
  return {
    div: {
      class: props.class || 'smart-list',
      children: (parentElement) => {
        const currentItems = typeof items === 'function' ? items() : items;
        
        if (!currentItems || currentItems.length === 0) {
          if (placeholder) {
            //parentElement.innerHTML = '';
            const placeholderEl = context.juris.domRenderer.render(placeholder);
            if (placeholderEl) parentElement.appendChild(placeholderEl);
          } else {
            //parentElement.innerHTML = '';
          }
          return null;
        }
        
        return smartDiff(parentElement, currentItems, renderItem, keyFn, context);
      }
    }
  };
}

function smartDiff(parentElement, newItems, renderItem, keyFn, context) {
  const existingNodes = Array.from(parentElement.children);
  
  // If no existing nodes, do initial render
  if (existingNodes.length === 0) {
    return initialRender(parentElement, newItems, renderItem, keyFn, context);
  }
  
  // Build maps for existing nodes
  const existingNodeMap = new Map();
  const existingItemDataMap = new Map();
  
  existingNodes.forEach(node => {
    const key = node.dataset.jurisKey;
    if (key) {
      existingNodeMap.set(key, node);
      if (node._jurisItemData) {
        existingItemDataMap.set(key, node._jurisItemData);
      }
    }
  });
  
  // Create new items key map
  const newKeys = newItems.map((item, index) => String(keyFn(item, index)));
  const newKeySet = new Set(newKeys);
  
  // Track operations needed
  const operations = [];
  const usedNodes = new Set();
  
  // Plan all operations first
  newItems.forEach((item, index) => {
    const key = String(keyFn(item, index));
    const existingNode = existingNodeMap.get(key);
    
    if (existingNode) {
      // Node exists - check if update needed
      const oldData = existingItemDataMap.get(key);
      const needsUpdate = shouldUpdateItem(oldData, { item, index });
      
      operations.push({
        type: 'reuse',
        key,
        item,
        index,
        node: existingNode,
        needsUpdate
      });
      usedNodes.add(existingNode);
    } else {
      // New node needed
      operations.push({
        type: 'create',
        key,
        item,
        index
      });
    }
  });
  
  // Remove unused nodes
  existingNodes.forEach(node => {
    if (!usedNodes.has(node)) {
      context.juris.domRenderer.cleanup(node);
      node.remove();
    }
  });
  
  // Execute operations to build final order
  const finalNodes = [];
  
  operations.forEach(op => {
    if (op.type === 'reuse') {
      if (op.needsUpdate) {
        updateItemElementInPlace(op.node, op.item, op.index, renderItem, context);
      }
      finalNodes.push(op.node);
    } else if (op.type === 'create') {
      const newNode = createItemElement(op.item, op.index, renderItem, op.key, context);
      if (newNode) {
        finalNodes.push(newNode);
      }
    }
  });
  
  // Apply the new order efficiently
  applyOrder(parentElement, finalNodes);
  
  return null;
}

function applyOrder(parentElement, finalNodes) {
  const currentNodes = Array.from(parentElement.children);
  
  // Check if order is already correct
  let orderCorrect = currentNodes.length === finalNodes.length;
  if (orderCorrect) {
    for (let i = 0; i < currentNodes.length; i++) {
      if (currentNodes[i] !== finalNodes[i]) {
        orderCorrect = false;
        break;
      }
    }
  }
  
  if (orderCorrect) {
    return; // No DOM manipulation needed
  }
  
  // Apply minimal DOM changes to achieve correct order
  finalNodes.forEach((node, targetIndex) => {
    const currentIndex = Array.from(parentElement.children).indexOf(node);
    
    if (currentIndex !== targetIndex) {
      if (targetIndex >= parentElement.children.length) {
        // Append to end
        parentElement.appendChild(node);
      } else {
        // Insert before target position
        const referenceNode = parentElement.children[targetIndex];
        parentElement.insertBefore(node, referenceNode);
      }
    }
  });
}

function updateItemElementInPlace(element, newItem, newIndex, renderItem, context) {
  // Update the stored data
  element._jurisItemData = { 
    item: deepClone(newItem), 
    index: newIndex,
    hash: generateHash(newItem)
  };
  
  // For in-place updates, we need to update the element's content
  // without replacing the entire node
  const newVnode = renderItem(newItem, newIndex);
  
  // Apply the new properties to the existing element
  updateElementProps(element, newVnode, context);
}

function updateElementProps(element, vnode, context) {
  if (!vnode || typeof vnode !== 'object') return;
  
  const tagName = Object.keys(vnode)[0];
  const props = vnode[tagName] || {};
  
  // Update text content if changed
  if (props.text !== undefined) {
    const newText = typeof props.text === 'function' ? props.text() : props.text;
    if (element.textContent !== newText) {
      element.textContent = newText;
    }
  }
  
  // Update attributes
  for (const key in props) {
    if (key === 'children' || key === 'text' || key.startsWith('on')) continue;
    
    const value = typeof props[key] === 'function' ? props[key]() : props[key];
    context.juris.domRenderer._setStaticAttribute(element, key, value);
  }
  
  // Handle children updates
  if (props.children) {
    const newChildren = typeof props.children === 'function' ? props.children() : props.children;
    updateElementChildren(element, newChildren, context);
  }
}

function updateElementChildren(element, newChildren, context) {
  if (Array.isArray(newChildren)) {
    // Simple children update
    element.innerHTML = '';
    newChildren.forEach(child => {
      const childElement = context.juris.domRenderer.render(child);
      if (childElement) element.appendChild(childElement);
    });
  } else if (newChildren) {
    element.innerHTML = '';
    const childElement = context.juris.domRenderer.render(newChildren);
    if (childElement) element.appendChild(childElement);
  }
}

function initialRender(parentElement, newItems, renderItem, keyFn, context) {
  const fragment = document.createDocumentFragment();
  
  newItems.forEach((item, index) => {
    const key = String(keyFn(item, index));
    const element = createItemElement(item, index, renderItem, key, context);
    if (element) fragment.appendChild(element);
  });
  
  parentElement.appendChild(fragment);
  return null;
}

function shouldUpdateItem(oldData, newData) {
  if (!oldData) return true;
  
  // Quick hash comparison first
  const newHash = generateHash(newData.item);
  if (oldData.hash && oldData.hash === newHash && oldData.index === newData.index) {
    return false;
  }
  
  // Fallback to deep comparison
  return oldData.index !== newData.index || !deepEquals1(oldData.item, newData.item);
}

function createItemElement(item, index, renderItem, key, context) {
  const vnode = renderItem(item, index);
  const element = context.juris.domRenderer.render(vnode);
  
  if (element) {
    element.dataset.jurisKey = key;
    element._jurisItemData = { 
      item: deepClone(item), 
      index,
      hash: generateHash(item)
    };
  }
  
  return element;
}

// Utility functions
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (Array.isArray(obj)) return obj.map(deepClone);
  
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

function generateHash(obj) {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

function deepEquals1(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => keysB.includes(key) && deepEquals1(a[key], b[key]));
  }
  
  return false;
}

// Optimized For Component - unchanged but included for completeness
function For(props, context) {
  const { each, children: renderFn, fallback } = props;
  
  return {
    div: {
      class: props.class || 'juris-for',
      children: (parentElement) => {
        const items = typeof each === 'function' ? each() : each;
        
        if (!items || items.length === 0) {
          if (fallback) {
            //parentElement.innerHTML = '';
            const fallbackEl = context.juris.domRenderer.render(fallback);
            if (fallbackEl) parentElement.appendChild(fallbackEl);
          } else {
            //parentElement.innerHTML = '';
          }
          return null;
        }
        
        return indexBasedDiff(parentElement, items, renderFn, context);
      }
    }
  };
}

function indexBasedDiff(parentElement, newItems, renderFn, context) {
  const existingChildren = Array.from(parentElement.children);
  const newLength = newItems.length;
  const existingLength = existingChildren.length;
  
  // Update existing children
  for (let i = 0; i < Math.min(existingLength, newLength); i++) {
    const item = newItems[i];
    const existingChild = existingChildren[i];
    
    const oldItem = existingChild._jurisForItem;
    if (!deepEquals1(oldItem, item)) {
      const newVnode = renderFn(item, i);
      const newElement = context.juris.domRenderer.render(newVnode);
      
      if (newElement) {
        newElement._jurisForItem = item;
        context.juris.domRenderer.cleanup(existingChild);
        parentElement.replaceChild(newElement, existingChild);
      }
    }
  }
  
  // Add new children if needed
  if (newLength > existingLength) {
    const fragment = document.createDocumentFragment();
    for (let i = existingLength; i < newLength; i++) {
      const item = newItems[i];
      const vnode = renderFn(item, i);
      const element = context.juris.domRenderer.render(vnode);
      
      if (element) {
        element._jurisForItem = item;
        fragment.appendChild(element);
      }
    }
    parentElement.appendChild(fragment);
  }
  
  // Remove excess children if needed
  if (existingLength > newLength) {
    for (let i = existingLength - 1; i >= newLength; i--) {
      const child = existingChildren[i];
      context.juris.domRenderer.cleanup(child);
      parentElement.removeChild(child);
    }
  }
  
  return null;
}

// Register the components
// juris.registerComponent('SmartList', SmartList);
// juris.registerComponent('For', For);