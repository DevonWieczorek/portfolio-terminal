import React, { useRef, useEffect, forwardRef, ReactElement } from 'react';

// TODO: debug componentRef not being forwarded
// Warning: Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?
const withScrollToTop = <P extends object>(
  Component: React.FC<P & React.RefAttributes<unknown>>
) => {
  // Define the forwardRef wrapper
  const WrappedComponent = forwardRef<ReactElement<any>, P>((props, ref): React.ReactElement | null => {
    // Use a ref to the component
    const componentRef = useRef<HTMLElement>(null);

    // Use an effect to scroll into view
    useEffect(() => {
      if (componentRef?.current) {
		console.log('SCROLL')
        componentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, [componentRef]);

    // Render the wrapped component with forwarded ref
    return <Component ref={componentRef as React.Ref<HTMLElement>} {...(props as P)} /> as React.ReactElement; // Cast to React.ReactElement
  });

  // Set the display name for better debugging
  WrappedComponent.displayName = `WithScrollToTop(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
};

export default withScrollToTop;