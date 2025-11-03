"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare } from "lucide-react";
import { api } from "@/lib/api";

type Thread = { id: number; subject: string; updated_at: string };
type Message = { id: number; sender: string; content: string; created_at: string };

export default function MessagesV2() {
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState("");
	const [threads, setThreads] = React.useState<Thread[]>([]);
	const [activeId, setActiveId] = React.useState<number | null>(null);
	const [messages, setMessages] = React.useState<Message[]>([]);
	const [text, setText] = React.useState("");

	React.useEffect(() => { loadThreads(); }, []);

	async function loadThreads() {
		try {
			setLoading(true);
			const res = await api.get(`/api/messages/threads`);
			setThreads((res as any).data || []);
			setError("");
		} catch (e) {
			setError("Failed to load messages.");
		} finally {
			setLoading(false);
		}
	}

	async function openThread(id: number) {
		setActiveId(id);
		try {
			const res = await api.get(`/api/messages/threads/${id}`);
			setMessages((res as any).data?.messages || []);
		} catch (e) {
			setError("Failed to load thread.");
		}
	}

	async function send() {
		if (!text.trim() || !activeId) return;
		const optimistic: Message = { id: Date.now(), sender: "me", content: text, created_at: new Date().toISOString() };
		setMessages((prev) => [...prev, optimistic]);
		setText("");
		try {
			await api.post(`/api/messages/threads/${activeId}/send`, { content: optimistic.content });
		} catch (e) {
			setError("Failed to send message.");
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Messages (New)</CardTitle>
				<CardDescription>Threaded conversations with attachments</CardDescription>
			</CardHeader>
			<CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{error && <div className="md:col-span-3"><Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert></div>}
				<div className="border rounded-md p-2 max-h-[60vh] overflow-auto">
					{loading ? (
						<div className="p-4 text-sm text-muted-foreground">Loading...</div>
					) : (
						<ul className="space-y-1">
							{threads.map(t => (
								<li key={t.id}>
									<button className={`w-full text-left px-2 py-2 rounded ${activeId===t.id?"bg-muted":"hover:bg-muted/60"}`} onClick={() => openThread(t.id)}>
										<div className="font-medium line-clamp-1">{t.subject || "Conversation"}</div>
										<div className="text-xs text-muted-foreground">{new Date(t.updated_at).toLocaleString()}</div>
									</button>
								</li>
							))}
						</ul>
					)}
				</div>
				<div className="md:col-span-2 flex flex-col border rounded-md">
					<div className="flex-1 p-3 space-y-2 max-h-[50vh] overflow-auto">
						{activeId ? (
							messages.length === 0 ? (
								<div className="text-sm text-muted-foreground">No messages yet.</div>
							) : messages.map(m => (
								<div key={m.id} className="p-2 rounded-md bg-muted/40">
									<div className="text-xs text-muted-foreground">{m.sender} · {new Date(m.created_at).toLocaleString()}</div>
									<div>{m.content}</div>
								</div>
							))
						) : (
							<div className="text-sm text-muted-foreground">Select a conversation</div>
						)}
					</div>
					<div className="border-t p-3 flex gap-2">
						<Textarea placeholder="Write a message" value={text} onChange={(e)=>setText(e.target.value)} />
						<Button onClick={send} disabled={!activeId}>Send</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}


