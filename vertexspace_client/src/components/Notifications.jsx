import { useEffect, useMemo, useState } from "react";
import SockJS from "sockjs-client/dist/sockjs";
import { Client } from "@stomp/stompjs";
import { API_BASE_URL } from "../constants/api";
import { getNotifications } from "../services/notificationService";

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const resolveWsUrl = () => {
  const apiUrl = API_BASE_URL;
  return apiUrl.replace(/\/api\/?$/, "") + "/ws";
};

const formatUtcToIst = (utcString) =>
  new Date(utcString).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

const convertMessageUtcToIst = (message) => {
  if (!message) return "";

  const utcDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/g;
  return message.replace(utcDateRegex, (utcValue) => formatUtcToIst(utcValue));
};

const Notifications = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.readStatus === false).length,
    [notifications]
  );

  useEffect(() => {
    let client;

    const fetchExisting = async () => {
      try {
        const res = await getNotifications();
        const list = extractList(res);
        setNotifications(list);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch notifications");
      }
    };

    const connectSocket = () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      client = new Client({
        reconnectDelay: 5000,
        webSocketFactory: () => new SockJS(resolveWsUrl()),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });

      client.onConnect = () => {
        client.subscribe("/user/queue/notifications", (message) => {
          const body = message.body;

          let incoming;
          try {
            const parsed = JSON.parse(body);
            incoming = {
              id: parsed.id || `rt-${Date.now()}`,
              message: parsed.message || body,
              type: parsed.type || "REALTIME",
              readStatus: false,
              createdAt: parsed.createdAt || new Date().toISOString(),
            };
          } catch {
            incoming = {
              id: `rt-${Date.now()}`,
              message: body,
              type: "REALTIME",
              readStatus: false,
              createdAt: new Date().toISOString(),
            };
          }

          setNotifications((prev) => [incoming, ...prev]);
        });
      };

      client.onStompError = () => {
        setError("Realtime notification connection error");
      };

      client.activate();
    };

    if (user) {
      fetchExisting();
      connectSocket();
    }

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [user]);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="bg-gray-800 px-3 py-1 rounded hover:bg-gray-700 transition"
      >
        Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-auto bg-white text-black rounded shadow-lg z-50 border">
          <div className="p-3 border-b font-bold">Notifications</div>

          {error && <p className="p-3 text-red-600 text-sm">{error}</p>}

          {notifications.length === 0 ? (
            <p className="p-3 text-sm text-gray-600">No notifications</p>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-3">
                  <p className="text-sm font-medium">
                    {convertMessageUtcToIst(notification.message)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {notification.type} · {formatUtcToIst(notification.createdAt)} IST
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
