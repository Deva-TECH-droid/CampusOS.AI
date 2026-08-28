import { NavLink, Outlet } from 'react-router-dom'

const WorkspaceLayout = ({ tabs }) => {
  return (
    <div className="flex flex-col h-full">

      {/* Tab Bar */}
      <div className="flex items-center gap-1 border-b border-gray-100 bg-white px-1 pb-0 -mx-6 -mt-6 px-6 mb-6">
        {tabs.map(({ label, path, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) =>
              `px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150 whitespace-nowrap
              ${isActive
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  )
}

export default WorkspaceLayout
