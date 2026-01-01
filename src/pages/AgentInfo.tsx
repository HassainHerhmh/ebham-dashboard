import React, { useEffect, useState } from "react";
import api from "../services/api";

interface Agent {
  id: number;
  name: string;
}

interface Group {
  id: number;
  name: string;
}

interface AgentInfoRow {
  id: number;
  agent_name: string;
  group_name: string;
  commission: number;
}

const AgentInfo: React.FC = () => {
  const [rows, setRows] = useState<AgentInfoRow[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [agentId, setAgentId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [commission, setCommission] = useState("0");

  /* =========================
     تحميل البيانات
  ========================= */
  const loadData = async () => {
    const [info, agentsData, groupsData] = await Promise.all([
      api.agentInfo.getAll(),
      api.agents.getAgents(),
      api.agentGroups.getGroups(),
    ]);

    setRows(info);
    setAgents(agentsData);
    setGroups(groupsData);
  };

  useEffect(() => {
    loadData();
  }, []);

  /* =========================
     إضافة
  ========================= */
  const handleAdd = async () => {
    if (!agentId || !groupId) {
      alert("اختر الوكيل والمجموعة");
      return;
    }

    await api.agentInfo.add({
      agent_id: Number(agentId),
      group_id: Number(groupId),
      commission: Number(commission),
    });

    setShowModal(false);
    setAgentId("");
    setGroupId("");
    setCommission("0");
    loadData();
  };

  const filtered = rows.filter((r) =>
    r.agent_name.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">معلومات الوكلاء</h1>

        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          إضافة
        </button>
      </div>

      <input
        type="text"
        placeholder="بحث باسم الوكيل"
        className="border p-2 rounded w-full"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">الوكيل</th>
              <th className="p-3">المجموعة</th>
              <th className="p-3">العمولة %</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.agent_name}</td>
                <td className="p-3">{r.group_name}</td>
                <td className="p-3">{r.commission}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* =========================
         Modal
      ========================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-[#e9efe6] rounded-xl w-[420px] p-6 space-y-4">

            <h2 className="text-xl font-bold text-right">إضافة وكيل</h2>

            <select
              className="w-full p-3 rounded"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
            >
              <option value="">اختر الوكيل</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            <select
              className="w-full p-3 rounded"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            >
              <option value="">اختر المجموعة</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="العمولة %"
              className="w-full p-3 rounded"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
            />

            <div className="flex justify-between items-center">
              <button
                onClick={handleAdd}
                className="bg-green-700 text-white px-6 py-2 rounded"
              >
                إضافة
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="text-green-700"
              >
                إلغاء الأمر
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AgentInfo;
