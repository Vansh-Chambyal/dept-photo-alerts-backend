import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { api } from "./api";
import { requestPushToken } from "./firebase";
import NavBar from "./components/NavBar";
import LoginPhone from "./pages/LoginPhone";
import LoginPin from "./pages/LoginPin";
import SetupAccount from "./pages/SetupAccount";
import Feed from "./pages/Feed";
import SendPhoto from "./pages/SendPhoto";
import ManageDepartments from "./pages/ManageDepartments";
import ManageUsers from "./pages/ManageUsers";

function Loading() {
  return (
    <div className="screen-centered">
      <p>Loading…</p>
    </div>
  );
}

function RequireAuth({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <Loading />;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user?.is_admin) return <Navigate to="/feed" replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="screen">
      <NavBar />
      <div className="content">{children}</div>
    </div>
  );
}

function Shell() {
  const { token } = useAuth();

  // Register for push once signed in. Silently does nothing if Firebase
  // isn't configured yet or the user declines the permission prompt.
  useEffect(() => {
    if (!token) return;
    requestPushToken().then((pushToken) => {
      if (pushToken) api.setFcmToken(pushToken, token).catch(() => {});
    });
  }, [token]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPhone />} />
      <Route path="/login/pin" element={<LoginPin />} />
      <Route path="/setup" element={<SetupAccount />} />
      <Route
        path="/feed"
        element={
          <RequireAuth>
            <AppLayout>
              <Feed />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/send"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AppLayout>
                <SendPhoto />
              </AppLayout>
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/departments"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AppLayout>
                <ManageDepartments />
              </AppLayout>
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AppLayout>
                <ManageUsers />
              </AppLayout>
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/feed" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
