import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `block w-full text-left py-2 px-4 rounded ${
      isActive ? "bg-primary-100 text-primary-700" : "hover:bg-gray-200"
    }`;

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-100 p-4 flex flex-col">
        <h2 className="font-bold text-xl mb-6">Admin Panel</h2>
        <nav className="flex flex-col space-y-2">
          <NavLink to="/admin/users" className={navLinkClasses}>
            Manage Users
          </NavLink>
          <NavLink to="/admin/locations" className={navLinkClasses}>
            Manage Locations
          </NavLink>
          <NavLink to="/admin/houses" className={navLinkClasses}>
            Manage Houses
          </NavLink>
          <NavLink to="/admin/rooms" className={navLinkClasses}>
            Manage Rooms
          </NavLink>
          <NavLink to="/admin/amenities" className={navLinkClasses}>
            Manage Amenities
          </NavLink>
          <NavLink to="/admin/services" className={navLinkClasses}>
            Manage Services
          </NavLink>
          <NavLink to="/admin/extras" className={navLinkClasses}>
            Manage Extras
          </NavLink>
          <NavLink to="/admin/beds" className={navLinkClasses}>
            Manage Beds
          </NavLink>
        </nav>
        <div className="mt-auto">
          <button
            className="block w-full text-left py-2 px-4 rounded mt-8 bg-blue-100 hover:bg-blue-200"
            onClick={() => navigate("/")}
          >
            Back to User View
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
