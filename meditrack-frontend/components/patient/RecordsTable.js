"use client";

// components/patient/RecordsTable.js
export default function RecordsTable({ user }) {
  return (
    <div>
      {/* Wrap ALL edit and delete buttons with this check */}
      {user?.role !== "PATIENT" && (
        <div className="flex gap-2">
          <button>Edit</button>
          <button>Delete</button>
        </div>
      )}
    </div>
  );
}
