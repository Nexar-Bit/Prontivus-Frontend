"use client";

import React from "react";
import { useAuth } from "@/contexts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, CheckCircle2, AlertTriangle, Phone, UserPlus, Users, ShieldCheck, Lock, Globe, Bell, Languages, Image as ImageIcon } from "lucide-react";
import VoiceInput from "@/components/mobile/VoiceInput";

type Contact = { id: string; name: string; relationship: string; phone: string };
type Dependent = { id: string; name: string; relationship: string; dob: string };

export default function PatientProfilePage() {
	const { user } = useAuth();

	// Mock state for demo purposes; replace with API hooks later
	const [profileCompletion, setProfileCompletion] = React.useState(72);
	const [isVerified, setIsVerified] = React.useState(true);
	const [contacts, setContacts] = React.useState<Contact[]>([
		{ id: "1", name: "Maria Souza", relationship: "Mother", phone: "+55 11 99999-1111" },
		{ id: "2", name: "João Souza", relationship: "Spouse", phone: "+55 11 98888-2222" },
	]);
	const [dependents, setDependents] = React.useState<Dependent[]>([
		{ id: "d1", name: "Ana Souza", relationship: "Daughter", dob: "2018-05-12" },
		{ id: "d2", name: "Pedro Souza", relationship: "Son", dob: "2021-09-03" },
	]);
	const [activeProfileId, setActiveProfileId] = React.useState<string>("self");

	const initials = (name?: string) => (name ? name.split(" ").map(n => n[0]).join("").toUpperCase() : "U");

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Avatar className="h-16 w-16">
						<AvatarImage src="" alt={user?.username} />
						<AvatarFallback>{initials(user?.username)}</AvatarFallback>
					</Avatar>
					<div>
						<h1 className="text-2xl font-semibold">Patient Profile</h1>
						<p className="text-muted-foreground">Manage your information, settings, and family profiles</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<Progress value={profileCompletion} className="w-44" />
					<span className="text-sm text-muted-foreground">{profileCompletion}% complete</span>
				</div>
			</div>

			{/* Quick Switch: Self / Dependents */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Profiles</CardTitle>
						<CardDescription>Manage your profile and dependents</CardDescription>
					</div>
					<div className="flex gap-2">
						<Button variant={activeProfileId === "self" ? "default" : "outline"} onClick={() => setActiveProfileId("self")}>Self</Button>
						{dependents.map(d => (
							<Button key={d.id} variant={activeProfileId === d.id ? "default" : "outline"} onClick={() => setActiveProfileId(d.id)}>
								<Users className="mr-2 h-4 w-4" />{d.name}
							</Button>
						))}
						<Button variant="outline">
							<UserPlus className="mr-2 h-4 w-4" /> Add Dependent
						</Button>
					</div>
				</CardHeader>
			</Card>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left column */}
				<div className="space-y-6 lg:col-span-2">
					{/* Personal Information */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle>Personal Information</CardTitle>
								<CardDescription>Basic details and contact information</CardDescription>
							</div>
							{isVerified ? (
								<Badge variant="secondary" className="gap-1"><ShieldCheck className="h-4 w-4" /> Verified</Badge>
							) : (
								<Badge variant="outline" className="gap-1"><AlertTriangle className="h-4 w-4" /> Not Verified</Badge>
							)}
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<Label htmlFor="first_name">First Name</Label>
									<Input id="first_name" placeholder="First name" defaultValue={(user as any)?.first_name} />
								</div>
								<div>
									<Label htmlFor="last_name">Last Name</Label>
									<Input id="last_name" placeholder="Last name" defaultValue={(user as any)?.last_name} />
								</div>
								<div>
									<Label htmlFor="email">Email</Label>
									<Input id="email" type="email" placeholder="you@example.com" defaultValue={(user as any)?.email} />
								</div>
								<div>
									<Label htmlFor="phone">Phone</Label>
									<Input id="phone" placeholder="+55 11 99999-0000" />
								</div>
							</div>
							<div className="mt-4 flex gap-2">
								<Button>Save</Button>
								<Button variant="outline"><Shield className="mr-2 h-4 w-4" /> Verify</Button>
							</div>
						</CardContent>
					</Card>

					{/* Medical Profile */}
					<Card>
						<CardHeader>
							<CardTitle>Medical Profile</CardTitle>
							<CardDescription>Summary of conditions, allergies, and medications</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="mb-4">
								<Label>Voice symptom entry</Label>
								<div className="mt-2">
									<VoiceInput onResult={(text) => alert(`Captured: ${text}`)} />
								</div>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<h3 className="font-medium mb-2">Conditions</h3>
									<ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
										<li>Hypertension (controlled)</li>
										<li>Type 2 Diabetes</li>
									</ul>
								</div>
								<div>
									<h3 className="font-medium mb-2">Allergies</h3>
									<ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
										<li>Penicillin</li>
										<li>Peanuts</li>
									</ul>
								</div>
								<div>
									<h3 className="font-medium mb-2">Medications</h3>
									<ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
										<li>Metformin 500mg (BID)</li>
										<li>Lisinopril 10mg (QD)</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Insurance Information */}
					<Card>
						<CardHeader>
							<CardTitle>Insurance Information</CardTitle>
							<CardDescription>Your insurance cards and coverage</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="border rounded-lg p-4 flex items-center gap-4 bg-card">
									<div className="h-16 w-28 bg-muted rounded-md grid place-items-center text-muted-foreground"><ImageIcon className="h-6 w-6" /></div>
									<div>
										<div className="font-medium">SulAmérica</div>
										<div className="text-sm text-muted-foreground">Plan: Especial 500</div>
										<div className="text-xs text-muted-foreground">Coverage: Ambulatory + Hospital</div>
									</div>
								</div>
								<div className="border rounded-lg p-4 flex items-center gap-4 bg-card">
									<div className="h-16 w-28 bg-muted rounded-md grid place-items-center text-muted-foreground"><ImageIcon className="h-6 w-6" /></div>
									<div>
										<div className="font-medium">Unimed</div>
										<div className="text-sm text-muted-foreground">Plan: Nacional</div>
										<div className="text-xs text-muted-foreground">Coverage: Full</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Right column */}
				<div className="space-y-6">
					{/* Emergency Contacts */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle>Emergency Contacts</CardTitle>
								<CardDescription>People we should contact in an emergency</CardDescription>
							</div>
							<Button variant="outline"><Phone className="mr-2 h-4 w-4" /> Add Contact</Button>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{contacts.map(c => (
									<div key={c.id} className="flex items-center justify-between border rounded-lg p-3">
										<div>
											<div className="font-medium">{c.name} <span className="text-muted-foreground font-normal">· {c.relationship}</span></div>
											<div className="text-sm text-muted-foreground">{c.phone}</div>
										</div>
										<div className="flex gap-2">
											<Button variant="outline" size="sm">Edit</Button>
											<Button variant="destructive" size="sm">Remove</Button>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Settings */}
					<Card>
						<CardHeader>
							<CardTitle>Settings</CardTitle>
							<CardDescription>Control your notifications, privacy, and security</CardDescription>
						</CardHeader>
						<CardContent>
							<Tabs defaultValue="notifications">
								<TabsList>
									<TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" /> Notifications</TabsTrigger>
									<TabsTrigger value="privacy"><Shield className="mr-2 h-4 w-4" /> Privacy</TabsTrigger>
									<TabsTrigger value="security"><Lock className="mr-2 h-4 w-4" /> Security</TabsTrigger>
									<TabsTrigger value="preferences"><Globe className="mr-2 h-4 w-4" /> Preferences</TabsTrigger>
								</TabsList>

								<TabsContent value="notifications" className="space-y-4">
									<div className="flex items-center justify-between">
										<div>
											<div className="font-medium">Appointment reminders</div>
											<div className="text-sm text-muted-foreground">Email and SMS reminders for upcoming visits</div>
										</div>
										<Button variant="outline">Configure</Button>
									</div>
									<Separator />
									<div className="flex items-center justify-between">
										<div>
											<div className="font-medium">Lab result notifications</div>
											<div className="text-sm text-muted-foreground">Alert me when new results are available</div>
										</div>
										<Button variant="outline">Configure</Button>
									</div>
								</TabsContent>

								<TabsContent value="privacy" className="space-y-4">
									<div className="flex items-center justify-between">
										<div>
											<div className="font-medium">Data sharing preferences</div>
											<div className="text-sm text-muted-foreground">Control how your data is shared with providers</div>
										</div>
										<Button variant="outline">Manage</Button>
									</div>
									<Separator />
									<div className="flex items-center justify-between">
										<div>
											<div className="font-medium">Consent management</div>
											<div className="text-sm text-muted-foreground">View and update consent for you and dependents</div>
										</div>
										<Button variant="outline">Manage</Button>
									</div>
								</TabsContent>

								<TabsContent value="security" className="space-y-4">
									<div className="flex items-center justify-between">
										<div>
											<div className="font-medium">Two-factor authentication</div>
											<div className="text-sm text-muted-foreground">Add an extra layer of security to your account</div>
										</div>
										<Button variant="outline">Set up 2FA</Button>
									</div>
									<Separator />
									<div className="flex items-center justify-between">
										<div>
											<div className="font-medium">Login history</div>
											<div className="text-sm text-muted-foreground">Review recent sign-ins and active sessions</div>
										</div>
										<Button variant="outline">View</Button>
									</div>
								</TabsContent>

								<TabsContent value="preferences" className="space-y-4">
									<div className="flex items-center justify-between">
										<div>
											<div className="font-medium">Communication</div>
											<div className="text-sm text-muted-foreground">Email, SMS, or push notifications</div>
										</div>
										<Button variant="outline">Configure</Button>
									</div>
									<Separator />
									<div className="flex items-center justify-between">
										<div>
											<div className="font-medium">Language</div>
											<div className="text-sm text-muted-foreground">Choose your preferred language</div>
										</div>
										<Button variant="outline"><Languages className="mr-2 h-4 w-4" /> Change</Button>
									</div>
									<Separator />
									<div className="flex items-center justify-between">
										<div>
											<div className="font-medium">Accessibility</div>
											<div className="text-sm text-muted-foreground">High contrast, text size, motion reduction</div>
										</div>
										<Button variant="outline">Configure</Button>
									</div>
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}


