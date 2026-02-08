"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import Terminal from "@/components/Terminal";
import styles from "@/styles/Home.module.scss";
import { useIsMobile } from "@/hooks/use-is-mobile";

const R3FScene = dynamic(() => import("@/components/three/R3FScene"), {
    ssr: false,
});

export default function Home() {
    const isMobile = useIsMobile();
    const [, setSelectedOption] = useState<string>("");

    return (
        <div className={styles.home}>
            {isMobile ? (
                <Terminal onCommand={setSelectedOption} isActive />
            ) : (
                <R3FScene />
            )}
        </div>
    );
}
