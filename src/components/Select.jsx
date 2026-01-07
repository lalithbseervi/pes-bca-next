/**
 * Select component with consistent styling regardless of dark/light mode
 * Includes loading state and disabled state handling
 */
export default function Select({
  value,
  onChange,
  disabled = false,
  loading = false,
  placeholder = "Select an option",
  options = [],
  className = "",
  renderOption = null,
}) {
  const isDisabled = disabled || loading;

  const baseStyles = `
    w-full p-3 rounded-lg border transition-all duration-200
    bg-white dark:bg-[#1a1a1a] 
    text-gray-900 dark:text-gray-100 
    border-gray-300 dark:border-gray-600
    focus:outline-none focus:ring-2 focus:ring-[#21c063] focus:border-[#21c063]
    disabled:bg-gray-100 dark:disabled:bg-[#0f0f0f] 
    disabled:text-gray-400 dark:disabled:text-gray-600 
    disabled:cursor-not-allowed
    hover:border-gray-400 dark:hover:border-gray-500 
    disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={onChange}
        disabled={isDisabled}
        className={`${baseStyles} ${className} ${loading ? 'pr-10' : ''}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => {
          if (renderOption) {
            return renderOption(option);
          }
          
          // Default rendering - supports both object and primitive values
          const optionValue = typeof option === 'object' ? option.value : option;
          const optionLabel = typeof option === 'object' ? option.label : option;
          const optionKey = typeof option === 'object' ? (option.key || option.value) : option;
          
          return (
            <option key={optionKey} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
      
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="animate-spin h-5 w-5 text-[#21c063]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
