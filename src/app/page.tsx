"use client";

import { useState } from "react";
import Terminal from "@/components/Terminal";
import R3FScene from "@/components/three/R3FScene";
import styles from "@/styles/Home.module.scss";
import { useIsMobile } from "@/hooks/use-is-mobile";

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
