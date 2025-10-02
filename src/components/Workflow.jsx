export default function Workflow({ workflow, batches, templates }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Workflow 🔄</h2>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Workflow visualization coming soon...</p>
        <div className="mt-4">
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-3xl">📝</span>
            </div>
            <div className="text-2xl">→</div>
            <div className="w-24 h-24 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-3xl">⚙️</span>
            </div>
            <div className="text-2xl">→</div>
            <div className="w-24 h-24 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-3xl">✅</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
