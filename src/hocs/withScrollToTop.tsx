import { useRef, useEffect, forwardRef, type ReactElement, type FC, type RefAttributes, type Ref } from 'react';

// TODO: debug componentRef not being forwarded
// Warning: Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?
const withScrollToTop = <P extends object>(
	Component: FC<P & RefAttributes<unknown>>
) => {
	// Define the forwardRef wrapper
	const WrappedComponent = forwardRef<ReactElement, P>((props): ReactElement | null => {
		// Use a ref to the component
		const componentRef = useRef<HTMLElement>(null);

		// Use an effect to scroll into view
		useEffect(() => {
			if (componentRef?.current) {
				componentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		}, []);

		// Render the wrapped component with forwarded ref
		return <Component ref={componentRef as Ref<HTMLElement>} {...(props as P)} /> as ReactElement; // Cast to ReactElement
	});

	// Set the display name for better debugging
	WrappedComponent.displayName = `WithScrollToTop(${Component.displayName || Component.name || 'Component'})`;

	return WrappedComponent;
};

export default withScrollToTop;