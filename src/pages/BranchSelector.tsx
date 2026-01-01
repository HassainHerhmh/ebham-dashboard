import React, { useEffect, useState } from "react";

interface Branch {
  id: number;
  name: string;
}

const BranchSelector: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");

  useEffect(() => {
    fetch("http://localhost:5000/branches", {
      headers: { "branch-name": "عتق" } // لجلب الفروع من أحد القواعد
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBranches(data.branches);
          const savedBranch = localStorage.getItem("selectedBranch");
          if (savedBranch) setSelectedBranch(savedBranch);
        }
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const branchName = e.target.value;
    setSelectedBranch(branchName);
    localStorage.setItem("selectedBranch", branchName);
  };

  return (
    <select
      value={selectedBranch}
      onChange={handleChange}
      className="border border-gray-300 rounded px-2 py-1"
    >
      <option value="">-- اختر فرع --</option>
      {branches.map((branch) => (
        <option key={branch.id} value={branch.name}>
          {branch.name}
        </option>
      ))}
    </select>
  );
};

export default BranchSelector;