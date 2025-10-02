export default function Batches({ batches, setBatches, deviations, setDeviations }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Batch Records 🧪</h2>
      <div className="bg-white p-6 rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Batch ID</th>
              <th className="text-left py-2">Product</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Progress</th>
            </tr>
          </thead>
          <tbody>
            {batches.map(b => (
              <tr key={b.id} className="border-b">
                <td className="py-3">{b.id}</td>
                <td className="py-3">{b.product}</td>
                <td className="py-3">
                  <span className={`px-3 py-1 rounded text-sm ${
                    b.status === "completed" ? "bg-green-100 text-green-800" :
                    b.status === "deviation" ? "bg-red-100 text-red-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {b.status}
                  </span>
                </td>
                <td className="py-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{width: `${b.progress}%`}}
                    ></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
