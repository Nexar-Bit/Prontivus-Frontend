"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText } from "lucide-react";
import { api } from "@/lib/api";

type RecordItem = {
	id: number;
	title: string;
	created_at: string;
	category?: string;
	file_id?: number;
};

export default function RecordsV2() {
	const [query, setQuery] = React.useState("");
	const [records, setRecords] = React.useState<RecordItem[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState("");
	const [viewerFileUrl, setViewerFileUrl] = React.useState<string | null>(null);

	React.useEffect(() => {
		load();
	}, []);

	async function load() {
		try {
			setLoading(true);
			const res = await api.get(`/api/records`);
			setRecords((res as any).data || []);
			setError("");
		} catch (e) {
			setError("Failed to load records.");
		} finally {
			setLoading(false);
		}
	}

	async function openFile(fileId?: number) {
		if (!fileId) return;
		try {
			const res = await api.get(`/api/files/${fileId}`);
			const { url } = (res as any).data || {};
			if (url) setViewerFileUrl(url);
		} catch (e) {
			setError("Failed to open document.");
		}
	}

	const filtered = React.useMemo(() => {
		if (!query) return records;
		const q = query.toLowerCase();
		return records.filter((r) => r.title?.toLowerCase().includes(q) || r.category?.toLowerCase().includes(q));
	}, [records, query]);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Medical Records (New)</CardTitle>
				<CardDescription>Timeline, filters, and secure viewer</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{error && (
					<Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
				)}
				<div className="grid gap-3">
					<Input placeholder="Search records" value={query} onChange={(e) => setQuery(e.target.value)} />
					{loading ? (
						<div className="flex items-center justify-center h-32">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
						</div>
					) : (
						<div className="space-y-2">
							{filtered.length === 0 ? (
								<div className="text-muted-foreground text-sm">No records found.</div>
							) : filtered.map((r) => (
								<div key={r.id} className="flex items-center justify-between p-3 border rounded-md">
									<div>
										<div className="font-medium">{r.title}</div>
										<div className="text-xs text-muted-foreground">{r.category || "Document"} · {new Date(r.created_at).toLocaleString()}</div>
									</div>
									<div className="flex gap-2">
										<Button variant="outline" size="sm" onClick={() => openFile(r.file_id)}>Open</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{viewerFileUrl && (
					<div className="fixed inset-0 bg-black/60 z-50 grid place-items-center p-4" role="dialog" aria-modal="true">
						<Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden">
							<CardHeader className="flex flex-row items-center justify-between">
								<CardTitle>Document Viewer</CardTitle>
								<Button variant="outline" onClick={() => setViewerFileUrl(null)}>Close</Button>
							</CardHeader>
							<CardContent className="h-[70vh]">
								<iframe src={viewerFileUrl} title="Medical document" className="w-full h-full" />
							</CardContent>
						</Card>
					</div>
				)}
			</CardContent>
		</Card>
	);
}


