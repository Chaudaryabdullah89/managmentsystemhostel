/**
 * Toast Notification Examples for Sonner
 * 
 * Import toast in your component:
 * import { toast } from 'sonner';
 * 
 * Then use any of these methods:
 */

// Success Toast
toast.success('Account created successfully!');

// Error Toast
toast.error('Invalid email or password');

// Info Toast
toast.info('Please check your email');

// Warning Toast
toast.warning('Your session will expire soon');

// Loading Toast (useful for async operations)
const promise = () => new Promise((resolve) => setTimeout(resolve, 2000));

toast.promise(promise, {
    loading: 'Loading...',
    success: 'Data loaded successfully!',
    error: 'Failed to load data',
});

// Custom Toast with description
toast('Notification', {
    description: 'This is a detailed message',
});

// Toast with action button
toast('Event created', {
    action: {
        label: 'Undo',
        onClick: () => console.log('Undo'),
    },
});

// Dismissible toast
const toastId = toast('This can be dismissed');
// Later, dismiss it:
// toast.dismiss(toastId);

// Position options (already set in layout.tsx):
// - top-left
// - top-center
// - top-right (current)
// - bottom-left
// - bottom-center
// - bottom-right

/**
 * Example usage in a form:
 */
const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation error
    if (!email) {
        toast.error('Email is required');
        return;
    }

    // Loading state
    const loadingToast = toast.loading('Submitting...');

    try {
        const response = await fetch('/api/submit', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        // Dismiss loading toast
        toast.dismiss(loadingToast);

        if (response.ok) {
            toast.success('Form submitted successfully!');
        } else {
            toast.error('Failed to submit form');
        }
    } catch (error) {
        toast.dismiss(loadingToast);
        toast.error('An error occurred');
    }
};
