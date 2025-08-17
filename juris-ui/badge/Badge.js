export const Badge = (props, context) => {
	const {
		variant = 'default',
		size = 'md',
		text = '',
		children = null,
		icon = null,
		closable = false,
		pulse = false,
		outline = false,
		rounded = 'default',
		onClick = null,
		onClose = null,
		className = '',
		style = {},
		...otherProps
	} = props;

	// Variant color schemes
	const variants = {
		default: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
		primary: { bg: '#3b82f6', color: '#ffffff', border: '#2563eb' },
		secondary: { bg: '#6b7280', color: '#ffffff', border: '#4b5563' },
		success: { bg: '#10b981', color: '#ffffff', border: '#059669' },
		warning: { bg: '#f59e0b', color: '#ffffff', border: '#d97706' },
		danger: { bg: '#ef4444', color: '#ffffff', border: '#dc2626' },
		info: { bg: '#06b6d4', color: '#ffffff', border: '#0891b2' },
		dark: { bg: '#1f2937', color: '#ffffff', border: '#111827' },
		light: { bg: '#f8fafc', color: '#374151', border: '#e2e8f0' }
	};

	// Size configurations
	const sizes = {
		xs: { padding: '2px 6px', fontSize: '0.625rem', height: '16px' },
		sm: { padding: '2px 8px', fontSize: '0.75rem', height: '20px' },
		md: { padding: '4px 10px', fontSize: '0.875rem', height: '24px' },
		lg: { padding: '6px 12px', fontSize: '1rem', height: '28px' },
		xl: { padding: '8px 16px', fontSize: '1.125rem', height: '32px' }
	};

	// Border radius options
	const borderRadius = {
		none: '0',
		sm: '2px',
		default: '4px',
		md: '6px',
		lg: '8px',
		xl: '12px',
		full: '9999px'
	};

	const colors = variants[variant] || variants.default;
	const sizeConfig = sizes[size] || sizes.md;
	
	// Base styles
	const baseStyles = {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontWeight: '500',
		lineHeight: '1',
		whiteSpace: 'nowrap',
		verticalAlign: 'middle',
		borderRadius: borderRadius[rounded],
		transition: 'all 0.2s ease-in-out',
		userSelect: 'none',
		position: 'relative',
		overflow: 'hidden',
		...sizeConfig,
		backgroundColor: outline ? 'transparent' : colors.bg,
		color: outline ? colors.bg : colors.color,
		border: outline ? `1px solid ${colors.border}` : 'none',
		cursor: onClick ? 'pointer' : 'default',
		...style
	};

	// Hover styles for clickable badges
	const hoverStyles = onClick ? {
		transform: 'translateY(-1px)',
		boxShadow: `0 4px 12px ${colors.bg}40`,
		opacity: '0.9'
	} : {};

	// Create badge content
	const badgeContent = () => {
		const elements = [];
		
		// Add icon if provided
		if (icon) {
			if (typeof icon === 'string') {
				elements.push({
					span: {
						text: icon,
						style: {
							marginRight: (text || children) ? '4px' : '0',
							fontSize: 'inherit',
							lineHeight: '1'
						}
					}
				});
			} else {
				// Object VDOM icon
				elements.push({
					div: {
						style: {
							marginRight: (text || children) ? '4px' : '0',
							display: 'flex',
							alignItems: 'center'
						},
						children: [icon]
					}
				});
			}
		}

		// Add text content
		if (text) {
			elements.push({
				span: {
					text: text,
					style: { lineHeight: '1' }
				}
			});
		}

		// Add children content (Object VDOM support)
		if (children) {
			if (Array.isArray(children)) {
				elements.push(...children);
			} else {
				elements.push(children);
			}
		}

		// Add close button if closable
		if (closable) {
			elements.push({
				button: {
					text: '×',
					style: {
						background: 'none',
						border: 'none',
						color: 'inherit',
						marginLeft: '6px',
						padding: '0',
						fontSize: '1.2em',
						lineHeight: '1',
						cursor: 'pointer',
						borderRadius: '50%',
						width: '14px',
						height: '14px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						opacity: '0.7',
						transition: 'opacity 0.2s ease'
					},
					onClick: (e) => {
						e.stopPropagation();
						if (onClose) onClose(e);
					},
					onMouseEnter: (e) => {
						e.target.style.opacity = '1';
						e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
					},
					onMouseLeave: (e) => {
						e.target.style.opacity = '0.7';
						e.target.style.backgroundColor = 'transparent';
					}
				}
			});
		}

		return elements;
	};

	return {
		span: {
			className: `juris-badge ${className}`,
			style: () => {
				const currentStyle = { ...baseStyles };
				// Apply hover styles when mouse is over (handled by CSS)
				return currentStyle;
			},
			onClick: onClick ? (e) => onClick(e) : undefined,
			onMouseEnter: onClick ? (e) => {
				Object.assign(e.target.style, hoverStyles);
			} : undefined,
			onMouseLeave: onClick ? (e) => {
				e.target.style.transform = 'translateY(0)';
				e.target.style.boxShadow = 'none';
				e.target.style.opacity = '1';
			} : undefined,
			children: [
				// Pulse animation overlay
				pulse ? {
					div: {
						style: {
							position: 'absolute',
							top: '0',
							left: '0',
							right: '0',
							bottom: '0',
							backgroundColor: colors.bg,
							borderRadius: 'inherit',
							animation: 'pulse 2s infinite',
							opacity: '0.4'
						}
					}
				} : null,
				
				// Main content container
				{
					div: {
						style: {
							position: 'relative',
							zIndex: '1',
							display: 'flex',
							alignItems: 'center',
							gap: '2px'
						},
						children: badgeContent()
					}
				}
			].filter(Boolean),
			...otherProps
		}
	};
};