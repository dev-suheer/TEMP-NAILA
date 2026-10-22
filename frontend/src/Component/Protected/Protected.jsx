import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import PageLoader from "../Loader/PageLoader";

const UserProtected = ({ children }) => {
  const { routingLoading, user, isAuthenticated } = useSelector(
    (state) => state.auth
  );
  if ((routingLoading || user === null) && isAuthenticated) {
    return <PageLoader />;
  }

  if (isAuthenticated && user) {
    return children;
  }

  return <Navigate to={"/"} replace={true} />;
};

const LoginProtected = ({ children }) => {
  const { user, routingLoading, isAuthenticated } = useSelector(
    (state) => state.auth
  );


  if (routingLoading && user === null) {
    return <PageLoader />;
  }
  if (isAuthenticated && user) {
    return <Navigate to={"/dashboard"} replace={true} />;
  }
  return children;
};

export { UserProtected, LoginProtected };
