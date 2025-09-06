
export const Card = (props, context) => {
  const {
    title = '',
    children = null,
    className = '',
    style = {},
    ...otherProps
  } = props;

  const baseStyles = {
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    ...style,
  };

  const headerStyles = {
    padding: '12px 16px',
    borderBottom: '1px solid #d1d5db',
    fontWeight: 'bold',
  };

  const bodyStyles = {
    padding: '16px',
  };

  return {
    div: {
      className: `juris-card ${className}`,
      style: baseStyles,
      ...otherProps,
      children: [
        title && {
          div: {
            className: 'juris-card-header',
            style: headerStyles,
            children: title,
          }
        },
        {
          div: {
            className: 'juris-card-body',
            style: bodyStyles,
            children: children,
          }
        }
      ].filter(Boolean),
    },
  };
};
