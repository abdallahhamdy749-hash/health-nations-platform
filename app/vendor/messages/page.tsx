"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  MessageSquare,
  Package,
  RefreshCw,
  Send,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type VendorMessage = {
  id: string;
  vendor_id: string;
  quotation_id: string | null;
  order_id: string | null;
  subject: string;
  message: string;
  sender_type: "vendor" | "admin";
  is_read: boolean;
  created_at: string;
};

export default function VendorMessagesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [messages, setMessages] = useState<VendorMessage[]>([]);
  const [selectedMessage, setSelectedMessage] =
    useState<VendorMessage | null>(null);

  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadMessages = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data, error } = await supabase
          .from("vendor_messages")
          .select(
            `
              id,
              vendor_id,
              quotation_id,
              order_id,
              subject,
              message,
              sender_type,
              is_read,
              created_at
            `
          )
          .eq("vendor_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        const rows = (data ?? []) as VendorMessage[];

        setMessages(rows);

        setSelectedMessage((current) => {
          if (current) {
            const updated = rows.find(
              (message) => message.id === current.id
            );

            if (updated) {
              return updated;
            }
          }

          return rows.length > 0 ? rows[0] : null;
        });
      } catch (error) {
        console.error("Failed to load vendor messages:", error);

        setMessages([]);
        setSelectedMessage(null);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load messages."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router]
  );

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const unreadCount = useMemo(() => {
    return messages.filter(
      (message) =>
        message.sender_type === "admin" && !message.is_read
    ).length;
  }, [messages]);

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  }

  function shortDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getMessagePreview(value: string) {
    if (value.length <= 95) {
      return value;
    }

    return `${value.slice(0, 95)}...`;
  }

  async function markAsRead(message: VendorMessage) {
    if (message.sender_type !== "admin" || message.is_read) {
      return;
    }

    try {
      const { error } = await supabase.rpc(
        "mark_vendor_message_read",
        {
          p_message_id: message.id,
        }
      );

      if (error) {
        throw error;
      }

      setMessages((current) =>
        current.map((item) =>
          item.id === message.id
            ? {
                ...item,
                is_read: true,
              }
            : item
        )
      );

      setSelectedMessage((current) =>
        current?.id === message.id
          ? {
              ...current,
              is_read: true,
            }
          : current
      );
    } catch (error) {
      console.error("Failed to mark message as read:", error);
    }
  }

  function selectMessage(message: VendorMessage) {
    setSelectedMessage(message);
    setReplyText("");
    setSuccessMessage("");
    setErrorMessage("");

    void markAsRead(message);
  }

  async function sendReply() {
    if (!selectedMessage) {
      return;
    }

    const cleanReply = replyText.trim();

    if (!cleanReply) {
      setErrorMessage("Please enter your reply.");
      return;
    }

    if (cleanReply.length > 5000) {
      setErrorMessage("Reply must be 5000 characters or less.");
      return;
    }

    setSendingReply(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { data, error } = await supabase.rpc(
        "reply_vendor_message",
        {
          p_message_id: selectedMessage.id,
          p_message: cleanReply,
        }
      );

      if (error) {
        throw error;
      }

      let reply: VendorMessage | null = null;

      if (Array.isArray(data)) {
        reply =
          data.length > 0 ? (data[0] as VendorMessage) : null;
      } else if (data) {
        reply = data as VendorMessage;
      }

      setReplyText("");

      setSuccessMessage(
        "Your reply has been sent securely to Health Nations."
      );

      if (reply) {
        setMessages((current) => [reply!, ...current]);
        setSelectedMessage(reply);
      } else {
        await loadMessages(true);
      }
    } catch (error) {
      console.error("Failed to send reply:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to send reply."
      );
    } finally {
      setSendingReply(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading messages...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.push("/vendor/dashboard")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Vendor Dashboard
        </button>

        <section className="overflow-hidden rounded-[30px] bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-9">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-950/30">
                <MessageSquare className="h-8 w-8" />
              </div>

              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                  Health Nations Vendor
                </p>

                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  Messages
                </h1>

                <p className="mt-1 text-sm text-slate-300">
                  Communicate securely with Health Nations.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadMessages(true)}
              disabled={refreshing || sendingReply}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Inbox className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Messages
                </p>

                <p className="mt-1 text-2xl font-black text-slate-900">
                  {messages.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Mail className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Unread
                </p>

                <p className="mt-1 text-2xl font-black text-slate-900">
                  {unreadCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Communication
                </p>

                <p className="mt-1 font-black text-slate-900">
                  Protected
                </p>
              </div>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
            <p className="font-bold">Something went wrong</p>
            <p className="mt-1">{errorMessage}</p>
          </section>
        ) : null}

        {successMessage ? (
          <section className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-bold">Reply sent</p>
              <p className="mt-1 text-sm">{successMessage}</p>
            </div>
          </section>
        ) : null}

        {!errorMessage && messages.length === 0 ? (
          <section className="mt-8 rounded-[28px] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <MailOpen className="h-8 w-8" />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-900">
              No messages yet
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Messages from Health Nations about your quotations, orders,
              and vendor account will appear here.
            </p>
          </section>
        ) : null}

        {messages.length > 0 ? (
          <section className="mt-8 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="grid min-h-[650px] lg:grid-cols-[380px_1fr]">
              <aside className="border-b border-slate-200 lg:border-b-0 lg:border-r">
                <div className="border-b border-slate-200 px-5 py-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">
                        Inbox
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {messages.length}{" "}
                        {messages.length === 1
                          ? "message"
                          : "messages"}
                      </p>
                    </div>

                    {unreadCount > 0 ? (
                      <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white">
                        {unreadCount} unread
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="max-h-[650px] overflow-y-auto">
                  {messages.map((message) => {
                    const selected =
                      selectedMessage?.id === message.id;

                    const unread =
                      message.sender_type === "admin" &&
                      !message.is_read;

                    return (
                      <button
                        key={message.id}
                        type="button"
                        onClick={() => selectMessage(message)}
                        className={`w-full border-b border-slate-100 px-5 py-5 text-left transition ${
                          selected
                            ? "bg-emerald-50"
                            : "bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              message.sender_type === "vendor"
                                ? "bg-blue-50 text-blue-600"
                                : unread
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {message.sender_type === "vendor" ? (
                              <Send className="h-4 w-4" />
                            ) : unread ? (
                              <Mail className="h-5 w-5" />
                            ) : (
                              <MailOpen className="h-5 w-5" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p
                                className={`truncate text-sm ${
                                  unread
                                    ? "font-black text-slate-950"
                                    : "font-bold text-slate-800"
                                }`}
                              >
                                {message.subject}
                              </p>

                              {unread ? (
                                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                              ) : null}
                            </div>

                            <p
                              className={`mt-1 text-xs font-semibold ${
                                message.sender_type === "admin"
                                  ? "text-emerald-700"
                                  : "text-blue-600"
                              }`}
                            >
                              {message.sender_type === "admin"
                                ? "Health Nations"
                                : "Your Company"}
                            </p>

                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                              {getMessagePreview(message.message)}
                            </p>

                            <p className="mt-2 text-[11px] font-medium text-slate-400">
                              {shortDate(message.created_at)}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <div className="flex min-h-[600px] flex-col">
                {selectedMessage ? (
                  <>
                    <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p
                            className={`text-xs font-bold uppercase tracking-wider ${
                              selectedMessage.sender_type === "admin"
                                ? "text-emerald-600"
                                : "text-blue-600"
                            }`}
                          >
                            {selectedMessage.sender_type === "admin"
                              ? "Health Nations"
                              : "Your Company"}
                          </p>

                          <h2 className="mt-2 text-2xl font-black text-slate-900">
                            {selectedMessage.subject}
                          </h2>

                          <p className="mt-2 text-sm text-slate-500">
                            {formatDate(selectedMessage.created_at)}
                          </p>
                        </div>

                        {selectedMessage.sender_type === "admin" &&
                        !selectedMessage.is_read ? (
                          <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                            Unread
                          </span>
                        ) : (
                          <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500">
                            Read
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 px-6 py-7 sm:px-8">
                      <div
                        className={`rounded-2xl border p-5 ${
                          selectedMessage.sender_type === "admin"
                            ? "border-emerald-100 bg-emerald-50/50"
                            : "border-blue-100 bg-blue-50/50"
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                          {selectedMessage.message}
                        </p>
                      </div>

                      {(selectedMessage.quotation_id ||
                        selectedMessage.order_id) && (
                        <div className="mt-6">
                          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                            Related To
                          </p>

                          <div className="flex flex-wrap gap-3">
                            {selectedMessage.quotation_id ? (
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    "/vendor/quotations"
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                              >
                                <FileText className="h-4 w-4" />
                                View Quotation
                              </button>
                            ) : null}

                            {selectedMessage.order_id ? (
                              <button
                                type="button"
                                onClick={() =>
                                  router.push("/vendor/orders")
                                }
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                              >
                                <Package className="h-4 w-4" />
                                View Order
                              </button>
                            ) : null}
                          </div>
                        </div>
                      )}

                      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <MessageSquare className="h-5 w-5" />
                          </div>

                          <div>
                            <h3 className="font-black text-slate-900">
                              Reply to Health Nations
                            </h3>

                            <p className="mt-1 text-sm leading-6 text-slate-500">
                              Your reply is sent securely through the
                              platform.
                            </p>
                          </div>
                        </div>

                        <textarea
                          rows={5}
                          maxLength={5000}
                          value={replyText}
                          onChange={(event) =>
                            setReplyText(event.target.value)
                          }
                          placeholder="Write your reply here..."
                          className="mt-5 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                        />

                        <div className="mt-2 flex items-center justify-between gap-4">
                          <p className="text-xs text-slate-400">
                            {replyText.length} / 5000
                          </p>

                          <button
                            type="button"
                            onClick={() => void sendReply()}
                            disabled={
                              sendingReply ||
                              !replyText.trim()
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {sendingReply ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4" />
                                Send Reply
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                        <div className="flex items-start gap-3">
                          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                          <div>
                            <p className="font-bold text-slate-900">
                              Protected communication
                            </p>

                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              Health Nations manages communication between
                              customers and vendors. Customer contact details
                              are not shared with vendors.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center p-8 text-center">
                    <div>
                      <MailOpen className="mx-auto h-10 w-10 text-slate-300" />

                      <p className="mt-4 font-bold text-slate-700">
                        Select a message
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Choose a message from your inbox to view it.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}