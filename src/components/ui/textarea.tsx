import * as React from 'react';

import {cn} from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, value, defaultValue, ...props}, ref) => {
    // If `value` is provided, the component is controlled.
    // Otherwise, it's uncontrolled and can use `defaultValue`.
    const controlledProps = value !== undefined ? { value } : { defaultValue };
    
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        ref={ref}
        {...controlledProps}
        {...props} 
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
