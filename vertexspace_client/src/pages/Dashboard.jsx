import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">
        Welcome {user.username}
      </h1>
      <p>Your role: {user.roles[0]}</p>
    </div>
  );
};

export default Dashboard;
