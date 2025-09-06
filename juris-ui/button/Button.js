
export const Button = (props, context) => {
  const {
    variant = 'primary',
    size = 'md',
    onClick = null,
    disabled = false,
    children = null,
    text = '',
    className = '',
    style = {},
    ...otherProps
  } = props;

  const variants = {
    primary: {
      background: '#3b82f6',
      color: 'white',
      border: 'none',
    },
    secondary: {
      background: 'transparent',
      color: '#6b7280',
      border: '1px solid #d1d5db',
    },
    danger: {
      background: '#ef4444',
      color: 'white',
      border: 'none',
    },
  };

  const sizes = {
    sm: {
      padding: '6px 12px',
      fontSize: '0.875rem',
    },
    md: {
      padding: '8px 16px',
      fontSize: '1rem',
    },
    lg: {
      padding: '12px 24px',
      fontSize: '1.125rem',
    },
  };

  const colors = variants[variant] || variants.primary;
  const sizeConfig = sizes[size] || sizes.md;

  const baseStyles = {
    padding: sizeConfig.padding,
    fontSize: sizeConfig.fontSize,
    borderRadius: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s ease-in-out',
    ...colors,
    ...style,
  };

  return {
    button: {
      className: `juris-button juris-button-${variant} ${className}`,
      style: baseStyles,
      onClick: !disabled ? onClick : null,
      disabled: disabled,
      children: children || text,
      ...otherProps,
    },
  };
};
