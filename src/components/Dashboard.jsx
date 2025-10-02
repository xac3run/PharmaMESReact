export default function Dashboard({ batches, templates }) {
  const inProgress = batches.filter(b => b.status === "in_progress").length;
  const completed = batches.filter(b => b.status === "completed").length;
  const deviations = batches.filter(b => b.status === "deviation").length;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard 📊</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm">In Progress</div>
          <div className="text-3xl font-bold text-blue-600">{inProgress}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Completed</div>
          <div className="text-3xl font-bold text-green-600">{completed}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Deviations</div>
          <div className="text-3xl font-bold text-red-600">{deviations}</div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-semibold mb-4">Active Batches</h3>
        {batches.map(b => (
          <div key={b.id} className="mb-2 p-3 bg-gray-50 rounded">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-semibold">{b.id}</span> - {b.product}
              </div>
              <span className={`px-3 py-1 rounded text-sm ${
                b.status === "completed" ? "bg-green-100 text-green-800" :
                b.status === "deviation" ? "bg-red-100 text-red-800" :
                "bg-blue-100 text-blue-800"
              }`}>
                {b.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
