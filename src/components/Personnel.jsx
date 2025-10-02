export default function Personnel({ personnel }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Personnel 👤</h2>
      <div className="bg-white p-6 rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Name</th>
              <th className="text-left py-2">Role</th>
              <th className="text-left py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {personnel.map(p => (
              <tr key={p.id} className="border-b">
                <td className="py-3">{p.name}</td>
                <td className="py-3">{p.role}</td>
                <td className="py-3">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
