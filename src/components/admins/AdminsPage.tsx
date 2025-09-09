"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import type { Admin, UpdateAdminRequest, UpdateAdminResponse } from "@/types/admins";

export default function AdminsPage({ admins }: { admins: Admin[] }) {
  const [query, setQuery] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Admin[]>(admins);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    admin?: Admin;
    action?: "activate" | "deactivate" | "grant_super" | "revoke_super";
  }>({ isOpen: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
    );
  }, [query, rows]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const pageSafe = Math.min(page, totalPages);
  const from = (pageSafe - 1) * perPage;
  const to = from + perPage;
  const pageItems = filtered.slice(from, to);

  function toggleActive(id: string) {
    const admin = rows.find((a) => a.id === id);
    if (!admin) return;
    const action = admin.isActive ? "deactivate" : "activate";
    setConfirmDialog({ isOpen: true, admin, action });
  }

  function toggleSuper(id: string) {
    const admin = rows.find((a) => a.id === id);
    if (!admin) return;
    const action = admin.superAdmin ? "revoke_super" : "grant_super";
    setConfirmDialog({ isOpen: true, admin, action });
  }

  async function handleConfirmToggle() {
    if (!confirmDialog.admin || !confirmDialog.action) return;
    try {
      setIsSubmitting(true);
      const current = confirmDialog.admin;
      const payload: UpdateAdminRequest = { id: current.id };
      if (confirmDialog.action === "activate") payload.isActive = true;
      if (confirmDialog.action === "deactivate") payload.isActive = false;
      if (confirmDialog.action === "grant_super") payload.superAdmin = true;
      if (confirmDialog.action === "revoke_super") payload.superAdmin = false;

      const { data } = await axios.patch<UpdateAdminResponse>("/api/protected/admins", payload);
      if (!data.success || !data.admin) {
        throw new Error(data.error || "Failed to update admin");
      }

      // Replace updated row with server response
      setRows((prev) => prev.map((a) => (a.id === data.admin!.id ? data.admin! : a)));
      setConfirmDialog({ isOpen: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      alert(`Could not update admin: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Admins</h1>

        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search name or email…"
            className="w-64 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
          />
          <select
            className="rounded-xl border px-2 py-2 text-sm"
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Active</Th>
              <Th>Super Admin</Th>
            </tr>
          </thead>
          <tbody className="[&>tr:nth-child(odd)]:bg-white [&>tr:nth-child(even)]:bg-gray-50/50">
            {pageItems.map((a) => (
              <tr key={a.id} className="border-t">
                <Td>
                  <div className="font-medium">{a.name}</div>
                </Td>
                <Td>{a.email}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <Badge active={a.isActive} />
                    <button
                      onClick={() => toggleActive(a.id)}
                      className={
                        "rounded-lg px-2 py-1 text-xs font-semibold border hover:bg-gray-50"
                      }
                      title={
                        a.isActive ? "Deactivate admin" : "Activate admin"
                      }
                    >
                      {a.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <BoolBadge value={a.superAdmin} trueText="Yes" falseText="No" />
                    <button
                      onClick={() => toggleSuper(a.id)}
                      className="rounded-lg px-2 py-1 text-xs font-semibold border hover:bg-gray-50"
                      title={
                        a.superAdmin
                          ? "Revoke super admin"
                          : "Grant super admin"
                      }
                    >
                      {a.superAdmin ? "Revoke" : "Grant"}
                    </button>
                  </div>
                </Td>
              </tr>
            ))}

            {pageItems.length === 0 && (
              <tr>
                <Td colSpan={4} className="py-10 text-center text-gray-500">
                  No admins found{query ? ` for “${query}”` : ""}.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-gray-600">
          Showing {pageItems.length} of {total} • Page {pageSafe} / {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <PageBtn onClick={() => setPage(1)} disabled={pageSafe === 1}>
            « First
          </PageBtn>
          <PageBtn
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pageSafe === 1}
          >
            ‹ Prev
          </PageBtn>
          <PageBtn
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={pageSafe >= totalPages}
          >
            Next ›
          </PageBtn>
          <PageBtn onClick={() => setPage(totalPages)} disabled={pageSafe >= totalPages}>
            Last »
          </PageBtn>
        </div>
      </div>

      {confirmDialog.isOpen && confirmDialog.admin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">
              {confirmDialog.action === "activate" && "Activate Admin"}
              {confirmDialog.action === "deactivate" && "Deactivate Admin"}
              {confirmDialog.action === "grant_super" && "Grant Super Admin"}
              {confirmDialog.action === "revoke_super" && "Revoke Super Admin"}
            </h3>

            <p className="mb-6 text-gray-600">
              {confirmDialog.action === "activate" && (
                <>Are you sure you want to activate <strong>{confirmDialog.admin.name}</strong>?</>
              )}
              {confirmDialog.action === "deactivate" && (
                <>Are you sure you want to deactivate <strong>{confirmDialog.admin.name}</strong>?</>
              )}
              {confirmDialog.action === "grant_super" && (
                <>Are you sure you want to grant Super Admin to <strong>{confirmDialog.admin.name}</strong>?</>
              )}
              {confirmDialog.action === "revoke_super" && (
                <>Are you sure you want to revoke Super Admin from <strong>{confirmDialog.admin.name}</strong>?</>
              )}
            </p>

            <div className="mb-4 rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-700">
                {confirmDialog.action === "activate" &&
                  "This will restore their access to the system."}
                {confirmDialog.action === "deactivate" &&
                  "This will disable their access to the system."}
                {confirmDialog.action === "grant_super" &&
                  "Super Admins can manage other admins and sensitive settings."}
                {confirmDialog.action === "revoke_super" &&
                  "Removing Super Admin will restrict their elevated permissions."}
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog({ isOpen: false })}
                className="rounded-lg border px-4 py-2 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmToggle}
                className={
                  "rounded-lg px-4 py-2 font-semibold text-white " +
                  (confirmDialog.action === "activate"
                    ? "bg-green-600 hover:bg-green-700"
                    : confirmDialog.action === "deactivate"
                      ? "bg-red-600 hover:bg-red-700"
                      : confirmDialog.action === "grant_super"
                        ? "bg-indigo-600 hover:bg-indigo-700"
                        : "bg-orange-600 hover:bg-orange-700")
                }
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." :
                  confirmDialog.action === "activate" ? "Activate" :
                    confirmDialog.action === "deactivate" ? "Deactivate" :
                      confirmDialog.action === "grant_super" ? "Grant" :
                        "Revoke"
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 ${className ?? ""}`}>
      {children}
    </th>
  );
}

function Td({
  children,
  className,
  colSpan,
}: React.PropsWithChildren<{ className?: string; colSpan?: number }>) {
  return (
    <td className={`px-4 py-3 align-top ${className ?? ""}`} colSpan={colSpan}>
      {children}
    </td>
  );
}

function Badge({ active }: { active: boolean }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold " +
        (active ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700")
      }
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function BoolBadge({
  value,
  trueText,
  falseText,
}: {
  value: boolean;
  trueText?: string;
  falseText?: string;
}) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold " +
        (value ? "bg-purple-100 text-purple-800" : "bg-gray-200 text-gray-700")
      }
    >
      {value ? trueText ?? "Yes" : falseText ?? "No"}
    </span>
  );
}

function PageBtn({
  children,
  disabled,
  onClick,
}: React.PropsWithChildren<{ disabled?: boolean; onClick: () => void }>) {
  return disabled ? (
    <span className="cursor-not-allowed rounded-lg border px-2 py-1 text-gray-400">
      {children}
    </span>
  ) : (
    <button onClick={onClick} className="rounded-lg border px-2 py-1 hover:bg-gray-50">
      {children}
    </button>
  );
}
