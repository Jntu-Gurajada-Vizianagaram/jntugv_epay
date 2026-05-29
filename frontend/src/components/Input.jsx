export function Input({ label, error, className = "", ...props }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}

      <input
        {...props}
        className={`
          w-full px-3 py-2 border rounded-lg text-sm bg-white text-gray-950
          ${error ? "border-red-500" : "border-gray-300"}
          focus:outline-none focus:ring-2 
          ${error ? "focus:ring-red-500" : "focus:ring-blue-500"}
          ${className}
        `}
      />

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
