export default function Templates({ templates }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">eBR Templates 📋</h2>
      <div className="bg-white p-6 rounded-lg shadow">
        {templates.map(t => (
          <div key={t.id} className="mb-4 p-4 border rounded">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold">{t.name}</h3>
                <p className="text-sm text-gray-600">Version: {t.version} | Created: {t.createdDate}</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
                {t.status}
              </span>
            </div>
            <div className="mt-3">
              <h4 className="font-semibold text-sm mb-2">Steps:</h4>
              {t.steps.map(s => (
                <div key={s.id} className="ml-4 mb-1 text-sm">
                  {s.id}. {s.name} ({s.type})
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
