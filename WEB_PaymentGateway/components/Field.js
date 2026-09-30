export default function Field({ id, label, error, multiline = false, ...props }) {
  const Tag = multiline ? "textarea" : "input";
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <Tag
        id={id}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-xl border bg-white px-3.5 text-sm placeholder:text-muted/70 ${
          multiline ? "py-2.5" : "h-11"
        } ${error ? "border-danger" : "border-line"}`}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
