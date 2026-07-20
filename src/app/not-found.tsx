export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-2">404</h1>
        <p className="text-gray-500">Page not found</p>
      </div>
    </div>
  );
}
