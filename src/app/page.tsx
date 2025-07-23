"use client";

import { useState } from "react";
import Terminal from "@/components/Terminal";
import styles from "@/styles/Home.module.css";

export default function Home() {
	const [, setSelectedOption] = useState<string>("");

	return (
		<div className={styles.home}>
			<Terminal onCommand={setSelectedOption} />
		</div>
	);
}
