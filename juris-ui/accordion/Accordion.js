export const Accordion = (props, {newState}) => {
	// Extract items from children prop if items not provided directly
	const {mode = 'single', initialOpen = [], children = [], items = children} = props;
	
	// Component-local state using newState
	const [getOpenItems, setOpenItems] = newState('openItems', initialOpen);
	
	const toggleItem = (itemId) => {
		const openItems = getOpenItems();
		
		if (mode === 'single') {
			const newOpen = openItems.includes(itemId) ? [] : [itemId];
			setOpenItems(newOpen);
		} else {
			const newOpen = openItems.includes(itemId) 
				? openItems.filter(id => id !== itemId)
				: [...openItems, itemId];
			setOpenItems(newOpen);
		}
	};

	return {
		div: {
			class: 'accordion', 
			style: {
				border: '1px solid #e2e8f0', 
				borderRadius: '8px', 
				overflow: 'hidden', 
				backgroundColor: 'white',
				boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
			},
			children: items.map((item, index) => ({
				div: {
					class: 'accordion-item', 
					key: `item-${index}`,
					children: [
						// Header
						{div: {
							class: 'accordion-header',
							style: () => {
								const isOpen = getOpenItems().includes(index);
								return {
									backgroundColor: isOpen ? '#3b82f6' : '#f8fafc',
									color: isOpen ? 'white' : '#374151',
									padding: '16px 20px', 
									cursor: 'pointer', 
									display: 'flex',
									justifyContent: 'space-between', 
									alignItems: 'center',
									transition: 'all 0.2s ease', 
									userSelect: 'none',
									borderBottom: isOpen ? 'none' : '1px solid #e2e8f0'
								};
							},
							onClick: () => toggleItem(index),
							children: [
								// Header text - handle both simple text and complex objects
								{div: {
									text: item.header?.text || (typeof item.header === 'string' ? item.header : 'Item'),
									style: {fontWeight: '600'}
								}},
								// Arrow indicator
								{div: {
									text: '▼',
									style: () => ({
										transition: 'transform 0.3s ease',
										transform: getOpenItems().includes(index) ? 'rotate(180deg)' : 'rotate(0deg)',
										fontSize: '12px'
									})
								}}
							]
						}},
						// Content
						{div: {
							class: 'accordion-content',
							style: () => {
								const isOpen = getOpenItems().includes(index);
								return {
									overflow: 'hidden', 
									transition: 'max-height 0.3s ease, padding 0.3s ease',
									maxHeight: isOpen ? '500px' : '0', 
									padding: isOpen ? '20px' : '0 20px',
									backgroundColor: '#fafafa'
								};
							},
							children: [{div: {
								text: item.content?.text || (typeof item.content === 'string' ? item.content : 'Content'),
								style: {
									color: '#64748b', 
									lineHeight: '1.6',
									fontSize: '14px'
								}
							}}]
						}}
					]
				}//accordion-item
			}))//items.map
		}//div.accordion
	};
};