import { TrendingUp, CheckCircle, AlertTriangle, Activity } from 'lucide-react';

export default function Dashboard({ batches, templates, equipment, deviations }) {
  const inProgress = batches.filter(b => b.status === "in_progress").length;
  const completed = batches.filter(b => b.status === "completed").length;
  const deviationsCount = batches.filter(b => b.status === "deviation").length;
  const equipmentActive = equipment.filter(e => e.status === "in_operation").length;

  const kpiCards = [
    {
      title: "In Progress",
      value: inProgress,
      icon: Activity,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-500"
    },
    {
      title: "Completed",
      value: completed,
      icon: CheckCircle,
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-500/10",
      iconColor: "text-green-500"
    },
    {
      title: "Deviations",
      value: deviationsCount,
      icon: AlertTriangle,
      color: "from-red-500 to-rose-600",
      bgColor: "bg-red-500/10",
      iconColor: "text-red-500"
    },
    {
      title: "Equipment Active",
      value: equipmentActive,
      icon: TrendingUp,
      color: "from-purple-500 to-indigo-600",
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-500"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header with glow effect */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2 animate-fade-in glow-text">
          Production Dashboard
        </h2>
        <p className="text-gray-600 animate-fade-in-delay">Real-time manufacturing execution overview</p>
      </div>
      
      {/* KPI Cards with glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => (
          <div
            key={index}
            className="glass-card group animate-slide-up hover-lift"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-xl`}></div>
            
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <div className={`w-2 h-2 rounded-full ${card.bgColor} animate-pulse`}></div>
              </div>
              
              <div>
                <p className="text-gray-600 text-sm mb-1">{card.title}</p>
                <p className="text-4xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Batches - Modern cards */}
      <div className="glass-card animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Active Batches</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live</span>
          </div>
        </div>
        
        <div className="space-y-3">
          {batches.map((b, index) => (
            <div
              key={b.id}
              className="batch-card group"
              style={{ animationDelay: `${0.5 + index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-semibold text-gray-900">{b.id}</span>
                  <span className="text-gray-600 ml-2">— {b.product}</span>
                </div>
                <span className={`status-badge ${
                  b.status === "completed" ? "status-completed" :
                  b.status === "deviation" ? "status-deviation" :
                  "status-progress"
                }`}>
                  {b.status}
                </span>
              </div>
              
              <div className="relative">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      b.status === "completed" ? "bg-gradient-to-r from-green-500 to-emerald-500" :
                      b.status === "deviation" ? "bg-gradient-to-r from-red-500 to-rose-500" :
                      "bg-gradient-to-r from-blue-500 to-indigo-500"
                    }`}
                    style={{ width: `${b.progress}%` }}
                  ></div>
                </div>
                <span className="absolute -top-6 right-0 text-xs font-semibold text-gray-600">
                  {b.progress}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Deviations */}
      {deviations.length > 0 && (
        <div className="glass-card animate-slide-up" style={{ animationDelay: '0.8s' }}>
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            Recent Deviations
          </h3>
          
          <div className="space-y-3">
            {deviations.slice(0, 5).map((d, index) => (
              <div
                key={d.id}
                className="deviation-card group"
                style={{ animationDelay: `${0.9 + index * 0.1}s` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">Batch: {d.batchId}</div>
                    <div className="text-sm text-gray-600 mb-2">{d.description}</div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Reported by: {d.reportedBy}</span>
                      <span>•</span>
                      <span>{d.reportedDate}</span>
                    </div>
                  </div>
                  <span className={`status-badge ${
                    d.status === 'approved' ? 'status-completed' :
                    d.status === 'rejected' ? 'status-deviation' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {d.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}