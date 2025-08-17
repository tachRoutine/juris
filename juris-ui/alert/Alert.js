export const Alert = (props, context) => {
	const {
		variant = 'info',
		size = 'md',
		title = '',
		message = '',
		children = null,
		icon = null,
		closable = false,
		dismissible = false,
		border = true,
		rounded = 'default',
		shadow = true,
		onClose = null,
		onDismiss = null,
		className = '',
		style = {},
		actions = null,
		...otherProps
	} = props;

	// Variant color schemes
	const variants = {
		info: {
			bg: '#eff6ff',
			border: '#bfdbfe',
			text: '#1e40af',
			icon: 'ℹ️',
			accent: '#3b82f6'
		},
		success: {
			bg: '#f0fdf4',
			border: '#bbf7d0',
			text: '#166534',
			icon: '✅',
			accent: '#10b981'
		},
		warning: {
			bg: '#fffbeb',
			border: '#fde68a',
			text: '#92400e',
			icon: '⚠️',
			accent: '#f59e0b'
		},
		danger: {
			bg: '#fef2f2',
			border: '#fecaca',
			text: '#dc2626',
			icon: '❌',
			accent: '#ef4444'
		},
		primary: {
			bg: '#f0f9ff',
			border: '#bae6fd',
			text: '#0c4a6e',
			icon: '🎯',
			accent: '#0ea5e9'
		},
		secondary: {
			bg: '#f8fafc',
			border: '#cbd5e1',
			text: '#475569',
			icon: '💬',
			accent: '#64748b'
		}
	};

	// Size configurations
	const sizes = {
		sm: {
			padding: '12px 16px',
			fontSize: '0.875rem',
			iconSize: '1rem',
			titleSize: '0.9rem',
			gap: '8px'
		},
		md: {
			padding: '16px 20px',
			fontSize: '0.875rem',
			iconSize: '1.125rem',
			titleSize: '1rem',
			gap: '12px'
		},
		lg: {
			padding: '20px 24px',
			fontSize: '1rem',
			iconSize: '1.25rem',
			titleSize: '1.125rem',
			gap: '16px'
		}
	};

	// Border radius options
	const borderRadius = {
		none: '0',
		sm: '4px',
		default: '6px',
		md: '8px',
		lg: '12px',
		xl: '16px'
	};

	const colors = variants[variant] || variants.info;
	const sizeConfig = sizes[size] || sizes.md;

	// Base styles
	const baseStyles = {
		position: 'relative',
		display: 'flex',
		padding: sizeConfig.padding,
		backgroundColor: colors.bg,
		border: border ? `1px solid ${colors.border}` : 'none',
		borderRadius: borderRadius[rounded],
		borderLeft: `4px solid ${colors.accent}`,
		color: colors.text,
		fontSize: sizeConfig.fontSize,
		lineHeight: '1.5',
		gap: sizeConfig.gap,
		boxShadow: shadow ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
		transition: 'all 0.2s ease-in-out',
		...style
	};

	// Create alert content
	const alertContent = () => {
		const elements = [];

		// Icon section
		if (icon !== false) {
			const alertIcon = icon || colors.icon;
			
			if (typeof alertIcon === 'string') {
				elements.push({
					div: {
						style: {
							fontSize: sizeConfig.iconSize,
							flexShrink: '0',
							lineHeight: '1',
							marginTop: '1px'
						},
						text: alertIcon
					}
				});
			} else if (alertIcon) {
				// Object VDOM icon
				elements.push({
					div: {
						style: {
							fontSize: sizeConfig.iconSize,
							flexShrink: '0',
							lineHeight: '1',
							marginTop: '1px',
							display: 'flex',
							alignItems: 'center'
						},
						children: [alertIcon]
					}
				});
			}
		}

		// Content section
		const contentElements = [];

		// Title
		if (title) {
			contentElements.push({
				div: {
					style: {
						fontSize: sizeConfig.titleSize,
						fontWeight: '600',
						marginBottom: title && (message || children) ? '4px' : '0',
						color: colors.text
					},
					text: title
				}
			});
		}

		// Message content
		if (message) {
			contentElements.push({
				div: {
					style: {
						color: colors.text,
						opacity: '0.9'
					},
					text: message
				}
			});
		}

		// Children content (Object VDOM support)
		if (children) {
			if (Array.isArray(children)) {
				contentElements.push(...children);
			} else {
				contentElements.push(children);
			}
		}

		// Actions section
		if (actions) {
			contentElements.push({
				div: {
					style: {
						marginTop: '12px',
						display: 'flex',
						gap: '8px',
						flexWrap: 'wrap'
					},
					children: Array.isArray(actions) ? actions : [actions]
				}
			});
		}

		elements.push({
			div: {
				style: {
					flex: '1',
					minWidth: '0'
				},
				children: contentElements
			}
		});

		// Close button section
		if (closable || dismissible) {
			elements.push({
				button: {
					style: {
						position: 'absolute',
						top: '8px',
						right: '8px',
						background: 'none',
						border: 'none',
						color: colors.text,
						cursor: 'pointer',
						padding: '4px',
						borderRadius: '4px',
						fontSize: '1.25rem',
						lineHeight: '1',
						opacity: '0.6',
						transition: 'opacity 0.2s ease',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						width: '24px',
						height: '24px'
					},
					text: '×',
					onClick: (e) => {
						e.stopPropagation();
						if (onClose) onClose(e);
						if (onDismiss) onDismiss(e);
					},
					onMouseEnter: (e) => {
						e.target.style.opacity = '1';
						e.target.style.backgroundColor = 'rgba(0,0,0,0.1)';
					},
					onMouseLeave: (e) => {
						e.target.style.opacity = '0.6';
						e.target.style.backgroundColor = 'transparent';
					}
				}
			});
		}

		return elements;
	};

	return {
		div: {
			className: `juris-alert juris-alert-${variant} ${className}`,
			style: baseStyles,
			role: 'alert',
			'aria-live': variant === 'danger' ? 'assertive' : 'polite',
			children: alertContent(),
			...otherProps
		}
	};
};