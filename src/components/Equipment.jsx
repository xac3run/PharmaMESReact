export default function Equipment({ equipment }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Equipment ⚙️</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {equipment.map(e => (
          <div key={e.id} className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold mb-2">{e.name}</h3>
            <p className="text-sm text-gray-600">Type: {e.type}</p>
            <p className="text-sm text-gray-600">Location: {e.location}</p>
            <span className={`inline-block mt-2 px-3 py-1 rounded text-sm ${
              e.status === "in_operation" ? "bg-green-100 text-green-800" :
              "bg-yellow-100 text-yellow-800"
            }`}>
              {e.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
