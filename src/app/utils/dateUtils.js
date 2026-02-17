export const formatDate = (dateString, options = {}) => {
    if (!dateString) return "";
    const date = new Date(dateString);

    const defaultOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        ...options
    };

    return date.toLocaleDateString('en-US', defaultOptions);
};

export const formatTime = (dateString, options = {}) => {
    if (!dateString) return "";
    const date = new Date(dateString);

    const defaultOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        ...options
    };

    return date.toLocaleTimeString('en-US', defaultOptions);
};
