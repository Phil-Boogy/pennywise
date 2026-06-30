import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useAppDispatch } from "./hooks/redux";
import { setCredentials } from "./features/auth/authSlice";
import { refreshToken } from "./api/auth";

const App = () => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const attemptRefresh = async () => {
      try {
        const response = await refreshToken();
        dispatch(setCredentials({
          accessToken: response.accessToken,
          user: response.user,
        }));
      } catch (error) {
        // no valid refresh token, user stays logged out
      } finally {
        setIsLoading(false);
      }
    };

    attemptRefresh();
  }, [dispatch]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Outlet />
    </div>
  );
};

export default App;