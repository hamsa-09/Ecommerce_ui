import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const RoleBased = ({ roles, children }) => {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  const hasAccess = roles.some((role) => user.roles.includes(role));

  return hasAccess ? children : null;
};

export default RoleBased;
