"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api";

type Prescription = { id: number; drug: string; dosage: string; status: string; updated_at: string };

export default function PrescriptionsV2() {
	const [items, setItems] = React.useState<Prescription[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState("");

	React.useEffect(() => { load(); }, []);

	async function load() {
		try {
			setLoading(true);
			const res = await api.get(`/api/prescriptions`);
			setItems((res as any).data || []);
			setError("");
		} catch (e) {
			setError("Failed to load prescriptions.");
		} finally {
			setLoading(false);
		}
	}

	async function renew(id: number) {
		try {
			await api.post(`/api/prescriptions/${id}/renew`);
			load();
		} catch (e) {
			setError("Failed to request renewal.");
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2"><Pill className="h-5 w-5" /> Prescriptions (New)</CardTitle>
				<CardDescription>Renewals, interactions, pickup status</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				{error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
				{loading ? (
					<div className="flex items-center justify-center h-24">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
					</div>
				) : items.length === 0 ? (
					<div className="text-sm text-muted-foreground">No prescriptions found.</div>
				) : (
					<div className="space-y-2">
						{items.map(p => (
							<div key={p.id} className="flex items-center justify-between p-3 border rounded-md">
								<div>
									<div className="font-medium">{p.drug} — {p.dosage}</div>
									<div className="text-xs text-muted-foreground">{p.status} · {new Date(p.updated_at).toLocaleString()}</div>
								</div>
								<div className="flex gap-2">
									<Button variant="outline" onClick={() => renew(p.id)}>Request Renewal</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}


