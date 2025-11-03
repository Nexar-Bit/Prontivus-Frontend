"use client";

import React from "react";

export default function A11yLiveAnnouncer() {
	return (
		<div aria-live="polite" aria-atomic="true" className="sr-only" id="a11y-live-region" />
	);
}


