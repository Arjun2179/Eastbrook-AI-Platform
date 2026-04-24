import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-content">
        <Topbar />
        <div className="app-page">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
