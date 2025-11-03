"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

type Props = { onResult: (text: string) => void };

export default function VoiceInput({ onResult }: Props) {
	const [recording, setRecording] = React.useState(false);
	const recognitionRef = React.useRef<any>(null);

	function ensureRecognition() {
		// @ts-ignore
		const R = window.SpeechRecognition || window.webkitSpeechRecognition;
		if (!R) return null;
		if (!recognitionRef.current) {
			// @ts-ignore
			recognitionRef.current = new R();
			recognitionRef.current.lang = "en-US";
			recognitionRef.current.interimResults = false;
			recognitionRef.current.maxAlternatives = 1;
			recognitionRef.current.onresult = (e: any) => {
				const text = e.results?.[0]?.[0]?.transcript ?? "";
				onResult(text);
			};
			recognitionRef.current.onend = () => setRecording(false);
		}
		return recognitionRef.current;
	}

	function toggle() {
		const rec = ensureRecognition();
		if (!rec) return;
		if (recording) {
			rec.stop();
			setRecording(false);
		} else {
			rec.start();
			setRecording(true);
		}
	}

	return (
		<Button onClick={toggle} variant={recording ? "destructive" : "secondary"} className="h-12">
			<Mic className="mr-2 h-5 w-5" /> {recording ? "Stop" : "Voice Input"}
		</Button>
	);
}


