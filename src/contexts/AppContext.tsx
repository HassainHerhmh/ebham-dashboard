import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from "react";
import { usePolling } from "../hooks/usePolling";

interface Notification {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  timestamp: Date;
  isVisible: boolean;
}

interface Stats {
  totalOrders: number;
  activeCustomers: number;
  availableCaptains: number;
  totalSales: number;
  averageDeliveryTime: number;
  dailyTarget: number;
}

interface AppState {
  stats: Stats | null;
  loading: boolean;
  error: string | null;
  notifications: Notification[];
  user: { name: string; role: string } | null;
  realTimeUpdates: boolean;
}

interface AppActions {
  loadStats: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addNotification: (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => void;
  hideNotification: (id: string) => void;
  toggleRealTimeUpdates: () => void;
}

interface AppContextType {
  state: AppState;
  actions: AppActions;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

type Action =
  | { type: "SET_STATS"; payload: Stats }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "HIDE_NOTIFICATION"; payload: string }
  | { type: "TOGGLE_REAL_TIME_UPDATES" };

const initialState: AppState = {
  stats: null,
  loading: false,
  error: null,
  notifications: [],
  user: { name: "أحمد محمد", role: "مدير النظام" },
  realTimeUpdates: true,
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_STATS":
      return { ...state, stats: action.payload, loading: false, error: null };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "ADD_NOTIFICATION":
      return { ...state, notifications: [...state.notifications, action.payload] };
    case "HIDE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, isVisible: false } : n
        ),
      };
    case "TOGGLE_REAL_TIME_UPDATES":
      return { ...state, realTimeUpdates: !state.realTimeUpdates };
    default:
      return state;
  }
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const actions: AppActions = {
    loadStats: async () => {
      try {
        const api = await import("../services/api");

        // ✅ تحقق إن وُجد قسم admin.getStatistics فعلاً
        const hasGetStats = Boolean(
          (api.default as any)?.admin?.getStatistics
        );

        if (hasGetStats) {
          const response = await (api.default as any).admin.getStatistics();
          if (response.success && response.stats) {
            dispatch({ type: "SET_STATS", payload: response.stats });
            return;
          }
        }

        // البيانات المبدئية الافتراضية عند غياب API
        const mockStats: Stats = {
          totalOrders: 0,
          activeCustomers: 0,
          availableCaptains: 0,
          totalSales: 0,
          averageDeliveryTime: 28,
          dailyTarget: 200,
        };
        dispatch({ type: "SET_STATS", payload: mockStats });
      } catch (error) {
        console.error("Error loading stats:", error);
        dispatch({ type: "SET_ERROR", payload: "فشل في تحميل الإحصائيات" });
        const mockStats: Stats = {
          totalOrders: 0,
          activeCustomers: 0,
          availableCaptains: 0,
          totalSales: 0,
          averageDeliveryTime: 28,
          dailyTarget: 200,
        };
        dispatch({ type: "SET_STATS", payload: mockStats });
      }
    },

    setLoading: (loading: boolean) => {
      dispatch({ type: "SET_LOADING", payload: loading });
    },

    setError: (error: string | null) => {
      dispatch({ type: "SET_ERROR", payload: error });
    },

    addNotification: (
      message: string,
      type: "success" | "error" | "warning" | "info"
    ) => {
      const notification: Notification = {
        id: Date.now().toString(),
        message,
        type,
        timestamp: new Date(),
        isVisible: true,
      };
      dispatch({ type: "ADD_NOTIFICATION", payload: notification });
      setTimeout(() => {
        dispatch({ type: "HIDE_NOTIFICATION", payload: notification.id });
      }, 5000);
    },

    hideNotification: (id: string) => {
      dispatch({ type: "HIDE_NOTIFICATION", payload: id });
    },

    toggleRealTimeUpdates: () => {
      dispatch({ type: "TOGGLE_REAL_TIME_UPDATES" });
    },
  };

  useEffect(() => {
    actions.loadStats();
  }, []);

  usePolling(
    () => {
      if (state.realTimeUpdates) {
        actions.loadStats();
      }
    },
    { interval: 10000, enabled: state.realTimeUpdates }
  );

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};